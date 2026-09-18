"use client";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Cpu,
  Move,
  Edit3,
  MousePointerClick,
  HelpCircle,
  ShieldCheck,
  Send,
  Lightbulb,
  BookOpen,
  BarChart3,
  Award,
} from "lucide-react";
import type { TurnEvent } from "../../engine/types.ts";
import { applyEvent, LiveTimeline, type TimelineItem } from "./live-timeline.tsx";

type Checks = {
  schema_valid: boolean;
  answer_valid: boolean;
  grounded_in_lesson: boolean;
  no_answer_leak: boolean;
};

type TurnData = {
  session_id: string;
  turn_id: string;
  graded: boolean | null;
  decision: {
    action: string;
    interaction_type: string;
    difficulty: string;
    concept_id: string;
    reason: string;
  };
  interaction: {
    message: string;
    question: string | null;
    options: string[];
    hint: string | null;
    source_refs: string[];
  };
  checks: Checks;
  fallback_used: boolean;
  generation_attempts: number;
  mastery: Record<string, number>;
  learner_state?: {
    mastery_per_concept: Record<string, number>;
    attempts: number;
    correct_count: number;
    recent_errors: string[];
    avg_response_ms: number;
    explained_concepts: string[];
  };
  concepts: { id: string; title: string }[];
};

type Payload = { action: string; message?: string; selected_option?: number };
type StreamLine = TurnEvent | { type: "result"; data: TurnData } | { type: "error"; error: string };

type InteractionType = "none" | "drag_drop" | "fill_blank" | "spot_bug" | "ai_adaptive";

type SlideItem = {
  slideId: string;
  conceptId: string;
  slideNumber: number;
  totalSlides: number;
  category: string;
  title: string;
  subtitle: string;
  transcriptRef: string;
  theoryPoints: string[];
  keyTakeaway?: string;
  interactionType: InteractionType;
  dragDrop?: {
    instruction: string;
    slots: { id: string; label: string; correctChip: string }[];
    chips: string[];
  };
  fillBlank?: {
    instruction: string;
    prefix: string;
    expected: string[];
    suffix: string;
    hint: string;
    explanation?: string;
    incorrectExplanation?: string;
  };
  spotBug?: {
    instruction: string;
    statement: string;
    explanation: string;
  };
};

