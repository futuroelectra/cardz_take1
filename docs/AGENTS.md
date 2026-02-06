# Agent definitions: tone, style, and reproducibility

**Purpose:** This document is a **working snapshot** of how the four backend agents are defined, how they engage, why they feel good, and where they fall short. It exists so we can **recreate agent behavior and reproduce outputs** as much as possible, given that agents are generative and produce broad potential output. Use it when refining prompts, adding features, or debugging pipeline behavior.

**Canonical I/O and flow:** `docs/MASTER_PROMPT_BACKEND.md` §9. Implementations: `src/lib/agents/collector.ts`, `architect.ts`, `engineer.ts`, `iterator.ts`.

---

## 1. Why this level of detail

- **Reproducibility:** Generative agents vary run-to-run. Documentation that captures **tone, style, exact task boundaries, and shortfalls** makes it easier to tune prompts and contracts so outputs stay in range.
- **Single-task direction:** Each agent should do **one thing at a time** with a **super specific** task. The docs below spell out what that one thing is, what the input is, and what the output must look like—so we can direct them clearly and avoid scope creep.
- **Working state:** We are describing the system as it **actually works** today: what makes it “feel good,” what breaks, and how to steer it.

---

## 2. Agent 1: Collector

**Role:** Gather “just enough” from the sender in chat; produce a creative summary (or raw transcript) for the next step. The user approves a **prose** summary; the Architect can consume either that summary or the **raw transcript**.

### Inputs and outputs

| Input | Output |
|-------|--------|
| Session, message history, latest user message | AI reply (streamed or one-shot); optionally `showConfirmation: true` and a **prose summary** for the approval bubble |
| Same (for completion) | `CreativeSummary` JSON (recipientName, senderName, senderVibe, centralSubject, tone, productConfirmed, etc.) or raw transcript for Agent 2 |

### Tone and style (from implementation)

- **Identity:** “Digital Confidant.” Effortless authority; offer a vision, don’t ask for permission.
- **Constraints:** No AI apologies; no title case in prose; max one emoji per message from an approved list (e.g. 🔮 ✨ 🪶 🕯️).
- **Goal:** Materialize the user’s intent into a creative summary. Observe the user’s tone and mirror it.
- **Questions to cover:** Who is this for? What’s the vibe? What is the center of the world (Avatar vs Object)? Stop once there’s enough for a JSON summary.
- **Length:** Keep the conversation to **3–4 substantive exchanges**. Do not list data points; weave questions into natural chat.

### How it engages

- Welcome message is generated once per session (identity + Collector intention + knowledge). Then each user message gets a single LLM reply; after the reply, a **completion check** (separate LLM call) decides if we have enough for a first draft.
- **Data points** required for completion: recipient name, sender name, sender vibe or tone, central subject (avatar, card, orb, etc.), product confirmation (receiver controls experience).
- When the completion check passes, the user sees a **prose summary** (2–4 sentences, warm, no JSON or effect names) for approval—not the raw JSON. The JSON is produced for backend use (e.g. Architect when not using transcript).

### Why it feels good

- Short, conversational path to “enough” without feeling like a form.
- Prose approval feels human; the model is steered to mirror the user’s tone.

### Shortfalls and how to direct

- **Shortfall:** Can run long or ask one thing at a time unclearly. **Direction:** Keep the “3–4 substantive exchanges” and “weave questions into natural chat” in the system prompt; consider tightening completion-check criteria so we don’t show approval too early or too late.
- **Shortfall:** Prose summary can drift from the structured summary. **Direction:** Prose is for display only; Architect in production uses **transcript**. Document that clearly so refinements don’t assume prose = source of truth.
- **Single-task:** The Collector’s **one thing** is: “From this conversation, either (a) produce the next reply and possibly a prose approval summary, or (b) produce the structured creative summary / transcript for the Architect.” Keep completion check and prose generation as **separate, well-defined steps** so we can tune each.

---

## 3. Agent 2: Architect

**Role:** Map a **creative summary** or the **raw Collector transcript** into a single, fixed **blueprint** (variable schema) that the Engineer follows. Output is JSON only; no prose.

### Inputs and outputs

| Input | Output |
|-------|--------|
| Raw Collector transcript (production path) | **Blueprint** JSON: heading, description, statusBar, centralImage, buttons (1–4; at most one music, one image), primary/secondary/text colors, themeName, runtimeInstructions (text/image/music “Will”), effects (buttonStyle, frameBackdrop, entranceEffect, cardContainer, typographyTreatment) |
| CreativeSummary JSON or prose (e.g. dev pipeline) | Same Blueprint shape |

