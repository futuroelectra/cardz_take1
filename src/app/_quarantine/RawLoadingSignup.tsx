"use client";

import { useState, useEffect } from "react";

const phrases = [
  "robots at work...",
  "rendering love...",
  "launching servers...",
];

type RawLoadingSignupProps = {
  onNavigateToEditor?: () => void;
};

export default function RawLoadingSignup({ onNavigateToEditor }: RawLoadingSignupProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsVisible(true);
      }, 300); // Wait for fade-out to complete
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigateToEditor?.();
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [onNavigateToEditor]);

  return (
    <div className="Layout_signup flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden px-[15px]">
      <div className="Section_page_content flex flex-col items-center gap-[15px] w-full max-w-[400px] relative">
        <div className="Section_signup_container flex flex-col items-center gap-[17px] w-full relative">
          <div className="Section_signup flex flex-col items-start gap-[13px] w-full max-w-[400px] relative">
            {/* Loading Animation Section */}
            <div className="Section_loading_header flex flex-col items-center gap-[13px] w-full relative">
              <div className="Comp_loading_visual flex flex-col items-center gap-[13px] w-full relative">
                <div className="Comp_loadinganimation w-[90px] h-[90px] relative flex items-center justify-center">
                  {/* Outer ring - slow rotation */}
                  <div className="absolute w-[90px] h-[90px] border-4 border-cardzzz-cream/20 border-t-cardzzz-cream/60 rounded-full animate-spin" style={{ animationDuration: "3s" }}></div>
                  {/* Middle ring - medium rotation */}
                  <div className="absolute w-[70px] h-[70px] border-[3px] border-cardzzz-cream/30 border-r-cardzzz-cream/70 rounded-full animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}></div>
                  {/* Inner ring - fast rotation */}
                  <div className="absolute w-[50px] h-[50px] border-2 border-cardzzz-cream/40 border-b-cardzzz-cream rounded-full animate-spin" style={{ animationDuration: "1s" }}></div>
                  {/* Pulsing center dot */}
                  <div className="absolute w-[12px] h-[12px] bg-cardzzz-cream rounded-full animate-pulse"></div>
                </div>
                <div className={`Comp_LoadingPhrases w-full text-cardzzz-cream text-center font-roundo font-bold text-[19px] leading-normal relative transition-opacity duration-300 ease-in-out min-h-[28px] ${isVisible ? "opacity-100" : "opacity-0"}`}>
                  {phrases[currentPhraseIndex]}
                </div>
              </div>
              <div className="BodyText w-full text-cardzzz-cream text-center font-satoshi font-medium text-[14px] leading-normal relative">
                Thank you for creating account, your creation will be ready for tinker changes soon.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
