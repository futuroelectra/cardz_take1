/**
 * Generate the card subject image from blueprint.subjectPrompt (text-to-image).
 * Optional: in future support I2I with uploaded asset URL.
 * Returns the image URL (e.g. from DALL-E); caller stores in card_assets.
 */
import OpenAI from "openai";
import type { Blueprint } from "@/lib/architect/types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function runSubjectImage(
  blueprint: Blueprint,
  _uploadedImageUrl?: string | null
): Promise<string> {
  const prompt = blueprint.subjectPrompt?.trim() || "A beautiful abstract card subject";
  if (!openai) {
    return "https://placehold.co/600x600/1a1a2e/FFFADC?text=Subject+placeholder";
  }
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  const url = response.data?.[0]?.url ?? "https://placehold.co/600x600/1a1a2e/FFFADC?text=No+image";
  return url;
}
