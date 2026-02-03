import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Run the text button: build user prompt from template ({{INPUT}} -> receiverInput), call LLM with system instruction.
 * Returns the generated text.
 */
export async function runTextButton(
  systemInstruction: string,
  userPromptTemplate: string,
  receiverInput: string
): Promise<{ type: "text"; content: string }> {
  const userPrompt = userPromptTemplate.replace(/\{\{INPUT\}\}/g, receiverInput);

  if (!openai) {
    return {
      type: "text",
      content: "[Text generation not configured: OPENAI_API_KEY missing. In production, this would run: " +
        systemInstruction.slice(0, 50) + "... with topic: " + receiverInput.slice(0, 30) + "]",
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 1024,
  });

  const content =
    completion.choices[0]?.message?.content?.trim() ?? "[No response generated]";
  return { type: "text", content };
}
