import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckout } from "@/lib/lemonsqueezy/createCheckout";

/**
 * GET /api/paywall/checkout?type=creation — auth required. Returns { checkoutUrl } for $5 creation.
 * GET /api/paywall/checkout?type=reactivate&cardId=xxx — returns { checkoutUrl } for reactivate (cardId required).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "creation" | "reactivate" | null;
  const cardId = searchParams.get("cardId");

  if (type !== "creation" && type !== "reactivate") {
    return NextResponse.json(
      { error: "type must be creation or reactivate" },
      { status: 400 }
    );
  }

  if (type === "reactivate" && !cardId) {
    return NextResponse.json(
      { error: "cardId required for reactivate" },
      { status: 400 }
    );
  }

  if (type === "creation") {
    const user = await getCurrentUser(request.headers.get("cookie"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { checkoutUrl } = await createCheckout({
        type: "creation",
        userId: user.id,
        successUrl: request.nextUrl.origin + "/",
      });
      return NextResponse.json({ checkoutUrl });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Checkout failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    const { checkoutUrl } = await createCheckout({
      type: "reactivate",
      userId: "",
      cardId: cardId ?? undefined,
      successUrl: request.nextUrl.origin + "/c/" + cardId,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
