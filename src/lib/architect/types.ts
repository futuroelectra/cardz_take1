/**
 * Technical Blueprint shape (Architect output). Used for validation and API.
 */

export type ButtonOutputType = "text" | "music" | "image";

export type BlueprintButton = {
  label: string;
  description: string;
  outputType: ButtonOutputType;
  modalHeader: string;
  modalDescription: string;
  inputPlaceholder: string;
  submitLabel: string;
  successMessage: string;
  systemInstruction: string;
  userPromptTemplate: string;
};

export type Blueprint = {
  mainHeader: string;
  mainDescription: string;
  statusBarText: string;
  statusBarStyle: "pill" | "bar" | "minimal" | "none";
  buttonShape: "pill" | "rounded" | "squircle" | "sharp";
  fontHeading: string;
  fontBody: string;
  backgroundPrimary: string;
  backgroundSecondary?: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  effect: "none" | "particles-soft" | "confetti" | "gradient-mesh";
  buttons: BlueprintButton[];
  welcomeHeader: string;
  welcomeMessage: string;
  subjectPrompt: string;
  subjectImageUploadId?: string;
};
