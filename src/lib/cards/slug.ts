/**
 * Generate a URL-safe slug. Max 50 chars. Uniqueness enforced by DB.
 */
export function generateSlugFromHeader(mainHeader: string): string {
  const base = mainHeader
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : suffix;
}

export function generateSlugFallback(): string {
  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
