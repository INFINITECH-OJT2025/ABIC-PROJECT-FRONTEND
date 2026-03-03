"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Download, FileText, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewImagePanelFile {
    /** Display name of the file */
    name: string;
    /** URL or base64 data URI to display */
    src: string;
    /** MIME type, e.g. "image/png" or "application/pdf" */
    type?: string;
    /** Optional file size in bytes */
    size?: number;
}

export interface ViewImagePanelProps {
    open: boolean;
    file: ViewImagePanelFile | null;
    onClose: () => void;
    /** Optional z-index override, defaults to 60 */
    zIndex?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type?: string, src?: string): boolean {
    if (type) return type.startsWith("image/");
    if (src) return /\.(jpe?g|png|gif|webp|svg|bmp)(\?|#|$)/i.test(src);
    return false;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ViewImagePanel({
    open,
    file,
    onClose,
    zIndex = 60,
}: ViewImagePanelProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Reset zoom when file changes
    useEffect(() => {
        setZoom(1);
    }, [file]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    function handleClose() {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setZoom(1);
        }, 350);
    }

    function handleDownload() {
        if (!file) return;
        const a = document.createElement("a");
        a.href = file.src;
        a.download = file.name;
        a.click();
    }

    if (!open && !isClosing) return null;

    const showImage = isImage(file?.type, file?.src);
    const animationStyle = isClosing
        ? "viewPanelSlideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
        : "viewPanelSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)";

    const panelContent = (
        <>
            {/* Global keyframes — injected once, portal-safe */}
            <style>{`
                @keyframes viewPanelSlideIn {
                    from { transform: translateX(100%); }
                    to   { transform: translateX(0); }
                }
                @keyframes viewPanelSlideOut {
                    from { transform: translateX(0); }
                    to   { transform: translateX(100%); }
                }
            `}</style>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                style={{ zIndex }}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white flex flex-col rounded-md overflow-hidden shadow-xl"
                style={{
                    width: "min(96vw, 64rem)",
                    zIndex: zIndex + 1,
                    animation: animationStyle,
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.18)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                            {showImage ? (
                                <ZoomIn className="w-5 h-5 text-white" />
                            ) : (
                                <FileText className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold truncate">{file?.name ?? "Preview"}</h2>
                            {file?.size != null && (
                                <p className="text-sm text-white/90 mt-0.5">{formatFileSize(file.size)}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {/* Zoom controls — only for images */}
                        {showImage && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                    title="Zoom out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold tabular-nums min-w-[38px] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                    title="Zoom in"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoom(1)}
                                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                                    title="Reset zoom"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <div className="w-px h-6 bg-white/20 mx-1" />
                            </>
                        )}

                        <button
                            type="button"
                            onClick={handleDownload}
                            className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 rounded-md hover:bg-white/20 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-6">
                    {!file ? (
                        <p className="text-gray-400 text-sm">No file selected.</p>
                    ) : showImage ? (
                        <div
                            className="transition-transform duration-200 ease-out"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                        >
                            <img
                                src={file.src}
                                alt={file.name}
                                className="max-w-full rounded-lg shadow-xl border border-gray-200 object-contain"
                                style={{ maxHeight: "calc(100vh - 10rem)" }}
                                draggable={false}
                            />
                        </div>
                    ) : (
                        /* PDF or unknown — embed via iframe */
                        <iframe
                            src={file.src}
                            title={file.name}
                            className="w-full rounded-lg shadow-xl border border-gray-200 bg-white"
                            style={{ height: "calc(100vh - 10rem)" }}
                        />
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(panelContent, document.body);
}