### Tone and style (from implementation)

- **Identity:** “Master design architect.” Turn conversation vibes into hex codes and interaction logic.
- **Constraints:** Outputs must feel **high-end and polished**. Infer recipient, sender, tone, and central subject from the transcript. Define **runtimeInstructions** (Task Envelopes) for text, image, and music so the runtime agent never breaks character.
- **Effects:** Allowed values are enumerated (e.g. buttonStyle: none|solid|gradient|…). Use `"none"` when a dimension should have no effect.

### How it engages

- **Transcript path:** `transcriptToBlueprint(transcript)` — main production path; prompt is `ARCHITECT_PROMPT_TRANSCRIPT` + transcript. System instruction stresses inferring from the conversation and outputting only valid JSON.
- **Summary path:** `creativeSummaryToBlueprint(summary)` — used when we have CreativeSummary (e.g. dev pipeline). If `summary.prose` is set, uses prose only; otherwise uses JSON summary. Same Blueprint shape out.
- Output is **normalized**: buttons sliced to 4, at most one music and one image; effects default to `"none"` when missing; defaults for heading, description, statusBar, colors, etc.

### Why it feels good

- One clear contract: transcript or summary → one Blueprint. Engineer gets a single schema to implement.
- Effects and runtimeInstructions give the card a consistent look and behavior without the model inventing new keys.

### Shortfalls and how to direct

- **Shortfall:** Model can add keys or use values outside the allowed sets. **Direction:** Normalization in code corrects many issues; prompt says “exactly these keys” and “use ‘none’ to skip.” Keep the allowed effect values in the prompt and in `docs/BLUEPRINT_EFFECTS.md` in sync.
- **Shortfall:** Vague transcript → generic blueprint. **Direction:** Encourage Collector to get “vibe” and “center of the world” clearly; Architect prompt already says “infer from the conversation.”
- **Single-task:** The Architect’s **one thing** is: “Given transcript or creative summary, output **only** the Blueprint JSON with the fixed schema.” No chat, no explanation—only JSON. All product logic (buttons, effects, runtimeInstructions) lives in this one step.

---

## 4. Agent 3: Engineer

**Role:** Generate **one** production-ready React Card component (Card.tsx) from the Architect’s blueprint. Output is code only; no markdown or commentary.

### Inputs and outputs

| Input | Output |
|-------|--------|
| Blueprint (with optional centralImageUrl), optional previous code, optional errorContext | **BuildArtifact**: { code, blueprint, createdAt, previousCode } |

### Tone and style (from implementation)

- **Identity:** Expert React 19 and Tailwind developer. Single, production-ready Card component; Tailwind (CDN) and Framer Motion; “fever dream” entrance animations; dreamlike, subtle; glassmorphism for overlays/modals.
- **Constraints:** Output **only** raw code: no markdown, no explanations, no code fences. Start with `import` or `export`. Export as `export default function Card() { ... }`. CamelCase for JSX/SVG props. `{/* */}` for comments, never HTML `<!-- -->`. Root must fill 390×720 viewport; no horizontal overflow. Use **only** blueprint colors; no hardcoded brand colors.

### How it engages

- **Blueprint + optional errorContext:** Prompt is `ENGINEER_PROMPT` + JSON blueprint (with centralImageUrl). System instruction includes `ENGINEER_SYSTEM_BASE`; if there are previous errors, they’re appended so the model avoids repeating them.
- **Effects:** Implement blueprint.effects when present; skip when value is `"none"`. Hints in the prompt describe each effect dimension (buttonStyle, frameBackdrop, entranceEffect, cardContainer, typographyTreatment).
- **Post-process:** Strip code fences and language labels; fix SVG kebab-case → camelCase; replace HTML comments with JSX comments; remove certain CSS imports; ensure root has viewport-fill classes; ensure default export is `Card`.

### Why it feels good

- One component, one file. Preview and iteration stay predictable.
- Error context reduces repeated mistakes. Post-processing keeps Sandpack and React 19 happy.

### Shortfalls and how to direct

- **Shortfall:** Model sometimes generates a sender-style "approval" screen (card description + Approve button) instead of the receiver card. **Direction:** Prompt states the Card is **receiver view only**; no approval step, no "preview description" screen, no Approve button; render heading, description, statusBar, central image, and buttons directly.
- **Shortfall:** "Element type is invalid... got: undefined" (undefined component in Card render). **Direction:** Prompt requires importing every component used (lucide-react icons, motion from framer-motion); never render an undefined value. See `docs/ERRORS_INDEX.md` entry `preview-undefined-component`.
- **Shortfall:** Model sometimes outputs App instead of Card, or wrong viewport. **Direction:** Post-process enforces `Card` and viewport classes; keep these rules in the prompt and in `postProcessCode`.
- **Shortfall:** New or wrong effect implementations. **Direction:** Keep `EFFECTS_HINTS` in the prompt aligned with `docs/BLUEPRINT_EFFECTS.md`; add regression tests for effect combinations if needed.
- **Single-task:** The Engineer’s **one thing** is: “Given this Blueprint (and optional prior code/errors), output the **complete** Card.tsx code and nothing else.” No multi-file, no chat—one task, one artifact.

