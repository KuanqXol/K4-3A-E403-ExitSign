// Shared types for the SlideAlive adaptive pipeline (see workflow.md).

export type Action =
  | "PREDICT_FIRST"
  | "MISCONCEPTION_PROBE"
  | "SOCRATIC_HINT"
  | "REINFORCE_EXPLAIN"
  | "CONTINUE"
  | "REFUSE_OUT_OF_SCOPE"
  // Extension of workflow.md: layer ② (ambiguous / missing info) needs a clarifying turn.
  | "ASK_CLARIFY";

export type InteractionType =
  | "PREDICT"
  | "SPOT_THE_BUG"
  | "FREE_EXPLAIN"
  | "MULTI_CHOICE_JUSTIFY"
  | "NONE";

export type Difficulty = "E" | "M" | "H";

export type LearnerActionKind =
  | "start"
  | "ask"
  | "answer"
  | "explain"
  | "ask_hint"
  | "retry"
  | "skip";

export type Misconception = { id: string; claim: string; correction: string };

export type Concept = {
  concept_id: string;
  title: string;
  keywords: string[];
  key_points: string[];
  source_ref: string[];
  misconception_bank: Misconception[];
};

export type LessonKnowledge = {
  lesson_id: string;
  title: string;
  transcript_file: string;
  concepts: Concept[];
};

export type LearnerState = {
  mastery_per_concept: Record<string, number>;
  attempts: number;
  correct_count: number;
  recent_errors: string[];
  avg_response_ms: number;
  explained_concepts: string[];
};

export type RecentBehavior = {
  learner_action: LearnerActionKind;
  is_correct?: boolean | null;
  response_time_ms?: number;
  hint_usage?: number;
  retry_count?: number;
  skip_streak?: number;
};

export type AnswerKey = {
  correct_option_index: number | null;
  rubric: string[];
};

export type PendingInteraction = {
  concept_id: string;
  interaction_type: InteractionType;
  question: string;
  options: string[];
  answer_key: AnswerKey;
};

export type TurnInput = {
  concept_id: string;
  learner_state: LearnerState;
  recent_behavior: RecentBehavior;
  learner_message?: string | null;
  selected_option?: number | null;
  pending_interaction?: PendingInteraction | null;
  // Context of the slide currently viewed by the learner (e.g. from user testing U5)
  slide_concept?: string | null;
};

export type Scope = "in_lesson" | "out_of_scope" | "ambiguous";

export type LearnerIntent =
  | "ask_concept"
  | "answer_attempt"
  | "explain_back"
  | "ask_hint"
  | "ask_answer"
  | "claim_check"
  | "chitchat"
  | "none";

export type Analysis = {
  scope: Scope;
  intent: LearnerIntent;
  concept_id: string | null;
  is_correct: boolean | null;
  misconception_id: string | null;
  false_premise: boolean;
  explanation_score: number | null;
  reason: string;
  source: "rule" | "llm";
};

export type Decision = {
  action: Action;
  interaction_type: InteractionType;
  difficulty: Difficulty;
  concept_id: string;
  misconception_id: string | null;
  reason: string;
};

export type Interaction = {
  message: string;
  question: string | null;
  options: string[];
  answer_key: AnswerKey | null;
  hint: string | null;
  source_refs: string[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  checks: {
    schema_valid: boolean;
    answer_valid: boolean;
    grounded_in_lesson: boolean;
    no_answer_leak: boolean;
  };
};

export type TurnOutput = {
  turn_id: string;
  analysis: Analysis;
  decision: Decision;
  interaction: Interaction;
  validation: ValidationResult;
  generation_attempts: number;
  fallback_used: boolean;
  // validator errors of each LLM generation attempt, in order ([] = that attempt passed)
  attempt_errors: string[][];
  llm_errors: string[];
  next_state: LearnerState;
  pending_interaction: PendingInteraction | null;
  log_file: string;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmResponse = { content: string; model: string; latency_ms: number; usage?: unknown };

export interface LlmClient {
  readonly model: string;
  completeJson(messages: ChatMessage[], stage: string, onDelta?: (delta: string) => void): Promise<LlmResponse>;
}

// Real-time pipeline events (streamed to the web UI). Prompts/responses here are the
// learner-safe views: answer keys are masked before an event is emitted.
export type TurnEvent =
  | { type: "stage"; name: string; detail?: unknown }
  | { type: "llm_start"; call_id: string; stage: string; model: string; prompt: ChatMessage[] }
  | { type: "llm_text"; call_id: string; text: string }
  | { type: "llm_end"; call_id: string; latency_ms: number; error?: string }
  | { type: "validation"; attempt: number; valid: boolean; errors: string[] };
