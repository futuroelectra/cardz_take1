import { NextResponse } from "next/server";
import { runArchitect } from "@/lib/architect/runArchitect";

/** Sample Creative Summaries for testing Architect (Phase 7 test gate). */
const SAMPLES: unknown[] = [
  {
    occasion: "Birthday",
    receiverPersonality: "Fun, loves memes and music",
    emotionalVibe: "chaotic",
    subjectIdea: "A sarcastic robot version of the sender",
    subjectType: "avatar",
    subjectSource: "text",
    interactionIdeas: ["poem", "song from mood"],
    welcomeMessage: "Hey! Open me when you're ready for chaos.",
  },
  {
    occasion: "Anniversary",
    receiverPersonality: "Romantic, thoughtful",
    emotionalVibe: "romantic",
    subjectIdea: "A glowing crystal that tells fortunes",
    subjectType: "inanimate",
    subjectSource: null,
    interactionIdeas: ["fortune", "short melody"],
    welcomeMessage: "For you, with love.",
  },
];

/**
 * GET /api/test/architect — run Architect on sample Creative Summaries.
 * Returns { results: { index, blueprint?, error? }[] }
 */
export async function GET() {
  const results: { index: number; blueprint?: unknown; error?: string }[] = [];

  for (let i = 0; i < SAMPLES.length; i++) {
    try {
      const blueprint = await runArchitect(SAMPLES[i]);
      results.push({ index: i, blueprint });
    } catch (e) {
      results.push({
        index: i,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ results });
}
