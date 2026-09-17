// Pre-defined interactions used when the LLM fails validation more than twice,
// and for guard-blocked turns (which never reach the model).
import type { Concept, Decision, Interaction, LessonKnowledge } from "./types.ts";

export const REFUSAL_MESSAGE =
  "Mình chỉ hỗ trợ nội dung của bài học hiện tại nên không xử lý được yêu cầu này. Bạn muốn ôn tiếp phần token, context window hay attention không?";

const GENERIC_DISTRACTORS = [
  "Bài giảng khẳng định điều này chỉ đúng với các mô hình đời cũ.",
  "Mô hình ghi nhớ nguyên văn mọi câu đã học rồi chép lại.",
];

function predictQuestion(concept: Concept): Interaction {
  const correct = concept.key_points[0];
  const distractors = concept.misconception_bank.map((m) => m.claim);
  const pool = [...distractors, ...GENERIC_DISTRACTORS].slice(0, 3);
  // Deterministic but concept-dependent position so the right answer is not always "A".
  const position = concept.concept_id.length % (pool.length + 1);
  const options = [...pool.slice(0, position), correct, ...pool.slice(position)];
  return {
    message: `Trước khi xem giải thích, bạn thử đoán nhé — phần "${concept.title}".`,
    question: `Nhận định nào đúng về "${concept.title}"? Giải thích vì sao bạn chọn.`,
    options,
    answer_key: { correct_option_index: position, rubric: [concept.key_points[0]] },
    hint: null,
    source_refs: concept.source_ref.slice(0, 2),
  };
}

export function fallbackInteraction(knowledge: LessonKnowledge, concept: Concept, decision: Decision): Interaction {
  const refs = concept.source_ref.slice(0, 2);
  const misconception = concept.misconception_bank.find((m) => m.id === decision.misconception_id) ?? concept.misconception_bank[0];
  switch (decision.action) {
    case "REFUSE_OUT_OF_SCOPE":
      return { message: REFUSAL_MESSAGE, question: null, options: [], answer_key: null, hint: null, source_refs: [] };
    case "ASK_CLARIFY":
      return {
        message: "Mình chưa rõ bạn đang hỏi phần nào.",
        question: "Bạn muốn mình làm rõ nội dung nào dưới đây?",
        options: knowledge.concepts.slice(0, 4).map((c) => c.title),
        answer_key: null,
        hint: null,
        source_refs: [],
      };
    case "SOCRATIC_HINT":
      return {
        message: "Mình gợi ý từng bước nhé.",
        question: `Theo bài giảng, điểm cốt lõi của "${concept.title}" liên quan đến điều gì?`,
        options: [],
        answer_key: null,
        hint: `Đọc lại đoạn ${refs.join(", ")} và chú ý ý: "${concept.key_points[1] ?? concept.key_points[0]}".`,
        source_refs: refs,
      };
    case "REINFORCE_EXPLAIN":
      return {
        message: "Bạn làm tốt rồi! Giờ thử giảng lại cho một bạn chưa học nhé.",
        question: `Giải thích "${concept.title}" bằng 2-3 câu của bạn.`,
        options: [],
        answer_key: { correct_option_index: null, rubric: concept.key_points.slice(0, 3) },
        hint: null,
        source_refs: refs,
      };
    case "MISCONCEPTION_PROBE":
      return {
        message: "Một bạn học phát biểu như sau. Bạn thấy có vấn đề không?",
        question: `"${misconception?.claim ?? concept.key_points[0]}" — nhận định này thế nào?`,
        options: ["Đúng hoàn toàn", "Sai — mâu thuẫn với bài giảng", "Chỉ đúng với tiếng Anh", "Bài giảng không đề cập"],
        answer_key: { correct_option_index: 1, rubric: [misconception?.correction ?? concept.key_points[0]] },
        hint: null,
        source_refs: refs,
      };
    default:
      return predictQuestion(concept);
  }
}
