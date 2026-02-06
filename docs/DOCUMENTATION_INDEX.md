# Documentation Index

**Single entry point for project documentation and cursor rules.** The codebase is the source of truth; these docs describe how it is structured, why decisions were made, and how to avoid regressions.

---

## Canonical specs

| Document | Purpose |
|----------|---------|
| **`docs/MASTER_PROMPT_BACKEND.md`** | Canonical product spec: three user flows (sender, receiver, returning), four agents, routes, components, element map, modals, notifications, security, and required mermaid flow diagrams. Implementation must align with this and with `.cursor/rules/`. |
| **`docs/AGENTS.md`** | Working snapshot of the four agents: tone, style, how they engage, why they feel good, shortfalls, and how to direct them toward single-task, reproducible outputs. Use when refining prompts or recreating agent behavior. |
| **`docs/DEV_PIPELINE.md`** | Dev pipeline at `/dev/pipeline`: what it does, streaming E2E, status, clean slate, interactive transcript/summary edits, preview viewport (full-height), problems encountered and solutions, and checklist for future changes. |

---

## Operations and debugging

| Document | Purpose |
|----------|---------|
| **`docs/ERRORS_INDEX.md`** | **Living index of every error we've hit.** When you fix a bug or see a new error (pipeline, preview, runtime), add it here with root cause, fix, and safeguard so we never repeat it. Keep this doc updated. |
| **`docs/DEBUG_PREVIEW.md`** | How to debug the in-app preview (Sandpack/iframe): data flow, where to look, step-by-step process, React version alignment, and **preview viewport (full height)** — custom index.html, CSS chain, and regression avoidance. |
| **`docs/BLUEPRINT_EFFECTS.md`** | Blueprint effects reference for the card builder. |
| **`docs/PROMPT_INJECTION.md`** | Prompt injection considerations. |
| **`docs/SUPABASE_CLI_SETUP.md`** | Supabase CLI setup. |

---

## Cursor rules (`.cursor/rules/`)

| Rule | Purpose |
|------|---------|
| **cursor-rules.mdc** | Standards for creating and managing cursor rules (location, format, naming, lifecycle). |
| **cursor-rules-lifecycle.mdc** | Process for proposing and updating rules; when to update master prompt and dev pipeline docs. |
| **flows.mdc** | Exactly three user flows; four agents; no hallucinated flows. References `docs/MASTER_PROMPT_BACKEND.md` §9 for agents. |
| **flow-diagrams-deliverables.mdc** | Mermaid flow diagrams required; master doc section order; deliverables checklist. |
| **directory-structure-naming.mdc** | Where files live (`src/app/`, `src/components/`, `src/hooks/`, `docs/`); kebab-case files; PascalCase components; no `_quarantine`. |
| **element-maps.mdc** | Format for element maps (page → component → element → action → backend); live in master prompt. |
| **ui-styling.mdc** | Typography (Satoshi, Roundo lowercase), glassmorphism, button states, naming (`Comp_`, `Layout_`, `Chat_`). |
| **modals-variants.mdc** | Existing modals; when to reuse vs variant vs new; glassmorphism and document in master prompt. |
| **notifications-backend.mdc** | Per-button notification options (WhatsApp/email from user, in-app only); async backend; no "from us only." |
| **non-functional-requirements.mdc** | Production-ready (no placeholders), security, reuse, consistency with spec and rules. |
| **code-style.mdc** | File size, comments, layout, formatting, coordination with directory and UI rules. |
| **dependencies-install.mdc** | Use CLI for dependencies; never manually edit package.json for deps. |
| **pipeline-agent-workflow.mdc** | Way of work for agent pipelines: define, map I/O, build, simulate, visualize, refine. References `docs/DEV_PIPELINE.md` for tooling. |
| **errors-index.mdc** | When you fix a bug or hit a new error, add it to `docs/ERRORS_INDEX.md` with root cause and safeguard so we never repeat it. Check the index before changing Engineer prompt or preview code. |

---

## Quick reference

- **Product behavior and flows** → `docs/MASTER_PROMPT_BACKEND.md` + `.cursor/rules/flows.mdc`
- **Dev pipeline and preview** → `docs/DEV_PIPELINE.md` + `docs/DEBUG_PREVIEW.md`
- **Errors we've seen (never repeat)** → `docs/ERRORS_INDEX.md`
- **UI and styling** → `.cursor/rules/ui-styling.mdc` + `src/app/globals.css`
- **Where to put new code** → `.cursor/rules/directory-structure-naming.mdc`
- **Changing rules or adding flows** → `.cursor/rules/cursor-rules-lifecycle.mdc`
