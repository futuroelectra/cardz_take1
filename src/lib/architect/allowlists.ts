/**
 * Allowlists for Architect output validation. Must match Architect prompt.
 */

export const ALLOWED_FONTS = [
  "Playfair Display",
  "Inter",
  "Dancing Script",
  "Space Mono",
  "Lora",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Roboto",
  "Crimson Text",
  "Libre Baskerville",
  "Raleway",
  "Nunito",
  "Merriweather",
  "Oswald",
] as const;

export const ALLOWED_EFFECTS = [
  "none",
  "particles-soft",
  "confetti",
  "gradient-mesh",
] as const;

export const ALLOWED_STATUS_BAR = ["pill", "bar", "minimal", "none"] as const;

export const ALLOWED_BUTTON_SHAPE = [
  "pill",
  "rounded",
  "squircle",
  "sharp",
] as const;

export const ALLOWED_BUTTON_OUTPUT_TYPES = ["text", "music", "image"] as const;

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isAllowedFont(s: string): boolean {
  return (ALLOWED_FONTS as readonly string[]).includes(s);
}

export function isAllowedEffect(s: string): boolean {
  return (ALLOWED_EFFECTS as readonly string[]).includes(s);
}

export function isAllowedStatusBar(s: string): boolean {
  return (ALLOWED_STATUS_BAR as readonly string[]).includes(s);
}

export function isAllowedButtonShape(s: string): boolean {
  return (ALLOWED_BUTTON_SHAPE as readonly string[]).includes(s);
}

export function isValidHex(s: string): boolean {
  return HEX_REGEX.test(s);
}
