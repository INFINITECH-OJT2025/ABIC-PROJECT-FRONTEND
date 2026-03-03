"use client";

import React from "react";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  darkMode?: boolean;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  darkMode = false,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  const BORDER = darkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.12)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background: darkMode
          ? "rgba(255,255,255,0.45)"
          : "rgba(0,0,0,0.45)",
      }}
    >
      <div className="relative">
        {/* Top Icon Circle */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
              darkMode ? "bg-[#7B0F2B]" : "bg-[#7a0f1f]"
            }`}
          >
            <LogOut className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Card */}
        <div
          className={`w-96 rounded-lg p-6 pt-12 shadow-xl border transition-colors duration-300 ${
            darkMode
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-900"
          }`}
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`text-lg font-bold transition-colors duration-300 ${
                darkMode ? "text-white" : "text-[#5f0c18]"
              }`}
            >
              Confirm Logout
            </div>

            <div
              className={`mt-2 text-sm transition-colors duration-300 ${
                darkMode ? "text-gray-300" : "text-neutral-800"
              }`}
            >
              Are you sure you want to sign out? You will need to log back in to access your dashboard.
            </div>

            {/* Buttons */}
            <div className="mt-6 w-full flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                className="flex-1 h-10 rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white transition active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}