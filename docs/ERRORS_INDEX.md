# Errors index (living document)

**Purpose:** Every error we hit in this project is recorded here so we never repeat it. When you fix a bug or encounter a new error, add an entry: what happened, root cause, how to fix, and any safeguard (prompt/code/rule) we added to prevent it again.

**When to update:** After fixing any pipeline, preview, or runtime error—or when a new error appears in the dev pipeline, preview iframe, or app—add it to this index and, if applicable, add a safeguard (Engineer prompt, post-process, or cursor rule).

---

## Format

Each entry has:

- **ID** – Short slug for reference (e.g. `preview-undefined-component`).
- **Error** – Exact or summarized message the user/console saw.
- **Root cause** – Why it happened.
- **Fix / prevention** – What to do when it happens; how to avoid it in the first place.
- **Safeguard** – Where we encoded the fix (Engineer prompt, `ERRORS_INDEX.md`, post-process, rule).

---

## Index

### 1. `preview-undefined-component` (Card render: undefined element)

| Field | Content |
|-------|--------|
| **Error** | `Preview error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports. Check the render method of Card. Try a small edit to refresh.` |
| **Root cause** | The Engineer-generated Card code used a component (e.g. from `lucide-react` or `framer-motion`) that was not imported, or was imported with the wrong name (e.g. named import used as default or vice versa). React then tries to render `undefined` as a component. |
| **Fix / prevention** | In generated Card code: (1) Import every icon/component from `lucide-react` and `framer-motion` at the top with the exact names used in JSX. (2) Use only `export default function Card()`; no named export for the main component. (3) Do not use a component in JSX unless it is explicitly imported (e.g. `<Heart />` requires `import { Heart } from 'lucide-react';`). |
| **Safeguard** | Engineer system prompt and main prompt in `src/lib/agents/engineer.ts`: require explicit imports for any non-built-in component; forbid rendering anything not imported; export default Card only. When this error appears in errorContext, it is sent to the Engineer on the next run so the model avoids repeating it. Documented here so humans and agents never reintroduce it. |

---

## How to add a new error

1. Add a new subsection: `### N. \`slug\` (short title)`.
2. Fill the table: **Error**, **Root cause**, **Fix / prevention**, **Safeguard**.
3. If you added a code/prompt/rule safeguard, say where (file, prompt section, or rule name).
4. If the error is pipeline/preview-specific, consider adding a prevention line to the Engineer prompt or errorContext handling so the LLM sees it on the next run.

---

*Last updated: when errors are added. This index is the single place we track "we hit this once; never again."*