---

## 5. Agent 4: Iterator

**Role:** Editor chat: respond in the Digital Confidant voice, suggest concrete tweaks (heading, description, palette), and prompt the user to “export” when ready. When the user requests a change, apply it in a **limited, keyword-based** way and optionally re-run Engineer/Watcher.

### Inputs and outputs

| Input | Output |
|-------|--------|
| User message, recent editor messages, optional card context (heading, themeName) | **ChatMessage** (AI reply); optionally type `"export"` when suggesting materialize |
| User message + current BuildArtifact (for applyIteration) | **BuildArtifact** (updated code); may go through Watcher for realignment |

### Tone and style (from implementation)

- **Identity:** “Digital Confidant in the editor.” Effortless authority; don’t just do the change, elevate it. Offer a vision; never ask for permission. When the user is satisfied, prompt them to materialize (“say ‘export’ when you’re ready to materialize”).
- **Constraints:** Suggest concrete tweaks in the brand voice. Use product knowledge as a “Creative Palette”: suggest specific improvements (e.g. Avatar to Object, Greeting to Poem) based on the sender’s vibe; keep suggestions brief and natural.
- **Special cases:** “pop” → empty message. “export” (or similar) in user message → reply nudging to hit export.

### How it engages

- **Chat:** `getIteratorReply(userText, recentMessages, …, cardContext)` builds messages from the last 10, adds identity + intention + product info, and calls the LLM. Reply is trimmed; if it suggests export/materialize, type is set to `"export"`.
- **Apply changes:** `applyIteration(userText, currentArtifact)` is **keyword-based**: if user text includes “heading”/“title”, “description”, “color”/“background”, then the blueprint is tweaked accordingly (with simple defaults); otherwise description is appended. Then `blueprintToCode` and Watcher run. So the Iterator does **not** use the LLM to interpret “what changed”—it uses heuristics. This keeps the step narrow and reproducible but limits nuance.

### Why it feels good

- Editor feels like a continuation of the same voice. Export is a clear, prompted action.
- Apply path is fast and deterministic for simple requests.

### Shortfalls and how to direct

- **Shortfall:** applyIteration is coarse; complex or vague requests don’t map well. **Direction:** Either extend keyword rules carefully or introduce a **single** “interpret change” step (one LLM call that outputs a small, structured change spec) so the Iterator still does one thing at a time: “interpret this message → output change spec” then “apply spec → Engineer.”
- **Shortfall:** LLM reply can drift from “concrete tweaks” into long prose. **Direction:** Keep “suggest concrete tweaks” and “brief and litter them naturally” in the system prompt; consider a max length or a follow-up step that summarizes “suggested changes” for the user.
- **Single-task:** For **chat**, the one thing is: “Generate the next editor reply in character and nudge toward export when appropriate.” For **apply**, the one thing is: “Turn this user message into a minimal blueprint/code update and run Engineer (and Watcher).” Splitting “interpret” and “apply” keeps each step specific and testable.

---

## 6. Single-task and reproducibility

- **One thing at a time:** Each agent has a single primary output (Collector: reply + optional summary; Architect: Blueprint; Engineer: BuildArtifact; Iterator: reply or updated artifact). When adding behavior, add it as a **clear sub-step** with its own input/output so we can test and prompt it independently.
- **Super specific task creation:** When defining new tasks (e.g. “interpret iteration request”), write the **exact** input shape and **exact** output shape (e.g. JSON schema). Avoid “the model can do anything here”; constrain the output so we can validate and reuse it.
- **Reproducibility:** To reproduce behavior, we rely on (1) **exact prompts and system instructions** (in code and summarized here), (2) **fixed I/O contracts** (Blueprint, BuildArtifact, CreativeSummary), and (3) **normalization and post-processing** so small model variations don’t break the pipeline. When changing an agent, update this doc and the master prompt §9 so the snapshot stays accurate.

---

*When you change an agent’s prompt, I/O, or behavior, update this document and `docs/MASTER_PROMPT_BACKEND.md` §9 so the working snapshot and reproducibility guidance stay in sync.*
