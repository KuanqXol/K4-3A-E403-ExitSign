"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Upload,
  Sparkles,
  Lightbulb,
  BarChart3,
  X,
  Layers,
  Play,
  Target,
  CheckCircle2,
  Zap,
  GraduationCap,
} from "lucide-react";
import {
  Concept,
  concepts,
  Difficulty,
  questions,
  slides,
} from "../lib/lesson";

type Profile = "You" | "Fast Learner" | "Needs Support";
type Attempt = {
  concept: Concept;
  correct: boolean;
  seconds: number;
  hint: boolean;
  difficulty: Difficulty;
  retry: number;
};
type Feedback = Attempt & { before: number; after: number; next: Difficulty };
const initialMastery: Record<Concept, number> = {
  "Sorted Arrays": 0,
  "Binary Search": 0,
  "Time Complexity": 0,
};
export function MasteryBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="mastery">
      <div className="mastery-label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-label={label || "Mastery"}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function HintCard({ text }: { text: string }) {
  return (
    <div className="hint-card" role="status">
      <Lightbulb size={17} />
      <div>
        <strong>A little nudge</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
export function ExplanationCard({
  concept,
  close,
}: {
  concept: Concept;
  close: () => void;
}) {
  return (
    <div className="explanation">
      <button
        aria-label="Close explanation"
        className="icon-btn close"
        onClick={close}
      >
        <X size={16} />
      </button>
      <span className="eyebrow">
        <Sparkles size={14} /> LET’S BREAK IT DOWN
      </span>
      <h3>{concept}</h3>
      {(concept === "Sorted Arrays"
        ? [
            "Arrange the values from smallest to largest.",
            "Find a value in the middle.",
            "Use the order to decide where smaller and larger targets belong.",
          ]
        : concept === "Time Complexity"
          ? [
              "Start with n possible values.",
              "Each comparison roughly halves the candidates.",
              "Count the halvings, including the final comparison.",
              "This grows as O(log n).",
            ]
          : [
              "Find the middle value.",
              "Compare it with the target.",
              "Remove half of the remaining search space.",
              "Repeat until found or the interval is empty.",
            ]
      ).map((text, i) => (
        <p className="explain-step" key={text}>
          <b>{i + 1}</b>
          {text}
        </p>
      ))}
    </div>
  );
}
export function LessonSidebar({
  slide,
  mastery,
  navigate,
  progress,
}: {
  slide: number;
  mastery: number;
  navigate: (n: number) => void;
  progress: () => void;
}) {
  return (
    <aside className="lesson-sidebar">
      <span className="eyebrow">YOUR CLASSROOM</span>
      <div className="course-icon">
        <BookOpen size={23} />
      </div>
      <h2>
        Introduction to
        <br />
        Algorithms
      </h2>
      <p className="muted">A little practice. A deeper understanding.</p>
      <div className="slide-progress">
        <span>Lesson progress</span>
        <b>{slide + 1} / 8 slides</b>
      </div>
      <div className="bar thin">
        <i style={{ width: `${((slide + 1) / 8) * 100}%` }} />
      </div>
      <nav className="sections">
        {["Introduction", "Binary Search", "Time Complexity", "Summary"].map(
          (name, i) => {
            const starts = [0, 2, 4, 7];
            const active = slide >= starts[i] && slide < (starts[i + 1] ?? 8);
            return (
              <button
                key={name}
                className={active ? "active" : ""}
                onClick={() => navigate(starts[i])}
              >
                <span className="section-marker">
                  {slide >= (starts[i + 1] ?? 8) ? (
                    <Check size={14} />
                  ) : active ? (
                    <span className="dot" />
                  ) : (
                    <span className="empty-dot" />
                  )}
                </span>
                {name}
                {active && <ChevronRight size={14} />}
              </button>
            );
          },
        )}
      </nav>
      <div className="sidebar-mastery">
        <span className="eyebrow">CURRENT MASTERY</span>
        <MasteryBar label={slides[slide].concept} value={mastery} />
        <p>Build understanding, one question at a time.</p>
      </div>
      <button className="text-btn progress-link" onClick={progress}>
        <BarChart3 size={17} /> View learning progress
      </button>
      <div className="sidebar-note">
        <Sparkles size={17} />
        <p>
          Your pace.
          <br />
          <strong>Your learning path.</strong>
        </p>
      </div>
    </aside>
  );
}
export function SlideViewer({
  slide,
  explain,
}: {
  slide: number;
  explain: () => void;
}) {
  const data = slides[slide];
  return (
    <>
      <article className="lecture-slide">
        <div className="slide-top">
          <span>ALGORITHMS / {data.concept.toUpperCase()}</span>
          <span>0{slide + 1}</span>
        </div>
        <h1>{data.title}</h1>
        <p className="slide-description">{data.description}</p>
        <div className="slide-content">
          <ul>
            {data.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="search-visual">
            <span className="eyebrow">
              {slide === 3 ? "TARGET = 5" : "SORTED SEARCH SPACE"}
            </span>
            <div className="array">
              {[2, 5, 8, 12, 16, 23, 38].map((n, i) => (
                <div
                  key={n}
                  className={`${i === 3 ? "middle" : ""} ${slide === 3 && i > 3 ? "discarded" : ""}`}
                >
                  <span>{n}</span>
                  {i === 3 && <small>mid</small>}
                </div>
              ))}
            </div>
            <div className="halves">
              <span>← smaller</span>
              <span>larger →</span>
            </div>
            <p>One comparison. Half the possibilities.</p>
          </div>
        </div>
        <footer>
          <span>
            SlideAlive <i>/</i> Learn by doing
          </span>
          <Layers size={15} />
        </footer>
      </article>
      <button className="text-btn explain-slide" onClick={explain}>
        <Sparkles size={15} /> Explain this slide
      </button>
    </>
  );
}
export function AITutorPanel({
  concept,
  difficulty,
  mastery,
  hint,
  explain,
  challenge,
  feedback,
}: {
  concept: Concept;
  difficulty: Difficulty;
  mastery: number;
  hint: () => void;
  explain: () => void;
  challenge: () => void;
  feedback: Feedback | null;
}) {
  return (
    <aside className="tutor-panel">
      <div className="tutor-title">
        <div className="spark-icon">
          <Sparkles size={21} />
        </div>
        <div>
          <h3>AI Tutor</h3>
          <span>
            <i className="online-dot" /> Here to help you learn
          </span>
        </div>
      </div>
      <div className="tutor-stats">
        <span>Current concept</span>
        <strong>{concept}</strong>
        <div>
          <span>Difficulty</span>
          <span className={`badge ${difficulty.toLowerCase()}`}>
            {difficulty}
          </span>
        </div>
        <MasteryBar label="Mastery" value={mastery} />
      </div>
      <div className="tutor-actions">
        <button onClick={explain}>
          <BookOpen size={16} />
          Explain
        </button>
        <button onClick={hint} disabled={!!feedback}>
          <Lightbulb size={16} />
          Hint
        </button>
        <button onClick={challenge} disabled={!!feedback}>
          <Zap size={16} />
          Challenge me
        </button>
      </div>
      <div className="insight">
        <span className="eyebrow">
          <Sparkles size={14} /> LEARNING INSIGHT
        </span>
        <p>
          {feedback
            ? feedback.correct
              ? "You’re building confidence. Your next question will help you go a little deeper."
              : "Let’s take a smaller step. A short explanation can help the idea click."
            : "Every answer helps shape your next step. Take your time and focus on understanding."}
        </p>
      </div>
      <div className="tutor-bottom">
        <span className="mini-orbit">✧</span>
        <p>
          It’s okay to get it wrong.
          <br />
          That’s where learning starts.
        </p>
      </div>
    </aside>
  );
}
export function QuestionCard({
  concept,
  difficulty,
  selected,
  select,
  submit,
  skip,
  hint,
  elapsed,
}: {
  concept: Concept;
  difficulty: Difficulty;
  selected: number | null;
  select: (n: number) => void;
  submit: () => void;
  skip: () => void;
  hint: boolean;
  elapsed: number;
}) {
  const q = questions[concept][difficulty];
  return (
    <section className="question-card">
      <div className="question-heading">
        <h3>
          <span className="quick-icon">
            <Zap size={16} />
          </span>
          Quick Check{" "}
          <span className={`badge ${difficulty.toLowerCase()}`}>
            {difficulty}
          </span>
        </h3>
        <span className="timer">
          <Clock size={13} />
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
          {String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>
      <h2>{q.prompt}</h2>
      <div className="options" role="radiogroup" aria-label="Answer options">
        {q.options.map((o, i) => (
          <button
            role="radio"
            aria-checked={selected === i}
            key={o}
            className={selected === i ? "selected" : ""}
            onClick={() => select(i)}
          >
            <span>{"ABCD"[i]}</span>
            {o}
            {selected === i && <Check size={15} />}
          </button>
        ))}
      </div>
      {hint && <HintCard text={q.hint} />}
      <div className="question-footer">
        <span>Small checks. Lasting understanding.</span>
        <button className="text-btn" onClick={skip}>
          Skip
        </button>
        <button
          className="primary"
          disabled={selected === null}
          onClick={submit}
        >
          Submit answer
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
export function AdaptiveFeedback({
  feedback,
  proceed,
}: {
  feedback: Feedback;
  proceed: () => void;
}) {
  return (
    <section
      className={`feedback ${feedback.correct ? "success" : "support"}`}
      aria-live="polite"
    >
      <div className="feedback-heading">
        <div className="feedback-icon">
          {feedback.correct ? <Check size={24} /> : <Lightbulb size={24} />}
        </div>
        <div>
          <span className="eyebrow">A STEP FORWARD</span>
          <h2>
            {feedback.correct
              ? "Correct. Nicely done!"
              : "Not quite. Let’s work through it."}
          </h2>
        </div>
        <span className={`badge ${feedback.next.toLowerCase()}`}>
          Next: {feedback.next}
        </span>
      </div>
      <div className="feedback-metrics">
        <span>
          <Clock size={15} />
          {feedback.seconds.toFixed(1)} sec
        </span>
        <span>Hint used: {feedback.hint ? "Yes" : "No"}</span>
        <span>
          Mastery{" "}
          <b>
            {feedback.before}% → {feedback.after}%
          </b>
        </span>
      </div>
      <p>
        {feedback.correct
          ? feedback.next === "Hard"
            ? "You’re doing well. Let’s make it harder."
            : "Good progress. Let’s build on that understanding."
          : "Let’s review the concept before trying again."}
      </p>
      <div className="answer-explanation">
        <strong>{feedback.correct ? "Why it works" : "A closer look"}</strong>
        <p>{questions[feedback.concept][feedback.difficulty].explanation}</p>
      </div>
      <div className="feedback-footer">
        <span>Your next step adapts to you.</span>
        <button className="primary" onClick={proceed}>
          {feedback.correct ? "Continue" : "Try an easier question"}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
export function SessionSummary({
  mastery,
  attempts,
  back,
  practice,
}: {
  mastery: Record<Concept, number>;
  attempts: Attempt[];
  back: () => void;
  practice: () => void;
}) {
  const average = Math.round(concepts.reduce((a, c) => a + mastery[c], 0) / 3);
  const strong = concepts.filter((c) => mastery[c] >= 70);
  const weak = concepts.filter((c) => mastery[c] < 70);
  return (
    <main className="summary-page">
      <div className="completion-icon">
        <GraduationCap size={35} />
      </div>
      <span className="eyebrow">A LITTLE WISER THAN BEFORE</span>
      <h1>Lesson complete.</h1>
      <p className="muted">
        Here’s what you learned. And where you can grow next.
      </p>
      <div className="summary-card">
        <div className="summary-score">
          <div
            className="score-ring"
            style={{
              background: `conic-gradient(var(--indigo) ${average}%, #e9edf7 0)`,
            }}
          >
            <div>
              <strong>{average}%</strong>
              <span>overall mastery</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">INTRODUCTION TO ALGORITHMS</span>
            <h2>Every answer is progress.</h2>
            <p>
              {attempts.length} questions answered ·{" "}
              {attempts.filter((a) => a.correct).length} correct
            </p>
            <span className="badge medium">Session-based estimate</span>
          </div>
        </div>
        <div className="summary-concepts">
          <div>
            <h3>
              <CheckCircle2 size={18} />
              Strong concepts
            </h3>
            {strong.length ? (
              strong.map((c) => (
                <MasteryBar key={c} label={c} value={mastery[c]} />
              ))
            ) : (
              <p className="muted">Keep practicing to reach 70% mastery.</p>
            )}
          </div>
          <div>
            <h3>
              <Target size={18} />
              Needs review
            </h3>
            {weak.length ? (
              weak.map((c) => (
                <MasteryBar key={c} label={c} value={mastery[c]} />
              ))
            ) : (
              <p>You’re ready for a new challenge.</p>
            )}
          </div>
        </div>
        <div className="recommendation">
          <Lightbulb size={22} />
          <div>
            <strong>Your next small step</strong>
            <p>
              {weak.includes("Time Complexity")
                ? "Review slides 5–6 and answer two more questions about O(log n) and the number of iterations."
                : weak.length
                  ? `Revisit ${weak[0]} and practice a few more questions.`
                  : "Try a harder question to deepen your understanding."}
            </p>
          </div>
        </div>
      </div>
      <div className="summary-actions">
        <button className="secondary" onClick={back}>
          <ArrowLeft size={16} />
          Back to lessons
        </button>
        <button className="primary" onClick={practice}>
          Practice weak concepts
          <ArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<"library" | "player" | "summary">(
    "library",
  );
  const [slide, setSlide] = useState(2);
  const [profile, setProfile] = useState<Profile>("You");
  const [mastery, setMastery] = useState(initialMastery);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [explanation, setExplanation] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const startTime = useRef(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const concept = slides[slide].concept;
  useEffect(() => {
    if (screen !== "player" || feedback) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [screen, feedback, slide, difficulty]);
  useEffect(() => {
    if (!showProgress) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowProgress(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showProgress]);
  function resetQuestion() {
    setSelected(null);
    setHint(false);
    setFeedback(null);
    setElapsed(0);
    startTime.current = Date.now();
  }
  function start(p: Profile = profile) {
    setProfile(p);
    setMastery(
      p === "You"
        ? { ...initialMastery }
        : p === "Fast Learner"
          ? { "Sorted Arrays": 82, "Binary Search": 65, "Time Complexity": 42 }
          : { "Sorted Arrays": 60, "Binary Search": 50, "Time Complexity": 25 },
    );
    setAttempts([]);
    setSlide(2);
    setDifficulty(p === "Fast Learner" ? "Easy" : "Medium");
    setScreen("player");
    setExplanation(false);
    resetQuestion();
  }
  function navigate(n: number) {
    setSlide(n);
    setDifficulty("Medium");
    setExplanation(false);
    resetQuestion();
  }
  function submit(simulated = false) {
    if (selected === null && !simulated) return;
    const correct = simulated
      ? profile === "Fast Learner"
      : selected === questions[concept][difficulty].answer;
    const seconds = simulated
      ? profile === "Fast Learner"
        ? 4.2
        : 28.4
      : Math.max(0.1, (Date.now() - startTime.current) / 1000);
    const usedHint = hint || (simulated && profile === "Needs Support");
    const before = mastery[concept];
    const change = correct ? (usedHint ? 6 : seconds < 10 ? 15 : 10) : -15;
    const after = Math.min(100, Math.max(0, before + change));
    const next: Difficulty = correct
      ? difficulty === "Easy"
        ? "Medium"
        : usedHint
          ? "Medium"
          : "Hard"
      : "Easy";
    const attempt = {
      concept,
      correct,
      seconds,
      hint: usedHint,
      difficulty,
      retry: attempts.filter((a) => a.concept === concept && !a.correct).length,
    };
    setMastery((m) => ({ ...m, [concept]: after }));
    setAttempts((a) => [...a, attempt]);
    setFeedback({ ...attempt, before, after, next });
    setHint(usedHint);
  }
  function acceptFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setFileMessage("Please choose a PDF file.");
      return;
    }
    if (file.size === 0) {
      setFileMessage("This file is empty. Please choose another PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setFileMessage("Please choose a PDF smaller than 20 MB.");
      return;
    }
    setFileMessage(
      `${file.name} selected. PDF processing is not connected in this prototype. Use the demo lesson below to explore the experience.`,
    );
  }
  const correctCount = attempts.filter((a) => a.correct).length;
  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setScreen("library")}>
          <span className="brand-icon">
            <Layers size={22} />
          </span>
          slide<span>alive</span>
          <span className="brand-period">.</span>
        </button>
        <div className="header-divider" />
        <span className="header-label">Adaptive Learning</span>
        <div className="header-right">
          {screen === "player" && (
            <>
              <button
                className="text-btn header-progress"
                onClick={() => setShowProgress(true)}
              >
                <BarChart3 size={16} />
                My progress
              </button>
              <button
                className="secondary finish"
                onClick={() => setScreen("summary")}
              >
                Finish session
              </button>
            </>
          )}
          <span className="prototype-label">INTERACTIVE PROTOTYPE</span>
          <div className="avatar">JL</div>
        </div>
      </header>
      {screen === "library" && (
        <main className="library">
          <div className="library-intro">
            <span className="welcome-pill">
              <span className="online-dot" /> MADE FOR YOUR WAY OF LEARNING
            </span>
            <h1>
              Same slides.
              <br />
              <span>A whole new way to learn.</span>
            </h1>
            <p>
              Learn from your slides, interactively.
              <br />
              Turn lecture materials into adaptive learning sessions.
            </p>
          </div>
          <div className="library-grid">
            <section
              className={`upload-card ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="upload-icon">
                <Upload size={28} />
              </div>
              <h2>Your slides, brought to life.</h2>
              <p>
                Drop a lecture PDF here to get started.
                <br />
                We’ll help you turn reading into understanding.
              </p>
              <input
                aria-label="Upload lesson PDF"
                type="file"
                accept="application/pdf,.pdf"
                ref={fileRef}
                onChange={(e) => acceptFile(e.target.files?.[0])}
                hidden
              />
              <button
                className="primary"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} />
                Browse file
              </button>
              <span className="file-note">
                PDF up to 20 MB · Demo preview only
              </span>
              {fileMessage && (
                <p role="status" className="file-message">
                  {fileMessage}
                </p>
              )}
            </section>
            <section className="demo-course">
              <div className="course-art">
                <span className="art-label">A SMALL LESSON. A BIG IDEA.</span>
                <div className="art-array">
                  {[2, 5, 8, 12, 16].map((n, i) => (
                    <span className={i === 2 ? "art-active" : ""} key={n}>
                      {n}
                    </span>
                  ))}
                </div>
                <div className="art-line" />
                <div className="art-caption">
                  <span>Less searching.</span>
                  <strong>More discovering.</strong>
                </div>
                <div className="art-orbit" />
              </div>
              <div className="course-details">
                <span className="eyebrow">CURATED DEMO LESSON</span>
                <h2>Introduction to Algorithms</h2>
                <div className="course-meta">
                  <span>
                    <Layers size={14} />8 slides
                  </span>
                  <span>
                    <Target size={14} />3 concepts
                  </span>
                  <span>
                    <Clock size={14} />
                    ~8 min
                  </span>
                </div>
                <button className="primary" onClick={() => start()}>
                  Use Demo Lesson
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>
          </div>
          <div className="library-benefits">
            <div>
              <span>
                <BookOpen size={20} />
              </span>
              <h3>Start with what you know</h3>
              <p>Your familiar slides, with a little more life.</p>
            </div>
            <div>
              <span>
                <Zap size={20} />
              </span>
              <h3>Learn by doing</h3>
              <p>Quick questions make the ideas stick.</p>
            </div>
            <div>
              <span>
                <Sparkles size={20} />
              </span>
              <h3>A path that’s yours</h3>
              <p>The next step changes as you learn.</p>
            </div>
          </div>
          <footer className="library-footer">
            <span>SLIDEALIVE / A MORE HUMAN WAY TO LEARN</span>
            <span>One slide. One insight. One step forward.</span>
          </footer>
        </main>
      )}
      {screen === "player" && (
        <>
          <div className="demo-bar">
            <span>
              <span className="demo-dot" />
              Demo mode <small>Explore two different learning paths</small>
            </span>
            <div className="profile-switch">
              {(["You", "Fast Learner", "Needs Support"] as Profile[]).map(
                (p) => (
                  <button
                    className={profile === p ? "active" : ""}
                    key={p}
                    onClick={() => start(p)}
                  >
                    {p === "You" ? "Try it yourself" : p}
                  </button>
                ),
              )}
            </div>
            {profile !== "You" && (
              <button
                className="simulate"
                disabled={!!feedback}
                onClick={() => submit(true)}
              >
                <Play size={12} />
                Simulate answer
              </button>
            )}
          </div>
          <div className="player-layout">
            <LessonSidebar
              slide={slide}
              mastery={mastery[concept]}
              navigate={navigate}
              progress={() => setShowProgress(true)}
            />
            <main className="lesson-main">
              <div className="lesson-breadcrumb">
                <span>My lessons</span>
                <ChevronRight size={12} />
                <span>Introduction to Algorithms</span>
                <span className="learning-label">
                  <span className="online-dot" /> Learning in progress
                </span>
              </div>
              <div className="slide-nav">
                <button
                  className="text-btn"
                  disabled={slide === 0}
                  onClick={() => navigate(slide - 1)}
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>
                <span>
                  Slide <b>{slide + 1}</b> / 8
                </span>
                <button
                  className="text-btn"
                  onClick={() =>
                    slide === 7 ? setScreen("summary") : navigate(slide + 1)
                  }
                >
                  {slide === 7 ? "Complete" : "Next"}
                  <ArrowRight size={14} />
                </button>
              </div>
              <SlideViewer
                slide={slide}
                explain={() => setExplanation((v) => !v)}
              />
              {explanation && (
                <ExplanationCard
                  concept={concept}
                  close={() => setExplanation(false)}
                />
              )}{" "}
              {feedback ? (
                <AdaptiveFeedback
                  feedback={feedback}
                  proceed={() => {
                    setDifficulty(feedback.next);
                    resetQuestion();
                  }}
                />
              ) : (
                <QuestionCard
                  concept={concept}
                  difficulty={difficulty}
                  selected={selected}
                  select={setSelected}
                  submit={() => submit()}
                  skip={() =>
                    slide === 7 ? setScreen("summary") : navigate(slide + 1)
                  }
                  hint={hint}
                  elapsed={elapsed}
                />
              )}
              <div className="lesson-footnote">
                <span>
                  <span className="online-dot" />{" "}
                  {profile === "You"
                    ? "Your answers shape your learning path"
                    : "Simulated profile · sample starting mastery"}
                </span>
                <span>Take your time. You’ve got this.</span>
              </div>
            </main>
            <AITutorPanel
              concept={concept}
              difficulty={difficulty}
              mastery={mastery[concept]}
              hint={() => setHint(true)}
              explain={() => setExplanation((v) => !v)}
              challenge={() => {
                setDifficulty("Hard");
                resetQuestion();
              }}
              feedback={feedback}
            />
          </div>
        </>
      )}
      {screen === "summary" && (
        <SessionSummary
          mastery={mastery}
          attempts={attempts}
          back={() => setScreen("library")}
          practice={() => {
            const weak = concepts.reduce((a, b) =>
              mastery[a] <= mastery[b] ? a : b,
            );
            navigate(
              weak === "Time Complexity" ? 4 : weak === "Binary Search" ? 2 : 1,
            );
            setDifficulty("Easy");
            setScreen("player");
          }}
        />
      )}
      {showProgress && (
        <div className="modal-backdrop" onClick={() => setShowProgress(false)}>
          <section
            className="progress-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const buttons =
                e.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                );
              const first = buttons[0];
              const last = buttons[buttons.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
          >
            <button
              autoFocus
              className="icon-btn close"
              aria-label="Close progress"
              onClick={() => setShowProgress(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">YOUR LEARNING JOURNEY</span>
            <h2 id="progress-title">Understanding, in progress.</h2>
            <p className="muted">
              A snapshot of this session. Every attempt counts.
            </p>
            {concepts.map((c) => (
              <div className="progress-concept" key={c}>
                <MasteryBar label={c} value={mastery[c]} />
                <span
                  className={`badge ${mastery[c] >= 70 ? "easy" : "medium"}`}
                >
                  {mastery[c] >= 70
                    ? "Strong"
                    : mastery[c] === 0
                      ? "Not practiced"
                      : "Needs review"}
                </span>
              </div>
            ))}
            <div className="stats-grid">
              {[
                [attempts.length, "Questions answered"],
                [correctCount, "Correct"],
                [
                  `${attempts.length ? (attempts.reduce((n, a) => n + a.seconds, 0) / attempts.length).toFixed(1) : "0"}s`,
                  "Avg. response time",
                ],
                [attempts.filter((a) => a.hint).length, "Hints used"],
              ].map(([n, l]) => (
                <div key={l}>
                  <strong>{n}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <p className="progress-note">
              {profile === "You"
                ? "Mastery starts at 0 for this session."
                : "Demo profile includes sample starting mastery."}{" "}
              Scores are illustrative, not a validated assessment.
            </p>
            <button className="primary" onClick={() => setShowProgress(false)}>
              Keep learning
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
