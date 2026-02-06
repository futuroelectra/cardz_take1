"use client";

import { useState, useEffect, useRef } from "react";

type Blueprint = Record<string, unknown>;

type E2ELogEntry =
  | { step: "session"; sessionId: string }
  | { step: "welcome"; welcome: string }
  | { step: "user"; text: string }
  | { step: "ai"; messages: { id: string; text: string; sender: string; type?: string }[] }
  | { step: "approve"; ok: boolean; buildId?: string; creativeSummary?: Record<string, unknown>; collectorTranscript?: string }
  | { step: "error"; error: string };

type E2EResult = {
  log: E2ELogEntry[];
  creativeSummary?: Record<string, unknown> | null;
  buildId?: string | null;
  collectorTranscript?: string | null;
  error?: string;
};

const PIPELINE_STATE_KEY = "cardzzz-dev-pipeline-state";

type PersistedPipelineState = {
  creativeSummaryInput: string;
  blueprint: Blueprint | null;
  pipelineError: string | null;
  changeInput: string;
  iterateError: string | null;
  iterateSuccess: boolean;
  e2eResult: E2EResult | null;
  e2eError: string | null;
  e2eView: "workflow" | "visual";
  errorContext: string[];
};

function loadPipelineState(): PersistedPipelineState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PIPELINE_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    const er = o.e2eResult as Record<string, unknown> | null | undefined;
    const log = Array.isArray(er?.log) ? (er.log as E2ELogEntry[]) : [];
    return {
      creativeSummaryInput: typeof o.creativeSummaryInput === "string" ? o.creativeSummaryInput : "",
      blueprint: o.blueprint && typeof o.blueprint === "object" ? (o.blueprint as Blueprint) : null,
      pipelineError: typeof o.pipelineError === "string" ? o.pipelineError : null,
      changeInput: typeof o.changeInput === "string" ? o.changeInput : "",
      iterateError: typeof o.iterateError === "string" ? o.iterateError : null,
      iterateSuccess: !!o.iterateSuccess,
      e2eResult:
        log.length > 0
          ? {
              log,
              creativeSummary: er && "creativeSummary" in er ? (er.creativeSummary as E2EResult["creativeSummary"]) ?? null : null,
              buildId: er && "buildId" in er ? (er.buildId as E2EResult["buildId"]) ?? null : null,
              collectorTranscript: er && "collectorTranscript" in er ? (er.collectorTranscript as E2EResult["collectorTranscript"]) ?? null : null,
            }
          : null,
      e2eError: typeof o.e2eError === "string" ? o.e2eError : null,
      e2eView: o.e2eView === "visual" ? "visual" : "workflow",
      errorContext: Array.isArray(o.errorContext) ? (o.errorContext as string[]) : [],
    };
  } catch {
    return null;
  }
}

function savePipelineState(state: PersistedPipelineState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PIPELINE_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota or other errors
  }
}

