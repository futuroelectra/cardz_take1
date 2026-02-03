import type { Blueprint, BlueprintButton } from "@/lib/architect/types";
import type { AdjusterIntent } from "./adjusterIntent";

export type CardSnapshot = {
  id: string;
  blueprint: Blueprint;
  activation_timestamp_utc: string | null;
  is_interactive: boolean;
  deployed_at: string | null;
};

export type PatchPayload = {
  blueprint?: Blueprint;
  activation_timestamp_utc?: string | null;
  is_interactive?: boolean;
  deployed_at?: string | null;
};

/**
 * Build PATCH payload from current card and Adjuster intent. Caller applies via PATCH /api/cards/[id].
 */
export function applyAdjusterIntent(
  card: CardSnapshot,
  intent: AdjusterIntent
): PatchPayload {
  const blueprint = { ...card.blueprint };
  const buttons = [...(blueprint.buttons ?? [])];

  switch (intent.action) {
    case "update_prompts": {
      const { buttonIndex, systemInstruction, userPromptTemplate } = intent.payload;
      if (buttonIndex < 0 || buttonIndex >= buttons.length) return {};
      const btn = { ...buttons[buttonIndex] } as BlueprintButton;
      if (systemInstruction !== undefined) btn.systemInstruction = systemInstruction;
      if (userPromptTemplate !== undefined) btn.userPromptTemplate = userPromptTemplate;
      buttons[buttonIndex] = btn;
      return { blueprint: { ...blueprint, buttons } };
    }
    case "update_copy": {
      const p = intent.payload as Record<string, unknown>;
      const allowed = [
        "mainHeader",
        "mainDescription",
        "statusBarText",
        "welcomeHeader",
        "welcomeMessage",
      ];
      for (const key of allowed) {
        if (p[key] !== undefined && typeof p[key] === "string") {
          (blueprint as Record<string, unknown>)[key] = p[key];
        }
      }
      if (Array.isArray(p.buttons)) {
        for (let i = 0; i < p.buttons.length && i < buttons.length; i++) {
          const b = p.buttons[i] as Record<string, unknown>;
          const existing = buttons[i] as Record<string, unknown>;
          for (const k of ["label", "modalHeader", "modalDescription", "inputPlaceholder", "submitLabel", "successMessage"]) {
            if (b[k] !== undefined && typeof b[k] === "string") existing[k] = b[k];
          }
        }
        (blueprint as Record<string, unknown>).buttons = buttons;
      }
      return { blueprint };
    }
    case "set_activation": {
      return {
        activation_timestamp_utc: intent.payload.activationTimestamp,
      };
    }
    case "deploy": {
      const now = new Date();
      return {
        deployed_at: now.toISOString(),
        is_interactive: true,
      };
    }
    default:
      return {};
  }
}
