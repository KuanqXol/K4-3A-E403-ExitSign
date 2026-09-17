"use client";
import type { ChatMessage, TurnEvent } from "../../engine/types.ts";

export type TimelineItem =
  | { kind: "stage"; key: string; name: string; detail?: unknown }
  | { kind: "llm"; key: string; stage: string; model: string; prompt: ChatMessage[]; text: string; done: boolean; latency?: number; error?: string }
  | { kind: "validation"; key: string; attempt: number; valid: boolean; errors: string[] };

// Pure reducer: returns a new timeline for each streamed event.
export function applyEvent(items: TimelineItem[], e: TurnEvent): TimelineItem[] {
  switch (e.type) {
    case "stage":
      return [...items, { kind: "stage", key: `s${items.length}`, name: e.name, detail: e.detail }];
    case "validation":
      return [...items, { kind: "validation", key: `v${items.length}`, attempt: e.attempt, valid: e.valid, errors: e.errors }];
    case "llm_start":
      return [...items, { kind: "llm", key: e.call_id, stage: e.stage, model: e.model, prompt: e.prompt, text: "", done: false }];
    case "llm_text":
      return items.map((it) => (it.kind === "llm" && it.key === e.call_id ? { ...it, text: e.text } : it));
    case "llm_end":
      return items.map((it) => (it.kind === "llm" && it.key === e.call_id ? { ...it, done: true, latency: e.latency_ms, error: e.error } : it));
  }
}

const STAGE_LABEL: Record<string, string> = {
  analyze: "LLM phân tích lượt học viên",
  "generate#1": "LLM sinh câu hỏi (lần 1)",
  "generate#2": "LLM sinh lại (lần 2)",
  "generate#3": "LLM sinh lại (lần 3)",
};

function detailText(detail: unknown): string {
  if (detail === undefined || detail === null) return "";
  return typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
}

function LlmCard({ item }: { item: Extract<TimelineItem, { kind: "llm" }> }) {
  const status = item.error ? `❌ ${item.error}` : item.done ? `✅ ${item.latency} ms` : "⏳ đang nhận phản hồi…";
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
        <b>{STAGE_LABEL[item.stage] ?? item.stage}</b>
        <span className="text-xs text-[var(--muted)]">{item.model} · {status}</span>
      </div>
      <details className="px-3 py-2">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--indigo)]">Prompt gửi tới mô hình</summary>
        {item.prompt.map((m, i) => (
          <div key={i} className="mt-2">
            <p className="text-xs font-bold uppercase text-[var(--muted)]">{m.role}</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs">{m.content}</pre>
          </div>
        ))}
      </details>
      <div className="px-3 pb-3">
        <p className="text-xs font-bold uppercase text-[var(--muted)]">Phản hồi thô (thời gian thực)</p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-2 text-xs text-emerald-200" aria-live="polite">
          {item.text}
          {!item.done && <span className="animate-pulse">▍</span>}
        </pre>
      </div>
    </div>
  );
}

export function LiveTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((it) => (
        <li key={it.key}>
          {it.kind === "llm" && <LlmCard item={it} />}
          {it.kind === "stage" && (
            <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2">
              <b>▸ {it.name}</b>
              {detailText(it.detail) && (
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-[var(--muted)]">{detailText(it.detail)}</pre>
              )}
            </div>
          )}
          {it.kind === "validation" && (
            <div className={`rounded-xl px-3 py-2 text-sm ${it.valid ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
              <b>Validator lần {it.attempt}: {it.valid ? "hợp lệ" : "không hợp lệ → sinh lại"}</b>
              {it.errors.length > 0 && <p>{it.errors.join(" · ")}</p>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
