"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "info" | "warning" | "error";

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind, action?: Toast["action"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastKind, string> = {
  success: "✓",
  info: "ℹ",
  warning: "⚠",
  error: "✕",
};

const COLORS: Record<ToastKind, string> = {
  success: "bg-green-600",
  info: "bg-blue-600",
  warning: "bg-amber-500",
  error: "bg-red-600",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "success", action?: Toast["action"]) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, kind, action }]);
      const timer = setTimeout(() => dismiss(id), action ? 6000 : 3500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-xs animate-in slide-in-from-right-4 fade-in duration-200"
          >
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full ${COLORS[toast.kind]} flex items-center justify-center text-xs font-bold`}
            >
              {ICONS[toast.kind]}
            </span>
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  dismiss(toast.id);
                }}
                className="flex-shrink-0 font-semibold text-blue-300 hover:text-blue-200 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
