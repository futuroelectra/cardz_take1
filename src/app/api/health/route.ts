import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import {
  getCollectorPrompt,
  getArchitectPrompt,
  getAdjusterPrompt,
} from "@/lib/prompts/load";

/**
 * Phase 1 test gate: confirms prompt loader returns strings and DB connects when DATABASE_URL is set.
 */
export async function GET() {
  const result: { prompts: boolean; db?: string; error?: string } = {
    prompts: false,
  };

  try {
    const collector = getCollectorPrompt();
    const architect = getArchitectPrompt();
    const adjuster = getAdjusterPrompt();
    if (
      typeof collector.system === "string" &&
      typeof architect.system === "string" &&
      typeof adjuster.system === "string"
    ) {
      result.prompts = true;
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : "prompts failed";
    return NextResponse.json(result, { status: 500 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ...result,
      db: "skipped (DATABASE_URL not set)",
    });
  }

  try {
    const sql = getSql();
    await sql`SELECT 1`;
    result.db = "ok";
  } catch (e) {
    result.db = "error";
    result.error = e instanceof Error ? e.message : "db connect failed";
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
