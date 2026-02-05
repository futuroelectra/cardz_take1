/**
 * Loaders for Collector intention, Iterator intention, and product information.
 * Server-only: uses fs/path; safe to import from API routes (never bundled for client).
 */

const COLLECTOR_FALLBACK = `Begin with a creative welcome to Cardzzz (different every time). Keep the conversation to 3–4 messages. Gather who the card is for, vibe, and center (avatar vs object). When you have enough, present the creative summary for approval; the sender will see an approve button and your task is complete.`;

const ITERATOR_FALLBACK = `You understand the full ceiling of functionality. Litter little bits of advice and easter eggs as the conversation continues; do not dump a wall of text. Help the sender get the absolute most out of the product. When satisfied, prompt them to materialize (export).`;

const PRODUCT_FALLBACK = `Card has heading, description, status bar, central subject (avatar or object), 1–4 buttons (text/music/image; at most one music, one image). You can use one or two buttons to drive home the message; subject can be an object instead of an avatar.`;

const COLLECTOR_KNOWLEDGE_FALLBACK = `Reference only when the sender asks about Cardzzz or seems confused. Never list or volunteer platform details unprompted.`;

const MAX_CHARS = 1500;
const MAX_CHARS_KNOWLEDGE = 4500;
const MAX_LINES_DEFAULT = 35;
const MAX_LINES_KNOWLEDGE = 90;

type ReadBrandFileOptions = { maxChars?: number; maxLines?: number };

async function readBrandFile(
  relativePath: string,
  fallback: string,
  options: ReadBrandFileOptions = {}
): Promise<string> {
  if (typeof window !== "undefined") return fallback;
  const maxChars = options.maxChars ?? MAX_CHARS;
  const maxLines = options.maxLines ?? MAX_LINES_DEFAULT;
  try {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), ".cursor", "rules", "brand", relativePath);
    const content = await readFile(fullPath, "utf-8");
    const trimmed = content.trim();
    if (!trimmed) return fallback;
    if (trimmed.length <= maxChars) return trimmed;
    const lines = trimmed.split("\n");
    const summary = lines.slice(0, maxLines).join("\n").trim();
    return summary || fallback;
  } catch (_err) {
    return fallback;
  }
}

/**
 * Returns Collector intention content for injection into the Collector system prompt.
 */
export async function getCollectorIntentionSummary(): Promise<string> {
  return readBrandFile("collector-intention/intention.md", COLLECTOR_FALLBACK);
}

/**
 * Returns Collector knowledge (Level 1 fundamentals) for reference when sender is confused or asks about Cardzzz.
 */
export async function getCollectorKnowledgeSummary(): Promise<string> {
  return readBrandFile("collector-knowledge/fundamentals.md", COLLECTOR_KNOWLEDGE_FALLBACK, {
    maxChars: MAX_CHARS_KNOWLEDGE,
    maxLines: MAX_LINES_KNOWLEDGE,
  });
}

/**
 * Returns Iterator intention content for injection into the Iterator system prompt.
 */
export async function getIteratorIntentionSummary(): Promise<string> {
  return readBrandFile("iterator-intention/intention.md", ITERATOR_FALLBACK);
}

/**
 * Returns product information (Knowledge Bank B / Creative Palette) for injection into the Iterator system prompt.
 */
export async function getProductInformationSummary(): Promise<string> {
  return readBrandFile("product-information/product.md", PRODUCT_FALLBACK, {
    maxChars: MAX_CHARS_KNOWLEDGE,
    maxLines: MAX_LINES_KNOWLEDGE,
  });
}
