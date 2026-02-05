"use client";

import { useEffect, useState } from "react";
import PreviewWrapper from "@/components/PreviewWrapper";

type Artifact = { code: string; blueprint?: unknown };

export default function DevPipelinePreviewPage() {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCurrent() {
      try {
        const res = await fetch("/api/dev/pipeline/current");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError("Could not load current build.");
          setArtifact(null);
          return;
        }
        if (data.artifact && typeof data.artifact.code === "string") {
          setArtifact(data.artifact);
          setError(null);
        } else {
          setArtifact(null);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load current build.");
          setArtifact(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCurrent();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood font-satoshi text-cardzzz-cream">
        <p className="text-sm">Loading preview…</p>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood font-satoshi text-cardzzz-cream">
        <div className="text-center">
          <p className="text-sm">
            {error ?? "Run the pipeline first from the dev pipeline page."}
          </p>
          <a
            href="/dev/pipeline"
            className="mt-3 inline-block text-sm underline hover:opacity-90"
          >
            Go to dev pipeline
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood p-4">
      <div className="flex flex-col items-center gap-2">
        <a
          href="/api/dev/pipeline/codesandbox-url?redirect=1"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold lowercase text-cardzzz-accent shadow hover:opacity-90"
        >
          open in codesandbox
        </a>
        <p className="text-xs text-cardzzz-muted">
          Opens the current build in a new tab (server redirect; no code sent from this page).
        </p>
      </div>
      <PreviewWrapper code={artifact.code} />
    </div>
  );
}
