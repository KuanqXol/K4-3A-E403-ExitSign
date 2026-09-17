// Validator guardrail: schema · answer validity · grounded in lesson · no answer leak.
import type { Concept, Decision, Interaction, PendingInteraction, ValidationResult } from "./types.ts";

const QUESTION_ACTIONS = new Set(["PREDICT_FIRST", "MISCONCEPTION_PROBE", "CONTINUE"]);
const GROUNDED_ACTIONS = new Set(["PREDICT_FIRST", "MISCONCEPTION_PROBE", "CONTINUE", "REINFORCE_EXPLAIN", "SOCRATIC_HINT"]);
const LEAK_PHRASES = [/đáp án (đúng )?là/i, /câu trả lời đúng là/i, /lựa chọn đúng là/i, /correct answer is/i];
const MIN_LEAK_LENGTH = 6;
const MAX_MESSAGE_CHARS = 900;

const str = (v: unknown): v is string => typeof v === "string";

export function toInteraction(raw: Record<string, unknown>): { interaction: Interaction; schemaErrors: string[] } {
  const errors: string[] = [];
  if (!str(raw.message) || raw.message.trim() === "") errors.push("`message` is empty or not a string");
  if (raw.question !== null && raw.question !== undefined && !str(raw.question)) errors.push("`question` must be a string or null");
  if (raw.hint !== null && raw.hint !== undefined && !str(raw.hint)) errors.push("`hint` must be a string or null");
  const options = Array.isArray(raw.options) ? raw.options.filter(str) : [];
  if (!Array.isArray(raw.options) || options.length !== raw.options.length) errors.push("`options` must be an array of strings");
  const rubric = Array.isArray(raw.rubric) ? raw.rubric.filter(str) : [];
  const refs = Array.isArray(raw.source_refs) ? raw.source_refs.filter(str).map((r) => r.replace(/[[\]]/g, "").trim()) : [];
  if (!Array.isArray(raw.source_refs)) errors.push("`source_refs` must be an array");
  const idx = raw.correct_option_index;
  const correctIndex = typeof idx === "number" && Number.isInteger(idx) ? idx : null;
  if (idx !== null && idx !== undefined && correctIndex === null) errors.push("`correct_option_index` must be an integer or null");

  return {
    interaction: {
      message: str(raw.message) ? raw.message.trim() : "",
      question: str(raw.question) && raw.question.trim() ? raw.question.trim() : null,
      options,
      answer_key: correctIndex !== null || rubric.length ? { correct_option_index: correctIndex, rubric } : null,
      hint: str(raw.hint) && raw.hint.trim() ? raw.hint.trim() : null,
      source_refs: [...new Set(refs)],
    },
    schemaErrors: errors,
  };
}

const normalize = (s: string) => s.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function containsLeak(haystacks: (string | null)[], secret: string | undefined): boolean {
  const text = haystacks.filter(str).map(normalize).join(" \n ");
  if (LEAK_PHRASES.some((p) => p.test(text))) return true;
  if (!secret) return false;
  const needle = normalize(secret);
  return needle.length >= MIN_LEAK_LENGTH && text.includes(needle);
}

const MIN_SHARED_OPTIONS = 3;

function repeatsQuestion(it: Interaction, previous: PendingInteraction): boolean {
  if (it.question && normalize(it.question) === normalize(previous.question)) return true;
  const old = new Set(previous.options.map(normalize));
  return it.options.filter((o) => old.has(normalize(o))).length >= MIN_SHARED_OPTIONS;
}

function checkAnswer(decision: Decision, it: Interaction): string[] {
  const errors: string[] = [];
  const key = it.answer_key;
  if (QUESTION_ACTIONS.has(decision.action)) {
    if (!it.question) errors.push("`question` is null/empty — it must hold the question");
    if (it.options.length < 3 || it.options.length > 4) errors.push(`\`options\` has ${it.options.length} items — needs 3-4`);
    if (new Set(it.options.map(normalize)).size !== it.options.length) errors.push("`options` contains duplicates");
    const idx = key?.correct_option_index;
    if (idx === null || idx === undefined || idx < 0 || idx >= it.options.length) errors.push(`\`correct_option_index\` is ${idx ?? "null"} — must be an integer 0..${Math.max(0, it.options.length - 1)}`);
    if (!key?.rubric.length) errors.push("`rubric` is empty — needs 1-3 sentences explaining the answer");
  }
  if (decision.action === "REINFORCE_EXPLAIN") {
    if (!it.question) errors.push("`question` is null — put the explain-it-yourself prompt in `question`, not only in `message`");
    if ((key?.rubric.length ?? 0) < 2) errors.push("`rubric` needs >= 2 grading criteria");
    if (it.options.length) errors.push("`options` must be [] for REINFORCE_EXPLAIN");
  }
  if (decision.action === "SOCRATIC_HINT" && !it.hint && !it.question) errors.push("needs `hint` or a guiding `question` (both are null)");
  if (decision.action === "ASK_CLARIFY" && !it.question) errors.push("`question` is null — put the clarifying question in `question`");
  if (decision.action === "REFUSE_OUT_OF_SCOPE" && (it.question || it.options.length || key?.correct_option_index != null)) {
    errors.push("refusal must not contain a question or answer key");
  }
  return errors;
}

export function validateInteraction(
  decision: Decision,
  concept: Concept,
  lessonRefs: Set<string>,
  it: Interaction,
  pending: PendingInteraction | null | undefined,
  schemaErrors: string[] = [],
  previous: PendingInteraction | null = null,
): ValidationResult {
  const schema = [...schemaErrors];
  if (it.message.length > MAX_MESSAGE_CHARS) schema.push("`message` is too long");

  const answer = checkAnswer(decision, it);

  const grounded: string[] = [];
  const unknownRefs = it.source_refs.filter((r) => !lessonRefs.has(r));
  if (unknownRefs.length) grounded.push(`source_refs not in this lesson: ${unknownRefs.join(",")}`);
  if (GROUNDED_ACTIONS.has(decision.action) && !it.source_refs.some((r) => concept.source_ref.includes(r))) {
    grounded.push(`no source_refs from concept ${concept.concept_id}`);
  }

  const leak: string[] = [];
  const visible = [it.message, it.hint, decision.action === "SOCRATIC_HINT" ? it.question : null];
  const ownIdx = it.answer_key?.correct_option_index;
  if (QUESTION_ACTIONS.has(decision.action) && ownIdx != null && containsLeak(visible, it.options[ownIdx])) {
    leak.push("message/hint reveals the correct option");
  }
  const pendingIdx = pending?.answer_key.correct_option_index;
  if (pending && pendingIdx != null && containsLeak([...visible, it.question], pending.options[pendingIdx])) {
    leak.push("reveals the answer of the pending question");
  } else if (!QUESTION_ACTIONS.has(decision.action) && containsLeak(visible, undefined)) {
    leak.push("contains an answer-announcing phrase");
  }

  const repeated = previous && decision.action !== "SOCRATIC_HINT" && repeatsQuestion(it, previous) ? ["`question` repeats the previous question — write a new one"] : [];
  const errors = [...schema, ...answer, ...repeated, ...grounded, ...leak];
  return {
    valid: errors.length === 0,
    errors,
    checks: {
      schema_valid: schema.length === 0,
      answer_valid: answer.length === 0,
      grounded_in_lesson: grounded.length === 0,
      no_answer_leak: leak.length === 0,
    },
  };
}
