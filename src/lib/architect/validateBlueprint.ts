import type { Blueprint, BlueprintButton } from "./types";
import {
  isAllowedFont,
  isAllowedEffect,
  isAllowedStatusBar,
  isAllowedButtonShape,
  isValidHex,
} from "./allowlists";

export type ValidationError = { path: string; message: string };

/**
 * Validate a blueprint. Returns an array of errors; empty if valid.
 */
export function validateBlueprint(value: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (value === null || typeof value !== "object") {
    return [{ path: "", message: "Blueprint must be an object" }];
  }

  const b = value as Record<string, unknown>;

  // Buttons: 1-4, at most one image, one music
  const buttons = b.buttons;
  if (!Array.isArray(buttons)) {
    errors.push({ path: "buttons", message: "buttons must be an array" });
  } else {
    if (buttons.length < 1 || buttons.length > 4) {
      errors.push({
        path: "buttons",
        message: "buttons must have 1 to 4 items",
      });
    }
    let imageCount = 0;
    let musicCount = 0;
    buttons.forEach((btn, i) => {
      const outputType = (btn as BlueprintButton).outputType;
      if (outputType === "image") imageCount++;
      if (outputType === "music") musicCount++;
      if (
        typeof outputType !== "string" ||
        !["text", "music", "image"].includes(outputType)
      ) {
        errors.push({
          path: `buttons[${i}].outputType`,
          message: "must be text, music, or image",
        });
      }
    });
    if (imageCount > 1) {
      errors.push({ path: "buttons", message: "at most one image button" });
    }
    if (musicCount > 1) {
      errors.push({ path: "buttons", message: "at most one music button" });
    }
  }

  // Design tokens
  if (b.fontHeading !== undefined && !isAllowedFont(String(b.fontHeading))) {
    errors.push({ path: "fontHeading", message: "font not in allowlist" });
  }
  if (b.fontBody !== undefined && !isAllowedFont(String(b.fontBody))) {
    errors.push({ path: "fontBody", message: "font not in allowlist" });
  }
  if (b.effect !== undefined && !isAllowedEffect(String(b.effect))) {
    errors.push({ path: "effect", message: "effect not in allowlist" });
  }
  if (
    b.statusBarStyle !== undefined &&
    !isAllowedStatusBar(String(b.statusBarStyle))
  ) {
    errors.push({ path: "statusBarStyle", message: "status bar style not in allowlist" });
  }
  if (
    b.buttonShape !== undefined &&
    !isAllowedButtonShape(String(b.buttonShape))
  ) {
    errors.push({ path: "buttonShape", message: "button shape not in allowlist" });
  }

  // Colors (hex)
  for (const key of [
    "backgroundPrimary",
    "accent",
    "textPrimary",
    "textSecondary",
  ] as const) {
    const v = b[key];
    if (v !== undefined && typeof v === "string" && !isValidHex(v)) {
      errors.push({ path: key, message: "must be a hex color #RRGGBB" });
    }
  }
  if (
    b.backgroundSecondary !== undefined &&
    b.backgroundSecondary !== null &&
    typeof b.backgroundSecondary === "string" &&
    !isValidHex(b.backgroundSecondary)
  ) {
    errors.push({
      path: "backgroundSecondary",
      message: "must be a hex color #RRGGBB",
    });
  }

  return errors;
}

/** Type guard: value is a valid Blueprint (only checks structure, not allowlists). */
export function isBlueprintShape(value: unknown): value is Blueprint {
  if (value === null || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.mainHeader === "string" &&
    Array.isArray(b.buttons) &&
    b.buttons.length >= 1 &&
    b.buttons.length <= 4
  );
}
