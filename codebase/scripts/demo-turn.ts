// Runs a single learner turn and prints the decision, the generated interaction and where the prompt/raw response were logged.
// Usage (from codebase/): npm run turn -- "context window là gì" [--concept context_window]
import path from "node:path";
import { parseArgs } from "node:util";
import { emptyState } from "../engine/behavior-tracker.ts";
import { runTurn } from "../engine/engine.ts";
import { DAY01_KNOWLEDGE } from "../engine/knowledge.ts";
import { loadEnvFile, OpenAiCompatibleClient } from "../engine/llm-client.ts";

const codebaseDir = path.resolve(import.meta.dirname, "..");

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { concept: { type: "string", default: "next_token_prediction" } },
  });
  loadEnvFile(path.join(codebaseDir, ".env"));
  process.env.VLEARN_DATA_DIR ||= path.resolve(codebaseDir, "..", "data", "vlearn-pack");
  process.env.SLIDEALIVE_LOG_DIR ||= path.join(codebaseDir, "logs");

  const message = positionals.join(" ").trim();
  const out = await runTurn(
    {
      concept_id: values.concept ?? "next_token_prediction",
      learner_state: emptyState(),
      recent_behavior: { learner_action: message ? "ask" : "start" },
      learner_message: message || null,
    },
    { llm: new OpenAiCompatibleClient(), knowledge: DAY01_KNOWLEDGE },
  );
  console.log(JSON.stringify({ decision: out.decision, interaction: out.interaction, validation: out.validation }, null, 2));
  console.log(`\nPrompt + phản hồi thô: ${out.log_file} (turn ${out.turn_id})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
