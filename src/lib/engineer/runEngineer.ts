import { getSql } from "@/lib/db";
import { validateBlueprint } from "@/lib/architect/validateBlueprint";
import { generateSlugFromHeader, generateSlugFallback } from "@/lib/cards/slug";
import { runSubjectImage } from "./runSubjectImage";
import type { Blueprint } from "@/lib/architect/types";

export type RunEngineerResult = { cardId: string; slug: string };

/**
 * Engineer: from Technical Blueprint create card row, generate slug, trigger subject image,
 * store asset, save blueprint to card. Returns card id and slug.
 */
export async function runEngineer(
  blueprint: Blueprint,
  ownerId: string,
  uploadedSubjectUrl?: string | null
): Promise<RunEngineerResult> {
  const errors = validateBlueprint(blueprint);
  if (errors.length > 0) {
    const msg = errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    throw new Error("Blueprint validation failed: " + msg);
  }

  const sql = getSql();

  let subjectAssetId: string | null = null;
  const hasSubjectPrompt = typeof blueprint.subjectPrompt === "string" && blueprint.subjectPrompt.trim().length > 0;
  if (hasSubjectPrompt) {
    const subjectUrl = await runSubjectImage(blueprint, uploadedSubjectUrl);
    const assetRows = await sql`
      INSERT INTO card_assets (url)
      VALUES (${subjectUrl})
      RETURNING id
    `;
    subjectAssetId = assetRows[0]?.id ?? null;
  }

  const slug =
    blueprint.mainHeader?.trim().length > 0
      ? generateSlugFromHeader(blueprint.mainHeader)
      : generateSlugFallback();

  const maxSlugAttempts = 5;
  for (let attempt = 0; attempt < maxSlugAttempts; attempt++) {
    const candidateSlug = attempt === 0 ? slug : `${slug}-${attempt}`;
    try {
      const rows = await sql`
        INSERT INTO cards (slug, owner_id, blueprint, subject_asset_id)
        VALUES (${candidateSlug}, ${ownerId}, ${JSON.stringify(blueprint)}::jsonb, ${subjectAssetId})
        RETURNING id, slug
      `;
      const row = rows[0];
      if (!row) throw new Error("Insert failed");
      return { cardId: row.id, slug: row.slug };
    } catch (e: unknown) {
      const isUniqueViolation =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: string }).code === "23505";
      if (isUniqueViolation && attempt < maxSlugAttempts - 1) continue;
      throw e;
    }
  }

  throw new Error("Could not generate unique slug");
}
