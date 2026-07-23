"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  hideCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  hideCloseButton = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={[
        "w-full rounded-[24px] bg-white shadow-xl p-0 m-auto backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        "open:animate-[modal-in_200ms_ease-out]",
        sizeClasses[size],
      ].join(" ")}
      style={{ border: "none", margin: "auto" }}
    >
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div className="p-6">
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 className="text-lg font-semibold text-[#1B1F1C]">{title}</h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="ml-auto p-1.5 rounded-[8px] text-[#9AA39C] hover:text-[#5B655D] hover:bg-[#F4F6F3] transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
