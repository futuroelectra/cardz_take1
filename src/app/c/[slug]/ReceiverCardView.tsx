"use client";

import { useState, useEffect } from "react";
import RawAuthModal from "@/app/_quarantine/RawAuthModal";

type CardConfig = {
  id: string;
  slug: string;
  subject_asset_url?: string | null;
  blueprint: {
    mainHeader?: string;
    mainDescription?: string;
    statusBarText?: string;
    statusBarStyle?: string;
    buttons?: Array<{
      label: string;
      description?: string;
      outputType: string;
      modalHeader?: string;
      modalDescription?: string;
      inputPlaceholder?: string;
      submitLabel?: string;
      successMessage?: string;
    }>;
    welcomeHeader?: string;
    welcomeMessage?: string;
    subjectPrompt?: string;
    fontHeading?: string;
    fontBody?: string;
    backgroundPrimary?: string;
    accent?: string;
    textPrimary?: string;
    textSecondary?: string;
    buttonShape?: string;
    effect?: string;
  };
  subject_asset_id?: string | null;
  activation_timestamp_utc?: string | null;
  is_interactive: boolean;
  first_opened_at?: string | null;
  expires_at?: string | null;
};

type ReceiverCardViewProps = {
  config: CardConfig;
};

export default function ReceiverCardView({ config }: ReceiverCardViewProps) {
  const [hasOpened, setHasOpened] = useState(!!config.first_opened_at);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [userInput, setUserInput] = useState("");
  const [actionResult, setActionResult] = useState<{
    type: string;
    content?: string;
    url?: string;
  } | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const now = Date.now();
  const activationTs = config.activation_timestamp_utc
    ? new Date(config.activation_timestamp_utc).getTime()
    : 0;
  const expiresAt = config.expires_at
    ? new Date(config.expires_at).getTime()
    : 0;
  const activated = activationTs <= now;
  const expired = expiresAt > 0 && now >= expiresAt;

  useEffect(() => {
    if (expiresAt > 0 && now >= expiresAt) setIsExpired(true);
  }, [expiresAt, now]);

  const blueprint = config.blueprint ?? {};
  const buttons = Array.isArray(blueprint.buttons) ? blueprint.buttons : [];
  const activeButton =
    activeButtonIndex !== null ? buttons[activeButtonIndex] : null;

  const doOpenCard = async () => {
    const openRes = await fetch(`/api/cards/${config.id}/open`, {
      method: "POST",
      credentials: "include",
    });
    if (openRes.ok) {
      setHasOpened(true);
      setIsWelcomeOpen(false);
    }
  };

  const handleOpenClick = async () => {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (!res.ok) {
      setIsAuthModalOpen(true);
      return;
    }
    await doOpenCard();
  };

  const handleAuthSubmit = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register-or-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (res.ok) {
      setIsAuthModalOpen(false);
      await doOpenCard();
    }
  };

  const handleButtonClick = (index: number) => {
    if (isExpired || !config.is_interactive) {
      return;
    }
    setActiveButtonIndex(index);
    setUserInput("");
    setActionResult(null);
    setIsInteractionOpen(true);
  };

  const handleSubmitAction = async () => {
    if (activeButtonIndex === null) return;
    setIsLoadingAction(true);
    try {
      const res = await fetch(`/api/cards/${config.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          button_index: activeButtonIndex,
          user_input: userInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult(data);
      } else {
        setActionResult({
          type: "error",
          content: data.error || "Something went wrong",
        });
      }
    } catch {
      setActionResult({ type: "error", content: "Network error" });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const themeStyle = {
    "--rc-bg": blueprint.backgroundPrimary ?? "#1a1a2e",
    "--rc-accent": blueprint.accent ?? "#c9a0a0",
    "--rc-text": blueprint.textPrimary ?? "#fff",
    "--rc-text-secondary": blueprint.textSecondary ?? "#aaa",
  } as React.CSSProperties;

  const fontFamilyHeading = blueprint.fontHeading ?? "var(--font-roundo)";
  const fontFamilyBody = blueprint.fontBody ?? "var(--font-satoshi)";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: `linear-gradient(180deg, ${blueprint.backgroundPrimary ?? "#1a1a2e"} 0%, ${blueprint.backgroundSecondary ?? blueprint.backgroundPrimary ?? "#0d0d1a"} 100%)`,
        color: blueprint.textPrimary ?? "#fff",
      }}
    >
      {/* Dynamic fonts */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          fontFamilyHeading.replace(/ /g, "+")
        )}:wght@400;700&family=${encodeURIComponent(
          fontFamilyBody.replace(/ /g, "+")
        )}:wght@400;600&display=swap`}
      />

      {isWelcomeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-md w-full rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-8 text-center"
            style={{ color: blueprint.textPrimary ?? "#fff" }}
          >
            {!activated ? (
              <>
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: fontFamilyHeading }}
                >
                  coming soon
                </h1>
                <p style={{ fontFamily: fontFamilyBody }}>
                  This dream-card unlocks at a special time. Check back later.
                </p>
              </>
            ) : !hasOpened ? (
              <>
                <h1
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: fontFamilyHeading }}
                >
                  {blueprint.welcomeHeader ?? "hello"}
                </h1>
                <p className="mb-6" style={{ fontFamily: fontFamilyBody }}>
                  {blueprint.welcomeMessage ?? ""}
                </p>
                <button
                  type="button"
                  onClick={handleOpenClick}
                  className="w-full h-[54px] rounded-2xl bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold text-lg cursor-pointer hover:opacity-90"
                >
                  open
                </button>
              </>
            ) : null}
            {hasOpened && isWelcomeOpen && (
              <button
                type="button"
                onClick={() => setIsWelcomeOpen(false)}
                className="mt-4 text-sm underline"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {hasOpened && !isWelcomeOpen && (
        <>
          <h1
            className="text-3xl font-bold text-center mb-2"
            style={{ fontFamily: fontFamilyHeading }}
          >
            {(blueprint.mainHeader ?? "").toLowerCase()}
          </h1>
          {blueprint.mainDescription && (
            <p
              className="text-center mb-4 max-w-md"
              style={{ fontFamily: fontFamilyBody }}
            >
              {blueprint.mainDescription}
            </p>
          )}
          {blueprint.statusBarText && blueprint.statusBarStyle !== "none" && (
            <div
              className={`mb-6 px-4 py-2 rounded-full text-sm ${
                blueprint.statusBarStyle === "pill"
                  ? "rounded-full"
                  : blueprint.statusBarStyle === "bar"
                    ? "w-full max-w-md rounded-lg"
                    : ""
              }`}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: blueprint.textSecondary ?? "#aaa",
                fontFamily: fontFamilyBody,
              }}
            >
              {blueprint.statusBarText}
            </div>
          )}

          {/* Subject placeholder (circle) */}
          <div className="w-40 h-40 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-8 overflow-hidden">
            {config.subject_asset_url ? (
              <img
                src={config.subject_asset_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-4xl opacity-60"
                style={{ fontFamily: fontFamilyBody }}
              >
                ✦
              </span>
            )}
          </div>

          {/* Buttons 1-4 */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {buttons.map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleButtonClick(i)}
                disabled={isExpired || !config.is_interactive}
                className={`w-full py-4 px-6 rounded-2xl font-roundo font-bold text-lg transition-all ${
                  isExpired || !config.is_interactive
                    ? "bg-white/5 text-white/50 cursor-not-allowed"
                    : "bg-cardzzz-cream text-cardzzz-accent cursor-pointer hover:opacity-90 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]"
                } ${
                  blueprint.buttonShape === "pill"
                    ? "rounded-full"
                    : blueprint.buttonShape === "sharp"
                      ? "rounded-none"
                      : ""
                }`}
              >
                {(btn.label ?? "").toLowerCase()}
              </button>
            ))}
          </div>

          {isExpired && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-center text-sm opacity-80">
                This dream-card has expired. Reactivate to play.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/paywall/checkout?type=reactivate&cardId=${encodeURIComponent(config.id)}`
                    );
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.checkoutUrl) {
                      window.location.href = data.checkoutUrl;
                    }
                  } catch {
                    // ignore
                  }
                }}
                className="h-[54px] px-6 rounded-2xl bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold cursor-pointer hover:opacity-90"
              >
                reactivate
              </button>
            </div>
          )}
        </>
      )}

      {/* Interaction modal */}
      {isInteractionOpen && activeButton && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-md w-full rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6"
            style={{ color: blueprint.textPrimary ?? "#fff" }}
          >
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: fontFamilyHeading }}
            >
              {(activeButton.modalHeader ?? activeButton.label ?? "").toLowerCase()}
            </h2>
            <p className="mb-4 text-sm" style={{ fontFamily: fontFamilyBody }}>
              {activeButton.modalDescription ?? ""}
            </p>
            {!actionResult ? (
              <>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={activeButton.inputPlaceholder ?? "Type something..."}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-cardzzz-cream placeholder:text-cardzzz-muted mb-4 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitAction}
                    disabled={isLoadingAction}
                    className="flex-1 h-[54px] rounded-2xl bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoadingAction
                      ? "..."
                      : (activeButton.submitLabel ?? "submit").toLowerCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInteractionOpen(false);
                      setActiveButtonIndex(null);
                      setActionResult(null);
                    }}
                    className="px-4 rounded-2xl border border-white/30 text-inherit"
                  >
                    close
                  </button>
                </div>
              </>
            ) : (
              <>
                {actionResult.type === "text" && actionResult.content && (
                  <p className="mb-4 whitespace-pre-wrap" style={{ fontFamily: fontFamilyBody }}>
                    {actionResult.content}
                  </p>
                )}
                {actionResult.type === "music" && actionResult.url && (
                  <audio controls src={actionResult.url} className="w-full mb-4" />
                )}
                {actionResult.type === "image" && actionResult.url && (
                  <img
                    src={actionResult.url}
                    alt="Generated"
                    className="w-full rounded-xl mb-4"
                  />
                )}
                {actionResult.type === "error" && (
                  <p className="mb-4 text-cardzzz-accent">{actionResult.content}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsInteractionOpen(false);
                    setActiveButtonIndex(null);
                    setActionResult(null);
                  }}
                  className="w-full h-[54px] rounded-2xl bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold cursor-pointer hover:opacity-90"
                >
                  close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <RawAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignUp={handleAuthSubmit}
        onSignIn={handleAuthSubmit}
      />
    </div>
  );
}