export default function DevPipelinePage() {
  const [creativeSummaryInput, setCreativeSummaryInput] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [changeInput, setChangeInput] = useState("");
  const [iterateError, setIterateError] = useState<string | null>(null);
  const [iterateLoading, setIterateLoading] = useState(false);
  const [iterateSuccess, setIterateSuccess] = useState(false);
  const [transcriptAppendInput, setTranscriptAppendInput] = useState("");
  const [transcriptSubmitLoading, setTranscriptSubmitLoading] = useState(false);
  const [summaryEditRequest, setSummaryEditRequest] = useState("");
  const [summaryEditLoading, setSummaryEditLoading] = useState(false);
  const [e2eResult, setE2eResult] = useState<E2EResult | null>(null);
  const [e2eLoading, setE2eLoading] = useState(false);
  const [e2eError, setE2eError] = useState<string | null>(null);
  const [e2eView, setE2eView] = useState<"workflow" | "visual">("workflow");
  const [errorContext, setErrorContext] = useState<string[]>([]);
  /** "e2e" = Collector → Approve, "build" = Architect → Engineer. */
  const [buildPhase, setBuildPhase] = useState<"e2e" | "build" | null>(null);
  /** Live status during E2E run (stage / what's happening). */
  const [e2eStatus, setE2eStatus] = useState<string | null>(null);
  /** Status from the preview iframe (postMessage). */
  const [previewFrameStatus, setPreviewFrameStatus] = useState<
    { status: "loading" | "ready" | "error"; message?: string } | null
  >(null);
  const saveSkippedOnce = useRef(false);
  /** Scroll run log into view as new entries stream in. */
  const runLogEndRef = useRef<HTMLDivElement | null>(null);
  /** Incremented on clean slate so the preview iframe remounts and refetches (no cached visual). */
  const [previewIframeKey, setPreviewIframeKey] = useState(0);

  // Restore state from localStorage on mount so refresh keeps run state.
  useEffect(() => {
    const saved = loadPipelineState();
    if (!saved) return;
    setCreativeSummaryInput(saved.creativeSummaryInput);
    setBlueprint(saved.blueprint);
    setPipelineError(saved.pipelineError);
    setChangeInput(saved.changeInput);
    setIterateError(saved.iterateError);
    setIterateSuccess(saved.iterateSuccess);
    setE2eResult(saved.e2eResult);
    setE2eError(saved.e2eError);
    setE2eView(saved.e2eView);
    setErrorContext(saved.errorContext);
  }, []);

  // Persist state to localStorage when it changes (skip first run to avoid overwriting before hydrate).
  useEffect(() => {
    if (!saveSkippedOnce.current) {
      saveSkippedOnce.current = true;
      return;
    }
    savePipelineState({
      creativeSummaryInput,
      blueprint,
      pipelineError,
      changeInput,
      iterateError,
      iterateSuccess,
      e2eResult,
      e2eError,
      e2eView,
      errorContext,
    });
  }, [
    creativeSummaryInput,
    blueprint,
    pipelineError,
    changeInput,
    iterateError,
    iterateSuccess,
    e2eResult,
    e2eError,
    e2eView,
    errorContext,
  ]);

  /** When the run log grows (streaming), scroll so the latest entry is in view. */
  useEffect(() => {
    if (e2eResult?.log.length && e2eView === "workflow") {
      runLogEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [e2eResult?.log.length, e2eView]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "preview-error" && typeof e.data.message === "string") {
        setErrorContext((prev) =>
          prev.includes(e.data.message) ? prev : [...prev, e.data.message]
        );
      }
      if (e.data?.type === "preview-status" && e.data.status) {
        setPreviewFrameStatus({
          status: e.data.status as "loading" | "ready" | "error",
          message: typeof e.data.message === "string" ? e.data.message : undefined,
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleAppendTranscript = async () => {
    const text = transcriptAppendInput.trim();
    const transcript = e2eResult?.collectorTranscript;
    if (!text || !transcript) return;
    setTranscriptSubmitLoading(true);
    setPipelineError(null);
    try {
      const res = await fetch("/api/dev/pipeline/from-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript + "\n\nUser: " + text,
          errorContext: errorContext.length > 0 ? errorContext : undefined,
        }),
      });
      const data = (await res.json()) as { blueprint?: Blueprint; error?: string };
      if (!res.ok) {
        setPipelineError(data.error ?? "From-transcript failed");
        return;
      }
      setBlueprint(data.blueprint ?? null);
      setTranscriptAppendInput("");
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setTranscriptSubmitLoading(false);
    }
  };

  const handleUpdateSummaryWithAI = async () => {
    const request = summaryEditRequest.trim();
    if (!request) return;
    let current: Record<string, unknown>;
    try {
      current = JSON.parse(creativeSummaryInput.trim() || "{}") as Record<string, unknown>;
    } catch {
      setPipelineError("Creative summary is not valid JSON");
      return;
    }
    setSummaryEditLoading(true);
    setPipelineError(null);
    try {
      const res = await fetch("/api/dev/pipeline/update-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creativeSummary: current, request }),
      });
      const data = (await res.json()) as { creativeSummary?: Record<string, unknown>; error?: string };
      if (!res.ok) {
        setPipelineError(data.error ?? "Update failed");
        return;
      }
      if (data.creativeSummary) {
        setCreativeSummaryInput(JSON.stringify(data.creativeSummary, null, 2));
        setE2eResult((prev) => (prev ? { ...prev, creativeSummary: data.creativeSummary ?? null } : null));
      }
      setSummaryEditRequest("");
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSummaryEditLoading(false);
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

  /** Derive short status label from the latest log entry for the status strip. */
  function statusFromEntry(entry: E2ELogEntry, logSoFar: E2ELogEntry[]): string {
    switch (entry.step) {
      case "session":
        return "session created";
      case "welcome":
        return "welcome message";
      case "user":
        const userCount = logSoFar.filter((e) => e.step === "user").length;
        return `chat round ${userCount} (user)`;
      case "ai":
        const aiCount = logSoFar.filter((e) => e.step === "ai").length;
        return `chat round ${aiCount} (AI)`;
      case "approve":
        return "approved, starting build…";
      case "error":
        return `error: ${entry.error}`;
      default:
        return "";
    }
  }

  const handleRunE2E = async () => {
    setE2eLoading(true);
    setE2eResult({ log: [] });
    setE2eError(null);
    setBuildPhase("e2e");
    setE2eView("workflow");
    setE2eStatus("creating session…");
    try {
      const res = await fetch("/api/dev/pipeline/e2e-collector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setE2eError(data.error ?? "E2E run failed");
        setE2eStatus(null);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: E2EResult = { log: [] };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed) as { log?: E2ELogEntry; done?: boolean; creativeSummary?: Record<string, unknown>; buildId?: string; collectorTranscript?: string; error?: string };
            if (data.log != null) {
              result = { ...result, log: [...result.log, data.log] };
              setE2eResult((prev) => ({ ...prev, log: [...(prev?.log ?? []), data.log!] }));
              setE2eStatus(statusFromEntry(data.log, result.log));
            }
            if (data.done) {
              result = {
                ...result,
                creativeSummary: data.creativeSummary ?? null,
                buildId: data.buildId ?? null,
                collectorTranscript: data.collectorTranscript ?? null,
              };
              setE2eResult((prev) => ({
                ...(prev ?? { log: [] }),
                log: prev?.log ?? [],
                creativeSummary: result.creativeSummary ?? null,
                buildId: result.buildId ?? null,
                collectorTranscript: result.collectorTranscript ?? null,
              }));
              setCreativeSummaryInput(result.creativeSummary ? JSON.stringify(result.creativeSummary, null, 2) : "");
              if (data.error) {
                setE2eError(data.error);
                setE2eStatus(null);
              } else if (data.buildId) {
                setE2eStatus("building (Architect → Engineer)…");
                setBuildPhase("build");
                const runRes = await fetch("/api/dev/pipeline/run-build", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    buildId: data.buildId,
                    errorContext: errorContext.length > 0 ? errorContext : undefined,
                  }),
                });
                const runData = (await runRes.json()) as {
                  error?: string;
                  blueprint?: Record<string, unknown>;
                };
                if (!runRes.ok) {
                  const errMsg = runData?.error ?? "Run build failed";
                  setE2eError(errMsg);
                  setErrorContext((prev) => (prev.includes(errMsg) ? prev : [...prev, errMsg]));
                } else if (runData?.blueprint) {
                  setBlueprint(runData.blueprint);
                  if (typeof window !== "undefined") {
                    window.open("/dev/pipeline/preview", "_blank", "noopener");
                  }
                }
                setE2eStatus(null);
              } else {
                setE2eStatus(null);
              }
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (e) {
      setE2eError(e instanceof Error ? e.message : "Request failed");
      setE2eStatus(null);
    } finally {
      setE2eLoading(false);
      setBuildPhase(null);
      setE2eStatus(null);
    }
  };

  /** Nuke every form of state: server, localStorage, all React state, and force preview iframe to remount. */
  const handleFlushCache = async () => {
    try {
      await fetch("/api/dev/pipeline/clear", { method: "POST" });
    } catch {
      // ignore; we still clear client state
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(PIPELINE_STATE_KEY);
        // Clear any other dev/pipeline-related keys so nothing is left
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith("cardzzz-dev") || key.includes("pipeline") || key.includes("preview"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
    setCreativeSummaryInput("");
    setBlueprint(null);
    setPipelineError(null);
    setChangeInput("");
    setIterateError(null);
    setIterateSuccess(false);
    setIterateLoading(false);
    setE2eResult(null);
    setE2eError(null);
    setE2eView("workflow");
    setErrorContext([]);
    setBuildPhase(null);
    setE2eStatus(null);
    setPreviewFrameStatus(null);
    setSummaryEditRequest("");
    setSummaryEditLoading(false);
    setTranscriptAppendInput("");
    setTranscriptSubmitLoading(false);
    setPreviewIframeKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood p-6 font-satoshi text-cardzzz-cream">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-roundo text-2xl font-bold lowercase">dev pipeline</h1>
          <button
            type="button"
            onClick={handleFlushCache}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-roundo text-sm font-bold lowercase text-cardzzz-cream hover:bg-white/15 transition-colors"
          >
            clean slate
          </button>
        </div>

        {/* Run end to end: Agent 1 → 2 → 3, then toggle workflow vs visual */}
        <section>
          <h2 className="font-roundo text-lg font-bold lowercase mb-2">run end to end</h2>
          <p className="text-sm text-cardzzz-muted mb-2">
            One click: Collector (real chat) → approve → Architect → Engineer → final visual. The conversation is generative (user and agent are both LLM), so each run produces a different chat and different output. Toggle below between workflow log and visual output. Errors (preview or pipeline) are collected and sent to the Engineer on the next run so it avoids repeating them.
          </p>
          {errorContext.length > 0 && (
            <div className="mb-3 rounded-lg border border-white/20 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-roundo text-sm font-bold lowercase text-cardzzz-cream">
                  errors this session ({errorContext.length})
                </span>
                <button
                  type="button"
                  onClick={() => setErrorContext([])}
                  className="text-xs text-cardzzz-muted hover:text-cardzzz-cream underline"
                >
                  clear
                </button>
              </div>
              <ul className="text-xs text-red-200 space-y-1 list-disc list-inside">
                {errorContext.map((msg, i) => (
                  <li key={i} className="break-words">{msg}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunE2E}
              disabled={e2eLoading}
              className="rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold text-cardzzz-accent lowercase shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              run end to end
            </button>
            {e2eLoading && e2eStatus && (
              <span className="text-sm text-cardzzz-muted font-satoshi" role="status" aria-live="polite">
                {e2eStatus}
              </span>
            )}
          </div>
          {e2eError && (
            <p className="mt-2 text-sm text-red-300" role="alert">
              {e2eError}
            </p>
          )}
          {e2eResult && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-cardzzz-muted">view:</span>
                <button
                  type="button"
                  onClick={() => setE2eView("workflow")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium lowercase transition-colors ${
                    e2eView === "workflow"
                      ? "bg-cardzzz-cream text-cardzzz-accent"
                      : "bg-white/10 text-cardzzz-cream border border-white/20 hover:bg-white/15"
                  }`}
                >
                  workflow
                </button>
                <button
                  type="button"
                  onClick={() => setE2eView("visual")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium lowercase transition-colors ${
                    e2eView === "visual"
                      ? "bg-cardzzz-cream text-cardzzz-accent"
                      : "bg-white/10 text-cardzzz-cream border border-white/20 hover:bg-white/15"
                  }`}
                >
                  visual output
                </button>
              </div>
              {e2eView === "visual" ? (
                <div className="space-y-2">
                  <div
                    className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-satoshi text-cardzzz-cream"
                    role="status"
                    aria-live="polite"
                  >
                    {e2eLoading ? (
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-medium">
                          {buildPhase === "e2e"
                            ? "Stage: Collector → Approve"
                            : "Stage: Architect → Engineer (building)"}
                        </span>
                        {e2eStatus && (
                          <span className="text-cardzzz-muted">
                            {e2eStatus}
                          </span>
                        )}
                        {!e2eStatus && (
                          <span className="text-cardzzz-muted">
                            {buildPhase === "e2e"
                              ? "Typically 15–30 seconds."
                              : "Typically 30–90 seconds. Preview will appear below when ready."}
                          </span>
                        )}
                      </div>
                    ) : e2eError ? (
                      <div>
                        <p className="font-medium text-red-300">
                          Build failed: {e2eError}
                        </p>
                        {(e2eError.includes("404") ||
                          e2eError.toLowerCase().includes("not found") ||
                          e2eError.toLowerCase().includes("not available")) && (
                          <p className="mt-1 text-cardzzz-muted text-xs">
                            Run the pipeline again; the build may have expired or the server was restarted.
                          </p>
                        )}
                      </div>
                    ) : e2eResult ? (
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-medium">Build complete.</span>
                        {previewFrameStatus?.status === "loading" && (
                          <span className="text-cardzzz-muted">Preview loading…</span>
                        )}
                        {previewFrameStatus?.status === "ready" && (
                          <span className="text-cardzzz-muted">Preview ready.</span>
                        )}
                        {previewFrameStatus?.status === "error" && previewFrameStatus?.message && (
                          <span className="text-amber-200">
                            Preview: {previewFrameStatus.message}
                          </span>
                        )}
                        {!previewFrameStatus && (
                          <span className="text-cardzzz-muted">Preview may take a moment to load.</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">No build yet.</p>
                        <p className="mt-0.5 text-cardzzz-muted text-xs">
                          Run “run end to end” to generate a preview.
                        </p>
                        {previewFrameStatus?.status === "error" && previewFrameStatus?.message && (
                          <p className="mt-1 text-amber-200 text-xs">
                            {previewFrameStatus.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/20 min-h-[820px]">
                    <iframe
                      key={previewIframeKey}
                      src={`/dev/pipeline/preview?bust=${previewIframeKey}`}
                      title="Pipeline visual output"
                      className="w-full h-[820px] border-0"
                    />
                  </div>
                </div>
              ) : (
                <>
              <h3 className="font-roundo text-base font-bold lowercase">run log</h3>
              <div className="rounded-lg border border-white/20 bg-black/20 p-4 space-y-3 text-sm">
                {e2eResult.log.map((entry, i) => (
                  <div key={i} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                    {entry.step === "session" && (
                      <div>
                        <span className="text-cardzzz-muted">session</span>
                        <pre className="mt-1 text-cardzzz-cream break-all">{entry.sessionId}</pre>
                      </div>
                    )}
                    {entry.step === "welcome" && (
                      <div>
                        <span className="text-cardzzz-muted">welcome</span>
                        <p className="mt-1 text-cardzzz-cream whitespace-pre-wrap">{entry.welcome}</p>
                      </div>
                    )}
                    {entry.step === "user" && (
                      <div>
                        <span className="text-cardzzz-muted">user</span>
                        <p className="mt-1 text-cardzzz-cream">{entry.text}</p>
                      </div>
                    )}
                    {entry.step === "ai" && (
                      <div>
                        <span className="text-cardzzz-muted">ai</span>
                        {entry.messages
                          .filter((m) => m.sender === "ai")
                          .map((m) => (
                            <div key={m.id} className="mt-1 text-cardzzz-cream">
                              {m.type && (
                                <span className="text-cardzzz-muted text-xs mr-2">[{m.type}]</span>
                              )}
                              <span className="whitespace-pre-wrap">{m.text}</span>
                            </div>
                          ))}
                      </div>
                    )}
                    {entry.step === "approve" && (
                      <div>
                        <span className="text-cardzzz-muted">approve</span>
                        <p className="mt-1 text-cardzzz-cream">
                          ok: {String(entry.ok)}
                          {entry.buildId != null && ` · buildId: ${entry.buildId}`}
                        </p>
                        {entry.collectorTranscript != null && (
                          <details className="mt-2">
                            <summary className="text-cardzzz-muted cursor-pointer text-xs">Agent 1 raw transcript</summary>
                            <pre className="mt-1 text-xs text-cardzzz-cream whitespace-pre-wrap break-words">
                              {entry.collectorTranscript}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                    {entry.step === "error" && (
                      <p className="mt-1 text-red-300">{entry.error}</p>
                    )}
                  </div>
                ))}
                <div ref={runLogEndRef} aria-hidden="true" />
              </div>
              {e2eResult.collectorTranscript && (
                <>
                  <h3 className="font-roundo text-base font-bold lowercase">input to Agent 2 (raw transcript)</h3>
                  <p className="text-sm text-cardzzz-muted mb-1">
                    Full Collector conversation sent to Agent 2; Architect turns this into the blueprint.
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-white/20 bg-black/20 p-4 text-xs text-cardzzz-cream whitespace-pre-wrap">
                    {e2eResult.collectorTranscript}
                  </pre>
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <label className="sr-only" htmlFor="transcript-append">Append to conversation</label>
                    <input
                      id="transcript-append"
                      type="text"
                      value={transcriptAppendInput}
                      onChange={(e) => setTranscriptAppendInput(e.target.value)}
                      placeholder="Add a line to the conversation…"
                      className="flex-1 min-w-[200px] rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-cardzzz-muted focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleAppendTranscript}
                      disabled={transcriptSubmitLoading || !transcriptAppendInput.trim()}
                      className="rounded-lg bg-cardzzz-cream px-4 py-2 font-roundo font-bold text-cardzzz-accent lowercase shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {transcriptSubmitLoading ? "Running…" : "append and re-run from Agent 2"}
                    </button>
                  </div>
                </>
              )}
              {e2eResult.creativeSummary && (
                <>
                  <h3 className="font-roundo text-base font-bold lowercase">creative summary (shown to user for approval)</h3>
                  <pre className="overflow-x-auto rounded-lg border border-white/20 bg-black/20 p-4 text-xs text-cardzzz-cream">
                    {JSON.stringify(e2eResult.creativeSummary, null, 2)}
                  </pre>
                </>
              )}
              {e2eResult.buildId && (
                <p className="text-sm text-cardzzz-muted">buildId: {e2eResult.buildId}</p>
              )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Creative summary + apply with AI: only after E2E has produced a summary */}
        {e2eResult?.creativeSummary != null && (
          <section>
            <label className="block text-sm font-medium mb-2">Creative summary</label>
            <div className="mb-2 flex flex-wrap items-end gap-2">
              <input
                type="text"
                value={summaryEditRequest}
                onChange={(e) => setSummaryEditRequest(e.target.value)}
                placeholder="e.g. make it more festive, add a note about…"
                className="flex-1 min-w-[200px] rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-cardzzz-muted focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <button
                type="button"
                onClick={handleUpdateSummaryWithAI}
                disabled={summaryEditLoading || !summaryEditRequest.trim()}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-roundo font-bold lowercase text-cardzzz-cream hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {summaryEditLoading ? "Applying…" : "apply with AI"}
              </button>
            </div>
            {(creativeSummaryInput || e2eResult.creativeSummary) && (
              <pre className="overflow-x-auto rounded-lg border border-white/20 bg-black/20 p-4 text-xs text-cardzzz-cream mb-2">
                {creativeSummaryInput
                  ? creativeSummaryInput
                  : JSON.stringify(e2eResult.creativeSummary, null, 2)}
              </pre>
            )}
            {pipelineError && (
              <p className="mt-2 text-sm text-red-300" role="alert">
                {pipelineError}
              </p>
            )}
          </section>
        )}

        {/* Section 2 – Agent 2 output */}
        {blueprint && (
          <section>
            <h2 className="font-roundo text-lg font-bold lowercase mb-2">Agent 2 (Architect) output</h2>
            <pre className="overflow-x-auto rounded-lg border border-white/20 bg-black/20 p-4 text-xs text-cardzzz-cream">
              {JSON.stringify(blueprint, null, 2)}
            </pre>
          </section>
        )}

        {/* Request changes (Agent 4 → Agent 3) */}
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
