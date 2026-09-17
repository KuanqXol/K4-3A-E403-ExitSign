// Golden-set loading, acceptance scoring and report rendering (no I/O side effects except reads).
import { readFileSync } from "node:fs";
import { emptyState } from "../engine/behavior-tracker.ts";
import type { Action, Difficulty, PendingInteraction, TurnInput, TurnOutput } from "../engine/types.ts";

export type Expected = {
  actions: Action[];
  difficulty?: Difficulty[];
  concept_id?: string[];
  must_cite_any?: string[];
  must_not_contain?: string[];
  allow_fallback?: boolean;
  max_generation_attempts?: number;
};

export type GoldenCase = {
  id: string;
  layer: string;
  origin: { type: "chatlog" | "synthetic"; turn_id?: string; lecture_code?: string; note?: string };
  description: string;
  input: Omit<TurnInput, "learner_state" | "pending_interaction"> & {
    learner_state?: Partial<TurnInput["learner_state"]>;
    pending_interaction?: string | PendingInteraction | null;
  };
  expected: Expected;
};

export type GoldenSet = {
  version: string;
  lesson_id: string;
  shared_pending: Record<string, PendingInteraction>;
  cases: GoldenCase[];
};

export type CaseResult = {
  id: string;
  legacy_id?: string;
  layer: string;
  origin: string;
  description: string;
  passed: boolean;
  failures: string[];
  actual?: {
    action: Action;
    difficulty: Difficulty;
    concept_id: string;
    analysis_scope: string;
    analysis_intent: string;
    misconception_id: string | null;
    valid: boolean;
    validator_errors: string[];
    attempts: number;
    fallback_used: boolean;
    llm_errors: string[];
    attempt_errors?: string[][];
    source_refs: string[];
    question: string | null;
    turn_id: string;
  };
  error?: string;
  duration_ms: number;
};

export function loadGoldenSet(file: string): GoldenSet {
  const data = JSON.parse(readFileSync(file, "utf8")) as GoldenSet;
  if (!Array.isArray(data.cases) || data.cases.length === 0) throw new Error("golden_set.json không có cases");
  const ids = new Set<string>();
  for (const c of data.cases) {
    if (ids.has(c.id)) throw new Error(`Trùng id ${c.id}`);
    ids.add(c.id);
    if (!c.expected?.actions?.length) throw new Error(`${c.id}: thiếu expected.actions`);
  }
  return data;
}

export function toTurnInput(set: GoldenSet, c: GoldenCase): TurnInput {
  const ref = c.input.pending_interaction;
  const pending = typeof ref === "string" ? set.shared_pending[ref] : ref ?? null;
  if (typeof ref === "string" && !pending) throw new Error(`${c.id}: không có shared_pending ${ref}`);
  return {
    ...c.input,
    learner_state: { ...emptyState(), ...c.input.learner_state },
    pending_interaction: pending,
  };
}

const lower = (s: string) => s.toLowerCase().normalize("NFC");

export function scoreCase(c: GoldenCase, out: TurnOutput): string[] {
  const e = c.expected;
  const failures: string[] = [];
  const { decision, interaction, validation } = out;
  if (!e.actions.includes(decision.action)) failures.push(`action=${decision.action}, mong đợi ${e.actions.join("|")}`);
  if (e.difficulty && !e.difficulty.includes(decision.difficulty)) failures.push(`difficulty=${decision.difficulty}, mong đợi ${e.difficulty.join("|")}`);
  if (e.concept_id && !e.concept_id.includes(decision.concept_id)) failures.push(`concept=${decision.concept_id}, mong đợi ${e.concept_id.join("|")}`);
  if (!validation.valid) failures.push(`validator: ${validation.errors.join("; ")}`);
  if (out.fallback_used && !e.allow_fallback) failures.push("phải dùng fallback (LLM không qua validator sau 3 lần)");
  if (e.max_generation_attempts !== undefined && out.generation_attempts > e.max_generation_attempts) {
    failures.push(`gọi LLM sinh ${out.generation_attempts} lần, tối đa ${e.max_generation_attempts}`);
  }
  if (e.must_cite_any && !e.must_cite_any.some((r) => interaction.source_refs.includes(r))) {
    failures.push(`không trích ${e.must_cite_any.join("|")} (có: ${interaction.source_refs.join(",") || "∅"})`);
  }
  const visible = lower([interaction.message, interaction.question ?? "", interaction.hint ?? ""].join("\n"));
  for (const banned of e.must_not_contain ?? []) {
    if (visible.includes(lower(banned))) failures.push(`nội dung hiển thị chứa "${banned}"`);
  }
  return failures;
}

