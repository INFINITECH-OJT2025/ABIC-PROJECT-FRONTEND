"use client";

import React, { useEffect, useRef, useState } from "react";

interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  darkMode?: boolean;
  zIndex?: number;
}

export default function LoadingModal({
  isOpen,
  title,
  message,
  darkMode = false,
  zIndex = 100,
}: LoadingModalProps) {
  const [visible, setVisible] = useState(false);
  const openTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // When opening
      openTimeRef.current = Date.now();
      setVisible(true);
    } else if (visible && openTimeRef.current) {
      // When closing → enforce 1 second minimum
      const elapsed = Date.now() - openTimeRef.current;
      const remaining = Math.max(1000 - elapsed, 0);

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        openTimeRef.current = null;
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  if (!visible) return null;

  const BORDER = darkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.12)";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        zIndex,
        background: darkMode
          ? "rgba(255,255,255,0.45)"
          : "rgba(0,0,0,0.45)",
      }}
    >
      <div className="relative">
        {/* Loading Circle */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${darkMode ? "bg-[#7B0F2B]" : "bg-[#7a0f1f]"
              }`}
          >
            <div
              className={`animate-spin rounded-full h-8 w-8 ${darkMode
                ? "border-b-2 border-gray-200"
                : "border-b-2 border-white"
                }`}
            ></div>
          </div>
        </div>

        {/* Card */}
        <div
          className={`w-96 rounded-lg p-6 pt-12 shadow-xl border transition-colors duration-300 ${darkMode
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-900"
            }`}
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col items-center">
            <div
              className={`text-lg font-bold text-center transition-colors duration-300 ${darkMode ? "text-white" : "text-[#5f0c18]"
                }`}
            >
              {title}
            </div>

            <div
              className={`mt-2 text-sm text-center transition-colors duration-300 ${darkMode
                ? "text-gray-300"
                : "text-neutral-800"
                }`}
            >
              {message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}