// Adaptive Engine — deterministic pedagogical policy.
// Input: LLM/rule analysis of the learner turn + Learner State + Recent Behavior.
// Output: Interaction Decision (action, interaction_type, difficulty).
import type {
  Action,
  Analysis,
  Decision,
  Difficulty,
  InteractionType,
  LearnerState,
  LessonKnowledge,
  RecentBehavior,
} from "./types.ts";

export const MASTERY_CONTINUE = 80;
export const MASTERY_REINFORCE = 60;
export const EXPLANATION_PASS = 0.7;
export const SLOW_RESPONSE_MS = 25_000;
export const STRUGGLE_HINTS = 2;
export const STRUGGLE_SKIPS = 2;

const INTERACTION_BY_ACTION: Record<Action, InteractionType> = {
  PREDICT_FIRST: "PREDICT",
  MISCONCEPTION_PROBE: "SPOT_THE_BUG",
  SOCRATIC_HINT: "NONE",
  REINFORCE_EXPLAIN: "FREE_EXPLAIN",
  CONTINUE: "MULTI_CHOICE_JUSTIFY",
  REFUSE_OUT_OF_SCOPE: "NONE",
  ASK_CLARIFY: "NONE",
};

const LEVELS: Difficulty[] = ["E", "M", "H"];

export function difficultyFromMastery(mastery: number): Difficulty {
  if (mastery < 40) return "E";
  if (mastery < 75) return "M";
  return "H";
}

function shift(level: Difficulty, delta: number): Difficulty {
  const index = Math.min(LEVELS.length - 1, Math.max(0, LEVELS.indexOf(level) + delta));
  return LEVELS[index];
}

export function isStruggling(behavior: RecentBehavior): boolean {
  return (
    (behavior.hint_usage ?? 0) >= STRUGGLE_HINTS ||
    (behavior.skip_streak ?? 0) >= STRUGGLE_SKIPS ||
    (behavior.response_time_ms ?? 0) >= SLOW_RESPONSE_MS
  );
}

export function nextConcept(knowledge: LessonKnowledge, state: LearnerState, current: string): string {
  const order = knowledge.concepts.map((c) => c.concept_id);
  const after = order.slice(order.indexOf(current) + 1).concat(order.slice(0, order.indexOf(current)));
  const pending = after.filter((id) => (state.mastery_per_concept[id] ?? 0) < MASTERY_CONTINUE);
  return pending[0] ?? current;
}

type Choice = { action: Action; difficultyDelta: number; reason: string; conceptOverride?: string };

function chooseAction(a: Analysis, state: LearnerState, b: RecentBehavior, mastery: number): Choice {
  if (a.scope === "out_of_scope") return { action: "REFUSE_OUT_OF_SCOPE", difficultyDelta: 0, reason: a.reason };
  if (a.scope === "ambiguous") return { action: "ASK_CLARIFY", difficultyDelta: 0, reason: a.reason };
  if (a.intent === "ask_answer" || a.intent === "ask_hint") {
    return { action: "SOCRATIC_HINT", difficultyDelta: 0, reason: "Học viên xin đáp án/gợi ý → gợi mở, không lộ đáp án" };
  }
  if (a.false_premise) {
    return { action: "MISCONCEPTION_PROBE", difficultyDelta: 0, reason: "Tiền đề sai so với bài giảng → cho học viên tự bắt lỗi" };
  }
  if (a.intent === "answer_attempt" && a.is_correct === false) {
    if (a.misconception_id) {
      return { action: "MISCONCEPTION_PROBE", difficultyDelta: -1, reason: `Sai do ngộ nhận ${a.misconception_id} → hạ độ khó, bắt lỗi` };
    }
    return { action: "SOCRATIC_HINT", difficultyDelta: 0, reason: "Trả lời sai, chưa rõ ngộ nhận → gợi mở từng bước" };
  }
  if (a.intent === "answer_attempt" && a.is_correct === true) {
    if (mastery >= MASTERY_REINFORCE && !state.explained_concepts.includes(a.concept_id ?? "")) {
      return { action: "REINFORCE_EXPLAIN", difficultyDelta: 0, reason: "Đúng và mastery khá → yêu cầu tự giải thích (protégé)" };
    }
    if (mastery >= MASTERY_CONTINUE) return { action: "CONTINUE", difficultyDelta: 0, reason: "Đã vững concept → sang concept tiếp" };
    return { action: "PREDICT_FIRST", difficultyDelta: 1, reason: "Trả lời đúng → tăng độ khó" };
  }
  if (a.intent === "explain_back") {
    if ((a.explanation_score ?? 0) >= EXPLANATION_PASS) {
      return { action: "CONTINUE", difficultyDelta: 0, reason: "Giải thích lại đạt → chuyển tiếp" };
    }
    return a.misconception_id
      ? { action: "MISCONCEPTION_PROBE", difficultyDelta: -1, reason: "Giải thích lộ ngộ nhận → bắt lỗi" }
      : { action: "SOCRATIC_HINT", difficultyDelta: 0, reason: "Giải thích còn thiếu ý → gợi mở" };
  }
  if (isStruggling(b)) {
    return { action: "PREDICT_FIRST", difficultyDelta: -1, reason: "Học viên đang vật lộn (hint/skip/chậm) → hạ độ khó" };
  }
  if (b.learner_action === "start" && mastery >= MASTERY_CONTINUE) {
    return { action: "CONTINUE", difficultyDelta: 0, reason: "Concept đã vững từ trước → chuyển tiếp" };
  }
  if (a.intent === "ask_concept" && mastery >= MASTERY_REINFORCE) {
    return { action: "REINFORCE_EXPLAIN", difficultyDelta: 0, reason: "Đã học concept này → yêu cầu tự giải thích" };
  }
  return { action: "PREDICT_FIRST", difficultyDelta: 0, reason: "Concept mới → cho dự đoán trước khi giảng (productive failure)" };
}

export function decide(
  knowledge: LessonKnowledge,
  analysis: Analysis,
  state: LearnerState,
  behavior: RecentBehavior,
  fallbackConceptId: string,
): Decision {
  const conceptId = analysis.concept_id ?? fallbackConceptId;
  const mastery = state.mastery_per_concept[conceptId] ?? 0;
  const choice = chooseAction(analysis, state, behavior, mastery);
  const target = choice.action === "CONTINUE" ? nextConcept(knowledge, state, conceptId) : conceptId;
  const base = difficultyFromMastery(state.mastery_per_concept[target] ?? 0);
  return {
    action: choice.action,
    interaction_type: INTERACTION_BY_ACTION[choice.action],
    difficulty: shift(base, choice.difficultyDelta),
    concept_id: target,
    misconception_id: analysis.misconception_id,
    reason: choice.reason,
  };
}