export function failureCategory(r: CaseResult): string {
  if (r.error || r.actual?.llm_errors.length) return "Lỗi hạ tầng/LLM";
  const f = r.failures.join(" ");
  if (f.includes("action=")) return "Quyết định sư phạm sai";
  if (f.includes("concept=")) return "Nhận diện concept sai";
  if (f.includes("difficulty=")) return "Độ khó sai";
  if (f.includes("chứa \"") || f.includes("lộ")) return "Lộ đáp án / nội dung cấm";
  if (f.includes("không trích") || f.includes("source_refs") || f.includes("nguồn")) return "Không bám nguồn";
  if (f.includes("fallback") || f.includes("validator")) return "Đầu ra LLM không hợp lệ";
  return "Khác";
}

export type RunRecord = {
  run_id: string;
  label: string;
  started_at: string;
  model: string;
  base_url: string;
  total: number;
  passed: number;
  results: CaseResult[];
  note?: string;
};

const pct = (a: number, b: number) => (b === 0 ? "0.0" : ((a / b) * 100).toFixed(1));
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function breakdown(results: CaseResult[], key: (r: CaseResult) => string): string[] {
  const groups = new Map<string, CaseResult[]>();
  for (const r of results) groups.set(key(r), [...(groups.get(key(r)) ?? []), r]);
  return [...groups.entries()].map(([k, rs]) => {
    const ok = rs.filter((r) => r.passed).length;
    return `| ${k} | ${rs.length} | ${ok} | ${rs.length - ok} | ${pct(ok, rs.length)}% |`;
  });
}

function generationStats(results: CaseResult[]): string[] {
  const generated = results.filter((r) => (r.actual?.attempts ?? 0) > 0);
  const firstTry = generated.filter((r) => r.actual?.attempts === 1 && !r.actual.fallback_used).length;
  const fallback = generated.filter((r) => r.actual?.fallback_used).length;
  const blocked = results.filter((r) => r.actual?.attempts === 0).length;
  return [
    "| Chỉ số sinh câu hỏi | Giá trị |",
    "|---|---:|",
    `| Ca có gọi LLM sinh | ${generated.length} |`,
    `| Qua validator ngay lần 1 | ${firstTry}/${generated.length} (${pct(firstTry, generated.length)}%) |`,
    `| Phải dùng fallback sau 3 lần | ${fallback}/${generated.length} (${pct(fallback, generated.length)}%) |`,
    `| Ca bị chặn bằng luật, không gọi LLM | ${blocked} |`,
  ];
}

