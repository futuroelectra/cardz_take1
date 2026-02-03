/**
 * Run the image button: I2I (or text+image) with subject asset + receiver scene description.
 * Returns the generated image URL.
 * Stub: when image API not configured, return a placeholder URL.
 */
export async function runImageButton(
  systemInstruction: string,
  userPromptTemplate: string,
  receiverInput: string,
  subjectAssetUrl?: string | null
): Promise<{ type: "image"; url: string }> {
  const sceneDescription = userPromptTemplate.replace(/\{\{INPUT\}\}/g, receiverInput);
  const _style = systemInstruction;
  const _subjectUrl = subjectAssetUrl;

  if (!process.env.OPENAI_API_KEY) {
    return {
      type: "image",
      url: "https://placehold.co/600x600/1a1a2e/FFFADC?text=Image+placeholder",
    };
  }

  // TODO: Call OpenAI Images API (or Replicate I2I) with subjectAssetUrl + sceneDescription + style.
  // For v1 we can use DALL-E 3 with a text prompt that includes style and scene.
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Scene: ${sceneDescription}. Style: ${systemInstruction.slice(0, 200)}.${subjectAssetUrl ? " Include the subject from the reference." : ""}`;
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  const url = response.data?.[0]?.url ?? "https://placehold.co/600x600/1a1a2e/FFFADC?text=No+image";
  return { type: "image", url };
}
