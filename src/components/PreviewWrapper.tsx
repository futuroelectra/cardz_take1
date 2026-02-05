"use client";

import { Sandpack } from "@codesandbox/sandpack-react";
import { useMemo } from "react";

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

/** Wrapper App.tsx: loads Card.tsx and catches runtime errors (e.g. undefined lucide-react icons). */
const WRAPPER_APP = `import React from "react";
import Card from "./Card";

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-screen items-center justify-center bg-[#1a0f1b] rounded-[20px] p-4">
          <p className="text-[#FFFADC] text-sm text-center">
            Preview error: a component may be missing or misnamed. Try a small edit in the editor to refresh.
          </p>
        </div>
      );
    }
    return this.props.children;
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
  const files = {
    "/App.tsx": appCode,
    "/Card.tsx": cardCode,
  };

  if (!apiBaseUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1a0f1b] rounded-[20px]">
        <div className="text-[#FFFADC] font-satoshi text-sm">Loading preview...</div>
      </div>
    );
  }

  return (
    <div
      className="editor-preview-frame flex flex-col overflow-hidden rounded-[20px] shrink-0"
      style={{ width: 390, height: 720, minWidth: 390, minHeight: 720, maxWidth: 390, maxHeight: 720 }}
    >
      <Sandpack
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
          showNavigator: false,
          showTabs: false,
          showLineNumbers: false,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: "100%",
          editorWidthPercentage: 0,
          showConsole: false,
          showConsoleButton: false,
          layout: "preview",
          resizablePanels: false,
        }}
      />
    </div>
  );
}
