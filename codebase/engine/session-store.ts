// In-memory learner sessions for the web prototype. The answer key of the pending
// question stays server-side so the browser can never read it. Resets on server restart.
import { randomUUID } from "node:crypto";
import { emptyState } from "./behavior-tracker.ts";
import type { LearnerActionKind, LearnerState, PendingInteraction, RecentBehavior } from "./types.ts";

export type Session = {
  id: string;
  concept_id: string;
  state: LearnerState;
  pending: PendingInteraction | null;
  hint_usage: number;
  skip_streak: number;
  retry_count: number;
  updated_at: number;
};

const MAX_SESSIONS = 500;
const sessions = new Map<string, Session>();

export function getOrCreateSession(id: string | undefined, conceptId: string): Session {
  const existing = id ? sessions.get(id) : undefined;
  if (existing) return existing;
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.values()].sort((a, b) => a.updated_at - b.updated_at)[0];
    sessions.delete(oldest.id);
  }
  const session: Session = {
    id: randomUUID(),
    concept_id: conceptId,
    state: emptyState(),
    pending: null,
    hint_usage: 0,
    skip_streak: 0,
    retry_count: 0,
    updated_at: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

export function saveSession(session: Session): void {
  sessions.set(session.id, { ...session, updated_at: Date.now() });
}

export function behaviorFor(session: Session, action: LearnerActionKind, responseMs?: number): RecentBehavior {
  return {
    learner_action: action,
    response_time_ms: responseMs,
    hint_usage: session.hint_usage + (action === "ask_hint" ? 1 : 0),
    skip_streak: action === "skip" ? session.skip_streak + 1 : 0,
    retry_count: session.retry_count + (action === "retry" ? 1 : 0),
  };
}
