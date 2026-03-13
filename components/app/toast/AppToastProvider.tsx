"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useAppToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAppToast must be used inside AppToastProvider");
  return ctx;
}

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (title: string, description?: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const newToast: Toast = { id, title, description, type };
  
      // Put new toast at the TOP
      setToasts((prev) => [newToast, ...prev]);
  
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles: Record<ToastType, string> = {
    success: "bg-[#16a34a] shadow-lg shadow-[#16a34a]/30",
    error: "bg-[#dc2626] shadow-lg shadow-[#dc2626]/30",
    warning: "bg-[#ea580c] shadow-lg shadow-[#ea580c]/30",
    info: "bg-[#7B0F2B] shadow-lg shadow-[#7B0F2B]/30",
  };

  const typeIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-white" />,
    error: <XCircle className="w-5 h-5 text-white" />,
    warning: <AlertTriangle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed top-6 right-6 z-[200] w-[360px] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{
                opacity: 0,
                x: 100,
                scale: 0.95,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                x: 100,
                scale: 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
              }}
              whileHover={{
                scale: 1.02,
              }}
              className={cn(
                "rounded-2xl p-4 text-white flex gap-3 items-start border border-white/20 will-change-transform",
                typeStyles[toast.type]
              )}
            >
              <div className="mt-0.5">{typeIcons[toast.type]}</div>

              <div className="flex-1">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-white/80 mt-1">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}