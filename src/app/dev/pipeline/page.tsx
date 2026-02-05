"use client";

import { useState } from "react";

type Blueprint = Record<string, unknown>;

export default function DevPipelinePage() {
  const [creativeSummaryInput, setCreativeSummaryInput] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [changeInput, setChangeInput] = useState("");
  const [iterateError, setIterateError] = useState<string | null>(null);
  const [iterateLoading, setIterateLoading] = useState(false);
  const [iterateSuccess, setIterateSuccess] = useState(false);
  const handleSubmitPipeline = async () => {
    const raw = creativeSummaryInput.trim();
    if (!raw) return;
    setPipelineLoading(true);
    setPipelineError(null);
    setBlueprint(null);
    setIterateSuccess(false);
    try {
      let body: { creativeSummary: unknown };
      if (raw.startsWith("{")) {
        try {
          body = { creativeSummary: JSON.parse(raw) as unknown };
        } catch {
          body = { creativeSummary: raw };
        }
      } else {
        body = { creativeSummary: raw };
      }
      const res = await fetch("/api/dev/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setPipelineError(data.error ?? "Pipeline failed");
        return;
      }
      setBlueprint(data.blueprint ?? null);
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleSubmitChanges = async () => {
    const userText = changeInput.trim();
    if (!userText) return;
    setIterateLoading(true);
    setIterateError(null);
    setIterateSuccess(false);
    try {
      const res = await fetch("/api/dev/pipeline/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIterateError(data.error ?? "Iteration failed");
        return;
      }
      setIterateSuccess(true);
      if (data.blueprint) setBlueprint(data.blueprint);
    } catch (e) {
      setIterateError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setIterateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood p-6 font-satoshi text-cardzzz-cream">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="font-roundo text-2xl font-bold lowercase">dev pipeline</h1>

        {/* Section 1 – Input */}
        <section>
          <label className="block text-sm font-medium mb-2">Creative summary (JSON or plain prose)</label>
          <textarea
            value={creativeSummaryInput}
            onChange={(e) => setCreativeSummaryInput(e.target.value)}
            placeholder='e.g. {"prose": "A warm card for Danielle from Alex..."} or paste plain prose'
            rows={6}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-cardzzz-muted focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <button
            type="button"
            onClick={handleSubmitPipeline}
            disabled={pipelineLoading || !creativeSummaryInput.trim()}
            className="mt-2 rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold text-cardzzz-accent lowercase shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pipelineLoading ? "Running…" : "Submit"}
          </button>
          {pipelineError && (
            <p className="mt-2 text-sm text-red-300" role="alert">
              {pipelineError}
            </p>
          )}
        </section>

        {/* Section 2 – Agent 2 output */}
        {blueprint && (
          <section>
            <h2 className="font-roundo text-lg font-bold lowercase mb-2">Agent 2 (Architect) output</h2>
            <pre className="overflow-x-auto rounded-lg border border-white/20 bg-black/20 p-4 text-xs text-cardzzz-cream">
              {JSON.stringify(blueprint, null, 2)}
            </pre>
          </section>
        )}

        {/* Section 3 – View Agent 3 build */}
        {blueprint && (
          <section>
            <h2 className="font-roundo text-lg font-bold lowercase mb-2">View what Agent 3 built</h2>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/dev/pipeline/preview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold text-cardzzz-accent lowercase shadow hover:opacity-90"
              >
                View what Agent 3 built
              </a>
              <a
                href="/api/dev/pipeline/codesandbox-url?redirect=1"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cardzzz-cream/60 bg-transparent px-4 py-2 font-roundo font-bold lowercase text-cardzzz-cream hover:opacity-90"
              >
                open in codesandbox
              </a>
            </div>
            <p className="mt-1 text-sm text-cardzzz-muted">
              Same preview link shows the latest build after you submit changes. CodeSandbox link uses the raw build from the server (redirect); use it if the in-app preview does not load.
            </p>
          </section>
        )}

        {/* Section 4 – Request changes (Agent 4 → Agent 3) */}
        {blueprint && (
          <section>
            <h2 className="font-roundo text-lg font-bold lowercase mb-2">Request changes (Agent 4 → Agent 3)</h2>
            <textarea
              value={changeInput}
              onChange={(e) => setChangeInput(e.target.value)}
              placeholder="e.g. make the heading shorter"
              rows={2}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-cardzzz-muted focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <button
              type="button"
              onClick={handleSubmitChanges}
              disabled={iterateLoading || !changeInput.trim()}
              className="mt-2 rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold text-cardzzz-accent lowercase shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {iterateLoading ? "Applying…" : "Submit changes"}
            </button>
            {iterateSuccess && (
              <p className="mt-2 text-sm text-green-300">Changes applied. Refresh the preview link to see the update.</p>
            )}
            {iterateError && (
              <p className="mt-2 text-sm text-red-300" role="alert">
                {iterateError}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