const DAY1_SLIDES: SlideItem[] = [
  {
    slideId: "slide_intro",
    conceptId: "next_token_prediction",
    slideNumber: 10,
    totalSlides: 29,
    category: "LLM FOUNDATION · ARCHITECTURE",
    title: "Kiến trúc Tổng quan Transformer",
    subtitle: "Mô hình sinh văn bản dựa trên bài toán dự đoán token tiếp theo",
    transcriptRef: "T04-035 · T04-036",
    theoryPoints: [
      "Bản chất của các mô hình ngôn ngữ lớn (LLM) là ước lượng xác suất phân phối của token tiếp theo dựa trên chuỗi văn bản đã xuất hiện phía trước.",
      "Kiến trúc Transformer (Vaswani et al., 2017) loại bỏ sự phụ thuộc tuần tự của RNN, cho phép xử lý và huấn luyện song song toàn bộ ngữ cảnh trên GPU.",
      "Cấu trúc gồm 2 thành phần cốt lõi: Encoder (chuyển đổi câu thành không gian vector ngữ nghĩa) và Decoder (tự hồi quy sinh từng token tiếp theo).",
    ],
    keyTakeaway: "💡 Bước ngoặt lịch sử: Nhờ khả năng xử lý ma trận song song, mô hình có thể nạp toàn bộ tri thức của Internet thay vì nghẽn cổ chai như các mạng nơ-ron tuần tự cũ.",
    interactionType: "none",
  },
  {
    slideId: "slide_attention",
    conceptId: "attention",
    slideNumber: 12,
    totalSlides: 29,
    category: "TRANSFORMER ARCHITECTURE",
    title: "Cơ chế Self-Attention Toàn Cục",
    subtitle: "Tính toán tương quan giữa TẤT CẢ các cặp từ trong câu cùng một lúc",
    transcriptRef: "T04-038 · T04-040 · T04-054",
    theoryPoints: [
      "Mạng tuần tự RNN phải đọc lần lượt từng chữ nên dễ quên các chi tiết ở xa trong văn bản dài.",
      "Transformer khắc phục bằng Attention: nhìn toàn bộ chuỗi cùng lúc và đo mức độ liên quan giữa mọi cặp từ.",
      "Multi-Head Attention chia nhỏ biểu diễn thành nhiều 'con mắt' để soi chiếu ngữ pháp và ngữ nghĩa song song.",
    ],
    interactionType: "fill_blank",
    fillBlank: {
      instruction: "Điền thuật ngữ chính xác vào chỗ trống trên dòng slide:",
      prefix: "Khác với mạng RNN phải duyệt tuần tự, Transformer nhìn toàn bộ câu cùng một lúc nhờ cơ chế ",
      expected: ["attention", "self-attention", "tự chú ý"],
      suffix: " để nắm bắt ngữ cảnh xa.",
      hint: "Tên cơ chế trong bài báo 'Attention Is All You Need' (Google, 2017).",
      explanation: "Cơ chế Self-Attention (tự chú ý) cho phép mô hình tính toán ma trận trọng số tương quan giữa mọi cặp từ đồng thời, loại bỏ hoàn toàn điểm nghẽn duyệt tuần tự của mạng RNN truyền thống.",
      incorrectExplanation: "Thuật ngữ chính xác là: Attention (hoặc Self-Attention). Đây là cơ chế cốt lõi trong Transformer giúp mô hình cùng lúc chú ý đến tất cả các từ khác trong câu để hiểu trọn vẹn ngữ cảnh ngữ nghĩa.",
    },
  },
  {
    slideId: "slide_token",
    conceptId: "tokenization",
    slideNumber: 16,
    totalSlides: 29,
    category: "LLM FOUNDATION · TOKENIZATION",
    title: "Token — Đơn vị Tính toán & Chi phí",
    subtitle: "Cách mô hình chẻ nhỏ văn bản để xử lý ma trận và tính toán tài nguyên",
    transcriptRef: "T04-049 · T04-050",
    theoryPoints: [
      "Mô hình không nhìn nhận văn bản theo từng chữ cái hay từ nguyên vẹn mà chẻ thành các mảnh nhỏ (Subwords) thông qua thuật toán Byte-Pair Encoding.",
      "Quy đổi ước tính: ~4 ký tự tiếng Anh ≈ 1 token (~0.75 từ). Với tiếng Việt do hệ thống dấu thanh nên tiêu tốn nhiều token hơn (~1.3–1.5 lần).",
      "Toàn bộ chi phí gọi API, băng thông truyền tải và giới hạn bộ nhớ của Context Window đều được tính và lập hoá đơn theo số lượng Token.",
    ],
    keyTakeaway: "📌 Ứng dụng thực tiễn: Khi thiết kế Prompt trong production, việc cắt giảm từ thừa không chỉ giúp mô hình tập trung hơn mà còn tiết kiệm chi phí gọi API theo cấp số nhân.",
    interactionType: "none",
  },
  {
    slideId: "slide_temp",
    conceptId: "temperature_sampling",
    slideNumber: 22,
    totalSlides: 29,
    category: "LLM FOUNDATION · PARAMETERS",
    title: "Temperature & Sampling Strategies",
    subtitle: "Điều khiển mức độ ngẫu nhiên và sáng tạo của câu trả lời sinh ra",
    transcriptRef: "T04-070 · T04-071 · T04-072",
    theoryPoints: [
      "Temperature điều khiển cách mô hình lấy mẫu từ phân phối xác suất của token tiếp theo thông qua hàm Softmax.",
      "Temperature = 0 (Greedy search): Luôn chọn token có xác suất cao nhất, câu trả lời ổn định, nhất quán và chuẩn xác.",
      "Temperature cao (> 1.0): San phẳng phân phối xác suất, giúp sinh từ phong phú, sáng tạo nhưng tăng nguy cơ bịa đặt.",
    ],
    interactionType: "drag_drop",
    dragDrop: {
      instruction: "Kéo thả thẻ hành vi vào đúng mốc nhiệt độ trên sơ đồ slide:",
      slots: [
        { id: "s_t0", label: "Mốc T = 0 (Nhiệt độ thấp)", correctChip: "Chính xác, ổn định, ít rủi ro" },
        { id: "s_t2", label: "Mốc T = 2.0 (Nhiệt độ cao)", correctChip: "Rất ngẫu nhiên, dễ ảo giác" },
      ],
      chips: ["Chính xác, ổn định, ít rủi ro", "Rất ngẫu nhiên, dễ ảo giác", "Tự sửa ngữ pháp"],
    },
  },
  {
    slideId: "slide_hallucination",
    conceptId: "hallucination",
    slideNumber: 25,
    totalSlides: 29,
    category: "LLM FOUNDATION · RISKS",
    title: "Hiện tượng Ảo giác (Hallucination)",
    subtitle: "Văn bản trôi chảy, tự tin nhưng thông tin hoàn toàn sai sự thật",
    transcriptRef: "T04-048 · T04-067 · T04-074",
    theoryPoints: [
      "Ảo giác là hệ quả tất yếu khi mô hình chỉ tối ưu hóa việc nối từ theo xác suất thống kê mượt mà nhất mà không có cơ sở dữ liệu chân lý.",
      "Giọng điệu tự tin, trôi chảy hoàn toàn KHÔNG đồng nghĩa với tính đúng đắn của dữ liệu (Fluency Bias).",
      "Giải pháp chuẩn trong công nghiệp: Bổ sung tài liệu kiểm chứng (RAG) và xây dựng chốt chặn Validator độc lập.",
    ],
    keyTakeaway: "⚠️ Cảnh báo nghiệp vụ: Trong các ứng dụng y tế, tài chính và pháp lý, tuyệt đối không tin tưởng câu trả lời của LLM nếu chưa qua bộ kiểm duyệt chân lý.",
    interactionType: "none",
  },
  {
    slideId: "slide_spot_bug",
    conceptId: "hallucination",
    slideNumber: 26,
    totalSlides: 29,
    category: "LLM FOUNDATION · RISKS",
    title: "Thực hành: Bắt lỗi Ngộ nhận về AI",
    subtitle: "Nhận diện tư duy sai lầm thường gặp khi đánh giá độ tin cậy của mô hình",
    transcriptRef: "T04-048 · T04-074",
    theoryPoints: [
      "Ảo giác đặc biệt nguy hiểm khi câu trả lời nghe rất trôi chảy, mạch lạc và tự tin.",
      "Dưới đây là một tuyên bố ngộ nhận phổ biến — hãy nhấp chuột trực tiếp để bắt lỗi:",
    ],
    interactionType: "spot_bug",
    spotBug: {
      instruction: "Phát hiện lỗi ngộ nhận bằng cách nhấp chuột vào tuyên bố sai dưới đây:",
      statement: "Tuyên bố: Khi câu trả lời của AI rất trôi chảy, tự tin và mạch lạc thì chắc chắn 100% dữ liệu đó là sự thật.",
      explanation:
        "Bắt lỗi chính xác! Trôi chảy chỉ phản ánh xác suất nối từ mượt mà, hoàn toàn không đảm bảo tính chân lý của dữ liệu.",
    },
  },
  {
    slideId: "slide_context",
    conceptId: "context_window",
    slideNumber: 29,
    totalSlides: 29,
    category: "LLM FOUNDATION · CONTEXT",
    title: "Context Window & Thử thách Thích ứng",
    subtitle: "Giới hạn bộ nhớ ngữ cảnh và thử thách câu hỏi thích ứng từ AI",
    transcriptRef: "T04-051 · T04-052 · T04-057",
    theoryPoints: [
      "Context Window giống như chiếc bàn làm việc: lượng tài liệu đưa vào xử lý trong 1 lượt có giới hạn vật lý.",
      "Hiện tượng Context Rot: Nhồi nhét quá nhiều tài liệu rác khiến mô hình bị loãng sự chú ý và dễ quên phần thông tin quan trọng.",
      "Chọn lọc ngữ cảnh chất lượng (high-signal) quan trọng hơn việc nhồi nhét tài liệu dung lượng lớn.",
    ],
    interactionType: "ai_adaptive",
  },
];

