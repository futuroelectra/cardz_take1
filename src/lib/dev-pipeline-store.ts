/**
 * Dev-only in-memory store for the pipeline testing page.
 * Holds the current blueprint and artifact so the preview link always shows the latest build.
 * No persistence; empty after server restart.
 */

import type { Blueprint, BuildArtifact } from "@/lib/types";

let currentBlueprint: Blueprint | null = null;
let currentArtifact: BuildArtifact | null = null;

export function setCurrent(blueprint: Blueprint, artifact: BuildArtifact): void {
  currentBlueprint = blueprint;
  currentArtifact = artifact;
}

export function getCurrent(): { blueprint: Blueprint; artifact: BuildArtifact } | null {
  if (!currentBlueprint || !currentArtifact) return null;
  return { blueprint: currentBlueprint, artifact: currentArtifact };
}
