/**
 * Run the music button: optional LLM to produce style tags from receiver input + musical DNA,
 * then call Suno (or similar) to generate track; return track URL.
 * Stub: when SUNO_API_KEY or integration not set, return a placeholder URL.
 */
export async function runMusicButton(
  systemInstruction: string,
  userPromptTemplate: string,
  receiverInput: string
): Promise<{ type: "music"; url: string }> {
  const _userPrompt = userPromptTemplate.replace(/\{\{INPUT\}\}/g, receiverInput);
  const _dna = systemInstruction;

  if (!process.env.SUNO_API_KEY) {
    return {
      type: "music",
      url: "https://example.com/placeholder-music.mp3",
    };
  }

  // TODO: Call Suno API with tags derived from systemInstruction + receiverInput.
  // Optional: call LLM to turn (receiverInput + musical DNA) into comma-separated style tags, then Suno.
  return {
    type: "music",
    url: "https://example.com/placeholder-music.mp3",
  };
}
