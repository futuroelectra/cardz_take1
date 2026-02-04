"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function PreviewAuthPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-cardzzz-blood flex items-center justify-center p-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setError(null);
          }}
          className="px-4 py-2 rounded bg-cardzzz-cream text-cardzzz-accent font-roundo font-bold"
        >
          open modal
        </button>
        <button
          type="button"
          onClick={() => {
            setError("Invalid password");
            setIsOpen(true);
          }}
          className="px-4 py-2 rounded border border-cardzzz-cream text-cardzzz-cream font-satoshi text-sm"
        >
          open with error
        </button>
      </div>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSignUp={(email, password) => {
          console.log("Sign up", email, password);
          setIsOpen(false);
        }}
        onSignIn={(email, password) => {
          console.log("Sign in", email, password);
          setIsOpen(false);
        }}
        error={error}
      />
    </div>
  );
}
