"use client";

import { SandpackProvider, SandpackLayout, SandpackPreview, useErrorMessage } from "@codesandbox/sandpack-react";
import { useMemo, useEffect } from "react";

interface PreviewWrapperProps {
  code: string;
}

const FALLBACK_CODE = `export default function App() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-gradient-to-br from-[#2D1B2E] to-[#1a0f1b]">
      <div className="text-[#FFFADC] text-lg font-sans">Loading your card...</div>
    </div>
  );
}
`;

/** Ensure the card code has a default export so Sandpack can render it. */
function ensureDefaultExport(code: string): string {
  const trimmed = code.trim();
  if (/export\s+default\s+/m.test(trimmed)) return code;
  if (/\bexport\s+(?:function|const)\s+App\b/m.test(trimmed) || /\bfunction\s+App\s*\(/m.test(trimmed)) {
    return trimmed + "\nexport default App;\n";
  }
  if (/\bexport\s+{\s*App\s*}\s*;?\s*$/m.test(trimmed)) {
    return trimmed.replace(/\bexport\s+{\s*App\s*}\s*;?\s*$/m, "export default App;\n");
  }
  return code;
}

/** Wrapper App.tsx: loads Card.tsx and catches runtime errors; reports to parent for error-context (dev pipeline). */
const WRAPPER_APP = `import React from "react";
import Card from "./Card";

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage?: string }
> {
  state = { hasError: false, errorMessage: undefined };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }
  componentDidUpdate(_: unknown, prev: { hasError: boolean }) {
    if (this.state.hasError && !prev.hasError && typeof window !== "undefined" && window.parent) {
      try {
        window.parent.postMessage(
          { type: "preview-error", message: this.state.errorMessage || "Unknown error" },
          "*"
        );
      } catch (_) {}
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-screen items-center justify-center bg-[#1a0f1b] rounded-[20px] p-4">
          <p className="text-[#FFFADC] text-sm text-center">
            Preview error: {this.state.errorMessage || "a component may be missing or misnamed."} Try a small edit to refresh.
          </p>
        </div>
      );
    }
    return (
      <div className="h-full min-h-full flex flex-col">
        <div className="flex-1 min-h-0 [&>*]:h-full [&>*]:min-h-0">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <PreviewErrorBoundary>
      <Card />
    </PreviewErrorBoundary>
  );
}
`;

/** Log Sandpack compile errors in dev (must be rendered inside SandpackProvider). */
function SandpackCompileErrorLogger() {
  const message = useErrorMessage();
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && message) {
      console.error("[preview-wrapper] Sandpack compile error:", message);
    }
  }, [message]);
  return null;
}

export default function PreviewWrapper({ code }: PreviewWrapperProps) {
  const apiBaseUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const processCode = (rawCode: string): string => {
    if (!apiBaseUrl || !rawCode) return rawCode;
    let processed = rawCode;
    processed = processed.replace(
      /https:\/\/[^\s"']*n8n[^\s"']*webhook[^\s"']*/g,
      `${apiBaseUrl}/api/webhook-proxy`
    );
    if (processed.includes("/api/webhook-proxy") && !processed.includes(apiBaseUrl)) {
      processed = processed.replace(
        /(['"])(\/api\/webhook-proxy)(['"])/g,
        `$1${apiBaseUrl}/api/webhook-proxy$3`
      );
    }
    processed = ensureDefaultExport(processed);
    return processed;
  };

  const cardCode = processCode(code || "") || FALLBACK_CODE;
  const appCode = WRAPPER_APP;

  /** Use template default index so bundler injects correctly; only override App + Card. */
  /** Custom index so html/body/#root fill iframe height (fixes preview not stretching). */
  const indexHtml = `<!DOCTYPE html>
<html lang="en" style="height:100%;margin:0">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>html,body,#root{height:100%;margin:0;padding:0}</style>
  </head>
  <body style="height:100%;margin:0">
    <div id="root" style="height:100%"></div>
  </body>
</html>`;
  const files = {
    "/App.tsx": appCode,
    "/Card.tsx": cardCode,
    "/public/index.html": { code: indexHtml },
  };

  if (!apiBaseUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1a0f1b] rounded-[20px]">
        <div className="text-[#FFFADC] font-satoshi text-sm">Loading preview...</div>
      </div>
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[preview-wrapper] rendering Sandpack, code length:", cardCode.length);
  }

  return (
    <div
      className="editor-preview-frame flex h-full min-h-[720px] w-[390px] max-w-[390px] flex-col overflow-hidden rounded-[20px] shrink-0"
      style={{ width: 390 }}
    >
      <SandpackProvider
        key={code.slice(0, 200)}
        template="react-ts"
        theme="dark"
        files={files}
        customSetup={{
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            "framer-motion": "^11.0.0",
            "lucide-react": "latest",
          },
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          activeFile: "/App.tsx",
          visibleFiles: ["/App.tsx", "/Card.tsx"],
        }}
      >
        <SandpackCompileErrorLogger />
        <SandpackLayout
          className="editor-preview-sandpack-wrapper"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" }}
        >
          <SandpackPreview
            className="editor-preview-sandpack-preview"
            showNavigator={false}
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showOpenNewtab={false}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
