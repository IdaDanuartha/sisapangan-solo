"use client";

import { useEffect, useState, createContext, useContext, useCallback, useRef, type ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4500) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — top-right on desktop, top on mobile */}
      <div
        role="region"
        aria-label="Notifikasi"
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-[#3AA65A]" />,
    error: <AlertCircle size={16} className="text-[#D14343]" />,
    info: <Info size={16} className="text-[#2F6E4F]" />,
    warning: <AlertCircle size={16} className="text-[#F0A93B]" />,
  };

  const borderColors: Record<ToastType, string> = {
    success: "border-l-[#3AA65A]",
    error: "border-l-[#D14343]",
    info: "border-l-[#2F6E4F]",
    warning: "border-l-[#F0A93B]",
  };

  return (
    <div
      role="alert"
      className={[
        "pointer-events-auto flex items-start gap-3 bg-white rounded-[12px] shadow-lg px-4 py-3 border-l-4 transition-all duration-300",
        borderColors[toast.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      ].join(" ")}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <p className="flex-1 text-sm text-[#1B1F1C]">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="flex-shrink-0 p-0.5 text-[#9AA39C] hover:text-[#5B655D] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
