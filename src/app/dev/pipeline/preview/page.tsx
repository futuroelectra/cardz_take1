"use client";

import { useEffect, useState } from "react";
import PreviewWrapper from "@/components/PreviewWrapper";

type Artifact = { code: string; blueprint?: unknown };

export default function DevPipelinePreviewPage() {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.parent) return;
    window.parent.postMessage({ type: "preview-status", status: "loading" }, "*");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchCurrent() {
      if (process.env.NODE_ENV === "development") {
        console.log("[preview-page] fetch /api/dev/pipeline/current ...");
      }
      try {
        const res = await fetch("/api/dev/pipeline/current");
        const data = await res.json();
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") {
          console.log("[preview-page] response ok:", res.ok, "has artifact:", !!data?.artifact?.code);
        }
        if (!res.ok) {
          setError("Could not load current build.");
          setArtifact(null);
          return;
        }
        if (data.artifact && typeof data.artifact.code === "string") {
          if (process.env.NODE_ENV === "development") {
            console.log("[preview-page] artifact received, code length:", data.artifact.code.length);
          }
          setArtifact(data.artifact);
          setError(null);
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("[preview-page] no artifact in response (run pipeline first)");
          }
          setArtifact(null);
          setError(null);
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[preview-page] fetch error:", e);
        }
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

  useEffect(() => {
    if (typeof window === "undefined" || !window.parent) return;
    if (loading) {
      window.parent.postMessage({ type: "preview-status", status: "loading" }, "*");
    } else if (error || !artifact) {
      window.parent.postMessage(
        {
          type: "preview-status",
          status: "error",
          message: error ?? "Run the pipeline first from the dev pipeline page.",
        },
        "*"
      );
    } else {
      window.parent.postMessage({ type: "preview-status", status: "ready" }, "*");
    }
  }, [loading, error, artifact]);

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood">
      <div className="flex shrink-0 flex-col items-center gap-1 py-2 px-2">
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
      <div className="min-h-0 flex-1 flex items-start justify-center">
        <PreviewWrapper code={artifact.code} />
      </div>
    </div>
  );
}
