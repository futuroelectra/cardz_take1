/**
 * Agent 1: Collector. Gathers "just enough" from sender chat; outputs creative summary for Architect.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM for replies and completion check.
 */

import { generate, generateJson, type LLMMessage } from "@/lib/llm";
import type { CreativeSummary, ChatMessage } from "@/lib/types";

const COLLECTOR_SYSTEM = `You are a creative assistant helping someone design a personalized card experience for a recipient. Keep the conversation short and natural: 1–2 substantive exchanges. Ask who the card is for, what vibe or tone they want, and what the center of the experience is (e.g. an avatar, a card, an orb). Confirm briefly that they're creating something the recipient will control. Do not list data points; weave questions into a friendly chat.`;

const DATA_POINTS = [
  "recipient name",
  "sender name",
  "sender vibe or tone",
  "central subject (avatar, card, orb, etc.)",
  "product confirmation (receiver controls experience)",
];

const COMPLETION_CHECK_PROMPT = `Based on the conversation, do we have enough to create a first draft of the card?

We need: ${DATA_POINTS.join(", ")}.

Respond with JSON only:
{
  "hasEnoughInfo": true or false,
  "missingPoints": ["list any missing data points"]
}`;

const TRANSLATE_PROMPT = `You are a data extraction assistant. Turn this chat transcript into a structured creative summary for a card builder.

Output ONLY valid JSON with exactly these keys (no extra keys):
{
  "recipientName": "string",
  "senderName": "string",
  "senderVibe": "string",
  "centralSubject": "string (e.g. avatar, card, orb)",
  "centralSubjectStyle": "string or omit",
  "tone": "string",
  "productConfirmed": true,
  "notes": "string or omit"
}

Transcript:
`;

function chatMessagesToLLM(messages: ChatMessage[]): LLMMessage[] {
  return messages.map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
}

/**
 * Returns true when we have enough exchanges to produce a first draft (e.g. 1–2 substantive).
 */
export function hasEnoughForCreativeSummary(messages: ChatMessage[]): boolean {
  const userMessages = messages.filter((m) => m.sender === "user");
  return userMessages.length >= 1;
}

type TranslateOutput = {
  recipientName: string;
  senderName: string;
  senderVibe: string;
  centralSubject: string;
  centralSubjectStyle?: string;
  tone: string;
  productConfirmed: boolean;
  notes?: string;
};

/**
 * Translate transcript to CreativeSummary via LLM. Used when completion check passes.
 */
export async function extractCreativeSummary(messages: ChatMessage[]): Promise<CreativeSummary> {
  const transcript = messages
    .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n\n");
  const out = await generateJson<TranslateOutput>({
    prompt: TRANSLATE_PROMPT + transcript + "\n\nReturn ONLY the JSON object.",
    systemInstruction: "You are a data extraction expert. Respond with valid JSON only.",
    responseFormat: "json",
  });
  return {
    recipientName: out.recipientName ?? "your loved one",
    senderName: out.senderName ?? "you",
    senderVibe: out.senderVibe ?? "personal and warm",
    centralSubject: out.centralSubject ?? "avatar",
    centralSubjectStyle: out.centralSubjectStyle,
    tone: out.tone ?? "warm",
    productConfirmed: out.productConfirmed ?? true,
    notes: out.notes,
  };
}

type CompletionCheck = { hasEnoughInfo?: boolean; missingPoints?: string[] };

/**
 * Generate next AI reply in collector phase using LLM. Runs completion check; when enough info, returns showConfirmation true.
 */
export async function getCollectorReply(
  messages: ChatMessage[],
  userText: string
): Promise<{ aiMessage: ChatMessage; showConfirmation: boolean }> {
  const trimmed = userText.toLowerCase().trim();
  if (trimmed === "pop") {
    return {
      aiMessage: {
        id: `ai-${Date.now()}`,
        text: "",
        sender: "ai",
        timestamp: new Date().toISOString(),
      },
      showConfirmation: false,
    };
  }

  const llmMessages = chatMessagesToLLM(messages);
  const nextMessages: LLMMessage[] = [...llmMessages, { role: "user", parts: [{ text: userText }] }];

  const responseText = await generate({
    messages: nextMessages,
    systemInstruction: COLLECTOR_SYSTEM,
  });

  const fullConvoForCheck = [
    ...messages.map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`),
    `User: ${userText}`,
    `Assistant: ${responseText}`,
  ].join("\n");

  const checkPrompt = `${COMPLETION_CHECK_PROMPT}\n\nConversation:\n${fullConvoForCheck}`;
  let completionCheck: CompletionCheck = { hasEnoughInfo: false, missingPoints: [] };
  try {
    completionCheck = await generateJson<CompletionCheck>({
      prompt: checkPrompt,
      responseFormat: "json",
    });
  } catch {
    // If JSON parse fails, assume not complete
  }

  const showConfirmation = completionCheck.hasEnoughInfo === true;

  const aiMessage: ChatMessage = {
    id: `ai-${Date.now()}`,
    text: responseText,
    sender: "ai",
    type: showConfirmation ? "confirmation" : undefined,
    timestamp: new Date().toISOString(),
  };

  return { aiMessage, showConfirmation };
}
