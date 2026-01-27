# Cardzzz

A creative assistant chat application built with Next.js, featuring a glassmorphism design system and a systematic approach to importing and sanitizing code from Builder.io and Figma.

## Project Overview

Cardzzz is a modern chat interface application that provides a creative assistant experience. The project emphasizes clean code architecture, design system consistency, and a structured workflow for integrating external design tools.

**Tech Stack:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

**Design System:**
- Glassmorphism UI with custom design tokens
- Custom typography (Satoshi for body, Roundo for headings)
- Consistent naming conventions and component structure

## Project Structure

```
src/
├── app/
│   ├── _quarantine/          # Raw, unsanitized components from Builder.io/Figma
│   │   ├── RawChat.tsx       # Chat interface screen
│   │   ├── RawLoadingSignup.tsx  # Loading/signup screen (to be added)
│   │   └── useChatLogic.ts   # Shared hooks/logic
│   ├── components/           # Sanitized, reusable components (to be created)
│   │   ├── glass/
│   │   │   ├── GlassInput.tsx
│   │   │   ├── GlassBubble.tsx
│   │   │   └── GlassContainer.tsx
│   │   └── ui/
│   │       ├── Navbar.tsx
│   │       └── Button.tsx
│   ├── page.tsx              # Root page (routes to screens)
│   └── globals.css           # Design tokens and global styles
```

## The Quarantine Workflow

This project uses a two-phase approach for importing external code from Builder.io and Figma, ensuring code quality and maintainability.

### Phase 1: Quarantine (Raw Import)

**Location:** All Builder.io/Figma code goes into `src/app/_quarantine/`

**Naming Convention:** Files are prefixed with `Raw` (e.g., `RawChat.tsx`, `RawLoadingSignup.tsx`)

**Process:**
- Code is imported as-is, without modification
- All original classes, styles, and structure are preserved
- Purpose: Isolate external code for systematic sanitization

**Why Quarantine?**
- Prevents external code from polluting the main codebase
- Allows for systematic review and sanitization
- Makes it easy to track what needs to be cleaned up
- Provides a clear separation between raw imports and production code

### Phase 2: Sanitization

After code is quarantined, it undergoes systematic transformation:

1. **Transform raw code** to match project standards
2. **Extract reusable components** to reduce duplication
3. **Apply design tokens** and naming conventions
4. **Move sanitized code** to appropriate locations (`src/app/components/`)

## Step-by-Step Import Process

Follow this workflow when importing code from Builder.io or Figma:

### Step 1: Create Raw Component

1. Create a new file in `_quarantine/` folder (e.g., `RawLoadingSignup.tsx`)
2. Paste Builder.io/Figma code directly into the file
3. Keep all original code intact (classes, styles, structure)
4. Do not modify anything at this stage

**Example:**
```tsx
// src/app/_quarantine/RawLoadingSignup.tsx
"use client";

export default function RawLoadingSignup() {
  return (
    <div style={{ background: "#220020" }}>
      {/* Raw Builder.io/Figma code */}
    </div>
  );
}
```

### Step 2: Initial Sanitization

Replace hardcoded values with design tokens and apply consistent styling:

**Color Replacements:**
- `#220020` → `cardzzz-wine`
- `#560000` → `cardzzz-blood`
- `#FFFADC` → `cardzzz-cream`
- `#890305` → `cardzzz-accent`
- `#858582` → `cardzzz-muted`

**Apply Glassmorphism Formula:**
```tsx
// Standard glassmorphism pattern
className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[30px]"
```

**Replace Generic Class Names:**
- Use `Comp_` prefix for reusable components
- Use `Section_` prefix for major layout blocks
- Use `Layout_` prefix for page-level containers
- Use `Chat_` prefix for chat-specific elements

**Before:**
```tsx
<div className="input-field" style={{ background: "#220020" }}>
  <button className="btn-primary">Click</button>
</div>
```

**After:**
```tsx
<div className="Comp_Text_Input bg-white/10 backdrop-blur-md border border-white/20">
  <button className="Comp_Button-Primary bg-cardzzz-cream text-cardzzz-accent">
    Click
  </button>
</div>
```

### Step 3: Typography Standardization

**Body Text:** Use `font-satoshi`
```tsx
<div className="font-satoshi text-[14px]">
  Body text content
</div>
```

**Headings/Buttons:** Use `font-roundo` (always lowercase)
```tsx
<button className="font-roundo font-bold text-[19px]">
  send
</button>
```

**Precise Sizing:** Use Tailwind arbitrary values
```tsx
className="text-[14px] p-[13px]"
```

### Step 4: Component Extraction

Identify repeated patterns and extract them into reusable components:

1. **Identify patterns** (glass inputs, bubbles, containers)
2. **Create component files** in `src/app/components/`
3. **Add TypeScript props** for configurability
4. **Update raw component** to use extracted components

**Example Extraction:**
```tsx
// src/app/components/glass/GlassBubble.tsx
type GlassBubbleProps = {
  children: React.ReactNode;
  sender?: "user" | "ai";
};

export function GlassBubble({ children, sender = "ai" }: GlassBubbleProps) {
  return (
    <div className={`Chat_bubble_${sender} bg-white/10 backdrop-blur-md border border-white/20 rounded-[30px] p-[10px_15px]`}>
      {children}
    </div>
  );
}
```

### Step 5: Remove Builder.io Artifacts

Clean up external tool-specific code:

- Remove Builder.io-specific attributes (`data-component-name`, etc.)
- Remove inline styles (convert to Tailwind classes)
- Remove unused imports
- Clean up commented code
- Fix any hydration errors

**Before:**
```tsx
<div 
  data-component-name="Button"
  style={{ padding: "10px", background: "#FFFADC" }}
  className="btn"
>
  Click
</div>
```

**After:**
```tsx
<button className="Comp_Button-Primary bg-cardzzz-cream p-[10px]">
  Click
</button>
```

### Step 6: Integration

Final integration steps:

1. Add navigation/routing logic
2. Connect to existing hooks/logic (e.g., `useChatLogic.ts`)
3. Test the complete user flow
4. Ensure responsive behavior
5. Verify accessibility

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

## Additional Resources

- **Styling Guidelines**: See `.cursor/rules/ui-styling.mdc` for detailed styling standards
- **Cursor Rules**: See `.cursor/rules/cursor-rules.mdc` for project conventions
- **Design Tokens**: Defined in `src/app/globals.css`

## Code Transformation Examples

### Before (Raw Builder.io Code)
```tsx
<div 
  className="chat-bubble"
  style={{ 
    background: "rgba(255, 250, 220, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "30px",
    padding: "10px 15px"
  }}
>
  <span style={{ color: "#FFFADC", fontFamily: "Satoshi" }}>
    Hello, I'm the assistant!
  </span>
</div>
```

### After (Sanitized Code)
```tsx
<div className="Chat_bubble_ai bg-white/10 backdrop-blur-md border border-white/20 rounded-[30px] p-[10px_15px]">
  <div className="BodyText text-cardzzz-cream font-satoshi text-[14px]">
    Hello, I'm the assistant!
  </div>
</div>
```

---

**Note:** This README serves as a living document. Update it as the project evolves and new patterns emerge.
