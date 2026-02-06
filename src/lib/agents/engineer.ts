/**
 * Agent 3: Engineer. Generates React card UI code from Architect's blueprint.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM then post-processes for Sandpack.
 */

import { generate } from "@/lib/llm";
import type { Blueprint, BuildArtifact } from "@/lib/types";

const ENGINEER_SYSTEM_BASE = `You are an expert React 19 and Tailwind developer. Generate a single, production-ready Card component for Card.tsx. This component is the RECEIVER view only: what the person who receives the card sees when they open it (after claiming/activating). Do NOT include any approval step, "preview description" screen, or "Approve" button. Render the card content directly: heading, description, statusBar, central image, buttons—no intermediate "here is the description, click Approve" screen. Use Tailwind CSS (via CDN) and Framer Motion. Use "fever dream" entrance animations: dreamlike, subtle. Use glassmorphism for overlays and modals where appropriate. Output ONLY raw code: no markdown, no explanations, no code fences. Start with "import" or "export". Export as: export default function Card() { ... }. Use camelCase for JSX/SVG props (e.g. strokeWidth not stroke-width). Use {/* */} for comments, never HTML <!-- -->.

CRITICAL - Avoid "Element type is invalid... got: undefined": (1) Import every component you use. For lucide-react icons use: import { IconName } from "lucide-react" and use only IconName in JSX. For framer-motion use: import { motion } from "framer-motion". (2) Do not use any component in JSX unless it is explicitly imported at the top—never render an undefined value. (3) Export only the Card as default: export default function Card() { ... }. No named export for the main component.`;

function engineerSystemWithErrorContext(errorContext: string[] | undefined): string {
  if (!errorContext?.length) return ENGINEER_SYSTEM_BASE;
  const block = `\n\nCRITICAL - Previous errors in this session that you MUST avoid repeating (fix these patterns):\n${errorContext.map((e) => `- ${e}`).join("\n")}\n`;
  return ENGINEER_SYSTEM_BASE + block;
}

const EFFECTS_HINTS = `
Implement blueprint.effects when present (omit effect when value is "none"):
- buttonStyle: gradient = CSS gradient on button bg; outline = border only; glass = backdrop-blur; softGlow = box-shadow glow; bordered = border; minimal = flat; pill = rounded-full; neon = bright border/glow.
- frameBackdrop: glow = soft box-shadow behind central frame; pulse = animate opacity/scale; softGlow = subtle glow; particles = small animated dots; gradientRing = gradient circle behind; shimmer = shimmer animation; halo = soft halo; subtleShadow = shadow.
- entranceEffect: confetti = light confetti on first mount; particles = particle burst; fade = opacity 0→1; scaleIn = scale 0.9→1; subtleDrift = slight drift; blurIn = blur→sharp; stagger = stagger children; floatUp = translateY animate.
- cardContainer: glass = backdrop-blur border; softBorder = rounded border; elevated = shadow; minimal = flat; gradientBorder = gradient border.
- typographyTreatment: subtleShadow = text-shadow; gradientText = gradient on text; letterSpacing = tracking; allCaps = uppercase; serif = font-serif; rounded = font-roundo or rounded.
`;

const ENGINEER_PROMPT = `Generate a single Card component for Card.tsx. This is the receiver-facing card only: show heading, description, statusBar, central image, and buttons from the blueprint. Do not add any "approve" or "preview description" step—the card is the final experience. This card is rendered inside a fixed 390×720 viewport; the root element MUST fill that container with no horizontal overflow.

Viewport (required):
- Use a single root wrapper with className (or style) so it fills the container: width 100%, height 100%, min-height 100%, overflow hidden or auto. Do NOT use min-h-screen or 100vw; avoid any horizontal overflow.

Content constraints:
- Central visual: Exactly one central image inside a circular frame (e.g. rounded-full overflow-hidden or a circle wrapper). Use centralImageUrl from the blueprint as the image src; if missing or placeholder, use /placeholder-avatar.svg. No other external image URLs.
- Buttons: Render exactly the buttons from blueprint.buttons (max 4). Button types: text (any number up to 4), music (at most 1), image (at most 1). Use blueprint labels and ids.
- Theme/colors: Use ONLY blueprint colors for background and text: primaryBackground, secondaryBackground, textColor. No hardcoded brand colors; the look is driven by the blueprint.

Style:
- Follow high-end, polished card style; typography and effects from the blueprint; layout is generative within these constraints.
- Tailwind for layout and colors; Framer Motion for entrance animations that feel dreamlike; glassmorphism for modal/overlay styling where appropriate.
- No external CSS imports (no import "./App.css").
- If the card needs to submit or notify, POST to: \`\${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook-proxy\` with JSON body.
- Use React 19, framer-motion, lucide-react. All styling via Tailwind or inline style. Import every icon or component you use (e.g. import { Heart, Sparkles } from "lucide-react"; use <Heart /> only if Heart is imported). Never render a component that is not imported—undefined causes "Element type is invalid" and breaks the preview.
- When the blueprint includes an "effects" object, implement each effect per the hints below (skip when value is "none").
${EFFECTS_HINTS}

Blueprint (JSON):
`;

/**
 * Strip markdown code fences and leading language labels from model output.
 */
function stripCodeFences(code: string): string {
  let out = code.trim();
  const codeBlockRegex = /^```(?:tsx|ts|typescript|javascript|js)?\n?([\s\S]*?)\n?```$/i;
  const match = out.match(codeBlockRegex);
  if (match) {
    out = match[1];
  } else {
    out = out.replace(/^```(?:tsx|ts|typescript|javascript|js)?\n?/i, "").replace(/\n?```$/i, "");
  }
  out = out.trim();
  out = out.replace(/^(?:typescript|tsx|javascript|js|ts)\s+/i, "");
  return out.trim();
}

