# Dev Pipeline: Reference and Operations Guide

**The dev pipeline is a development-only tool at `/dev/pipeline` that runs the full agent stack (Collector → Architect → Engineer) with a simulated user, streams progress and logs, and lets you interact with each stage.** This document is the source of truth for how it works, why decisions were made, and how to avoid common pitfalls.

---

## 1. What the dev pipeline does

- **One-click E2E run**: Simulates a sender: creates a session, gets a welcome message, then has an **LLM-generated user** converse with the Collector (Agent 1) until the user "approves." The conversation is **generative** (different every run). After approval, the pipeline runs Architect (Agent 2) and Engineer (Agent 3) to produce a build and sets it as the current preview.
- **Live feedback**: Status text to the right of the "run end to end" button shows the current stage (e.g. "creating session…", "chat round 2 (AI)", "building (Architect → Engineer)…"). The workflow log **streams** in real time: session, welcome, each user message, each AI reply, approve, then build. The run log **auto-scrolls** as new entries arrive so you can follow the stream without manually scrolling.
- **Agent 2 output visible**: After E2E (or run-build), the **Agent 2 (Architect) output** section shows the blueprint JSON to the letter—the exact variable schema the Engineer received. The run-build API returns the blueprint so the client can display it; "apply with AI" remains for the **creative summary** only.
- **Interactive workflow**: After a run you can:
  - **Append to the conversation**: Add a line to the raw transcript and re-run from Agent 2 (transcript → Architect → Engineer). Uses `POST /api/dev/pipeline/from-transcript`.
  - **Edit the creative summary with AI**: Type a request (e.g. "make it more festive"); the LLM merges it into the current summary. Then run "run pipeline (Architect → Engineer)" to rebuild. Uses `POST /api/dev/pipeline/update-summary`.
- **Clean slate**: The "clean slate" button clears the in-memory build (server) and all persisted pipeline state (localStorage + UI), so you start from an empty state.
- **Preview**: The "visual output" view shows the built card in an iframe (Sandpack). The preview is designed to **fill the viewport** (no fixed 470px height, no big white gap at the bottom).

---

## 2. Architecture (code locations)

| Piece | Location | Purpose |
|-------|----------|---------|
| Pipeline page | `src/app/dev/pipeline/page.tsx` | UI: run E2E, status, workflow/visual toggle, error context, creative summary section, transcript append, summary AI edit, clean slate |
| Preview page | `src/app/dev/pipeline/preview/page.tsx` | Loaded in iframe; fetches current build, renders `PreviewWrapper` |
| PreviewWrapper | `src/components/PreviewWrapper.tsx` | Sandpack (react-ts) wraps generated Card; custom `/public/index.html` for full-height iframe document |
| E2E collector (streaming) | `src/app/api/dev/pipeline/e2e-collector/route.ts` | POST: runs session → welcome → send loop (LLM user) → approve; streams NDJSON (log entries + done) |
| Run build | `src/app/api/dev/pipeline/run-build/route.ts` | POST: runs Architect + Engineer for a buildId, sets current; returns `blueprint` so the client can show Agent 2 output |
| From transcript | `src/app/api/dev/pipeline/from-transcript/route.ts` | POST: transcript → Architect → Engineer, set current |
| Update summary | `src/app/api/dev/pipeline/update-summary/route.ts` | POST: creativeSummary + request → LLM merged summary |
| Clear | `src/app/api/dev/pipeline/clear/route.ts` | POST: clears in-memory current build |
| Dev pipeline store | `src/lib/dev-pipeline-store.ts` | In-memory current blueprint + artifact for preview |

---

## 3. Streaming E2E (how and why)

**How:** The E2E collector API returns `Content-Type: application/x-ndjson`. Each line is a JSON object. For every step it pushes `{"log": <LogEntry>}` (session, welcome, user, ai, …). At the end it sends `{"done": true, "creativeSummary", "buildId", "collectorTranscript", "error?"}`.

**Why:** So the UI can show progress without waiting for the full run. The client uses `response.body.getReader()`, decodes chunks, splits on newlines, parses each line, appends to the log state, and updates the status label. When `done` is received, it sets creative summary/transcript/buildId and, if buildId is present, calls run-build.

**Important:** The simulated user is an LLM (`generateNextUserMessage` in e2e-collector). Each run produces a different conversation and thus different creative summary and final card. This is intentional.

