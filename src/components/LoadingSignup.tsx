"use client";

import { useState, useEffect } from "react";

const PHRASES = [
  "robots at work...",
  "rendering love...",
  "launching servers...",
];

const POLL_INTERVAL_MS = 1500;

type BuildLoadingProps = {
  buildId: string;
  onNavigateToEditor: () => void;
  /** When build fails or is not found, user can go back to chat. */
  onBackToChat: () => void;
  /** After auth modal signup: show thank-you line. After skip: spinner + phrases only. */
  variant: "signedUp" | "skip";
};

/**
 * Loading screen shown after "create an account" (auth modal) or "skip for now".
 * Shows spinner + rotating phrases; optional thank-you for signedUp. Polls build until ready, then navigates to editor.
 */
export default function LoadingSignup({
  buildId,
  onNavigateToEditor,
  onBackToChat,
  variant,
}: BuildLoadingProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [buildError, setBuildError] = useState<"failed" | "not_found" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % PHRASES.length);
        setIsVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!buildId) return;
    setBuildError(null);
    let cancelled = false;
    const poll = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/build/${buildId}`);
        const data = await res.json();
        if (cancelled) return true;
        if (res.status === 404) {
          setBuildError("not_found");
          return true;
        }
        if (res.ok && data.status === "failed") {
          setBuildError("failed");
          return true;
        }
        if (res.ok && data.status === "ready" && data.artifact) {
          onNavigateToEditor();
          return true;
        }
      } catch {
        // ignore; keep polling
      }
      return false;
    };
    let intervalId: ReturnType<typeof setInterval> | null = null;
    void poll().then((done) => {
      if (cancelled || done) return;
      intervalId = setInterval(() => {
        void poll().then((finished) => {
          if (finished && intervalId) clearInterval(intervalId);
        });
      }, POLL_INTERVAL_MS);
    });
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [buildId, onNavigateToEditor]);

  if (buildError) {
    return (
      <div className="Layout_signup relative flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden px-[15px]">
        <button
          type="button"
          onClick={onBackToChat}
          className="Comp_back_to_chat absolute top-[20px] left-[20px] z-10 text-cardzzz-cream/90 font-satoshi text-[14px] font-medium hover:text-cardzzz-cream hover:opacity-90 transition-opacity underline"
          aria-label="Back to chat"
        >
          ← back to chat
        </button>
        <div className="Section_page_content flex flex-col items-center gap-[20px] w-full max-w-[400px]">
          <p className="BodyText w-full text-cardzzz-cream text-center font-satoshi font-medium text-[14px] leading-normal">
            {buildError === "not_found"
              ? "Build not found. Your session may have expired."
              : "Something went wrong building your card."}
          </p>
          <button
            type="button"
            onClick={onBackToChat}
            className="Comp_Button-Primary w-full h-[54px] py-[20px] px-[10px] flex items-center justify-center rounded-[16.168px] bg-cardzzz-cream text-cardzzz-accent border border-cardzzz-cream/50 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] cursor-pointer hover:opacity-90 transition-all font-roundo font-bold text-[19px]"
          >
            back to chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="Layout_signup relative flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden px-[15px]">
      <button
        type="button"
        onClick={onBackToChat}
        className="Comp_back_to_chat absolute top-[20px] left-[20px] z-10 text-cardzzz-cream/90 font-satoshi text-[14px] font-medium hover:text-cardzzz-cream hover:opacity-90 transition-opacity underline"
        aria-label="Back to chat"
      >
        ← back to chat
      </button>
      <div className="Section_page_content flex flex-col items-center gap-[15px] w-full max-w-[400px] relative">
        <div className="Comp_loading_visual flex flex-col items-center gap-[13px] w-full relative">
          <div className="Comp_loadinganimation w-[90px] h-[90px] relative flex items-center justify-center">
            <div className="absolute w-[90px] h-[90px] border-4 border-cardzzz-cream/20 border-t-cardzzz-cream/60 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
            <div className="absolute w-[70px] h-[70px] border-[3px] border-cardzzz-cream/30 border-r-cardzzz-cream/70 rounded-full animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
            <div className="absolute w-[50px] h-[50px] border-2 border-cardzzz-cream/40 border-b-cardzzz-cream rounded-full animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute w-[12px] h-[12px] bg-cardzzz-cream rounded-full animate-pulse" />
          </div>
          <div className={`Comp_LoadingPhrases w-full text-cardzzz-cream text-center font-roundo font-bold text-[19px] leading-normal transition-opacity duration-300 ease-in-out min-h-[28px] ${isVisible ? "opacity-100" : "opacity-0"}`}>
            {PHRASES[currentPhraseIndex]}
          </div>
        </div>
        {variant === "signedUp" && (
          <p className="BodyText w-full text-cardzzz-cream text-center font-satoshi font-medium text-[14px] leading-normal">
            thank you for creating an account. your creation will be ready for tinker changes soon.
          </p>
        )}
      </div>
    </div>
  );
}