/**
 * Fix common LLM mistakes: SVG kebab-case, HTML comments, CSS imports, malformed style.
 */
function postProcessCode(code: string): string {
  let out = code;

  out = out.replace(/https:\/\/connorjoejoseph\.app\.n8n\.cloud\/webhook-test\/[^\s"']+/g, "/api/webhook-proxy");
  out = out.replace(/import\s+['"]\.\/App\.css['"];?\n?/g, "");
  out = out.replace(/import\s+['"]\.\/styles\.css['"];?\n?/g, "");
  out = out.replace(/import\s+['"]globals\.css['"];?\n?/g, "");

  out = out.replace(/<!--([\s\S]*?)-->/g, (_, content) => `{/* ${content.replace(/<!--|-->/g, "").trim()} */}`);

  const kebabToCamel = [
    "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-opacity",
    "fill-opacity", "fill-rule", "clip-rule", "font-size", "font-family",
    "text-anchor", "stop-color", "stop-opacity",
  ];
  for (const attr of kebabToCamel) {
    const camel = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    out = out.replace(new RegExp(`\\s${attr}=`, "g"), ` ${camel}=`);
  }

  const reactImport = /import\s+React/i;
  if (!reactImport.test(out)) {
    out = "import React, { useState, useEffect } from 'react';\n" + out;
  }
  if (!/import\s+{[^}]*motion/i.test(out)) {
    out = "import { motion, AnimatePresence } from 'framer-motion';\n" + out;
  }

  // Ensure default export is Card (file is used as Card.tsx)
  out = out.replace(/\bexport\s+default\s+function\s+App\s*\(/g, "export default function Card(");
  out = out.replace(/\bexport\s+default\s+App\s*;/g, "export default Card;");
  const defaultAppMatch = out.match(/\b(function|const)\s+App\s*[=(]/);
  if (defaultAppMatch && !/export\s+default\s+function\s+Card\s*\(/.test(out)) {
    out = out.replace(/\bfunction\s+App\s*\(/g, "function Card(");
    out = out.replace(/\bconst\s+App\s*=/g, "const Card =");
  }

  // Ensure root JSX fills viewport: if the first return's first element is a div without viewport fill, add classes
  const returnMatch = out.match(/(return\s*\(\s*)(<\s*div\s*)([\s\S]*?)(>)/);
  if (returnMatch && !/className=["'][^"']*\b(w-full|h-full|min-h-full)/.test(out.slice(0, 800))) {
    const viewportClasses = "w-full h-full min-h-full overflow-hidden";
    const middle = returnMatch[3];
    let newMiddle = middle;
    if (middle.includes("className=")) {
      newMiddle = middle.replace(/className=["']([^"']*)["']/, (_, cls) => `className="${cls} ${viewportClasses}"`);
    } else {
      newMiddle = `className="${viewportClasses}" ${middle.trim()}`.trim();
    }
    if (newMiddle !== middle) {
      out = out.replace(returnMatch[0], returnMatch[1] + returnMatch[2] + newMiddle + returnMatch[4]);
    }
  }

  return out;
}

/**
 * Produce card UI code from blueprint via LLM. Output is full React Card component (Card.tsx) for Sandpack.
 * centralImageUrl: URL (or data URL) for the central image in the circular frame; when absent or placeholder, use placeholder.
 * errorContext: errors from this session to avoid repeating (e.g. "x is not defined", "Card.tsx line 42").
 */
export async function blueprintToCode(
  blueprint: Blueprint,
  previousCode?: string,
  centralImageUrl?: string,
  errorContext?: string[]
): Promise<BuildArtifact> {
  const imageUrl = centralImageUrl ?? "/placeholder-avatar.svg";
  const payload = {
    ...blueprint,
    centralImageUrl: imageUrl,
  };
  const prompt =
    ENGINEER_PROMPT +
    JSON.stringify(payload, null, 2) +
    "\n\nUse the centralImageUrl from the blueprint above for the central image src. Generate the complete Card.tsx code with export default function Card(). Return ONLY the code.";
  let code = await generate({
    prompt,
    systemInstruction: engineerSystemWithErrorContext(errorContext),
  });
  code = stripCodeFences(code);
  code = postProcessCode(code);
  return {
    code,
    blueprint,
    createdAt: Date.now(),
    previousCode,
  };
}

/**
 * Realignment: when watcher detects too much drift, re-run with old code + blueprint so output stays close to structure.
 */
export async function realignCode(oldCode: string, newCode: string, blueprint: Blueprint): Promise<BuildArtifact> {
  const prompt = `The following React Card component (Card.tsx) was over-modified. Produce a corrected version that keeps the same structure and layout as the "Previous code" but applies the variable values from the "Blueprint". Output ONLY the code, no markdown. Export as: export default function Card() { ... }.

Previous code:
\`\`\`
${oldCode.slice(0, 4000)}
\`\`\`

Blueprint:
${JSON.stringify(blueprint, null, 2)}

Generate the aligned Card.tsx.`;
  let code = await generate({ prompt, systemInstruction: ENGINEER_SYSTEM_BASE });
  code = stripCodeFences(code);
  code = postProcessCode(code);
  return {
    code,
    blueprint,
    createdAt: Date.now(),
    previousCode: oldCode,
  };
}
