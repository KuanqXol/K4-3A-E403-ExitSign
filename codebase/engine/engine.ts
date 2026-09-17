// Central decision module: one learner turn through the full workflow.md pipeline
// Guard → Analyze (LLM) → Behavior Tracker/Learner State → Adaptive Engine → LLM Generate
// → Validator (retry ≤ 2, then fallback) → Interactive UI payload.
// Every model call is logged (input prompt + raw response) by llm-logger.ts.
import { excerptsFor, guessConcept, loadTranscript } from "./content-analyzer.ts";
import { decide } from "./adaptive-policy.ts";
import { updateState } from "./behavior-tracker.ts";
import { fallbackInteraction, REFUSAL_MESSAGE } from "./fallback.ts";
import { looksLikeGibberish, preGuard } from "./guard.ts";
import { allSourceRefs, findConcept } from "./knowledge.ts";
import { parseJsonObject } from "./llm-client.ts";
import { buildAnalyzerPrompt, buildGeneratorPrompt } from "./prompts.ts";
import { redactPrompt, redactRawResponse } from "./redact.ts";
import { LlmCallLogger, newTurnId } from "./llm-logger.ts";
import { toInteraction, validateInteraction } from "./validator.ts";
import type {
  Analysis,
  ChatMessage,
  Decision,
  Interaction,
  LearnerIntent,
  LessonKnowledge,
  LlmClient,
  PendingInteraction,
  Scope,
  TurnInput,
  TurnEvent,
  TurnOutput,
  ValidationResult,
} from "./types.ts";

export const MAX_RETRIES = 2;

export type EngineDeps = {
  llm: LlmClient;
  knowledge: LessonKnowledge;
  turnId?: string;
  logDir?: string;
  // live pipeline events for the UI; when set, model calls are streamed
  onEvent?: (event: TurnEvent) => void;
};

const SCOPES: Scope[] = ["in_lesson", "out_of_scope", "ambiguous"];
const INTENTS: LearnerIntent[] = [
  "ask_concept", "answer_attempt", "explain_back", "ask_hint", "ask_answer", "claim_check", "chitchat", "none",
];

function ruleAnalysis(partial: Partial<Analysis> & Pick<Analysis, "reason">): Analysis {
  return {
    scope: "in_lesson",
    intent: "none",
    concept_id: null,
    is_correct: null,
    misconception_id: null,
    false_premise: false,
    explanation_score: null,
    source: "rule",
    ...partial,
  };
}

function gradeSelection(input: TurnInput): boolean | null {
  const key = input.pending_interaction?.answer_key.correct_option_index;
  if (input.selected_option == null || key == null) return null;
  return input.selected_option === key;
}

function coerceAnalysis(raw: Record<string, unknown>, knowledge: LessonKnowledge): Analysis {
  const conceptId = typeof raw.concept_id === "string" && findConcept(knowledge, raw.concept_id) ? raw.concept_id : null;
  const misconception =
    typeof raw.misconception_id === "string" && knowledge.concepts.some((c) => c.misconception_bank.some((m) => m.id === raw.misconception_id))
      ? raw.misconception_id
      : null;
  const score = typeof raw.explanation_score === "number" ? Math.max(0, Math.min(1, raw.explanation_score)) : null;
  return {
    scope: SCOPES.includes(raw.scope as Scope) ? (raw.scope as Scope) : "ambiguous",
    intent: INTENTS.includes(raw.intent as LearnerIntent) ? (raw.intent as LearnerIntent) : "none",
    concept_id: conceptId,
    is_correct: typeof raw.is_correct === "boolean" ? raw.is_correct : null,
    misconception_id: misconception,
    false_premise: raw.false_premise === true,
    explanation_score: score,
    reason: typeof raw.reason === "string" ? raw.reason : "",
    source: "llm",
  };
}

