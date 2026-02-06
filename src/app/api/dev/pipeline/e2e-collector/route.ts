/**
 * Dev-only: E2E Collector pipeline. Runs real session → welcome → send loop → approve over HTTP.
 * User messages are LLM-generated each run so conversations (and final outputs) vary.
 * Streams NDJSON to the client: one line per log entry, then a "done" line.
 */

import { NextResponse } from "next/server";
import type { CreativeSummary } from "@/lib/types";
import { generate } from "@/lib/llm";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

const MAX_SEND_ROUNDS = 10;

const E2E_USER_SYSTEM =
  "You are simulating a user in a card-building chat. Reply with exactly one short, natural message (1-2 sentences). " +
  "No markdown, no code. If the assistant has shown a summary and asked for approval, say you approve (e.g. \"Yes, that looks good\" or \"Approve\"). " +
  "Output only that one line, no quotes or prefix.";

type Round = { user: string; ai: string };

/**
 * Generate the next user message given the conversation so far. Uses LLM so each E2E run evolves.
 */
async function generateNextUserMessage(
  welcome: string,
  rounds: Round[]
): Promise<string> {
  const lines: string[] = [`Assistant: ${welcome}`];
  for (const r of rounds) {
    lines.push(`User: ${r.user}`);
    lines.push(`Assistant: ${r.ai}`);
  }
  lines.push("Generate the next User message only (one short line):");
  const prompt = lines.join("\n");
  const raw = await generate({
    systemInstruction: E2E_USER_SYSTEM,
    prompt,
  });
  return raw.trim().replace(/^["']|["']$/g, "").split("\n")[0].trim() || "I'd like to make a card.";
}

export type LogEntry =
  | { step: "session"; sessionId: string }
  | { step: "welcome"; welcome: string }
  | { step: "user"; text: string }
  | { step: "ai"; messages: { id: string; text: string; sender: string; type?: string }[] }
  | { step: "approve"; ok: boolean; buildId?: string; creativeSummary?: CreativeSummary; collectorTranscript?: string }
  | { step: "error"; error: string };

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function streamLine(controller: ReadableStreamDefaultController<Uint8Array>, obj: unknown): void {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + "\n"));
}

export async function POST(req: Request): Promise<Response> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const baseUrl = getBaseUrl(req);
  const log: LogEntry[] = [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (entry: LogEntry) => {
        log.push(entry);
        streamLine(controller, { log: entry });
      };
      const finish = (payload: {
        creativeSummary?: CreativeSummary | null;
        buildId?: string | null;
        collectorTranscript?: string | null;
        error?: string;
      }) => {
        streamLine(controller, { done: true, ...payload });
        controller.close();
      };

      try {
        // 1. Create session
        const sessionRes = await fetch(`${baseUrl}/api/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const sessionData = (await sessionRes.json()) as { sessionId?: string; error?: string };
        if (!sessionRes.ok || !sessionData.sessionId) {
          const err = sessionData?.error ?? "Failed to create session";
          console.error("[e2e-collector] session error:", err);
          push({ step: "error", error: err });
          finish({ error: err });
          return;
        }
        const sessionId = sessionData.sessionId;
        push({ step: "session", sessionId });
        console.log("[e2e-collector] session:", sessionId);

        // 2. Welcome
        const welcomeRes = await fetch(`${baseUrl}/api/chat/welcome`);
        const welcomeData = (await welcomeRes.json()) as { welcome?: string; error?: string };
        const welcome =
          welcomeRes.ok && welcomeData.welcome ? welcomeData.welcome : "Welcome to Cardzzz ✦";
        push({ step: "welcome", welcome });
        console.log("[e2e-collector] welcome:", welcome);

        // 3. Send loop: LLM-generated user messages until we get confirmation
        let gotConfirmation = false;
        let round = 0;
        const rounds: Round[] = [];

        while (round < MAX_SEND_ROUNDS) {
          round += 1;
          const text = await generateNextUserMessage(welcome, rounds);
          push({ step: "user", text });
          console.log("[e2e-collector] user:", text);

          const sendRes = await fetch(`${baseUrl}/api/chat/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, text }),
          });
          const sendData = (await sendRes.json()) as {
            messages?: { id: string; text: string; sender: string; type?: string }[];
            error?: string;
            popTrigger?: boolean;
          };

          if (!sendRes.ok) {
            const err = sendData?.error ?? "Send failed";
            push({ step: "error", error: err });
            console.error("[e2e-collector] send error:", err);
            finish({ error: err });
            return;
          }
          if (sendData.popTrigger) {
            push({ step: "ai", messages: [] });
            rounds.push({ user: text, ai: "" });
            continue;
          }

          const messages = sendData.messages ?? [];
          push({ step: "ai", messages });
          const aiText = messages.filter((m) => m.sender === "ai").map((m) => m.text).join("\n");
          rounds.push({ user: text, ai: aiText });
          console.log("[e2e-collector] ai:", messages.map((m) => ({ text: m.text, type: m.type })));

          if (messages.some((m) => m.type === "confirmation")) {
            gotConfirmation = true;
            break;
          }
        }

        if (!gotConfirmation) {
          const err = `No confirmation after ${round} round(s)`;
          push({ step: "error", error: err });
          console.error("[e2e-collector]", err);
          finish({ error: err });
          return;
        }

        // 4. Approve
        const approveRes = await fetch(`${baseUrl}/api/chat/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const approveData = (await approveRes.json()) as {
          ok?: boolean;
          buildId?: string;
          creativeSummary?: CreativeSummary;
          collectorTranscript?: string;
          error?: string;
        };

        if (!approveRes.ok || !approveData.ok) {
          const err = approveData?.error ?? "Approve failed";
          push({ step: "error", error: err });
          console.error("[e2e-collector] approve error:", err);
          finish({ error: err });
          return;
        }

        push({
          step: "approve",
          ok: true,
          buildId: approveData.buildId,
          creativeSummary: approveData.creativeSummary,
          collectorTranscript: approveData.collectorTranscript,
        });
        console.log("[e2e-collector] approve ok, buildId:", approveData.buildId);
        finish({
          creativeSummary: approveData.creativeSummary ?? null,
          buildId: approveData.buildId ?? null,
          collectorTranscript: approveData.collectorTranscript ?? null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        push({ step: "error", error: message });
        console.error("[e2e-collector] error:", err);
        finish({ error: message });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
