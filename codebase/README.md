# SlideAlive prototype

Adaptive Interactive Learning for Slides. Desktop-first Next.js / React / TypeScript / Tailwind prototype built from the supplied brief.

## Run

Requires Node.js 20.9+ (Node 22 or 24 recommended).

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000.

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

- No backend or AI calls. Questions, hints and explanations are curated mock content for one eight-slide lesson.
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
