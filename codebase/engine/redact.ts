// Learner-safe views of prompts and raw model output for the live UI.
// The full, unmasked text is still written to logs/llm_calls.* on the server.
import { ANSWER_KEY_MARKER, CORRECTION_MARKER } from "./prompts.ts";
import type { ChatMessage } from "./types.ts";

const MASK = "•••";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ANSWER_KEY_LINE = new RegExp(`^(${escape(ANSWER_KEY_MARKER)}):.*$`, "gm");
const CORRECTION = new RegExp(`\\(${escape(CORRECTION_MARKER)} [^)]*\\)`, "g");

export function redactPrompt(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => ({
    ...m,
    content: m.content.replace(ANSWER_KEY_LINE, `$1: ${MASK}`).replace(CORRECTION, `(${CORRECTION_MARKER} ${MASK})`),
  }));
}

// Works on partial JSON while it is still streaming.
export function redactRawResponse(text: string): string {
  return text
    .replace(/("correct_option_index"\s*:\s*)(-?\d+|null)?/g, (_m, key: string, value?: string) => (value ? `${key}"${MASK}"` : key))
    .replace(/("rubric"\s*:\s*\[)[^\]]*(\]?)/g, (_m, open: string, close: string) => `${open}"${MASK}"${close}`);
}
