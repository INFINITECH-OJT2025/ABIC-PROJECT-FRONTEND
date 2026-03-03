"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

const BORDER = "rgba(0,0,0,0.12)";

export interface ConfirmationModalProps {
    /** Whether the modal is visible. */
    open: boolean;
    /** Title displayed inside the card. */
    title: string;
    /** Body message — can be a string or any JSX. */
    message: React.ReactNode;
    /** Label for the confirm button. Defaults to "Confirm". */
    confirmLabel?: string;
    /** Label for the cancel button. Defaults to "Cancel". */
    cancelLabel?: string;
    /** Lucide icon to display in the floating icon circle. */
    icon: LucideIcon;
    /**
     * Accent color (hex or CSS color) applied to:
     *  - the floating icon circle background
     *  - the confirm button background
     * Defaults to the orange "#f97316" (matches Tailwind orange-500).
     */
    color?: string;
    /** Called when the user clicks Cancel or the backdrop. */
    onCancel: () => void;
    /** Called when the user clicks the confirm button. */
    onConfirm: () => void;
    /** Whether the confirm button is in a loading / disabled state. */
    isConfirming?: boolean;
    /** Optional z-index for the modal overlay. Defaults to 100. */
    zIndex?: number;
}

export default function ConfirmationModal({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    icon: Icon,
    color = "#f97316",
    onCancel,
    onConfirm,
    isConfirming = false,
    zIndex = 100,
}: ConfirmationModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.45)", zIndex }}
            onClick={onCancel}
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirm-modal-title"
        >
            {/* Stop clicks inside the card from closing the modal */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                {/* Floating icon circle — uses the accent color */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: color }}
                    >
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Card */}
                <div
                    className="w-96 rounded-lg p-6 pt-12 shadow-xl border bg-white"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col items-center text-center">
                        <div
                            id="confirm-modal-title"
                            className="text-lg font-bold text-[#5f0c18]"
                        >
                            {title}
                        </div>

                        <div className="mt-2 text-sm text-neutral-800">
                            {message}
                        </div>

                        <div className="mt-6 w-full flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isConfirming}
                                className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isConfirming}
                                className="flex-1 h-10 rounded-lg font-semibold text-white disabled:opacity-50 transition active:scale-95"
                                style={{ backgroundColor: color }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                                {isConfirming ? "Please wait…" : confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