---

## 4. Creative summary section (when it appears)

The "Creative summary (edit and re-run from here)" block is **only shown when `e2eResult?.creativeSummary != null`** — i.e. after the E2E stream has produced a summary. The textarea is populated from the **streamed** result (set when the `done` payload is received). There is no pre-population from a previous session until that session has produced a summary; the section is not shown on a fresh load until you run E2E and get a result. The "run pipeline (Architect → Engineer)" button submits the current (possibly edited) summary to `POST /api/dev/pipeline` to re-run Architect and Engineer and update the preview.

---

## 5. Preview viewport: full height (problems and solutions)

**Problem:** The Sandpack preview iframe was fixed at 470px height (set by Sandpack’s JS), and the document inside the iframe (html, body, #root) did not fill the iframe, causing a big white gap at the bottom and the card not using the full area.

**Solutions applied:**

1. **Iframe and container CSS** (`src/app/globals.css`):
   - The div that wraps the Sandpack iframe (e.g. `sp-preview-container`) must have a defined height so `height: 100%` on the iframe works. We added rules so that `.editor-preview-frame [class*="sp-preview-container"]` (and `.sp-preview-container`) get `flex: 1 1 0`, `min-height: 0`, `height: 100%`, and flex layout.
   - The iframe itself is forced to fill with `height: 100% !important` and `flex: 1 1 0` / `min-height: 0` so it overrides Sandpack’s inline `height: 470px` and expands with the frame.
   - Selectors include `.editor-preview-frame iframe`, `.editor-preview-sandpack-preview iframe`, and `.sp-preview-iframe` / `[class*="sp-preview-iframe"]` so we catch Sandpack’s classes.

2. **Document inside the iframe** (`src/components/PreviewWrapper.tsx`):
   - We override Sandpack’s default `/public/index.html` with a custom one that sets `html, body, #root` to full height: inline `style="height:100%;margin:0"` on html and body, and a `<style>` block `html, body, #root { height: 100%; margin: 0; padding: 0 }`, plus `#root` with `style="height:100%"`. That way the React app inside the iframe has a full-height chain and our wrapper (and the Card) can fill the viewport.

3. **Preview page layout** (`src/app/dev/pipeline/preview/page.tsx`):
   - The page uses `min-h-screen flex flex-col`; the "open in codesandbox" block is `shrink-0` with minimal padding; the preview area is `flex-1 min-h-0` so it takes the rest of the viewport. `PreviewWrapper` uses `h-full min-h-[720px]` so it fills that area.

**How to avoid regression:** Do not remove the custom `/public/index.html` in PreviewWrapper or the `sp-preview-container` / iframe rules in globals.css. If Sandpack changes class names, re-check the DOM and add matching selectors. See also `docs/DEBUG_PREVIEW.md`.

---

## 6. Clean slate

- **Button:** "clean slate" on the pipeline page (top right).
- **Effect:** Calls `POST /api/dev/pipeline/clear` (clears in-memory build), removes `cardzzz-dev-pipeline-state` from localStorage, and resets all pipeline UI state (inputs, results, errors, build phase, preview status). After that, the page and preview are in a blank state.

---

## 7. Error context

Errors from the preview iframe (e.g. runtime errors in the card) are posted to the parent via `postMessage` and collected in "errors this session." They are sent to the Engineer on the next run-build (or from-transcript) via `errorContext` so the model can avoid repeating the same mistakes. **Every error we fix must be added to `docs/ERRORS_INDEX.md`** with root cause, fix, and safeguard so we never repeat it; see `.cursor/rules/errors-index.mdc`.

---

## 8. Checklist for future changes

- E2E collector must keep streaming NDJSON if the UI is to show live log and status.
- Creative summary section must remain gated on `e2eResult?.creativeSummary != null` and populated from the stream’s `done` payload.
- Preview full-height behavior depends on globals.css (iframe + container) and PreviewWrapper’s custom index.html; don’t remove or weaken those without updating this doc and DEBUG_PREVIEW.
- New dev-only API routes should be under `src/app/api/dev/pipeline/`, return 404 when not in development, and be documented here.

---

*Last updated to match the codebase as of the dev pipeline milestone: single E2E flow, streaming, status, clean slate, interactive transcript/summary, and full-height preview.*
