// Shared request handling for /api/turn (JSON) and /api/turn/stream (live NDJSON).
import { runTurn } from "./engine.ts";
import { DAY01_KNOWLEDGE, findConcept } from "./knowledge.ts";
import { loadEnvFile, OpenAiCompatibleClient } from "./llm-client.ts";
import { behaviorFor, getOrCreateSession, saveSession } from "./session-store.ts";
import type { LearnerActionKind, TurnEvent } from "./types.ts";

const ACTIONS: LearnerActionKind[] = ["start", "ask", "answer", "explain", "ask_hint", "retry", "skip"];
const MAX_MESSAGE_CHARS = 1000;

export type TurnRequest = {
  session_id?: string;
  concept_id?: string;
  action?: string;
  message?: string;
  selected_option?: number;
  response_time_ms?: number;
};

export type TurnResult = { status: number; body: { success: boolean; data: unknown; error: string | null } };

const fail = (status: number, error: string): TurnResult => ({ status, body: { success: false, data: null, error } });

export async function handleTurn(req: TurnRequest, onEvent?: (e: TurnEvent) => void): Promise<TurnResult> {
  const action = req.action as LearnerActionKind;
  if (!ACTIONS.includes(action)) return fail(400, "action không hợp lệ");
  const conceptId = req.concept_id ?? DAY01_KNOWLEDGE.concepts[0].concept_id;
  if (!findConcept(DAY01_KNOWLEDGE, conceptId)) return fail(400, "concept_id không tồn tại");
  const message = typeof req.message === "string" ? req.message.trim().slice(0, MAX_MESSAGE_CHARS) : "";
  const selected = Number.isInteger(req.selected_option) ? (req.selected_option as number) : null;
  const responseMs = Number.isFinite(req.response_time_ms) ? Math.max(0, req.response_time_ms as number) : undefined;

  let llm: OpenAiCompatibleClient;
  try {
    // Next loads .env without overriding the shell; re-apply so codebase/.env is the source of truth.
    loadEnvFile();
    llm = new OpenAiCompatibleClient();
  } catch (err) {
    return fail(500, (err as Error).message);
  }

  const session = getOrCreateSession(req.session_id, conceptId);
  const isAnsweringPending = Boolean(session.pending && (action === "answer" || action === "ask_hint" || action === "retry" || action === "explain"));
  const conceptChanged = !isAnsweringPending && Boolean(req.concept_id && req.concept_id !== session.concept_id);
  const activeConcept = isAnsweringPending ? session.pending!.concept_id : (action === "start" || conceptChanged ? conceptId : session.concept_id);
  const pending = action === "start" || conceptChanged ? null : session.pending;
  const behavior = behaviorFor(session, action, responseMs);

  try {
    const out = await runTurn(
      {
        concept_id: activeConcept,
        learner_state: session.state,
        recent_behavior: behavior,
        learner_message: message || null,
        selected_option: selected,
        pending_interaction: pending,
      },
      { llm, knowledge: DAY01_KNOWLEDGE, onEvent },
    );
    const keepPending = out.decision.action === "SOCRATIC_HINT" || out.decision.action === "ASK_CLARIFY";
    saveSession({
      ...session,
      concept_id: out.decision.concept_id,
      state: out.next_state,
      pending: out.pending_interaction ?? (keepPending ? pending : null),
      hint_usage: out.decision.action === "SOCRATIC_HINT" ? behavior.hint_usage ?? 0 : 0,
      skip_streak: behavior.skip_streak ?? 0,
      retry_count: behavior.retry_count ?? 0,
    });

    const { answer_key: _secret, ...generated } = out.interaction;
    // A hint keeps the learner on the pending question: show that exact question/options
    // (the ones grading uses) and fold the model's guiding question into the hint.
    const hintOnPending = out.decision.action === "SOCRATIC_HINT" && pending !== null;
    const visible = hintOnPending
      ? {
          ...generated,
          question: pending.question,
          options: pending.options,
          hint: [generated.question, generated.hint].filter((s) => s && s !== pending.question).join(" ") || null,
        }
      : generated;
    return {
      status: 200,
      body: {
        success: true,
        error: null,
        data: {
          session_id: session.id,
          turn_id: out.turn_id,
          graded: out.analysis.intent === "answer_attempt" ? out.analysis.is_correct : null,
          decision: out.decision,
          interaction: visible,
          checks: out.validation.checks,
          fallback_used: out.fallback_used,
          generation_attempts: out.generation_attempts,
          mastery: out.next_state.mastery_per_concept,
          learner_state: out.next_state,
          concepts: DAY01_KNOWLEDGE.concepts.map((c) => ({ id: c.concept_id, title: c.title })),
        },
      },
    };
  } catch (err) {
    console.error("[turn]", err);
    return fail(500, "Không xử lý được lượt học, xem log server.");
  }
}
