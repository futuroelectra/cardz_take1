/**
 * Agent 1: Collector. Gathers "just enough" from sender chat; outputs creative summary for Architect.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM for replies and completion check. Identity engine for tone.
 */

import { generate, generateStream, generateJson, type LLMMessage } from "@/lib/llm";
import { getIdentityEngineSummary } from "@/lib/brand/identity";
import { getCollectorIntentionSummary, getCollectorKnowledgeSummary } from "@/lib/brand/intentions";
import type { CreativeSummary, ChatMessage } from "@/lib/types";

const COLLECTOR_SYSTEM = `You are the Digital Confidant. Your goal is to materialize the user's intent into a creative summary. Observe the user's tone and mirror it. No AI apologies; no title case in prose; max one emoji per message from the approved list (e.g. 🔮 ✨ 🪶 🕯️). Use effortless authority: offer a vision, do not ask for permission.

Ask: Who is this for? What's the vibe? What is the center of the world (Avatar vs Object)? Stop once you have enough for a JSON summary. Keep the conversation to 3-4 substantive exchanges. Do not list data points; weave questions into a natural chat.`;

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

const PROSE_SUMMARY_PROMPT = `Based on this conversation between the sender and the assistant, write a short paragraph (2–4 sentences) that describes what the card will be—who it's for, the vibe, and the center of the world. This paragraph will be shown to the sender for approval. Write in plain prose only: no JSON, no bullet points, no technical terms or effect names. Warm and concise.

Conversation:
`;

const TRANSLATE_PROMPT = `Turn this chat transcript into a structured creative summary for a card builder.

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

const WELCOME_PROMPT =
  "Generate the first message the sender will see: a welcome to the Cardzzz platform. Start with a brief one-line intro, then the creative, on-brand welcome that is different every time and invites them into the conversation. On-tone (Digital Confidant). One short message only. No preamble or explanation.";

/**
 * Generate the body of the first welcome message (no prefix). Used by GET /api/chat/welcome; the route prepends the fixed line before returning.
 */
const COLLECTOR_KNOWLEDGE_RULE = `The fundamentals knowledge above is for reference only when the sender asks about Cardzzz or seems confused; never list or volunteer it unprompted.`;

export async function getCollectorWelcomeMessage(): Promise<string> {
  const [identitySummary, collectorIntention, collectorKnowledge] = await Promise.all([
    getIdentityEngineSummary(),
    getCollectorIntentionSummary(),
    getCollectorKnowledgeSummary(),
  ]);
  const systemInstruction = `${identitySummary}\n\n${collectorIntention}\n\n${collectorKnowledge}\n\n${COLLECTOR_KNOWLEDGE_RULE}\n\n${COLLECTOR_SYSTEM}`;
  const text = await generate({
    prompt: WELCOME_PROMPT,
    systemInstruction,
  });
  return text.trim();
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
 * Generate a short prose summary (2–4 sentences) for the approval bubble. No JSON or effect names.
 */
export async function generateProseSummary(messages: ChatMessage[], userText: string, assistantReply: string): Promise<string> {
  const transcript = [
    ...messages.map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`),
    `User: ${userText}`,
    `Assistant: ${assistantReply}`,
  ].join("\n\n");
  const prose = await generate({
    prompt: PROSE_SUMMARY_PROMPT + transcript + "\n\nWrite only the paragraph, nothing else.",
    systemInstruction: "You write short, warm approval summaries. Plain prose only. No JSON, no labels.",
  });
  return prose.trim();
}

/**
 * Translate transcript to CreativeSummary via LLM. Used when completion check passes.
 */
export async function extractCreativeSummary(messages: ChatMessage[]): Promise<CreativeSummary> {
  const transcript = messages
    .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n\n");
  const out = await generateJson<TranslateOutput>({
    prompt: TRANSLATE_PROMPT + transcript + "\n\nReturn ONLY the JSON object.",
    systemInstruction: "You are a data extraction expert. Respond with valid JSON only. Sentence case in string values.",
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

  const [identitySummary, collectorIntention, collectorKnowledge] = await Promise.all([
    getIdentityEngineSummary(),
    getCollectorIntentionSummary(),
    getCollectorKnowledgeSummary(),
  ]);
  const systemInstruction = `${identitySummary}\n\n${collectorIntention}\n\n${collectorKnowledge}\n\n${COLLECTOR_KNOWLEDGE_RULE}\n\n${COLLECTOR_SYSTEM}`;

  const responseText = await generate({
    messages: nextMessages,
    systemInstruction,
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
      systemInstruction: "You are a completion checker. Respond with JSON only.",
      responseFormat: "json",
    });
  } catch {
    // If JSON parse fails, assume not complete
  }

  const showConfirmation = completionCheck.hasEnoughInfo === true;

  let displayText = responseText;
  if (showConfirmation) {
    try {
      displayText = await generateProseSummary(messages, userText, responseText);
    } catch {
      // Fallback to raw reply if prose generation fails
    }
  }

  const aiMessage: ChatMessage = {
    id: `ai-${Date.now()}`,
    text: displayText,
    sender: "ai",
    type: showConfirmation ? "confirmation" : undefined,
    timestamp: new Date().toISOString(),
  };

  return { aiMessage, showConfirmation };
}

/**
 * Stream the Collector's main reply only (no completion check or prose). Used for streaming chat UX.
 * Caller should run completion check and prose after consuming the stream if needed.
 */
export async function* getCollectorReplyStream(
  messages: ChatMessage[],
  userText: string
): AsyncGenerator<string> {
  const trimmed = userText.toLowerCase().trim();
  if (trimmed === "pop") return;

  const llmMessages = chatMessagesToLLM(messages);
  const nextMessages: LLMMessage[] = [...llmMessages, { role: "user", parts: [{ text: userText }] }];

  const [identitySummary, collectorIntention, collectorKnowledge] = await Promise.all([
    getIdentityEngineSummary(),
    getCollectorIntentionSummary(),
    getCollectorKnowledgeSummary(),
  ]);
  const systemInstruction = `${identitySummary}\n\n${collectorIntention}\n\n${collectorKnowledge}\n\n${COLLECTOR_KNOWLEDGE_RULE}\n\n${COLLECTOR_SYSTEM}`;

  yield* generateStream({
    messages: nextMessages,
    systemInstruction,
  });
}

/**
 * Run completion check on a full conversation string. Used by streaming send route.
 */
export async function runCompletionCheck(fullConvoForCheck: string): Promise<boolean> {
  const checkPrompt = `${COMPLETION_CHECK_PROMPT}\n\nConversation:\n${fullConvoForCheck}`;
  let completionCheck: CompletionCheck = { hasEnoughInfo: false, missingPoints: [] };
  try {
    completionCheck = await generateJson<CompletionCheck>({
      prompt: checkPrompt,
      systemInstruction: "You are a completion checker. Respond with JSON only.",
      responseFormat: "json",
    });
  } catch {
    // If JSON parse fails, assume not complete
  }
  return completionCheck.hasEnoughInfo === true;
}