function attemptLines(r: CaseResult): string[] {
  const errors = r.actual?.attempt_errors;
  if (!errors?.length) return [];
  return [`- Validator từng lần sinh: ${errors.map((e, i) => `#${i + 1} ${e.length ? cell(e.join("; ")) : "OK"}`).join(" · ")}`];
}

function failureLines(run: RunRecord, analysis: string | undefined): string[] {
  const failed = run.results.filter((r) => !r.passed);
  if (failed.length === 0) return ["Không có ca thất bại trong lượt này."];
  const lines = ["| Nhóm nguyên nhân | Số ca | Ca |", "|---|---:|---|"];
  const byCat = new Map<string, string[]>();
  for (const r of failed) byCat.set(failureCategory(r), [...(byCat.get(failureCategory(r)) ?? []), r.id]);
  for (const [cat, ids] of byCat) lines.push(`| ${cat} | ${ids.length} | ${ids.join(", ")} |`);
  lines.push("");
  for (const r of failed) {
    lines.push(
      `#### ${r.id} — ${cell(r.description)}`,
      "",
      `- Nhóm nguyên nhân: **${failureCategory(r)}**`,
      ...(r.error ? [`- Lỗi: \`${cell(r.error)}\``] : r.failures.map((f) => `- ${cell(f)}`)),
      ...(r.actual
        ? [
            ...r.actual.llm_errors.map((e) => `- Lỗi gọi LLM: \`${cell(e)}\``),
            ...attemptLines(r),
            `- Phân tích lượt: scope=\`${r.actual.analysis_scope}\`, intent=\`${r.actual.analysis_intent}\`, misconception=\`${r.actual.misconception_id ?? "∅"}\``,
            `- Prompt + phản hồi thô: tìm \`turn=${r.actual.turn_id}\` trong \`codebase/logs/llm_calls.log\``,
          ]
        : []),
      analysis
        ? `- Nhận định: xem **Phân tích nguyên nhân chi tiết — ${run.label}**.`
        : `- Nhận định của nhóm: _(viết vào \`eval/analysis/${run.run_id}.md\` rồi chạy \`npm run eval -- --report-only\`)_`,
      "",
    );
  }
  return lines;
}

function renderRun(run: RunRecord, index: number, analysis: string | undefined): string[] {
  return [
    `## ${run.label}`,
    "",
    `\`${run.run_id}\` · ${run.started_at} · model \`${run.model}\` · endpoint \`${run.base_url}\``,
    "",
    `**Đạt ${run.passed}/${run.total} = ${pct(run.passed, run.total)}%** · Thất bại ${run.total - run.passed}`,
    "",
    ...(run.note ? [`> ${run.note}`, ""] : []),
    `### ${index}.1 Theo lớp chỗ khó / nhóm ca`,
    "",
    "| Lớp | Số ca | Đạt | Thất bại | Tỷ lệ |",
    "|---|---:|---:|---:|---:|",
    ...breakdown(run.results, (r) => r.layer),
    "",
    `### ${index}.2 Độ ổn định của bước sinh (LLM generate)`,
    "",
    ...generationStats(run.results),
    "",
    `### ${index}.3 Chi tiết từng ca`,
    "",
    "| Ca | Lớp | Nguồn | Kết quả | Action | Độ khó | Concept | Lần sinh | Fallback | turn_id (tra trong llm_calls.log) |",
    "|---|---|---|---|---|---|---|---:|---|---|",
    ...run.results.map((r) => {
      const a = r.actual;
      return `| ${r.id} | ${r.layer} | ${r.origin} | ${r.passed ? "✅ Đạt" : "❌ Trượt"} | ${a?.action ?? "—"} | ${a?.difficulty ?? "—"} | ${a?.concept_id ?? "—"} | ${a?.attempts ?? "—"} | ${a ? (a.fallback_used ? "có" : "không") : "—"} | ${a ? `\`${a.turn_id}\`` : "—"} |`;
    }),
    "",
    `### ${index}.4 Ca thất bại`,
    "",
    ...failureLines(run, analysis),
    ...(analysis
      ? ["", `### ${index}.5 Phân tích nguyên nhân chi tiết — ${run.label}`, "", `> Nguồn: \`eval/analysis/${run.run_id}.md\``, "", analysis.trim()]
      : []),
    "",
  ];
}

// analyses: optional hand-written root-cause analysis per run_id (eval/analysis/<run_id>.md)
export function renderReport(runs: RunRecord[], qualityBar: string, analyses: Record<string, string> = {}): string {
  const lines: string[] = [
    "# Kết quả chạy Golden Set",
    "",
    "> File này do `codebase/scripts/run-eval.ts` sinh tự động từ `eval/runs/*.json` và `eval/analysis/*.md`. Không sửa tay số liệu.",
    `> Quality bar đề xuất (nhóm chốt trong spec.md §7): ${qualityBar}`,
    "",
    "Tiêu chí nghiệm thu mỗi ca: đúng `action` (và `difficulty`/`concept` nếu ca quy định) · đầu ra qua Validator (schema, đáp án, bám nguồn, không lộ đáp án) · không phải dùng fallback · trích đúng mã đoạn nếu ca yêu cầu · không chứa nội dung cấm. **Tỷ lệ đạt = số ca đạt / tổng số ca.**",
    "",
    "## Tổng hợp các lượt chạy",
    "",
    "| Lượt | Thời điểm | Model | Tổng | Đạt | Thất bại | Tỷ lệ đạt |",
    "|---|---|---|---:|---:|---:|---:|",
    ...runs.map((r) => `| ${r.label} (\`${r.run_id}\`) | ${r.started_at} | ${r.model} | ${r.total} | ${r.passed} | ${r.total - r.passed} | ${pct(r.passed, r.total)}% |`),
    "",
    ...runs.flatMap((r, i) => renderRun(r, i + 1, analyses[r.run_id])),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}
