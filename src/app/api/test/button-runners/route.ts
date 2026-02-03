import { NextResponse } from "next/server";
import {
  runTextButton,
  runMusicButton,
  runImageButton,
} from "@/lib/actions";

/**
 * GET /api/test/button-runners — call each runner with mock inputs. For Phase 4 test gate.
 * Returns { text, music, image } with the shape each runner returns.
 */
export async function GET() {
  const mockSystem = "You are a sarcastic robot. Reply in one short sentence.";
  const mockTemplate = "TASK: Write a haiku. TOPIC: {{INPUT}}. Stay in character.";
  const mockInput = "cats";

  const [textResult, musicResult, imageResult] = await Promise.all([
    runTextButton(mockSystem, mockTemplate, mockInput),
    runMusicButton(mockSystem, mockTemplate, mockInput),
    runImageButton(mockSystem, mockTemplate, mockInput, null),
  ]);

  return NextResponse.json({
    text: textResult,
    music: musicResult,
    image: imageResult,
  });
}