// Rule corrections on top of the LLM analysis (root causes A–D of eval run 1):
// the model labelled catalogue concepts out_of_scope, and used ask_hint / explain_back
// even when no question was pending.
export function normalizeAnalysis(a: Analysis, pending: PendingInteraction | null | undefined, keywordGuess: string | null): Analysis {
  const notes: string[] = [];
  let next = a;
  if (next.scope !== "in_lesson" && (keywordGuess || (next.false_premise && next.concept_id))) {
    next = { ...next, scope: "in_lesson", concept_id: next.concept_id ?? keywordGuess };
    notes.push("matches a lesson concept → in_lesson");
  }
  if (next.intent === "ask_hint" && !pending) {
    next = next.concept_id ? { ...next, intent: "ask_concept" } : { ...next, scope: "ambiguous" };
    notes.push("ask_hint without a pending question");
  } else if (next.intent === "ask_hint" && pending && next.concept_id && next.concept_id !== pending.concept_id) {
    next = { ...next, intent: "ask_concept" };
    notes.push("asks about a different concept than the pending question");
  }
  if (next.intent === "explain_back" && pending?.interaction_type !== "FREE_EXPLAIN") {
    next = { ...next, intent: "ask_concept", false_premise: false, explanation_score: null };
    notes.push("explain_back without a pending FREE_EXPLAIN question");
  }
  return notes.length ? { ...next, reason: `${next.reason} [rule: ${notes.join("; ")}]` } : next;
}

async function callLlm(deps: EngineDeps, logger: LlmCallLogger, stage: string, prompt: ChatMessage[]) {
  const emit = deps.onEvent;
  const callId = `${logger.turnId}:${stage}`;
  const started = Date.now();
  let streamed = "";
  emit?.({ type: "llm_start", call_id: callId, stage, model: deps.llm.model, prompt: redactPrompt(prompt) });
  const onDelta = emit
    ? (delta: string) => {
        streamed += delta;
        emit({ type: "llm_text", call_id: callId, text: redactRawResponse(streamed) });
      }
    : undefined;
  try {
    const res = await deps.llm.completeJson(prompt, stage, onDelta);
    logger.log({ stage, model_name: res.model, latency_ms: res.latency_ms, raw_prompt: prompt, raw_response: res.content, usage: res.usage });
    emit?.({ type: "llm_text", call_id: callId, text: redactRawResponse(res.content) });
    emit?.({ type: "llm_end", call_id: callId, latency_ms: res.latency_ms });
    return res.content;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.log({ stage, model_name: deps.llm.model, latency_ms: Date.now() - started, raw_prompt: prompt, raw_response: streamed, error: message });
    emit?.({ type: "llm_end", call_id: callId, latency_ms: Date.now() - started, error: message });
    throw err;
  }
}

async function analyze(input: TurnInput, deps: EngineDeps, logger: LlmCallLogger): Promise<Analysis> {
  const message = input.learner_message?.trim() ?? "";
  const behavior = input.recent_behavior;
  const graded = gradeSelection(input);
  const pendingConcept = input.pending_interaction?.concept_id ?? input.concept_id;

  const guard = preGuard(message);
  deps.onEvent?.({ type: "stage", name: "Guard (luật)", detail: guard.blocked ? `Chặn: ${guard.reason}` : "Không phát hiện injection" });
  if (guard.blocked) return ruleAnalysis({ scope: "out_of_scope", intent: "chitchat", reason: guard.reason ?? "blocked" });

  if (!message) {
    if (behavior.learner_action === "ask_hint") return ruleAnalysis({ intent: "ask_hint", concept_id: pendingConcept, reason: "Bấm nút Hint" });
    if (graded !== null) return ruleAnalysis({ intent: "answer_attempt", concept_id: pendingConcept, is_correct: graded, reason: "Chấm lựa chọn theo answer_key" });
    return ruleAnalysis({ concept_id: input.concept_id, reason: `Không có văn bản (action=${behavior.learner_action})` });
  }
  if (looksLikeGibberish(message)) {
    return ruleAnalysis({ scope: "ambiguous", intent: "chitchat", reason: "Chuỗi vô nghĩa, cần hỏi lại" });
  }

  const guess = guessConcept(deps.knowledge, message);
  const prompt = buildAnalyzerPrompt(deps.knowledge, message, input.pending_interaction, guess);
  try {
    const analysis = normalizeAnalysis(
      coerceAnalysis(parseJsonObject(await callLlm(deps, logger, "analyze", prompt)), deps.knowledge),
      input.pending_interaction,
      guess,
    );
    const withGrade = graded === null ? analysis : { ...analysis, intent: "answer_attempt" as const, is_correct: graded };
    const concept_id = withGrade.concept_id ?? (withGrade.scope === "in_lesson" ? pendingConcept : null);
    return { ...withGrade, concept_id };
  } catch (err) {
    const reason = `Analyzer lỗi (${err instanceof Error ? err.message : err}); dùng từ khoá`;
    return guess
      ? ruleAnalysis({ intent: "ask_concept", concept_id: guess, reason })
      : ruleAnalysis({ scope: "ambiguous", intent: "none", reason });
  }
}

