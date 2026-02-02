"use client";

import { useState, useEffect } from "react";

type LoadingPhase = "signup" | "accountCreated" | "loading" | "complete";

const phrases = [
  "robots at work...",
  "rendering love...",
  "launching servers...",
];

type RawLoadingSignupProps = {
  onNavigateToEditor?: () => void;
};

export default function RawLoadingSignup({ onNavigateToEditor }: RawLoadingSignupProps) {
  const [phase, setPhase] = useState<LoadingPhase>("signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsFormValid(
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.password.trim() !== ""
    );
  }, [formData]);

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
    if (phase === "accountCreated") {
      const timer = setTimeout(() => {
        onNavigateToEditor?.();
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [phase, onNavigateToEditor]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      setPhase("accountCreated");
      // Later we can add setTimeout to transition to next screen
      // setTimeout(() => {
      //   setPhase("complete");
      // }, 5000);
    }
  };

  if (phase === "accountCreated") {
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

  if (phase === "loading") {
    return (
      <div className="Layout_signup flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden">
        <div className="Section_loading flex flex-col items-center gap-[15px] w-[390px] relative">
          <div className="Comp_loading flex flex-col items-center gap-[13px] w-[155px] relative">
            <div className="Comp_loadinganimation w-[90px] h-[90px] relative flex items-center justify-center">
              <div className="w-[90px] h-[90px] border-4 border-cardzzz-cream/30 border-t-cardzzz-cream rounded-full animate-spin"></div>
            </div>
            <div className={`Comp_LoadingPhrases w-full text-cardzzz-cream text-center font-roundo font-bold text-[19px] leading-normal relative transition-opacity duration-300 ease-in-out min-h-[28px] ${isVisible ? "opacity-100" : "opacity-0"}`}>
              {phrases[currentPhraseIndex]}
            </div>
          </div>
          <div className="BodyText w-full text-cardzzz-cream text-center font-satoshi font-medium text-[14px] leading-normal relative">
            Whilst we wait, please create an account so we know where to save your dream card...
          </div>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="Layout_signup flex flex-col items-center justify-center w-full h-screen bg-gradient-to-b from-cardzzz-wine to-cardzzz-blood overflow-hidden">
        <div className="text-cardzzz-cream font-roundo text-[24px]">
          complete
        </div>
      </div>
    );
  }

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
                Whilst we wait, please create an account so we know where to save your dream card...
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="section_signup_inputs flex flex-col items-start gap-[13px] w-full relative"
            >
              <div className="Comp_Input_Field_Unfilled w-full relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Name"
                  className="PlaceholderText w-full py-[10px] px-[27px] text-cardzzz-cream font-satoshi font-normal text-[14px] leading-normal relative bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] placeholder:text-cardzzz-muted outline-none focus:border-cardzzz-cream/40 transition-colors"
                />
              </div>
              <div className="Comp_Input_Field_Unfilled w-full relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Email"
                  className="PlaceholderText w-full py-[10px] px-[27px] text-cardzzz-cream font-satoshi font-normal text-[14px] leading-normal relative bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] placeholder:text-cardzzz-muted outline-none focus:border-cardzzz-cream/40 transition-colors"
                />
              </div>
              <div className="Comp_Input_Field_Unfilled w-full relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Password"
                  className="PlaceholderText w-full py-[10px] px-[27px] text-cardzzz-cream font-satoshi font-normal text-[14px] leading-normal relative bg-white/10 backdrop-blur-md border border-white/20 rounded-[20px] placeholder:text-cardzzz-muted outline-none focus:border-cardzzz-cream/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`Comp_Button w-full h-[54px] py-[20px] px-[10px] flex items-center justify-center gap-[10px] rounded-[16.168px] border transition-all ${
                  isFormValid
                    ? "bg-cardzzz-cream text-cardzzz-accent border-cardzzz-cream/50 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] cursor-pointer hover:opacity-90"
                    : "border-cardzzz-cream bg-transparent text-cardzzz-cream cursor-not-allowed"
                }`}
              >
                <span className="Label text-center font-roundo font-bold text-[19px] leading-normal relative">
                  create account
                </span>
              </button>
            </form>
            <div className="T_C_text w-full text-cardzzz-cream text-center font-satoshi font-normal text-[10px] leading-normal relative">
              By creating an account you acknowledge that you have read and agreed to our{" "}
              <button type="button" className="underline hover:text-cardzzz-cream/80 transition-colors cursor-pointer">
                privacy policy
              </button>{" "}
              and{" "}
              <button type="button" className="underline hover:text-cardzzz-cream/80 transition-colors cursor-pointer">
                terms of service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
