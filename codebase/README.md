# SlideAlive prototype

Adaptive Interactive Learning for Slides. Desktop-first Next.js / React / TypeScript / Tailwind prototype built from the supplied brief.

## Run

Node chạy từ `.venv` của repo (cài bằng `nodeenv`, Node 24 LTS — cần ≥ 23.6 để chạy file `.ts` trực tiếp).

```powershell
# từ thư mục gốc repo, một lần
.venv\Scripts\python.exe -m pip install nodeenv
.venv\Scripts\python.exe -m nodeenv -p --node=lts
.venv\Scripts\Activate.ps1          # đưa .venv\Scripts (node, npm) lên PATH

cd codebase
npm ci
# điền OPENAI_API_KEY (và tuỳ chọn OPENAI_BASE_URL / OPENAI_MODEL) vào codebase/.env
npm run dev                          # http://127.0.0.1:3000/tutor = bản gọi AI thật
```

Open http://127.0.0.1:3000 (mock UI) or http://127.0.0.1:3000/tutor (real AI loop).

## AI engine — module quyết định trung tâm (`engine/`)

Luồng một lượt học, đúng pipeline trong `workflow.md`:

```
learner turn ─► guard.ts (luật: chặn injection/đòi bí mật, KHÔNG gửi LLM)
             ─► LLM "analyze" (scope · intent · concept · đúng/sai · ngộ nhận · tiền đề sai)
             ─► behavior-tracker.ts (Learner State mới, bất biến)
             ─► adaptive-policy.ts (Interaction Decision: action · interaction_type · difficulty)
             ─► content-analyzer.ts (lấy đoạn transcript [Txx-NNN] từ data/vlearn-pack)
             ─► LLM "generate" (câu hỏi + đáp án + hint + source_refs, JSON)
             ─► validator.ts (schema · đáp án · bám nguồn · không lộ đáp án) ─► retry ≤ 2 ─► fallback.ts
             ─► payload cho UI (answer_key giữ ở server)
```

| File | Vai trò |
|---|---|
| `engine/engine.ts` | `runTurn()` — orchestrator |
| `engine/knowledge.ts` | Lesson Knowledge Day 1: 7 concept, key points, `source_ref`, `misconception_bank` |
| `engine/llm-client.ts` | Client OpenAI-compatible (OpenAI hoặc model local qua `OPENAI_BASE_URL`), đọc `codebase/.env` |
| `engine/prompts.ts` | Prompt 2 stage |
| `engine/llm-logger.ts` | Log prompt đầu vào + phản hồi thô của mô hình |
| `app/api/turn/route.ts` | `POST /api/turn` |
| `app/tutor/page.tsx` | UI gọi AI thật: câu hỏi, gợi ý, bỏ qua, mastery, quyết định + kết quả validator |
| `scripts/run-eval.ts` | Chạy golden set → `eval/run_results.md` |

`ASK_CLARIFY` là action bổ sung so với `workflow.md`, dành cho lớp chỗ khó ② (mơ hồ/thiếu thông tin).

### Logging prompt và phản hồi thô

Mọi lời gọi mô hình (cả lần lỗi) được ghi vào `codebase/logs/` (đã gitignore vì prompt chứa trích đoạn transcript):

- `llm_calls.log` — dạng đọc được, mỗi lời gọi một khối:
  ```
  ================================================================================
  2026-09-17T10:02:11.123Z | turn=run-...-G01 | stage=generate#1 | model=gpt-4o-mini | 1834 ms
  ================================================================================
  >>> PROMPT
  --- [system] ---
  ...
  --- [user] ---
  ...
  <<< RAW RESPONSE
  {"message": "...", ...}
  ```
- `llm_calls.jsonl` — cùng nội dung, một JSON/dòng: `timestamp`, `turn_id`, `stage` (`analyze`, `generate#1..3`), `model_name`, `latency_ms`, `raw_prompt`, `raw_response`, `usage`, `error`.

Lọc theo lượt: tìm `turn=<turn_id>` (web trả `turn_id` trong response; eval dùng `<run_id>-<case>`).

### Lệnh

```sh
npm run test:engine                      # 19 test, LLM giả lập, không cần key/data
npm run turn -- "context window là gì" --concept context_window
npm run eval                             # chạy toàn bộ golden set (cần key)
npm run eval -- --only G01,G11 --label "thử lại lớp 1"
```

```sh
npm run typecheck
npm run build
npm start
```

## Five-minute demo

1. Select **Use Demo Lesson**.
2. Answer a question yourself, open **Hint**, or **Explain this slide**.
3. Switch to **Fast Learner** and select **Simulate answer**. Continue to demonstrate Easy → Medium → Hard.
4. Switch to **Needs Support**, then **Simulate answer**. Review the explanation and continue to an Easy question.
5. Open **My progress**, then **Finish session**. Select **Practice weak concepts** to resume at the weakest concept.

Switching profiles resets the session. Simulated profiles have explicitly labeled sample starting mastery and simulated response times (4.2s / 28.4s). The manual profile uses real elapsed time and actual selections. Navigation and skip do not count as answers. Statistics and summaries derive from session attempts. State resets on page reload.

## Prototype boundaries

- The `/` mock page has no backend or AI calls: its questions, hints and explanations are curated mock content for one eight-slide lesson. `/tutor` is the real-AI path.
- PDF selection validates extension, size and empty files. Extraction is not implemented; selecting a PDF does not change the demo lesson.
- Mastery is an illustrative rule-based score, not a validated learning assessment: correct +15 when under 10s, otherwise +10; hinted correct +6; incorrect −15. Scores are clamped to 0–100. The manual profile starts at zero; demo profiles have sample baselines.
- Question content is a small curated bank with one question per concept and difficulty. Repeated practice can repeat a question. Mastery ≥70 is displayed as Strong.
- The prototype intentionally models the requested behavior; real deployment should validate learning outcomes and reduce reliance on response speed.
- No private course data, external services or API keys are used.

## Structure

- `app/page.tsx`: reusable UI components and session interaction state
- `app/globals.css`: responsive visual system and Tailwind import
- `lib/lesson.ts`: slides, question bank and shared types

## Interaction checks

`npm test` runs Playwright against installed Microsoft Edge. The suite covers both adaptive profiles, manual grading and hint use, upload boundaries, summary practice, and desktop/mobile overflow. If Edge is unavailable, install Playwright Chromium and remove `channel: 'msedge'` from `playwright.config.ts`.

OpenMAIC is a product reference for document-to-interactive-learning flow; this prototype is an independent implementation, without copied OpenMAIC source.
