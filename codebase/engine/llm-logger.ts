// Logging of every model call: the exact input prompt and the raw model response.
//   logs/llm_calls.jsonl — one JSON record per call (for scripts)
//   logs/llm_calls.log   — the same records, human-readable (for reviewers)
import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { ChatMessage } from "./types.ts";

export function resolveLogDir(): string {
  return process.env.SLIDEALIVE_LOG_DIR || path.resolve(process.cwd(), "logs");
}

export type LlmCallRecord = {
  timestamp: string;
  turn_id: string;
  stage: string;
  model_name: string;
  latency_ms: number;
  raw_prompt: ChatMessage[];
  raw_response: string;
  usage?: unknown;
  error?: string;
};

const RULE = "=".repeat(80);

function toText(r: LlmCallRecord): string {
  const prompt = r.raw_prompt.map((m) => `--- [${m.role}] ---\n${m.content}`).join("\n");
  return [
    RULE,
    `${r.timestamp} | turn=${r.turn_id} | stage=${r.stage} | model=${r.model_name} | ${r.latency_ms} ms${r.error ? ` | ERROR: ${r.error}` : ""}`,
    RULE,
    ">>> PROMPT",
    prompt,
    "<<< RAW RESPONSE",
    r.raw_response || "(rỗng)",
    "",
  ].join("\n");
}

export class LlmCallLogger {
  readonly turnId: string;
  readonly logDir: string;
  private readonly llmErrors: string[] = [];

  constructor(turnId: string, logDir = resolveLogDir()) {
    this.turnId = turnId;
    this.logDir = logDir;
  }

  get logFile(): string {
    return path.join(this.logDir, "llm_calls.log");
  }

  get errors(): string[] {
    return [...this.llmErrors];
  }

  log(record: Omit<LlmCallRecord, "turn_id" | "timestamp">): void {
    const full: LlmCallRecord = { timestamp: new Date().toISOString(), turn_id: this.turnId, ...record };
    mkdirSync(this.logDir, { recursive: true });
    appendFileSync(path.join(this.logDir, "llm_calls.jsonl"), JSON.stringify(full) + "\n", "utf8");
    appendFileSync(this.logFile, toText(full), "utf8");
    if (record.error) this.llmErrors.push(`${record.stage}: ${record.error}`);
  }
}

export function newTurnId(prefix = "turn"): string {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 7)}`;
}
