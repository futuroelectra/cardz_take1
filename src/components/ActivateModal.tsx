"use client";

import { useEffect } from "react";

type ActivateModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  onActivate?: () => void;
};

export default function ActivateModal({
  isOpen,
  onClose,
  onActivate,
}: ActivateModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const handleActivate = () => {
    onActivate?.();
  };

  return (
    <>
      <div
        className="Comp_Activate_Backdrop fixed inset-0 w-full h-full bg-black/40 backdrop-blur-xl z-50 flex items-center justify-center p-[15px]"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activate-heading"
      >
        <div className="Comp_Activate_Modal flex flex-col items-center gap-[15px] w-full max-w-[500px] pt-[30px] md:pt-[20px] pb-[30px] md:pb-[15px] pl-[30px] md:pl-[15px] pr-[30px] md:pr-[15px] rounded-[30px] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative z-[60]">
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="Comp_Activate_Close absolute top-[15px] right-[15px] w-[32px] h-[32px] flex items-center justify-center text-cardzzz-cream hover:opacity-70 transition-opacity cursor-pointer z-[70] p-0"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-0">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 id="activate-heading" className="Comp_Activate_Heading text-cardzzz-cream text-center font-roundo font-bold text-[24px] md:text-[28px] leading-normal mb-0">
            reactivate dream-card
          </h1>
          <p className="Comp_Activate_Subheading_New text-cardzzz-cream text-center font-roundo font-semibold text-[14px] md:text-[16px] leading-normal mb-[8px]">
            Your 48 hour window has expired
          </p>
          <p className="Comp_Activate_Subheading text-cardzzz-cream text-center font-satoshi font-medium text-[14px] md:text-[16px] leading-normal mb-0">
            In order reactivate your dream-card for another 48 hours you need to pay a once of fee of $5.
          </p>
          <div className="Comp_Activate_Included flex flex-col items-center gap-[10px] w-full mb-[15px]">
            <h2 className="Comp_Activate_Included_Heading text-cardzzz-cream text-center font-roundo font-bold text-[18px] leading-normal w-full mb-[3px]">
              alternatively:
            </h2>
            <p className="Comp_Activate_Bullets text-cardzzz-cream text-center font-satoshi font-medium text-[14px] leading-normal">
              Go to 'settings', subscribe to become a premium member, and enjoy unlimited access to all your dream-cards.
            </p>
          </div>
          <button
            type="button"
            onClick={handleActivate}
            className="Comp_Activate_Button w-full h-[54px] py-[20px] px-[10px] flex items-center justify-center rounded-[16.168px] border border-cardzzz-cream/50 bg-cardzzz-cream text-cardzzz-accent shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] cursor-pointer hover:opacity-90 transition-all"
          >
            <span className="Label text-center font-roundo font-bold text-[19px] leading-normal relative">$5</span>
          </button>
        </div>
      </div>
    </>
  );
}
