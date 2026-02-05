/**
 * Agent 3: Engineer. Generates React card UI code from Architect's blueprint.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM then post-processes for Sandpack.
 */

import { generate } from "@/lib/llm";
import type { Blueprint, BuildArtifact } from "@/lib/types";

const ENGINEER_SYSTEM = `You are an expert React 19 and Tailwind developer. Generate a single, production-ready App.tsx file. Use Tailwind CSS (via CDN) and Framer Motion. Use "fever dream" entrance animations: dreamlike, subtle. Use glassmorphism for overlays and modals where appropriate. Output ONLY raw code: no markdown, no explanations, no code fences. Start with "import" or "export". Use camelCase for JSX/SVG props (e.g. strokeWidth not stroke-width). Use {/* */} for comments, never HTML <!-- -->.`;

const EFFECTS_HINTS = `
Implement blueprint.effects when present (omit effect when value is "none"):
- buttonStyle: gradient = CSS gradient on button bg; outline = border only; glass = backdrop-blur; softGlow = box-shadow glow; bordered = border; minimal = flat; pill = rounded-full; neon = bright border/glow.
- frameBackdrop: glow = soft box-shadow behind central frame; pulse = animate opacity/scale; softGlow = subtle glow; particles = small animated dots; gradientRing = gradient circle behind; shimmer = shimmer animation; halo = soft halo; subtleShadow = shadow.
- entranceEffect: confetti = light confetti on first mount; particles = particle burst; fade = opacity 0→1; scaleIn = scale 0.9→1; subtleDrift = slight drift; blurIn = blur→sharp; stagger = stagger children; floatUp = translateY animate.
- cardContainer: glass = backdrop-blur border; softBorder = rounded border; elevated = shadow; minimal = flat; gradientBorder = gradient border.
- typographyTreatment: subtleShadow = text-shadow; gradientText = gradient on text; letterSpacing = tracking; allCaps = uppercase; serif = font-serif; rounded = font-roundo or rounded.
`;

const ENGINEER_PROMPT = `Generate a single App.tsx for a personalized card experience.

Requirements:
- One central visual (avatar, card, orb, etc.) and 1–4 action buttons from the blueprint.
- The central visual MUST be inside a circular frame (e.g. rounded-full overflow-hidden or a circle wrapper). Use the provided centralImageUrl as the image src for the central visual; if centralImageUrl is not provided or is the placeholder, use the placeholder URL for the image. No external image URLs except the one provided.
- Tailwind for layout and colors; Framer Motion for entrance animations that feel dreamlike; glassmorphism for modal/overlay styling.
- No external CSS imports (no import "./App.css").
- If the app needs to submit or notify, POST to: \`\${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook-proxy\` with JSON body.
- Use React 19, framer-motion, lucide-react. All styling via Tailwind or inline style.
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

  return out;
}

/**
 * Produce card UI code from blueprint via LLM. Output is full React App.tsx string for Sandpack.
 * centralImageUrl: URL (or data URL) for the central image in the circular frame; when absent or placeholder, use placeholder.
 */
export async function blueprintToCode(
  blueprint: Blueprint,
  previousCode?: string,
  centralImageUrl?: string
): Promise<BuildArtifact> {
  const imageUrl = centralImageUrl ?? "/placeholder-avatar.svg";
  const payload = {
    ...blueprint,
    centralImageUrl: imageUrl,
  };
  const prompt =
    ENGINEER_PROMPT +
    JSON.stringify(payload, null, 2) +
    "\n\nUse the centralImageUrl from the blueprint above for the central image src. Generate the complete App.tsx code. Return ONLY the code.";
  let code = await generate({ prompt, systemInstruction: ENGINEER_SYSTEM });
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
  const prompt = `The following React App.tsx was over-modified. Produce a corrected version that keeps the same structure and layout as the "Previous code" but applies the variable values from the "Blueprint". Output ONLY the code, no markdown.

Previous code:
\`\`\`
${oldCode.slice(0, 4000)}
\`\`\`

Blueprint:
${JSON.stringify(blueprint, null, 2)}

Generate the aligned App.tsx.`;
  let code = await generate({ prompt, systemInstruction: ENGINEER_SYSTEM });
  code = stripCodeFences(code);
  code = postProcessCode(code);
  return {
    code,
    blueprint,
    createdAt: Date.now(),
    previousCode: oldCode,
  };
}
