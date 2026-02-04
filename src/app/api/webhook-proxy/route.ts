/**
 * Proxy for generated card actions. Forwards POST body to WEBHOOK_URL (e.g. n8n).
 * Optional: set WEBHOOK_URL in env. If unset, returns 501.
 */

import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { success: false, error: "Webhook not configured" },
      { status: 501, headers: CORS_HEADERS }
    );
  }
  try {
    const body = await request.json();
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.text();
    return NextResponse.json(
      { success: response.ok, data: data || null },
      { status: response.status, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
