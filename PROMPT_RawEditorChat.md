# Prompt: Build RawEditorChat Component from Scratch

## Context
You are starting fresh. Ignore any previous implementations or assumptions. Your task is to create a new `RawEditorChat.tsx` component by sanitizing and implementing the builder.io code structure found in the existing file.

## Step 1: Examine the Existing Files


1. **Read `/src/app/_quarantine/RawEditorChat.tsx`** - This file contains builder.io JSON data with layout structure, dimensions, and component placement. Use this ONLY as a reference guide for:
   - Height measurements for the mobile preview container
   - Height measurements for the chat interface container
   - Alignment relationships (top and bottom alignment between left and right sections)
   - Overall layout structure

2. **Read `/src/app/_quarantine/RawChat.tsx`** - This file contains:
   - The navbar component (lines 83-151) - REUSE THIS EXACTLY
   - The chat interface structure (lines 153-270) - REUSE THIS EXACTLY for the right side
   - All chat-related components and logic

3. **Read `/src/app/globals.css`** - Reference for glassmorphism styling standards

## Step 2: Component Structure

Create a component with the following structure:

```
Desktop Layout:
┌─────────────────────────────────────────┐
│         Navbar (from RawChat.tsx)       │
│         Fixed height: h-[120px]        │
└─────────────────────────────────────────┘
┌──────────────────┬──────────────────────┐
│                  │                      │
│  Mobile Preview  │   Chat Interface     │
│  (Left Side)     │   (Right Side)       │
│                  │   (from RawChat.tsx) │
│                  │                      │
│  [Use builder.io │   [Exact copy of     │
│   for height]    │    chat section]     │
│                  │                      │
└──────────────────┴──────────────────────┘

Mobile Layout (below breakpoint):
┌─────────────────────────────────────────┐
│         Navbar (from RawChat.tsx)       │
│         Fixed height: h-[120px]        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         Mobile Preview                  │
│         (Top - Full Width)              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         Chat Interface                  │
│         (Bottom - Full Width)           │
│         (from RawChat.tsx)               │
└─────────────────────────────────────────┘
```

## Step 3: Implementation Requirements

### Layout Structure:
1. **Outer Container**: 
   - Full screen height: `h-screen`
   - Background gradient: `bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood`
   - Flex column layout: `flex flex-col`

2. **Navbar Section** (Top):
   - Copy EXACTLY from `RawChat.tsx` lines 83-151
   - Fixed height: `h-[120px]`
   - No grow: `shrink-0`
   - Include the logo SVG and menu icon SVG exactly as they appear

3. **Main Content Area** (Below navbar):
   - **Desktop**: Flexbox row layout: `flex flex-row` (use `md:flex-row` or `lg:flex-row` breakpoint)
   - **Mobile**: Flexbox column layout: `flex flex-col` (default or use `flex-col md:flex-row`)
   - Full width: `w-full`
   - Takes remaining height: `flex-1`
   - Gap between left and right: Use appropriate spacing
   - **Responsive behavior**: At mobile breakpoint, stack vertically with mobile preview on top, chat interface below

4. **Left Side - Mobile Preview**:
   - Use builder.io code as reference for the EXACT height
   - Container should have glassmorphism styling:
     - Background: `bg-white/10`
     - Backdrop blur: `backdrop-blur-md`
     - Border: `border border-white/20`
   - Should align perfectly at top and bottom with the right side chat interface
   - For now, this can be a placeholder container with the correct dimensions
   - The height MUST match what's specified in the builder.io code

5. **Right Side - Chat Interface**:
   - Copy EXACTLY from `RawChat.tsx` lines 153-270
   - This includes:
     - The scrollable chat section with alpha fade mask
     - The input container at the bottom
     - All chat bubbles, message rendering logic
     - The textarea, attach button, voice button, send button
   - The height MUST align perfectly with the mobile preview on the left
   - Use builder.io code to determine the exact height relationship

### Glassmorphism Consistency:
- **Mobile Preview Container**: `bg-white/10 backdrop-blur-md border border-white/20`
- **Chat Interface Container**: Same as above - `bg-white/10 backdrop-blur-md border border-white/20`
- **Input Container**: Same as in RawChat.tsx - `bg-white/10 backdrop-blur-md border border-white/20`
- All glassmorphism must match the pattern used throughout the website

### Component Restrictions:
- **DO NOT** add any components that are not present in the builder.io file
- **DO NOT** add features beyond what exists in RawChat.tsx
- **ONLY** use the builder.io code as a dimensional/spatial reference guide
- The builder.io code is for layout guidance ONLY, not for component features

### Height Alignment:
- **Desktop Layout**: The mobile preview (left) and chat interface (right) must be perfectly aligned:
  - Top edges align
  - Bottom edges align
  - Heights match exactly as specified in builder.io code
- Use the builder.io measurements to ensure this alignment
- **Mobile Layout**: When stacked vertically, each section takes its natural height based on content

### Responsive Layout:
- **Breakpoint**: Use an appropriate Tailwind breakpoint (e.g., `md:` for 768px or `lg:` for 1024px)
- **Desktop (above breakpoint)**:
  - Side-by-side layout: `flex-row` or `md:flex-row`
  - Mobile preview on left, chat interface on right
  - Heights align perfectly as specified in builder.io
- **Mobile (below breakpoint)**:
  - Stacked layout: `flex-col` (default)
  - Mobile preview container on top (full width)
  - Chat interface below (full width)
  - Both sections maintain their glassmorphism styling
  - Each section takes appropriate height for its content

## Step 4: Code Requirements

1. **Import statements**: Import necessary hooks and components from RawChat.tsx (useChatLogic, etc.)

2. **State management**: Reuse the same chat logic from RawChat.tsx

3. **Styling**: Follow the UI styling standards from `.cursor/rules/ui-styling.mdc`:
   - Use `font-satoshi` for body text
   - Use `font-roundo` for headings (lowercase)
   - Follow button state patterns
   - Use precise Tailwind arbitrary values

4. **Responsive considerations**: 
   - Implement responsive breakpoint using Tailwind classes
   - Desktop: Side-by-side layout (`flex-row` at `md:` or `lg:` breakpoint)
   - Mobile: Stacked layout (`flex-col` below breakpoint)
   - Mobile preview appears on top, chat interface below on mobile screens
   - Ensure both layouts maintain proper spacing and glassmorphism styling

## Step 5: Final Checklist

Before completing, verify:
- [ ] Navbar is identical to RawChat.tsx
- [ ] Chat interface on right is identical to RawChat.tsx
- [ ] Mobile preview container has correct height from builder.io
- [ ] Left and right containers align perfectly top and bottom (desktop)
- [ ] Responsive layout works: stacks vertically on mobile with mobile preview on top
- [ ] Glassmorphism styling is consistent (`bg-white/10 backdrop-blur-md border border-white/20`)
- [ ] No extra components beyond builder.io reference
- [ ] All heights match builder.io specifications (desktop)
- [ ] Component is functional and renders correctly at all breakpoints

## Important Notes:
- The builder.io code is a REFERENCE ONLY for spatial relationships and dimensions
- Do NOT try to parse or execute the builder.io JSON - just use it as a visual/spatial guide
- Focus on creating clean, maintainable React/Next.js code
- The mobile preview can be a simple placeholder container for now - the important part is getting the layout structure and heights correct
