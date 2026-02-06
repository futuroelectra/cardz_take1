# Debugging the in-app preview (visual output)

When the **CodeSandbox** link works but the **in-app preview** (visual output tab) does not render, the failure is in the Sandpack/iframe path. This doc lays out a repeatable process to find where the error comes from and stabilize the preview for production.

---

## 1. Data flow (where things can fail)

```
Pipeline page (parent)
  → iframe src="/dev/pipeline/preview"
    → Preview page: GET /api/dev/pipeline/current
      → getCurrent() from dev-pipeline-store (in-memory)
    → If artifact exists: render <PreviewWrapper code={artifact.code} />
      → SandpackProvider (react-ts, React 19, Tailwind CDN)
      → Wrapper App.tsx → Card.tsx (artifact.code)
      → SandpackPreview (inner iframe runs the bundled app)
```

**Possible failure points:**

| Stage | What to check | Where to look |
|-------|----------------|----------------|
| A | Current build not set | `/api/dev/pipeline/current` returns `{ artifact: null }` |
| B | Preview page never gets artifact / wrong origin | Network tab: request to `/api/dev/pipeline/current` from iframe; response body |
| C | PreviewWrapper gets empty or invalid code | Console in **iframe** (preview tab): logs from preview page + PreviewWrapper |
| D | Sandpack compile error (syntax, missing dep, wrong template) | Sandpack error overlay in iframe; or `useErrorMessage()` in our code; console in iframe |
| E | Sandpack runtime error (card component throws) | Error boundary in wrapper App posts `preview-error` to parent; overlay in Sandpack iframe |
| F | Layout/CSS: preview runs but is hidden or zero-size | Inspect `.editor-preview-frame` and Sandpack iframe in DevTools |

---

## 2. Where we log (and what to do)

Logging is added so you can follow the flow in the browser and pinpoint the stage that fails.

### 2.1 Parent window (pipeline page)

- **Where:** Main app window (the tab that shows "dev pipeline" and the workflow/visual toggle).
- **How to open console:** DevTools → Console; make sure the **top frame** is selected (not the iframe).
- **What you’ll see:** Nothing from the preview itself; only `preview-status` and `preview-error` are handled in code. For build status we use the status bar above the iframe.

### 2.2 Preview iframe (visual output)

- **Where:** The iframe that loads `/dev/pipeline/preview`.
- **How to open console for the iframe:** DevTools → top bar where it says "top" or the page URL → switch to the frame that has `/dev/pipeline/preview`. Or: right‑click inside the preview area → "Inspect" → in the Elements tree select the iframe’s document, then open Console (it will scope to that frame).
- **Log prefixes used:**
  - `[preview-page]` — preview page (fetch current, artifact state).
  - `[preview-wrapper]` — PreviewWrapper (code length, Sandpack compile error if any).
- **What to do:**
  1. Run "run end to end", then switch to the **visual output** tab.
  2. In Console, ensure you’re in the **preview iframe** context.
  3. Note the order of logs:
     - `[preview-page] fetch /api/dev/pipeline/current ...` then either `artifact received` or `no artifact / error`.
     - If artifact received: `[preview-wrapper] rendering Sandpack, code length: N`.
     - If Sandpack reports a compile error: `[preview-wrapper] Sandpack compile error: ...`.

### 2.3 Server (current artifact)

- **Where:** Terminal where `npm run dev` is running.
- **What to add if needed:** In `src/app/api/dev/pipeline/current/route.ts`, temporarily log `getCurrent()` result (e.g. whether `current` is null or has `artifact`). Confirms whether the server has a current build when the iframe requests it.

---

## 3. Step-by-step debugging process

### Step 1: Confirm artifact is present (stages A–B)

1. Run the pipeline: click **run end to end** and wait until it finishes (status bar says "Build complete" or shows an error).
2. Open DevTools → **Network** tab. Switch to **visual output** so the iframe loads and sends the request.
3. Find the request to **`current`** (or full path `/api/dev/pipeline/current`).
4. Check **Response**:
   - If body is `{ "blueprint": null, "artifact": null }` → **Stage A**: no current build. Run the pipeline again; ensure run-build completes and sets current (see `run-build/route.ts` → `setCurrent(...)`).
   - If body has `artifact: { code: "..." }` → artifact is present; failure is later (C–F).
5. In the **preview iframe** console, look for `[preview-page] artifact received, code length: N`. If you see `no artifact` or `fetch error` instead, the preview page is not getting the artifact (B).

### Step 2: Confirm PreviewWrapper receives code (stage C)

1. In the **preview iframe** console, look for:
   - `[preview-wrapper] rendering Sandpack, code length: N` (N > 0).
2. If this never appears: the preview page is not rendering `PreviewWrapper` (e.g. still on loading or error UI). Check `[preview-page]` logs to see if `loading` stayed true or `error` is set.
3. If N is 0 or very small: artifact may be empty or truncated; check `/api/dev/pipeline/current` response again.

### Step 3: Sandpack compile errors (stage D)

1. In the **preview iframe** console, look for:
   - `[preview-wrapper] Sandpack compile error: <message>`.
