// Lesson Knowledge for Day 1 — LLM Foundation.
// Key points are short paraphrases; the verbatim source text is loaded at runtime
// from data/vlearn-pack/transcript (never committed) by content-analyzer.ts.
import type { Concept, LessonKnowledge } from "./types.ts";

const concepts: Concept[] = [
  {
    concept_id: "next_token_prediction",
    title: "LLM sinh văn bản bằng dự đoán token tiếp theo",
    keywords: ["dự đoán", "token tiếp theo", "sinh văn bản", "bản chất llm", "llm là gì", "cơ chế"],
    key_points: [
      "LLM không 'tra cứu' tri thức; nó dự đoán từ/token tiếp theo theo xác suất đã học.",
      "Vòng lặp: dự đoán → sinh token → nối vào chuỗi → dự đoán tiếp, đến khi xong.",
      "Vì sinh từng token nên có chế độ streaming trả về từng phần.",
    ],
    source_ref: ["T04-046", "T04-047", "T04-048"],
    misconception_bank: [
      {
        id: "llm_is_database",
        claim: "LLM trả lời bằng cách tra cứu một cơ sở dữ liệu kiến thức có sẵn.",
        correction: "LLM dự đoán token tiếp theo theo xác suất, không tra bảng tri thức.",
      },
      {
        id: "llm_predicts_prices",
        claim: "Vì làm được nhiều việc nên LLM dự đoán được giá vàng, giá Bitcoin.",
        correction: "LLM chỉ nối token cho hợp lý; không phải mô hình dự báo thị trường.",
      },
    ],
  },
  {
    concept_id: "hallucination",
    title: "Ảo giác (hallucination)",
    keywords: ["ảo giác", "hallucination", "bịa", "sai thông tin"],
    key_points: [
      "Văn bản trông hợp lý nhưng có thể sai vì mô hình chỉ nối token cho có nghĩa.",
      "Ảo giác là hệ quả trực tiếp của cơ chế dự đoán xác suất.",
      "Cần thêm context, công cụ tra cứu và guardrail quanh LLM để giảm rủi ro.",
    ],
    source_ref: ["T04-048", "T04-067", "T04-074"],
    misconception_bank: [
      {
        id: "fluent_means_true",
        claim: "Câu trả lời trôi chảy, tự tin thì chắc chắn đúng.",
        correction: "Độ trôi chảy đến từ xác suất nối từ, không đảm bảo thông tin đúng.",
      },
    ],
  },
  {
    concept_id: "tokenization",
    title: "Token — đơn vị tính của LLM",
    keywords: ["token", "tokenizer", "chi phí", "ký tự"],
    key_points: [
      "Token không phải từ hay chữ cái; mô hình chẻ văn bản thành token.",
      "Ước lượng nhanh: khoảng 4 ký tự tiếng Anh ≈ 1 token.",
      "Tiếng Việt thường tốn token hơn tiếng Anh (khoảng 1,3–1,4 lần theo giảng viên).",
      "Số token quyết định chi phí khi gọi API.",
    ],
    source_ref: ["T04-049", "T04-050"],
    misconception_bank: [
      {
        id: "token_equals_word",
        claim: "Mỗi token là đúng một từ.",
        correction: "Token là mảnh do tokenizer chẻ ra; một từ có thể thành nhiều token.",
      },
      {
        id: "vietnamese_cheaper",
        claim: "Tiếng Việt tốn ít token hơn tiếng Anh.",
        correction: "Theo bài giảng, tiếng Việt thường tốn hơn tiếng Anh.",
      },
    ],
  },
  {
    concept_id: "context_window",
    title: "Context window và context rot",
    keywords: ["context", "ngữ cảnh", "cửa sổ ngữ cảnh", "context window", "context rot"],
    key_points: [
      "Context là toàn bộ thông tin mô hình tiêu thụ trong một lần — như bàn làm việc.",
      "Context window giới hạn lượng token mô hình nhận cùng lúc.",
      "Context rot: đưa càng nhiều, mô hình càng dễ quên phần đầu; context lớn không tự động tốt hơn.",
      "Nên quản lý context: đưa đúng thông tin chất lượng.",
    ],
    source_ref: ["T04-051", "T04-052", "T04-053", "T04-057"],
    misconception_bank: [
      {
        id: "bigger_context_always_better",
        claim: "Context window càng lớn thì mô hình càng thông minh.",
        correction: "Context rot khiến nhiều context có thể làm mô hình kém đi và chú ý sai chỗ.",
      },
    ],
  },
  {
    concept_id: "attention",
    title: "Transformer và cơ chế attention",
    keywords: ["attention", "transformer", "multi-head", "rnn", "chú ý"],
    key_points: [
      "RNN đọc từng chữ nên dễ quên phần đầu câu dài.",
      "Attention nhìn cả đoạn, tính mức liên quan giữa các cặp từ (ma trận trọng số).",
      "Multi-head: nhiều 'con mắt' cùng nhìn các đặc trưng khác nhau rồi tổng hợp.",
      "Transformer bắt nguồn từ bài báo 'Attention Is All You Need' (Google, 2017).",
    ],
    source_ref: ["T04-038", "T04-039", "T04-040", "T04-054", "T04-055", "T04-056"],
    misconception_bank: [
      {
        id: "attention_word_by_word",
        claim: "Transformer vẫn xử lý lần lượt từng chữ giống RNN.",
        correction: "Attention nhìn cả đoạn cùng lúc và nối các từ liên quan dù ở xa nhau.",
      },
      {
        id: "openai_invented_transformer",
        claim: "OpenAI là nơi công bố kiến trúc Transformer.",
        correction: "Bài báo gốc năm 2017 là của team Google; OpenAI đưa ra đại chúng với ChatGPT.",
      },
    ],
  },
  {
    concept_id: "temperature_sampling",
    title: "Temperature, top-k, top-p",
    keywords: ["temperature", "top-k", "top-p", "top_p", "sampling", "sáng tạo"],
    key_points: [
      "Mô hình liệt kê các token ứng viên theo xác suất.",
      "Top-k giữ k token xác suất cao nhất; top-p cộng dồn xác suất đến ngưỡng p.",
      "Temperature = 0: luôn lấy token xác suất cao nhất, kết quả gần như lặp lại.",
      "Temperature cao: chọn ngẫu nhiên rộng hơn, 'sáng tạo' hơn.",
    ],
    source_ref: ["T04-070", "T04-071", "T04-072"],
    misconception_bank: [
      {
        id: "high_temp_more_accurate",
        claim: "Tăng temperature giúp câu trả lời chính xác hơn.",
        correction: "Temperature cao tăng độ ngẫu nhiên; cần ổn định thì để thấp.",
      },
      {
        id: "topk_equals_topp",
        claim: "Top-k và top-p là một thứ.",
        correction: "Top-k cắt theo số lượng token; top-p cắt theo tổng xác suất cộng dồn.",
      },
    ],
  },
  {
    concept_id: "rlhf",
    title: "RLHF — học tăng cường với phản hồi con người",
    keywords: ["rlhf", "reinforcement", "học tăng cường", "reward", "gán nhãn"],
    key_points: [
      "Học tăng cường: làm đúng được thưởng, sai bị trừ; mô hình tự khám phá.",
      "Với tác vụ cần đánh giá chủ quan, con người tham gia chấm (like/dislike, chọn phương án).",
      "Gán nhãn dữ liệu chuyển dần sang chuyên gia chất lượng cao.",
    ],
    source_ref: ["T04-059", "T04-060", "T04-062"],
    misconception_bank: [
      {
        id: "rlhf_no_humans",
        claim: "RLHF không cần con người, mô hình tự học hoàn toàn.",
        correction: "Chữ HF là human feedback: con người đánh giá câu trả lời tốt hay chưa.",
      },
    ],
  },
];

export const DAY01_KNOWLEDGE: LessonKnowledge = {
  lesson_id: "D01-llm-foundation",
  title: "Day 1 — Foundation: cách LLM hoạt động",
  transcript_file: "transcript-04-clean.md",
  concepts,
};

export function findConcept(knowledge: LessonKnowledge, conceptId: string | null): Concept | undefined {
  return knowledge.concepts.find((c) => c.concept_id === conceptId);
}

export function allSourceRefs(knowledge: LessonKnowledge): Set<string> {
  return new Set(knowledge.concepts.flatMap((c) => c.source_ref));
}
