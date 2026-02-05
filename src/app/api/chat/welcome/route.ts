/**
 * Returns a single LLM-generated welcome message for the Collector chat so the first message is different every time.
 * The prefix "Welcome to Cardzzz ✦ " is prepended here only; the agent has no knowledge of it.
 */

import { NextResponse } from "next/server";
import { getCollectorWelcomeMessage } from "@/lib/agents";

const WELCOME_PREFIX = "Welcome to Cardzzz ✦ ";

export async function GET(): Promise<NextResponse<{ welcome: string } | { error: string }>> {
  try {
    const body = await getCollectorWelcomeMessage();
    return NextResponse.json({ welcome: WELCOME_PREFIX + body });
  } catch (err) {
    console.error("Welcome message error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate welcome" },
      { status: 500 }
    );
  }
}