const CONCEPT_TITLES: Record<string, string> = {
  temperature_sampling: "Temperature & Sampling",
  attention: "Transformer & Attention",
  hallucination: "Ảo giác (Hallucination)",
  tokenization: "Token & Tokenization",
  context_window: "Context Window & Rot",
  next_token_prediction: "Dự đoán token",
  rlhf: "RLHF (Human Feedback)",
};

export default function TutorPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [turn, setTurn] = useState<TurnData | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [elapsed, setElapsed] = useState(0);

  // State tương tác trực tiếp trên slide
  const [assignedChips, setAssignedChips] = useState<Record<string, string>>({});
  const [draggedChip, setDraggedChip] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [fillStatus, setFillStatus] = useState<"correct" | "incorrect" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [bugClicked, setBugClicked] = useState(false);
  const [choiceSelected, setChoiceSelected] = useState<number | null>(null);

  // Lựa chọn đáp án câu hỏi thích ứng do AI sinh ra
  const [aiOptionSelected, setAiOptionSelected] = useState<number | null>(null);
  const [lastUserQuestion, setLastUserQuestion] = useState<string | null>(null);

  const shownAt = useRef(Date.now());
  const currentSlide = DAY1_SLIDES[slideIndex];

  useEffect(() => {
    if (!loading) return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    setAssignedChips({});
    setDraggedChip(null);
    setFillValue("");
    setFillStatus(null);
    setShowHint(false);
    setBugClicked(false);
    setChoiceSelected(null);
    setAiOptionSelected(null);
  }, [slideIndex]);

  useEffect(() => {
    setAiOptionSelected(null);
  }, [turn?.turn_id]);

  async function send(payload: Payload) {
    const isAnswering = payload.action === "answer" || payload.action === "ask_hint" || payload.action === "explain" || payload.action === "retry";
    const targetConcept = isAnswering ? (turn?.decision?.concept_id ?? currentSlide.conceptId) : currentSlide.conceptId;
    const body = {
      ...payload,
      session_id: turn?.session_id,
      concept_id: targetConcept,
      slide_concept: currentSlide.conceptId,
      response_time_ms: Date.now() - shownAt.current,
    };
    setLoading(true);
    setError(null);
    setTimeline([]);
    setElapsed(0);
    try {
      const res = await fetch("/api/turn/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const failure = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error ?? `HTTP ${res.status}`);
      }
      await readNdjson(res, (line) => {
        if (line.type === "result") {
          setTurn(line.data);
          setText("");
          shownAt.current = Date.now();
        } else if (line.type === "error") {
          setError(line.error);
        } else {
          setTimeline((items) => applyEvent(items, line));
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  function handleAssignChip(slotId: string) {
    if (!draggedChip) return;
    setAssignedChips((prev) => ({ ...prev, [slotId]: draggedChip }));
    const slot = currentSlide.dragDrop?.slots.find((s) => s.id === slotId);
    const isCorrect = slot?.correctChip === draggedChip;

    send({
      action: "explain",
      message: `Học viên vừa kéo thẻ "${draggedChip}" vào ô "${slot?.label}" (${isCorrect ? "đúng" : "chưa đúng"}).`,
    });
    setDraggedChip(null);
  }

  function handleCheckFill() {
    const val = fillValue.trim().toLowerCase();
    const isCorrect = currentSlide.fillBlank?.expected.some((exp) => val.includes(exp.toLowerCase()));
    setFillStatus(isCorrect ? "correct" : "incorrect");
    setLastUserQuestion(`Điền từ khuyết: "${fillValue}" (kết quả: ${isCorrect ? "Đúng ✅" : "Chưa đúng ❌"})`);

    send({
      action: "explain",
      message: `Học viên điền từ "${fillValue}" vào chỗ trống trên slide (${isCorrect ? "chính xác" : "chưa chính xác"}).`,
    });
  }

  function handleSpotBug() {
    setBugClicked(true);
    send({
      action: "explain",
      message: `Học viên đã bắt đúng lỗi ngộ nhận trên slide: "${currentSlide.spotBug?.statement}". ${currentSlide.spotBug?.explanation}`,
    });
  }

  function handleQuickChoice(idx: number, isCorrect: boolean, text: string) {
    setChoiceSelected(idx);
    send({
      action: "answer",
      selected_option: idx,
      message: `Học viên chọn đáp án "${text}" (${isCorrect ? "đúng" : "sai"}).`,
    });
  }

  function handleAnswerAiQuestion(idx: number, optText: string) {
    setAiOptionSelected(idx);
    send({
      action: "answer",
      selected_option: idx,
      message: `Học viên chọn: ${optText}`,
    });
  }

  function handleAskHint() {
    send({ action: "ask_hint" });
  }

  function handleRequestAdaptiveQuestion() {
    send({ action: "start" });
  }

  const it = turn?.interaction;
  const activeLlm = timeline.find((t) => t.kind === "llm") as
    | Extract<TimelineItem, { kind: "llm" }>
    | undefined;

  const currentMastery = turn?.mastery[currentSlide.conceptId] ?? 0;
  const currentDiff = turn?.decision.difficulty ?? (currentMastery >= 70 ? "H" : currentMastery >= 35 ? "M" : "E");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* HEADER NỀN TRẮNG SÁNG */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-xs">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">SlideAlive</span>
                <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  Track D · VLearn Interactive
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Học tập Thích ứng: Lý thuyết súc tích + Tương tác trực tiếp trên Slide</p>
            </div>
          </div>

          {/* Bộ lật Slide */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 p-1 text-xs shadow-2xs">
              <button
                onClick={() => setSlideIndex((p) => Math.max(0, p - 1))}
                disabled={slideIndex === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono font-bold text-slate-700">
                Slide {currentSlide.slideNumber} / {currentSlide.totalSlides}
              </span>
              <button
                onClick={() => setSlideIndex((p) => Math.min(DAY1_SLIDES.length - 1, p + 1))}
                disabled={slideIndex === DAY1_SLIDES.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              AI: gpt-4o-mini
            </div>

            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Golden Set: 19/20 đạt (95%)
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE CHÍNH NỀN SÁNG TRẮNG */}
      <main className="mx-auto max-w-[1700px] p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* CỘT TRÁI (8 Cột): CHIẾC SLIDE BÀI GIẢNG NỀN TRẮNG CHUẨN MỰC */}
          <div className="space-y-6 lg:col-span-8">
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              {/* 1. Header của Slide */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold tracking-widest uppercase text-indigo-600">
                      {currentSlide.category} · SLIDE {currentSlide.slideNumber}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      currentSlide.interactionType === "none"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}>
                      {currentSlide.interactionType === "none" ? "📖 Slide Lý thuyết" : "⚡ Tương tác Thực hành"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {currentSlide.title}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1 font-medium">{currentSlide.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-600 font-semibold block">
                    Nguồn: {currentSlide.transcriptRef}
                  </span>
                </div>
              </div>

              {/* 2. PHẦN LÝ THUYẾT CỐT LÕI Ở TRÊN */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  Nội dung bài giảng trọng tâm:
                </div>
                <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  {currentSlide.theoryPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                      <span className="font-normal">{pt}</span>
                    </li>
                  ))}
                </ul>

                {/* Điểm mấu chốt nếu là slide lý thuyết */}
                {currentSlide.keyTakeaway && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{currentSlide.keyTakeaway}</span>
                  </div>
                )}
              </div>

              {/* 3. TƯƠNG TÁC THỰC HÀNH (Chỉ hiển thị ở những slide có tương tác) */}
              <div>
                {/* --- SLIDE THUẦN LÝ THUYẾT (none): Không có bài tập bắt buộc --- */}
                {currentSlide.interactionType === "none" && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
                    <span className="flex items-center gap-2 font-medium">
                      <span>📖</span> Đã hoàn thành phần lý thuyết. Bạn có thể hỏi AI bất kỳ câu hỏi nào bên phải hoặc sang slide tiếp theo.
                    </span>
                    <button
                      onClick={() => setSlideIndex((p) => Math.min(DAY1_SLIDES.length - 1, p + 1))}
                      disabled={slideIndex === DAY1_SLIDES.length - 1}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:border-indigo-400 hover:text-indigo-800 disabled:opacity-30 shadow-2xs transition"
                    >
                      Sang slide tiếp <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* --- CHẾ ĐỘ KÉO THẢ (Slide 4: Temperature) --- */}
                {currentSlide.interactionType === "drag_drop" && currentSlide.dragDrop && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-indigo-900">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Move className="h-4 w-4 text-indigo-600" />
                        {currentSlide.dragDrop.instruction}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentSlide.dragDrop.slots.map((slot) => {
                        const assigned = assignedChips[slot.id];
                        const isCorrect = assigned === slot.correctChip;
                        return (
                          <div
                            key={slot.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleAssignChip(slot.id)}
                            onClick={() => handleAssignChip(slot.id)}
                            className={`flex min-h-[85px] flex-col justify-between rounded-xl border-2 p-3.5 transition cursor-pointer ${
                              assigned
                                ? isCorrect
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : "border-rose-400 bg-rose-50 text-rose-900"
                                : "border-dashed border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800">{slot.label}</span>
                            {assigned ? (
                              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-xs">
                                <span>{assigned}</span>
                                <span className="font-bold">{isCorrect ? "✅ Đúng" : "❌ Chưa đúng"}</span>
                              </div>
                            ) : (
                              <span className="text-xs italic text-slate-400">⬇ Kéo hoặc click thẻ vào ô này...</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-3">
                      <span className="text-xs text-slate-600 font-bold">Thẻ để kéo:</span>
                      {currentSlide.dragDrop.chips.map((chip) => (
                        <div
                          key={chip}
                          draggable
                          onDragStart={() => setDraggedChip(chip)}
                          onClick={() => setDraggedChip(chip)}
                          className={`cursor-grab rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                            draggedChip === chip
                              ? "border-indigo-600 bg-indigo-600 text-white ring-2 ring-indigo-200"
                              : "border-slate-300 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50"
                          }`}
                        >
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- CHẾ ĐỘ ĐIỀN CHỮ KHUYẾT (Slide 2: Attention) --- */}
                {currentSlide.interactionType === "fill_blank" && currentSlide.fillBlank && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3">
                      <Edit3 className="h-4 w-4 text-emerald-600" />
                      {currentSlide.fillBlank.instruction}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span>• {currentSlide.fillBlank.prefix}</span>
                      <input
                        type="text"
                        value={fillValue}
                        onChange={(e) => setFillValue(e.target.value)}
                        placeholder="gõ từ khuyết..."
                        className={`rounded-lg border-2 px-3 py-1 text-xs font-bold focus:outline-hidden ${
                          fillStatus === "correct"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                            : fillStatus === "incorrect"
                            ? "border-rose-400 bg-rose-50 text-rose-900"
                            : "border-indigo-300 bg-white text-indigo-950 focus:border-indigo-600"
                        }`}
                      />
                      <span>{currentSlide.fillBlank.suffix}</span>

                      <button
                        onClick={handleCheckFill}
                        disabled={!fillValue.trim() || loading}
                        className="ml-auto rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition shadow-xs"
                      >
                        Kiểm tra
                      </button>

                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-slate-400 hover:text-amber-600"
                        title="Xem gợi ý"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>

                    {showHint && (
                      <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                        💡 {currentSlide.fillBlank.hint}
                      </p>
                    )}

                    {/* HỘP THÔNG BÁO KẾT QUẢ ĐÚNG / SAI VÀ GIẢI THÍCH CHI TIẾT */}
                    {fillStatus === "correct" && (
                      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs animate-in fade-in">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-800 block mb-0.5 font-bold text-xs">
                            ✅ Chính xác tuyệt đối!
                          </strong>
                          <p className="leading-relaxed font-medium text-emerald-900">
                            {currentSlide.fillBlank.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {fillStatus === "incorrect" && (
                      <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-950 flex items-start gap-2.5 shadow-xs animate-in fade-in">
                        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-800 block mb-0.5 font-bold text-xs">
                            ❌ Chưa chính xác rồi!
                          </strong>
                          <p className="leading-relaxed font-medium text-rose-900">
                            {currentSlide.fillBlank.incorrectExplanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- CHẾ ĐỘ BẮT LỖI NGỘ NHẬN (Slide 6: Hallucination Practice) --- */}
                {currentSlide.interactionType === "spot_bug" && currentSlide.spotBug && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-3">
                      <MousePointerClick className="h-4 w-4 text-amber-600" />
                      {currentSlide.spotBug.instruction}
                    </span>

                    <div
                      onClick={handleSpotBug}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        bugClicked
                          ? "border-rose-400 bg-rose-50 text-rose-950"
                          : "border-slate-200 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50/40 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium leading-relaxed">{currentSlide.spotBug.statement}</span>
                        <span className="ml-3 shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-300">
                          {bugClicked ? "🎯 Đã bắt đúng lỗi!" : "🐛 Bấm để bắt lỗi"}
                        </span>
                      </div>

                      {bugClicked && (
                        <p className="mt-3 text-xs text-rose-800 border-t border-rose-200 pt-2.5 leading-relaxed font-medium">
                          {currentSlide.spotBug.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* --- CHẾ ĐỘ THỬ THÁCH THÍCH ỨNG (Slide 7: Context Window) --- */}
                {currentSlide.interactionType === "ai_adaptive" && (
                  <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-6 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white mb-3 shadow-md shadow-indigo-100">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Thử thách Thích ứng Tự động</h4>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto mb-4 leading-relaxed">
                      Bấm để tạo câu hỏi AI đầu tiên về Context Window. Sau mỗi đáp án, hệ thống sẽ điều chỉnh độ khó dựa trên mức độ hiểu bài của bạn.
                    </p>
                    <button
                      onClick={handleRequestAdaptiveQuestion}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" /> Tạo câu hỏi AI đầu tiên
                    </button>
                  </div>
                )}
              </div>

              {/* 4. PHẢN HỒI VÀ DẪN DẮT CỦA TRỢ LÝ SOCRATIC AI (NGAY DƯỚI LÝ THUYẾT & TƯƠNG TÁC SLIDE) */}
              <div className="mt-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-5 sm:p-6 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        Trợ lý Socratic AI
                        <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          🏷️ {CONCEPT_TITLES[turn?.decision?.concept_id ?? currentSlide.conceptId] ?? currentSlide.title}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Đồng hành & gợi mở theo thời gian thực</p>
                    </div>
                  </div>
                  {loading && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 font-mono font-bold animate-pulse">
                      <Sparkles className="h-3.5 w-3.5 animate-spin" /> Đang sinh phản hồi... ({(elapsed / 1000).toFixed(1)}s)
                    </span>
                  )}
                </div>

                <div className="space-y-3.5">
                  {/* Trạng thái ban đầu khi chưa có câu hỏi */}
                  {!lastUserQuestion && !it && !loading && (
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4 text-center">
                      <p className="text-xs text-indigo-900/80 font-medium leading-relaxed">
                        💡 Sau khi đọc phần lý thuyết và hoàn thành điền thuật ngữ ở trên, bạn có thể gửi câu hỏi bên dưới hoặc ở khung bên phải (ví dụ: &quot;attention ở đây là gì&quot;, &quot;giải thích cái này&quot;) — Trợ lý Socratic AI sẽ phản hồi và dẫn dắt gợi mở ngay tại đây!
                      </p>
                    </div>
                  )}

                  {/* Câu hỏi của người học */}
                  {lastUserQuestion && (
                    <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                        Bạn
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-indigo-900 block mb-0.5 text-[10px] uppercase tracking-wider">
                          Câu hỏi của bạn:
                        </span>
                        <p className="text-slate-800 font-medium leading-relaxed text-sm">{lastUserQuestion}</p>
                      </div>
                    </div>
                  )}

                  {/* Trạng thái đang tải */}
                  {loading && !it && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 flex items-center gap-3 animate-pulse">
                      <Sparkles className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
                      <span className="font-medium">
                        Trợ lý AI đang đọc slide và sinh phản hồi dẫn dắt cho bạn...
                      </span>
                    </div>
                  )}

                  {/* Lời giải thích / phản hồi của AI */}
                  {it && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-800 leading-relaxed shadow-2xs">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                          AI
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Phản hồi từ Trợ lý Socratic AI:</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed pl-8 font-medium text-sm">{it.message}</p>
                    </div>
                  )}

                  {/* Gợi ý Socratic nếu có */}
                  {it?.hint && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-950">
                      <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5 text-amber-900">💡 Gợi ý Socratic (không lộ đáp án):</strong>
                        <span className="leading-relaxed font-medium">{it.hint}</span>
                      </div>
                    </div>
                  )}

                  {/* CÂU HỎI THÍCH ỨNG TRẢ RA NẾU CÓ */}
                  {it?.question && (
                    <div className="rounded-2xl border-2 border-indigo-300 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-indigo-600 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                            Thử thách Thích ứng
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            Mức: {turn?.decision?.difficulty ?? "E"}
                          </span>
                        </div>
                        {turn?.graded !== null && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            turn?.graded ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {turn?.graded ? "✅ Chính xác!" : "❌ Chưa chính xác"}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-900 leading-relaxed mb-4">
                        {it.question}
                      </p>

                      {/* Các lựa chọn trắc nghiệm nếu có */}
                      {it.options && it.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {it.options.map((opt, idx) => (
                            <button
                              key={idx}
                              disabled={loading}
                              onClick={() => handleAnswerAiQuestion(idx, opt)}
                              className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left text-xs font-medium transition ${
                                aiOptionSelected === idx
                                  ? "border-indigo-600 bg-indigo-600 text-white font-bold shadow-sm"
                                  : "border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-400 hover:bg-white shadow-2xs"
                              }`}
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-xs ${
                                aiOptionSelected === idx ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-sm">{opt}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <button
                          onClick={handleAskHint}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 font-semibold text-amber-700 hover:text-amber-800"
                        >
                          <HelpCircle className="h-4 w-4" /> Xin gợi ý Socratic (không lộ đáp án)
                        </button>
                        <span className="text-slate-400 text-xs font-medium">Tự động thích ứng</span>
                      </div>
                    </div>
                  )}

                  {/* Ô gõ câu hỏi nhanh trực tiếp ngay dưới phần phản hồi */}
                  <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && text.trim() && !loading) {
                          setLastUserQuestion(text.trim());
                          send({ action: "ask", message: text.trim() });
                          setText("");
                        }
                      }}
                      placeholder="Đặt câu hỏi tiếp cho AI về slide này..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                    <button
                      onClick={() => {
                        if (!text.trim() || loading) return;
                        setLastUserQuestion(text.trim());
                        send({ action: "ask", message: text.trim() });
                        setText("");
                      }}
                      disabled={!text.trim() || loading}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" /> Gửi
                    </button>
                  </div>
                </div>
              </div>

              {/* Chân slide */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 font-medium">
                <span>VLearn Interactive Presentation · Hackathon AI Batch 04</span>
                <span>Khung ICAP: Kiến tạo trực tiếp trên Slide</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (4 Cột): HỘP GÕ CÂU HỎI & CHỐT AN TOÀN VALIDATOR */}
          <div className="space-y-6 lg:col-span-4">
            {/* THẺ 1: HỘP ĐẶT CÂU HỎI CHO AI */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Hỏi Trợ lý Socratic</h3>
                    <p className="text-[11px] text-slate-500">Phản biện, đào sâu hoặc hỏi thêm về slide</p>
                  </div>
                </div>
              </div>

              {/* Hộp gõ câu hỏi phản biện / hỏi thêm */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                    <span>📌</span> Ngữ cảnh: Slide {currentSlide.slideNumber} — {CONCEPT_TITLES[currentSlide.conceptId] ?? currentSlide.title}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Gõ câu hỏi của bạn về slide này (ví dụ: attention ở đây là gì, giải thích cái này)..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs leading-relaxed"
                />
                <button
                  onClick={() => {
                    if (!text.trim() || loading) return;
                    setLastUserQuestion(text.trim());
                    send({ action: "ask", message: text.trim() });
                    setText("");
                  }}
                  disabled={!text.trim() || loading}
                  className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" /> Gửi câu hỏi cho AI
                </button>
              </div>
            </div>

            {/* THẺ 2: LIVE STREAMING & CHỐT AN TOÀN VALIDATOR */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-slate-600" /> AI Streaming Output
                </span>
                {activeLlm && <span className="font-mono text-[11px] text-slate-400">{activeLlm.model}</span>}
              </div>

              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-400 max-h-40 overflow-auto leading-relaxed shadow-inner">
                {activeLlm?.text ? (
                  <>
                    {activeLlm.text}
                    {!activeLlm.done && <span className="inline-block animate-pulse text-emerald-300">▍</span>}
                  </>
                ) : (
                  <span className="text-slate-500 italic">// Sẵn sàng stream phản hồi từ LLM...</span>
                )}
              </div>

              {turn?.checks && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Validator Guardrails:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                    <span className={`flex items-center gap-1 ${turn.checks.schema_valid ? "text-emerald-600" : "text-rose-600"}`}>
                      {turn.checks.schema_valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} Schema JSON
                    </span>
                    <span className={`flex items-center gap-1 ${turn.checks.answer_valid ? "text-emerald-600" : "text-rose-600"}`}>
                      {turn.checks.answer_valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} Đáp án logic
                    </span>
                    <span className={`flex items-center gap-1 ${turn.checks.grounded_in_lesson ? "text-emerald-600" : "text-rose-600"}`}>
                      {turn.checks.grounded_in_lesson ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} Bám transcript
                    </span>
                    <span className={`flex items-center gap-1 ${turn.checks.no_answer_leak ? "text-emerald-600" : "text-rose-600"}`}>
                      {turn.checks.no_answer_leak ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} Không lộ đáp án
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

async function readNdjson(res: Response, onLine: (line: StreamLine) => void): Promise<void> {
  if (!res.body) throw new Error("Server không trả stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = done ? "" : lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onLine(JSON.parse(line) as StreamLine);
    if (done) return;
  }
}
