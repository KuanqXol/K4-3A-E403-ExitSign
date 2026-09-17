// Behavior Tracker + Learner State update (pure; always returns a new state).
import type { Analysis, LearnerState, RecentBehavior } from "./types.ts";

const MAX_RECENT_ERRORS = 5;
const FAST_MS = 10_000;

export function emptyState(): LearnerState {
  return {
    mastery_per_concept: {},
    attempts: 0,
    correct_count: 0,
    recent_errors: [],
    avg_response_ms: 0,
    explained_concepts: [],
  };
}

export function correctRate(state: LearnerState): number {
  return state.attempts === 0 ? 0 : state.correct_count / state.attempts;
}

function masteryDelta(analysis: Analysis, behavior: RecentBehavior): number {
  if (analysis.intent === "explain_back") {
    return Math.round(((analysis.explanation_score ?? 0) - 0.5) * 30);
  }
  if (analysis.intent !== "answer_attempt" || analysis.is_correct === null) return 0;
  if (!analysis.is_correct) return -15;
  if ((behavior.hint_usage ?? 0) > 0) return 6;
  return (behavior.response_time_ms ?? FAST_MS) < FAST_MS ? 15 : 10;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function updateState(state: LearnerState, analysis: Analysis, behavior: RecentBehavior): LearnerState {
  const conceptId = analysis.concept_id;
  const graded = analysis.intent === "answer_attempt" && analysis.is_correct !== null;
  const attempts = state.attempts + (graded ? 1 : 0);
  const responseMs = behavior.response_time_ms;
  const avg =
    graded && responseMs !== undefined
      ? Math.round((state.avg_response_ms * state.attempts + responseMs) / attempts)
      : state.avg_response_ms;
  const error = analysis.misconception_id ?? (graded && !analysis.is_correct ? `wrong:${conceptId}` : null);
  const passedExplain = analysis.intent === "explain_back" && (analysis.explanation_score ?? 0) >= 0.7;

  return {
    mastery_per_concept: conceptId
      ? {
          ...state.mastery_per_concept,
          [conceptId]: clamp((state.mastery_per_concept[conceptId] ?? 0) + masteryDelta(analysis, behavior)),
        }
      : { ...state.mastery_per_concept },
    attempts,
    correct_count: state.correct_count + (graded && analysis.is_correct ? 1 : 0),
    recent_errors: error ? [error, ...state.recent_errors].slice(0, MAX_RECENT_ERRORS) : [...state.recent_errors],
    avg_response_ms: avg,
    explained_concepts:
      passedExplain && conceptId && !state.explained_concepts.includes(conceptId)
        ? [...state.explained_concepts, conceptId]
        : [...state.explained_concepts],
  };
}