type Generated = {
  interaction: Interaction;
  validation: ValidationResult;
  attempts: number;
  fallback: boolean;
  attemptErrors: string[][];
};

async function generate(input: TurnInput, decision: Decision, analysis: Analysis, deps: EngineDeps, logger: LlmCallLogger): Promise<Generated> {
  const concept = findConcept(deps.knowledge, decision.concept_id);
  if (!concept) throw new Error(`concept_id không tồn tại: ${decision.concept_id}`);
  const lessonRefs = allSourceRefs(deps.knowledge);
  const pending = decision.action === "SOCRATIC_HINT" ? input.pending_interaction : null;

  if (decision.action === "REFUSE_OUT_OF_SCOPE" && analysis.source === "rule") {
    const interaction = { ...fallbackInteraction(deps.knowledge, concept, decision), message: REFUSAL_MESSAGE };
    const validation = validateInteraction(decision, concept, lessonRefs, interaction, pending);
    return { interaction, validation, attempts: 0, fallback: false, attemptErrors: [] };
  }

  const excerpts = excerptsFor(concept, loadTranscript(deps.knowledge));
  deps.onEvent?.({ type: "stage", name: "Content Analyzer", detail: `Nguồn transcript: ${excerpts.map((e) => e.ref).join(", ")}` });

  let previousErrors: string[] = [];
  const attemptErrors: string[][] = [];
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const prompt = buildGeneratorPrompt({
      knowledge: deps.knowledge, concept, decision, excerpts,
      message: input.learner_message, pending: input.pending_interaction, previousErrors,
    });
    try {
      const raw = parseJsonObject(await callLlm(deps, logger, `generate#${attempt}`, prompt));
      const { interaction, schemaErrors } = toInteraction(raw);
      const validation = validateInteraction(
        decision, concept, lessonRefs, interaction, pending, schemaErrors, input.pending_interaction ?? null,
      );
      attemptErrors.push(validation.errors);
      deps.onEvent?.({ type: "validation", attempt, valid: validation.valid, errors: validation.errors });
      if (validation.valid) return { interaction, validation, attempts: attempt, fallback: false, attemptErrors };
      previousErrors = validation.errors;
    } catch (err) {
      previousErrors = [`call/parse error: ${err instanceof Error ? err.message : err}`];
      attemptErrors.push(previousErrors);
      deps.onEvent?.({ type: "validation", attempt, valid: false, errors: previousErrors });
    }
  }
  const interaction = fallbackInteraction(deps.knowledge, concept, decision);
  const validation = validateInteraction(decision, concept, lessonRefs, interaction, pending);
  deps.onEvent?.({ type: "stage", name: "Fallback", detail: "LLM không qua validator sau 3 lần → dùng câu hỏi mẫu" });
  return { interaction, validation, attempts: MAX_RETRIES + 1, fallback: true, attemptErrors };
}

function toPending(decision: Decision, it: Interaction): PendingInteraction | null {
  if (!it.question || !it.answer_key || decision.interaction_type === "NONE") return null;
  return {
    concept_id: decision.concept_id,
    interaction_type: decision.interaction_type,
    question: it.question,
    options: it.options,
    answer_key: it.answer_key,
  };
}

export async function runTurn(input: TurnInput, deps: EngineDeps): Promise<TurnOutput> {
  const logger = new LlmCallLogger(deps.turnId ?? newTurnId(), deps.logDir);

  const emit = deps.onEvent;
  emit?.({ type: "stage", name: "Nhận yêu cầu", detail: { action: input.recent_behavior.learner_action, message: input.learner_message ?? null } });
  const analysis = await analyze(input, deps, logger);
  emit?.({ type: "stage", name: `Phân tích lượt (${analysis.source === "llm" ? "LLM" : "luật"})`, detail: analysis });

  const nextState = updateState(input.learner_state, analysis, input.recent_behavior);

  const decision = decide(deps.knowledge, analysis, nextState, input.recent_behavior, input.concept_id);
  emit?.({ type: "stage", name: "Adaptive Engine → quyết định", detail: decision });

  const generated = await generate(input, decision, analysis, deps, logger);
  const pending = toPending(decision, generated.interaction);

  return {
    turn_id: logger.turnId,
    analysis,
    decision,
    interaction: generated.interaction,
    validation: generated.validation,
    generation_attempts: generated.attempts,
    fallback_used: generated.fallback,
    attempt_errors: generated.attemptErrors,
    llm_errors: logger.errors,
    next_state: nextState,
    pending_interaction: pending,
    log_file: logger.logFile,
  };
}
