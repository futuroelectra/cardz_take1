"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RawNavMenuModalProps = {
  isOpen: boolean;
  onClose: () => void;
  menuIconRef?: React.RefObject<HTMLButtonElement | null> | null;
};

export default function RawNavMenuModal({
  isOpen,
  onClose,
  menuIconRef,
}: RawNavMenuModalProps) {
  const router = useRouter();
  const [modalPosition, setModalPosition] = useState<{ top: number; right: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate modal position based on menu icon position
  // Modal should appear below the menu icon in the top-right corner
  useEffect(() => {
    if (!isOpen) {
      // Reset position when closed to prevent flash on next open
      setModalPosition(null);
      return;
    }

    const updatePosition = () => {
      if (menuIconRef?.current) {
        const rect = menuIconRef.current.getBoundingClientRect();
        // Position modal below the menu icon, aligned to the right
        // The menu icon itself will change to exit icon in place
        setModalPosition({
          top: rect.bottom + 10, // 10px gap below the icon
          right: window.innerWidth - rect.right, // Align right edge with icon's right edge
        });
      }
    };

    // Calculate position immediately using requestAnimationFrame to ensure DOM is ready
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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render until position is calculated to prevent flash
  if (!isOpen || !modalPosition) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLinkClick = (path: string) => {
    console.log("Navigate to:", path);
    onClose();
    if (path === "/create" || path === "/") {
      router.push("/");
    } else if (path === "/collection") {
      router.push("/collection-with-cards");
    } else if (path === "/settings") {
      router.push("/settings");
    } else {
      // TODO: Implement navigation for other paths
      console.log("Navigation to", path, "not yet implemented");
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="Comp_NavMenu_Backdrop fixed inset-0 w-full h-full bg-black/40 backdrop-blur-xl z-40"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      />

      {/* Modal Container - Small box positioned below menu icon in top-right */}
      <div
        ref={modalRef}
        className="Comp_NavMenu_Modal fixed z-50 flex flex-col items-start gap-[10px] w-auto min-w-[150px] p-[15px] rounded-[20px] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-[fadeInScale_0.2s_ease-out]"
        style={{
          top: `${modalPosition.top}px`,
          right: `${modalPosition.right}px`,
        }}
      >
        {/* Menu Items */}
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
