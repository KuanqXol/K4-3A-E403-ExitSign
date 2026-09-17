// Content Analyzer: reads the cleaned transcript from data/vlearn-pack and returns
// the verbatim paragraphs a concept cites, so every generation is grounded in source text.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Concept, LessonKnowledge } from "./types.ts";

const PARAGRAPH_PATTERN = /^\*\*\[(T\d{2}-\d{3})\]\*\*\s*(.+)$/;
const MAX_EXCERPT_CHARS = 900;

// VLEARN_DATA_DIR may be absolute, or relative to the repo root / codebase
// ("/data/vlearn-pack" on Windows would otherwise mean the drive root).
export function resolveDataDir(): string {
  const fromEnv = process.env.VLEARN_DATA_DIR?.trim();
  const bases = [process.cwd(), path.resolve(process.cwd(), "..")];
  const candidates = [
    ...(fromEnv ? [path.resolve(fromEnv), ...bases.map((b) => path.resolve(b, fromEnv.replace(/^[\\/]+/, "")))] : []),
    ...bases.map((b) => path.resolve(b, "data/vlearn-pack")),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, "transcript"))) ?? candidates[0];
}

export function parseTranscript(markdown: string): Map<string, string> {
  const paragraphs = new Map<string, string>();
  for (const line of markdown.split(/\r?\n/)) {
    const match = PARAGRAPH_PATTERN.exec(line.trim());
    if (match) paragraphs.set(match[1], match[2].trim());
  }
  return paragraphs;
}

const cache = new Map<string, Map<string, string>>();

export function loadTranscript(knowledge: LessonKnowledge, dataDir = resolveDataDir()): Map<string, string> {
  const file = path.join(dataDir, "transcript", knowledge.transcript_file);
  const cached = cache.get(file);
  if (cached) return cached;
  if (!existsSync(file)) {
    throw new Error(
      `Không tìm thấy transcript ${file}. Đặt data pack tại <repo>/data/vlearn-pack hoặc set VLEARN_DATA_DIR.`,
    );
  }
  const parsed = parseTranscript(readFileSync(file, "utf8"));
  cache.set(file, parsed);
  return parsed;
}

export type SourceExcerpt = { ref: string; text: string };

export function excerptsFor(concept: Concept, transcript: Map<string, string>): SourceExcerpt[] {
  return concept.source_ref
    .map((ref) => ({ ref, text: transcript.get(ref) ?? "" }))
    .filter((e) => e.text.length > 0)
    .map((e) => ({ ref: e.ref, text: e.text.slice(0, MAX_EXCERPT_CHARS) }));
}

// Keyword match used as a cheap hint for the LLM analyzer and as a no-LLM fallback.
export function guessConcept(knowledge: LessonKnowledge, message: string): string | null {
  const text = message.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const concept of knowledge.concepts) {
    const score = concept.keywords.filter((k) => text.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { id: concept.concept_id, score };
  }
  return best?.id ?? null;
}
