// Runs every golden-set case through the real prototype pipeline and writes
//   eval/runs/<run_id>.json  and  eval/run_results.md
// Usage (from codebase/, key in codebase/.env): npm run eval -- [--label "Lượt 1"] [--only G01,G02]
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { runTurn } from "../engine/engine.ts";
import { DAY01_KNOWLEDGE } from "../engine/knowledge.ts";
import { loadEnvFile, OpenAiCompatibleClient } from "../engine/llm-client.ts";
import {
  type CaseResult,
  type RunRecord,
  loadGoldenSet,
  renderReport,
  scoreCase,
  toTurnInput,
} from "./eval-lib.ts";

const QUALITY_BAR = "Đạt khi ≥ 80% số ca qua tiêu chí nghiệm thu, và 100% ca lớp ③ (ngoài phạm vi) cùng mọi ca có kiểm tra lộ đáp án đều đạt.";

const codebaseDir = path.resolve(import.meta.dirname, "..");
const repoDir = path.resolve(codebaseDir, "..");
const evalDir = path.join(repoDir, "eval");

function writeReport(outDir: string, runsDir: string): void {
  const runs = readdirSync(runsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(runsDir, f), "utf8")) as RunRecord);
  if (runs.length === 0) throw new Error(`Chưa có lượt chạy nào trong ${runsDir}`);
  const analysisDir = path.join(outDir, "analysis");
  const analyses = Object.fromEntries(
    runs
      .map((r) => [r.run_id, path.join(analysisDir, `${r.run_id}.md`)] as const)
      .filter(([, file]) => existsSync(file))
      .map(([id, file]) => [id, readFileSync(file, "utf8")]),
  );
  writeFileSync(path.join(outDir, "run_results.md"), renderReport(runs, QUALITY_BAR, analyses), "utf8");
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    // --out: write runs/ + run_results.md elsewhere (smoke tests), golden set is still read from eval/
    options: {
      label: { type: "string" },
      only: { type: "string" },
      out: { type: "string" },
      // --report-only: rebuild run_results.md from existing runs, no API calls
      "report-only": { type: "boolean", default: false },
    },
  });
  const outDir = values.out ? path.resolve(values.out) : evalDir;
  const runsDir = path.join(outDir, "runs");
  if (values["report-only"]) {
    writeReport(outDir, runsDir);
    console.log(`→ ${path.join(outDir, "run_results.md")}`);
    return;
  }
  loadEnvFile(path.join(codebaseDir, ".env"));
  process.env.VLEARN_DATA_DIR ||= path.join(repoDir, "data", "vlearn-pack");
  process.env.SLIDEALIVE_LOG_DIR ||= path.join(codebaseDir, "logs");

  const llm = new OpenAiCompatibleClient();
  const set = loadGoldenSet(path.join(evalDir, "golden_set.json"));
  const only = values.only ? new Set(values.only.split(",").map((s) => s.trim())) : null;
  const cases = set.cases.filter((c) => !only || only.has(c.id));

  const startedAt = new Date();
  const runId = `run-${startedAt.toISOString().replace(/[-:]/g, "").slice(0, 15)}`;
  const priorRuns = existsSync(runsDir) ? readdirSync(runsDir).filter((f) => f.endsWith(".json")).length : 0;
  const label = values.label ?? `Lượt ${priorRuns + 1}`;
  console.log(`▶ ${label} · ${cases.length} ca · model ${llm.model}`);

  const results: CaseResult[] = [];
  for (const c of cases) {
    const t0 = Date.now();
    const origin = c.origin.type === "chatlog" ? `chatlog ${c.origin.turn_id}` : "tự xây";
    try {
      const out = await runTurn(toTurnInput(set, c), {
        llm,
        knowledge: DAY01_KNOWLEDGE,
        turnId: `${runId}-${c.id}`,
      });
      const failures = scoreCase(c, out);
      results.push({
        id: c.id, layer: c.layer, origin, description: c.description,
        passed: failures.length === 0, failures, duration_ms: Date.now() - t0,
        actual: {
          action: out.decision.action,
          difficulty: out.decision.difficulty,
          concept_id: out.decision.concept_id,
          analysis_scope: out.analysis.scope,
          analysis_intent: out.analysis.intent,
          misconception_id: out.analysis.misconception_id,
          valid: out.validation.valid,
          validator_errors: out.validation.errors,
          attempts: out.generation_attempts,
          fallback_used: out.fallback_used,
          attempt_errors: out.attempt_errors,
          llm_errors: out.llm_errors,
          source_refs: out.interaction.source_refs,
          question: out.interaction.question,
          turn_id: out.turn_id,
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ id: c.id, layer: c.layer, origin, description: c.description, passed: false, failures: [], error, duration_ms: Date.now() - t0 });
    }
    const r = results[results.length - 1];
    console.log(`  ${r.passed ? "✅" : "❌"} ${c.id} ${r.actual?.action ?? r.error ?? ""} ${r.failures.join(" · ")}`);
  }

  const record: RunRecord = {
    run_id: runId,
    label,
    started_at: startedAt.toISOString(),
    model: llm.model,
    base_url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    results,
  };
  mkdirSync(runsDir, { recursive: true });
  writeFileSync(path.join(runsDir, `${runId}.json`), JSON.stringify(record, null, 2), "utf8");

  writeReport(outDir, runsDir);

  console.log(`\n${record.passed}/${record.total} đạt (${((record.passed / record.total) * 100).toFixed(1)}%)`);
  console.log(`→ ${path.join(runsDir, `${runId}.json`)}\n→ ${path.join(outDir, "run_results.md")}\n→ prompt + phản hồi thô: ${path.join(process.env.SLIDEALIVE_LOG_DIR ?? "", "llm_calls.log")}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
