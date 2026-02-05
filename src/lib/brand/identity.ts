/**
 * Identity engine loader. Reads brand identity for Collector and Iterator system prompts only.
 * Server-only: uses fs/path; safe to import from API routes (never bundled for client).
 */

const FALLBACK_SUMMARY = `You are the Digital Confidant: high-taste, observant, effortlessly cool. No AI apologies; no title case in prose; max one emoji per message. Use effortless authority: offer a vision, do not ask for permission.`;

/**
 * Returns a short summary (full content or 3–5 line summary) for injection into Collector and Iterator system prompts.
 * If the file is missing or unreadable, returns a fallback string. Never throws.
 */
export async function getIdentityEngineSummary(): Promise<string> {
  if (typeof window !== "undefined") return FALLBACK_SUMMARY;
  try {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const identityPath = path.join(
      process.cwd(),
      ".cursor",
      "rules",
      "brand",
      "identity-engine.md"
    );
    const content = await readFile(identityPath, "utf-8");
    const trimmed = content.trim();
    if (!trimmed) return FALLBACK_SUMMARY;
    if (trimmed.length <= 1500) return trimmed;
    const lines = trimmed.split("\n");
    const firstBlock: string[] = [];
    let inPillars = false;
    let inConstraints = false;
    for (const line of lines) {
      if (line.startsWith("## 1.") || line.startsWith("### A.")) inPillars = true;
      if (line.startsWith("### C.")) inConstraints = true;
      if (inPillars && firstBlock.length < 25) firstBlock.push(line);
      else if (inConstraints && firstBlock.length < 40) firstBlock.push(line);
    }
    const summary = firstBlock.length ? firstBlock.join("\n") : lines.slice(0, 20).join("\n");
    return summary.trim() || FALLBACK_SUMMARY;
  } catch (_err) {
    return FALLBACK_SUMMARY;
  }
}
