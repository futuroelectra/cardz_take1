/**
 * Avatar pipeline: extract style from Collector conversation, then call image service (Nano Banana / Gemini).
 * When no image API is configured, returns the uploaded image URL as-is for the first build.
 */

import { generate } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";

const EXTRACT_STYLE_PROMPT = `From this conversation between the sender and the assistant, extract a 1–2 sentence description of how the sender wants the avatar (or central image) to look or feel. Plain language only, no JSON.

Conversation:
`;

/**
 * Extract style/intent for the avatar from the Collector conversation.
 */
export async function extractStyleFromConversation(messages: ChatMessage[]): Promise<string> {
  const transcript = messages
    .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n\n");
  const style = await generate({
    prompt: EXTRACT_STYLE_PROMPT + transcript + "\n\nWrite only the 1–2 sentence description.",
    systemInstruction: "You extract the sender's desired style for an avatar. Be concise.",
  });
  return style.trim();
}

/**
 * Generate (or passthrough) avatar image: upload image + conversation context → Nano Banana / Gemini → stored image URL.
 * When NANO_BANANA_API_URL is not set, returns the input imageDataUrl as-is so the Engineer can display it in the circular frame.
 */
export async function generateAndStoreAvatar(
  imageDataUrl: string,
  conversationContext: ChatMessage[]
): Promise<string> {
  const apiUrl = process.env.NANO_BANANA_API_URL;
  if (!apiUrl) {
    return imageDataUrl;
  }

  try {
    const styleDescription = await extractStyleFromConversation(conversationContext);
    const systemInstruction = "Create an avatar.";
    const userPrompt = `Create an avatar based on: ${styleDescription}`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction,
        userPrompt,
        imageDataUrl,
      }),
    });
    if (!res.ok) return imageDataUrl;
    const data = (await res.json()) as { imageUrl?: string };
    if (typeof data.imageUrl === "string") return data.imageUrl;
  } catch {
    // fallback to original image
  }
  return imageDataUrl;
}
