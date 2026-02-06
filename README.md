# Cardzzz

A creative assistant chat application built with Next.js. Users have a short conversation (Collector), approve a creative summary, then receive a built interactive card; they iterate in the editor, export, and share. Receivers claim and activate cards; returning users access library and settings.

**Tech stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS.

**Design system:** Glassmorphism, custom tokens (cardzzz-wine, cardzzz-blood, cardzzz-cream, cardzzz-accent, cardzzz-muted), Satoshi for body/labels, Roundo for headings (lowercase). See `.cursor/rules/ui-styling.mdc`.

---

## Project structure (source of truth)

- **`src/app/`** — Next.js routes and app files only (`page.tsx`, `layout.tsx`, `globals.css`). No reusable UI here.
- **`src/components/`** — All reusable UI: Chat, EditorChat, LoadingSignup, NavMenuModal, PaywallModal, ActivateModal, PreviewWrapper, Collection, CollectionWithCards, Settings. One component per file; kebab-case filenames, PascalCase component names.
- **`src/hooks/`** — Shared hooks (e.g. `useChatLogic.ts`).
- **`src/lib/`** — Agents (collector, architect, engineer, iterator), build flow, store, types, LLM, auth, dev-pipeline-store.
- **`src/app/api/`** — API routes (chat, session, build, dev pipeline, etc.).
- **`docs/`** — Project documentation. Canonical spec: `docs/MASTER_PROMPT_BACKEND.md`. Dev pipeline: `docs/DEV_PIPELINE.md`. Preview debugging: `docs/DEBUG_PREVIEW.md`.

There is **no** `_quarantine` folder; no `Raw`-prefixed components. New screens go in `src/components/` and are imported from `@/components/` in pages. See `.cursor/rules/directory-structure-naming.mdc`.

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `docs/MASTER_PROMPT_BACKEND.md` | Canonical spec: three flows, four agents, routes, element map, mermaid diagrams |
| `docs/DEV_PIPELINE.md` | Dev pipeline at `/dev/pipeline`: E2E streaming, interactive workflow, preview, problems & solutions |
| `docs/DEBUG_PREVIEW.md` | Debugging the in-app preview and viewport (full-height) |
| `docs/BLUEPRINT_EFFECTS.md` | Blueprint effects reference |
| `docs/DOCUMENTATION_INDEX.md` | Index of all docs and cursor rules with one-line purpose |
| `.cursor/rules/` | Cursor rules (flows, UI styling, modals, notifications, code style, directory structure) |

## Design System Reference

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `cardzzz-wine` | `#220020` | Primary dark background |
| `cardzzz-blood` | `#560000` | Secondary dark background |
| `cardzzz-cream` | `#FFFADC` | Primary text color |
| `cardzzz-accent` | `#890305` | Accent color (buttons, highlights) |
| `cardzzz-muted` | `#858582` | Muted/secondary text |

### Glassmorphism Pattern

Standard glassmorphism implementation:

```tsx
className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[30px]"
```

**Variations:**
- Light glass: `bg-white/10`
- Dark glass: `bg-black/20`
- Border: `border border-white/20`
- Blur: `backdrop-blur-md`

### Typography

**Body Text (Satoshi):**
```tsx
className="font-satoshi text-[14px] font-medium"
```

**Headings/Buttons (Roundo):**
```tsx
className="font-roundo font-bold text-[19px]"
```
*Note: All Roundo text must be lowercase*

## Naming Conventions

The project uses a prefix-based naming system for clarity and organization:

### Component Prefixes

- **`Comp_`**: Reusable UI components (buttons, inputs, badges)
  - Example: `Comp_Button-Primary`, `Comp_Text_Input`
  
- **`Section_`**: Major layout sections (navbar, chat area, input container)
  - Example: `Section_navbar`, `Section_chat`, `Section_Input_Container`
  
- **`Layout_`**: Page-level containers (full-screen layouts)
  - Example: `Layout_chat`, `Layout_auth`
  
- **`Chat_`**: Chat-specific elements (bubbles, message containers)
  - Example: `Chat_bubble_ai`, `Chat_bubble_user`, `Chat_Bubble_Container`

### File Naming

- **Raw components**: `Raw[ScreenName].tsx` (e.g., `RawChat.tsx`)
- **Sanitized components**: `[ComponentName].tsx` (e.g., `GlassInput.tsx`)
- **Hooks**: `use[HookName].ts` (e.g., `useChatLogic.ts`)

## Best Practices

### Code Organization

- ✅ Always start with raw code in `_quarantine/` before sanitizing
- ✅ Extract components when you see duplication (DRY principle)
- ✅ Use design tokens instead of hardcoded values
- ✅ Follow the naming convention consistently
- ✅ Keep components focused and single-purpose
- ✅ Use TypeScript types for props
- ✅ Maintain glassmorphism consistency across all UI elements

### Typography

- ✅ Use `font-satoshi` for all body text and labels
- ✅ Use `font-roundo` for headings and buttons
- ✅ **Always use lowercase** for Roundo font text
- ✅ Use Tailwind arbitrary values for precise sizing

### Styling

- ✅ Apply glassmorphism formula consistently
- ✅ Use design tokens from `globals.css`
- ✅ Prefer Tailwind classes over inline styles
- ✅ Use arbitrary values for pixel-perfect designs: `p-[13px]`, `text-[14px]`

## Development Workflow

1. **Design in Figma** - Create the UI design
2. **Export code via Builder.io** - Generate React/Next.js code
3. **Create Raw component** in `_quarantine/` folder
4. **Paste raw code** without modifications
5. **Sanitize systematically:**
   - Colors → tokens
   - Classes → naming conventions
   - Inline styles → Tailwind classes
6. **Extract reusable components** to `src/app/components/`
7. **Integrate with existing codebase** (hooks, routing, etc.)
8. **Test user flow** and verify functionality

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

### Build for Production

```bash
npm run build
npm start
```

## Additional resources

- **Canonical spec:** `docs/MASTER_PROMPT_BACKEND.md`
- **Dev pipeline:** `docs/DEV_PIPELINE.md`
- **Styling:** `.cursor/rules/ui-styling.mdc`
- **Cursor rules:** `.cursor/rules/cursor-rules.mdc`
- **Design tokens:** `src/app/globals.css`
