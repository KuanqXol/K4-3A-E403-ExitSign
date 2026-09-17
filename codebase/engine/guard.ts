// Rule-based pre-guard. Learner text is data, never instructions: injection and
// secret-extraction attempts are refused before anything is sent to the model.
const INJECTION_PATTERNS: RegExp[] = [
  /system[_ ]?override/i,
  /b[oỏ]\s*qua\s+(m[oọ]i|t[aấ]t\s*c[aả]|c[aá]c|to[aà]n\s*b[oộ])?\s*(h[uư][oớ]ng\s*d[aẫ]n|ch[iỉ]\s*d[aẫ]n|guardrail|r[aà]ng\s*bu[oộ]c|gi[oớ]i\s*h[aạ]n|nguy[eê]n\s*t[aắ]c|prompt)/i,
  /ignore\s+(all|any|every|previous|the\s+prompt|the\s+first|instructions?)/i,
  /qu[eê]n\s+h[eế]t/i,
  /<\s*system\s*>/i,
  /(hi[eể]n\s*th[iị]|cung\s*c[aấ]p|ti[eế]t\s*l[oộ]|show|cho\s+(t[oô]i|tao|m[iì]nh|em)\s+(bi[eế]t|xem)?)\s.{0,40}(api\s*key|m[aậ]t\s*kh[aẩ]u|password|t[aà]i\s*kho[aả]n\s*admin|system\s*prompt|prompt\s*hi[eệ]n)/i,
  /t[oô]i\s+(l[aà]\s+)?(admin|qu[aả]n\s*tr[iị]\s*vi[eê]n)/i,
];

export type GuardResult = { blocked: boolean; reason: string | null };

export function preGuard(message: string | null | undefined): GuardResult {
  if (!message) return { blocked: false, reason: null };
  const hit = INJECTION_PATTERNS.find((p) => p.test(message));
  return hit
    ? { blocked: true, reason: `prompt_injection_or_secret_request (${hit.source.slice(0, 40)})` }
    : { blocked: false, reason: null };
}

const GIBBERISH_MIN_LETTERS = 3;
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const KEYBOARD_RUN = 4;
const VOWELS = /[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/;

function isKeyboardMash(word: string): boolean {
  if (word.length < KEYBOARD_RUN) return false;
  return KEYBOARD_ROWS.some((row) =>
    Array.from({ length: word.length - KEYBOARD_RUN + 1 }, (_, i) => word.slice(i, i + KEYBOARD_RUN)).some((chunk) => row.includes(chunk)),
  );
}

export function looksLikeGibberish(message: string): boolean {
  const words = message.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.join("").length < GIBBERISH_MIN_LETTERS) return true;
  const junk = words.filter((w) => (w.length >= 3 && !VOWELS.test(w)) || isKeyboardMash(w));
  return junk.length / words.length > 0.5;
}
