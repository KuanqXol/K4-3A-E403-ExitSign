// OpenAI-compatible chat client (OpenAI, or any local server exposing /v1/chat/completions,
// e.g. Ollama/LM Studio via OPENAI_BASE_URL). The key is read from the environment only.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ChatMessage, LlmClient, LlmResponse } from "./types.ts";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.2;
const REQUEST_TIMEOUT_MS = 60_000;

// Loads KEY=VALUE lines from codebase/.env. Non-empty values in .env win over the shell
// environment (the project file is the single place to configure keys); empty values are
// skipped so the defaults below apply.
export function loadEnvFile(file = path.resolve(process.cwd(), ".env")): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (value) process.env[match[1]] = value;
  }
}

const envValue = (name: string): string | undefined => process.env[name]?.trim() || undefined;

export class OpenAiCompatibleClient implements LlmClient {
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly temperature: number;

  constructor(opts: { apiKey?: string; baseUrl?: string; model?: string; temperature?: number } = {}) {
    this.apiKey = opts.apiKey ?? envValue("OPENAI_API_KEY") ?? "";
    this.baseUrl = (opts.baseUrl ?? envValue("OPENAI_BASE_URL") ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.model = opts.model ?? envValue("OPENAI_MODEL") ?? DEFAULT_MODEL;
    this.temperature = opts.temperature ?? Number(envValue("OPENAI_TEMPERATURE") ?? DEFAULT_TEMPERATURE);
    if (!Number.isFinite(this.temperature)) throw new Error("OPENAI_TEMPERATURE phải là số");
    const isLocal = /localhost|127\.0\.0\.1/.test(this.baseUrl);
    if (!this.apiKey && !isLocal) {
      throw new Error("Thiếu OPENAI_API_KEY. Điền vào codebase/.env.");
    }
  }

  // onDelta given → streamed request (SSE); each text chunk is reported as it arrives.
  async completeJson(messages: ChatMessage[], _stage?: string, onDelta?: (delta: string) => void): Promise<LlmResponse> {
    const started = Date.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        response_format: { type: "json_object" },
        ...(onDelta ? { stream: true, stream_options: { include_usage: true } } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    if (onDelta) return this.readStream(res, started, onDelta);
    const bodyText = await res.text();
    const body = JSON.parse(bodyText) as {
      model?: string;
      usage?: unknown;
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("LLM trả về không có choices[0].message.content");
    return { content, model: body.model ?? this.model, latency_ms: Date.now() - started, usage: body.usage };
  }

  private async readStream(res: Response, started: number, onDelta: (delta: string) => void): Promise<LlmResponse> {
    if (!res.body) throw new Error("LLM stream không có body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let model = this.model;
    let usage: unknown;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.trim();
        if (!data.startsWith("data:")) continue;
        const payload = data.slice(5).trim();
        if (payload === "[DONE]") continue;
        const chunk = JSON.parse(payload) as {
          model?: string;
          usage?: unknown;
          choices?: { delta?: { content?: string } }[];
        };
        model = chunk.model ?? model;
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          content += delta;
          onDelta(delta);
        }
      }
    }
    if (!content) throw new Error("LLM stream không trả nội dung");
    return { content, model, latency_ms: Date.now() - started, usage };
  }
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const parsed: unknown = JSON.parse(trimmed);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("JSON gốc không phải object");
  }
  return parsed as Record<string, unknown>;
}
