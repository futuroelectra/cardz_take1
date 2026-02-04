"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NavMenuModalProps = {
  isOpen: boolean;
  onClose: () => void;
  menuIconRef?: React.RefObject<HTMLButtonElement | null> | null;
};

export default function NavMenuModal({
  isOpen,
  onClose,
  menuIconRef,
}: NavMenuModalProps) {
  const router = useRouter();
  const [modalPosition, setModalPosition] = useState<{ top: number; right: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setModalPosition(null);
      return;
    }

    const updatePosition = () => {
      if (menuIconRef?.current) {
        const rect = menuIconRef.current.getBoundingClientRect();
        setModalPosition({
          top: rect.bottom + 10,
          right: window.innerWidth - rect.right,
        });
      }
    };

    requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, menuIconRef]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
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

  if (!isOpen || !modalPosition) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLinkClick = (path: string) => {
    onClose();
    if (path === "/create" || path === "/") {
      router.push("/");
    } else if (path === "/collection") {
      router.push("/collection-with-cards");
    } else if (path === "/settings") {
      router.push("/settings");
    }
  };

  return (
    <>
      <div
        className="Comp_NavMenu_Backdrop fixed inset-0 w-full h-full bg-black/40 backdrop-blur-xl z-40"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      />
      <div
        ref={modalRef}
        className="Comp_NavMenu_Modal fixed z-50 flex flex-col items-start gap-[10px] w-auto min-w-[150px] p-[15px] rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-[fadeInScale_0.2s_ease-out]"
        style={{
          top: `${modalPosition.top}px`,
          right: `${modalPosition.right}px`,
        }}
      >
        <button
          type="button"
          onClick={() => handleLinkClick("/create")}
          className="Comp_NavMenu_Link w-full text-left text-cardzzz-cream font-roundo font-bold text-[16px] leading-normal hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          create
        </button>
        <button
          type="button"
          onClick={() => handleLinkClick("/collection")}
          className="Comp_NavMenu_Link w-full text-left text-cardzzz-cream font-roundo font-bold text-[16px] leading-normal hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          collection
        </button>
        <button
          type="button"
          onClick={() => handleLinkClick("/settings")}
          className="Comp_NavMenu_Link w-full text-left text-cardzzz-cream font-roundo font-bold text-[16px] leading-normal hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          settings
        </button>
      </div>
    </>
  );
}
