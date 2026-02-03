/**
 * Create a Lemon Squeezy checkout and return the URL.
 * Requires LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID.
 */

const LEMON_API = "https://api.lemonsqueezy.com/v1";

export type CheckoutType = "creation" | "reactivate";

export type CreateCheckoutParams = {
  type: CheckoutType;
  userId: string;
  cardId?: string;
  successUrl?: string;
};

export async function createCheckout(
  params: CreateCheckoutParams
): Promise<{ checkoutUrl: string }> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;
  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy is not configured");
  }

  const customData: Record<string, string> = { type: params.type };
  if (params.type === "creation") customData.user_id = params.userId;
  if (params.type === "reactivate" && params.cardId) customData.card_id = params.cardId;

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        store_id: Number(storeId),
        variant_id: Number(variantId),
        custom_price: 500,
        product_options: {
          name: params.type === "creation" ? "Cardzzz — Create your dream card" : "Cardzzz — Reactivate card",
          redirect_url: params.successUrl ?? undefined,
        },
        checkout_data: {
          custom: customData,
        },
      },
    },
  };

  const res = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy checkout failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = data.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL in response");
  return { checkoutUrl: url };
}
