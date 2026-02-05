# Collector and Iterator knowledge banks

## Goal

- **Knowledge Bank A** (Collector): One knowledge file containing Level 1 fundamentals. Injected into Collector context with a strict rule: never volunteer as a list; only draw from it when the sender is confused or asks about Cardzzz.
- **Knowledge Bank B** (Iterator): One knowledge file containing Level 2 deep capability. Injected into Iterator context and used as a "Creative Palette": brief, high-authority suggestions littered naturally based on the sender's vibe.

Naming is parallel: **collector-knowledge** and **iterator-knowledge** (no "product-information").

## Current state

- Collector gets context from: identity.ts, getCollectorIntentionSummary(), and COLLECTOR_SYSTEM. No knowledge file today.
- Iterator gets: identity, getIteratorIntentionSummary(), getProductInformationSummary() (reads product-information/product.md), and ITERATOR_SYSTEM_BASE.
- Loaders live in intentions.ts.

## 1. File layout and content

**New: Collector knowledge (Knowledge Bank A)**

- Create folder: `.cursor/rules/brand/collector-knowledge/`
- Create file: `collector-knowledge/fundamentals.md`
- **Structure**: Usage section at the top (reference only when confused or asking about Cardzzz; never volunteer as a list). Then: Core Identity, Experience Loop, The "Why", Direct Response Snippets (as provided).

**Iterator knowledge (Knowledge Bank B) – rename and replace**

- **Rename** existing folder: `product-information/` → **`iterator-knowledge/`**
- **Rename** file: `product.md` → **`creative-palette.md`** (or keep `fundamentals.md` for symmetry; recommend `creative-palette.md` to reflect "Creative Palette" usage)
- **Replace** contents with Knowledge Bank B. Structure: Usage section at the top (Creative Palette; suggest specific improvements; brief, high-authority, littered naturally). Then: UI Blueprint, Interaction Logic, Aesthetic Manipulation, Proactive Suggestion Scripts, Technical Constraints.

Resulting layout:

```
.cursor/rules/brand/
  collector-intention/
  collector-knowledge/     ← NEW (Knowledge Bank A)
    fundamentals.md
  iterator-intention/
  iterator-knowledge/     ← RENAMED from product-information (Knowledge Bank B)
    creative-palette.md   ← content = Knowledge Bank B (file renamed from product.md)
  product-information/    ← REMOVE after migration
  identity-engine.md
```

## 2. Loaders (intentions.ts)

- Add **getCollectorKnowledgeSummary()**: reads `collector-knowledge/fundamentals.md`, fallback for Collector knowledge.
- **Rename** and **repoint**: Change getProductInformationSummary() to **getIteratorKnowledgeSummary()** (or keep the export name getProductInformationSummary for minimal call-site changes—either way the implementation reads from `iterator-knowledge/creative-palette.md`). Recommendation: rename to **getIteratorKnowledgeSummary()** for clarity and update the single call site in iterator.ts.
- Add optional larger maxChars/maxLines for these two knowledge files so content is not over-truncated.

## 3. Wiring into agents

- **Collector**: Load getCollectorKnowledgeSummary(); system = identity + collector intention + collector knowledge + COLLECTOR_SYSTEM; add one-line rule about not volunteering knowledge.
- **Iterator**: Load getIteratorKnowledgeSummary() from `iterator-knowledge/creative-palette.md` (no more product-information); system = identity + iterator intention + iterator knowledge + base. Optionally one line in system prompt about using as Creative Palette.

## 4. Implementation order

1. Add optional larger limit in readBrandFile for knowledge files (collector-knowledge, iterator-knowledge).
2. Create collector-knowledge/fundamentals.md with Usage + Knowledge Bank A.
3. Create iterator-knowledge/ folder; add creative-palette.md with Usage + Knowledge Bank B. Remove or repoint old product-information (delete product-information folder after iterator-knowledge is in use).
4. In intentions.ts: add getCollectorKnowledgeSummary(); rename getProductInformationSummary → getIteratorKnowledgeSummary and change path to iterator-knowledge/creative-palette.md.
5. In collector.ts: call getCollectorKnowledgeSummary(), inject into system instruction, add one-line rule.
6. In iterator.ts: call getIteratorKnowledgeSummary() instead of getProductInformationSummary(); ensure system prompt order uses iterator knowledge.

## 5. Summary

| Audience  | Folder               | File               | Loader                        |
|-----------|----------------------|--------------------|-------------------------------|
| Collector | collector-knowledge  | fundamentals.md    | getCollectorKnowledgeSummary() |
| Iterator  | iterator-knowledge   | creative-palette.md| getIteratorKnowledgeSummary() |

Same pattern for both: **{agent}-knowledge** + one file. No "product-information" in the tree.
