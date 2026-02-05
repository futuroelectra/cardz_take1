/**
 * Dev-only: create a CodeSandbox from the current artifact and return its URL.
 * Uses only the in-memory store (raw Engineer/Iterator output). No client-supplied
 * code or preview UI state is ever used—intercept at source so the link is reliable.
 *
 * GET ?redirect=1 → 302 to CodeSandbox URL (best for "open in new tab" / bookmark).
 * GET (no query) → JSON { url } for programmatic use.
 */

import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Only ensure a default export so the sandbox can mount. No webhook replacement or other changes. */
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

/** create-react-app style so CodeSandbox's default React template runs it. */
function buildSandboxFiles(rawCode: string): Record<string, { content: string }> {
  const appCode = ensureDefaultExport(rawCode);
  return {
    "package.json": {
      content: JSON.stringify(
        {
          name: "card-preview",
          version: "0.0.0",
          private: true,
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1",
            "framer-motion": "^11.0.0",
            "lucide-react": "latest",
          },
        },
        null,
        2
      ),
    },
    "public/index.html": {
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Card preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
    },
    "src/index.js": {
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
`,
    },
    "src/App.js": {
      content: appCode,
    },
  };
}

export async function GET(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const current = getCurrent();
  if (!current?.artifact?.code) {
    const wantRedirect = new URL(req.url).searchParams.get("redirect") === "1";
    if (wantRedirect) {
      return NextResponse.redirect(new URL("/dev/pipeline?error=no-build", req.url), 302);
    }
    return NextResponse.json(
      { error: "No current build. Run the pipeline first." },
      { status: 400 }
    );
  }
  const files = buildSandboxFiles(current.artifact.code);
  const body = { files };
  try {
    const res = await fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { sandbox_id?: string; error?: string };
    if (!res.ok || !data.sandbox_id) {
      const err = data.error ?? "CodeSandbox returned an error";
      console.error("CodeSandbox define error:", err, data);
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
    const url = `https://codesandbox.io/s/${data.sandbox_id}`;
    const wantRedirect = new URL(req.url).searchParams.get("redirect") === "1";
    if (wantRedirect) {
      return NextResponse.redirect(url, 302);
    }
    return NextResponse.json({ url });
  } catch (err) {
    console.error("CodeSandbox request failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create sandbox" },
      { status: 502 }
    );
  }
}
