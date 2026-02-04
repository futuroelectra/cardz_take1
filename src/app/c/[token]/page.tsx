"use client";

/**
 * Private card view. Link alone MUST NOT grant access; claim (passphrase or sign-up) required.
 * Per docs/MASTER_PROMPT_BACKEND.md §4.
 */

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import PreviewWrapper from "@/components/PreviewWrapper";

type ClaimStatus = "loading" | "unclaimed" | "claiming" | "active" | "expired" | "error";

export default function CardViewPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("loading");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cardCode, setCardCode] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setClaimStatus("error");
      setError("Invalid link");
      return;
    }
    setClaimStatus("unclaimed");
  }, [token]);

  const handleClaimWithPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setClaimStatus("claiming");
    setError(null);
    try {
      const res = await fetch("/api/card/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, passphrase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Claim failed");
        setClaimStatus("unclaimed");
        return;
      }
      setClaimStatus("active");
      if (data.code) setCardCode(data.code);
    } catch {
      setError("Network error");
      setClaimStatus("unclaimed");
    }
  };

  return (
    <div className="Layout_receiver flex flex-col min-h-screen w-full bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood p-6">
      <div className="max-w-md mx-auto flex flex-col gap-6 flex-1 min-h-0 w-full">
        {claimStatus === "loading" && (
          <p className="text-cardzzz-cream font-satoshi text-center">Loading...</p>
        )}
        {claimStatus === "unclaimed" && (
          <>
            <h1 className="text-cardzzz-cream font-roundo font-bold text-[24px] text-center">
              unlock your experience
            </h1>
            <p className="text-cardzzz-cream font-satoshi text-[14px] text-center">
              Enter the secret passphrase shared with you to open this card.
            </p>
            <form onSubmit={handleClaimWithPassphrase} className="flex flex-col gap-4">
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Secret passphrase"
                className="w-full py-3 px-4 rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 text-cardzzz-cream font-satoshi placeholder:text-cardzzz-muted outline-none"
              />
              <button
                type="submit"
                className="w-full h-[54px] rounded-[16.168px] bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold text-[19px] cursor-pointer hover:opacity-90"
              >
                unlock
              </button>
            </form>
            <p className="text-cardzzz-cream font-satoshi text-[12px] text-center">
              Don&apos;t have a passphrase? You may need to sign up to claim this card.
            </p>
            {error && (
              <p className="text-red-300 font-satoshi text-[14px] text-center">{error}</p>
            )}
          </>
        )}
        {claimStatus === "claiming" && (
          <p className="text-cardzzz-cream font-satoshi text-center">Unlocking...</p>
        )}
        {claimStatus === "active" && (
          <div className="w-full flex flex-col gap-4 flex-1 min-h-0">
            <h1 className="text-cardzzz-cream font-roundo font-bold text-[24px] text-center shrink-0">
              welcome
            </h1>
            <p className="text-cardzzz-cream font-satoshi text-[14px] text-center shrink-0">
              You have 48 hours to enjoy this experience.
            </p>
            {cardCode ? (
              <div className="w-full flex-1 min-h-[400px] flex flex-col rounded-[20px] overflow-hidden bg-black/40">
                <PreviewWrapper code={cardCode} />
              </div>
            ) : (
              <p className="text-cardzzz-cream/70 font-satoshi text-sm text-center">No card content available.</p>
            )}
          </div>
        )}
        {claimStatus === "error" && (
          <p className="text-cardzzz-cream font-satoshi text-center">{error ?? "Invalid link"}</p>
        )}
      </div>
    </div>
  );
}