2. If present: the bundler (Sandpack) failed to compile. Typical causes:
   - Syntax error in generated code.
   - Missing or incompatible dependency (e.g. React 19 vs 18; CodeSandbox uses React 18).
   - Template mismatch: we use `react-ts` and only override `/App.tsx` and `/Card.tsx`; the template’s entry may expect different files or exports.
3. **Fix direction:** Align with CodeSandbox if needed (e.g. try React 18 in Sandpack’s `customSetup.dependencies` in `PreviewWrapper.tsx`). Resolve any missing or wrong imports in the generated card code.

### Step 4: Sandpack runtime errors (stage E)

1. If there is **no** compile error log but the preview is blank or shows an error overlay inside the Sandpack iframe:
   - Our wrapper `App.tsx` uses an error boundary; it posts `preview-error` to the parent and shows a message in the iframe.
2. In the **parent** window, check the "errors this session" area on the pipeline page for the message.
3. In the **preview iframe**, look for Sandpack’s own error overlay (red screen). That indicates a runtime exception in the card component (e.g. missing export, wrong component name, or runtime API mismatch).

### Step 5: Layout / iframe visibility (stage F)

1. If there are no compile/runtime error logs and the CodeSandbox link works:
   - Inspect the preview area in the **parent** page: select the iframe that contains `/dev/pipeline/preview`. Check computed dimensions (e.g. 390×720 from `globals.css`). If width/height are 0 or very small, the layout is collapsing.
2. Inspect **inside** the preview iframe: root element of the preview page and the Sandpack container (e.g. `.editor-preview-frame`). Ensure they have non-zero size and are not `display: none` or `visibility: hidden`.

---

## 4. Environment differences (CodeSandbox vs Sandpack)

| Aspect | CodeSandbox (link) | In-app (Sandpack) |
|--------|--------------------|-------------------|
| React | 18 | 19 (in PreviewWrapper) |
| Entry | CRA-style: index.html → index.js → App.js | react-ts template: App.tsx → Card.tsx |
| Tailwind | index.html `<script src="cdn.tailwindcss.com">` | Sandpack `externalResources: [cdn.tailwindcss.com]` |
| Wrapper | Raw card code as App.js | Wrapper App.tsx with error boundary importing Card.tsx |

If the card code or dependencies assume React 18 or a different entry shape, Sandpack can fail at compile or runtime while CodeSandbox still works. First thing to try: set React 18 in `PreviewWrapper` to match CodeSandbox (see §5).

---

## 5. Quick fix to try first: align React version

In `src/components/PreviewWrapper.tsx`, the Sandpack `customSetup.dependencies` use React 19. CodeSandbox uses React 18. To rule out React version mismatch:

- Change to:
  - `react: "^18.2.0"`
  - `react-dom: "^18.2.0"`
- Reload the preview tab and see if the in-app preview starts rendering. If it does, keep React 18 for the preview until the generated code and deps are compatible with React 19.

---

## 6. Checklist before production

- [ ] Step 1: `/api/dev/pipeline/current` returns an artifact after a successful run.
- [ ] Step 2: Preview iframe console shows `[preview-page] artifact received` and `[preview-wrapper] rendering Sandpack, code length: N` with N > 0.
- [ ] Step 3: No `[preview-wrapper] Sandpack compile error` (or compile errors are fixed).
- [ ] Step 4: No runtime error overlay in Sandpack iframe; no unexpected "errors this session" from the card.
- [ ] Step 5: Iframe and Sandpack container have correct size and are visible.
- [ ] Optional: React version in Sandpack matches what the card code expects (e.g. 18 to match CodeSandbox).

Once the failing stage is identified (A–F), fix that layer (store, API, preview page, PreviewWrapper config, or generated code) and re-run this process until the in-app preview is stable.

---

## 7. Preview viewport (full height)

The preview iframe and the document inside it must **fill the available height** so the card does not sit in a short box with a big white gap below.

**What we did:**

1. **Custom index.html in Sandpack** (`src/components/PreviewWrapper.tsx`): We override `/public/index.html` with a version that sets `html`, `body`, and `#root` to `height: 100%` and `margin: 0`. Without this, the document inside the Sandpack iframe does not fill the iframe and percentage heights on our app root fail.

2. **CSS in `src/app/globals.css`**: We force the Sandpack preview **container** (e.g. `sp-preview-container`) to use `flex: 1 1 0`, `height: 100%`, and `min-height: 0` so the iframe has a defined parent height. We then force the **iframe** to `height: 100% !important` and `flex: 1 1 0` so it overrides Sandpack’s inline `height: 470px` and fills the container.

3. **Preview page layout** (`src/app/dev/pipeline/preview/page.tsx`): The preview area is in a `flex-1 min-h-0` wrapper so it takes the rest of the viewport below the "open in codesandbox" bar. `PreviewWrapper` uses `h-full min-h-[720px]` so the frame fills that area.

**If the preview is short or has a white strip again:**

- Confirm the custom `/public/index.html` is still passed in `PreviewWrapper`’s `files` and contains the height styles for html, body, #root.
- In DevTools, inspect the iframe’s parent chain under `.editor-preview-frame`; the container that directly wraps the iframe should have a non-zero height (flex or explicit). If Sandpack changed class names, add matching selectors in globals.css.
- See `docs/DEV_PIPELINE.md` §5 for the full rationale and regression-avoidance notes.
