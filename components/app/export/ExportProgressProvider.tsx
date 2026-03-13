"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

type ExportStatus = "idle" | "running" | "success" | "error";

interface ExportProgressState {
    status: ExportStatus;
    label: string;
    current: number;
    total: number;
    errorMessage?: string;
}

interface ExportProgressContextType {
    startExport: (label: string, total: number) => void;
    tickProgress: (current: number) => void;
    finishExport: () => void;
    failExport: (message?: string) => void;
    dismiss: () => void;
}

const ExportProgressContext = createContext<ExportProgressContextType | null>(null);

export function useExportProgress() {
    const ctx = useContext(ExportProgressContext);
    if (!ctx) throw new Error("useExportProgress must be used inside ExportProgressProvider");
    return ctx;
}

export function ExportProgressProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ExportProgressState>({
        status: "idle", label: "", current: 0, total: 0,
    });

    const startExport = useCallback((label: string, total: number) => {
        setState({ status: "running", label, current: 0, total });
    }, []);

    const tickProgress = useCallback((current: number) => {
        setState(prev => ({ ...prev, current }));
    }, []);

    const finishExport = useCallback(() => {
        setState(prev => ({ ...prev, status: "success", current: prev.total }));
    }, []);

    const failExport = useCallback((message?: string) => {
        setState(prev => ({ ...prev, status: "error", errorMessage: message }));
    }, []);

    const dismiss = useCallback(() => {
        setState({ status: "idle", label: "", current: 0, total: 0 });
    }, []);

    const visible = state.status !== "idle";
    const pct = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0;

    const isRunning = state.status === "running";
    const isSuccess = state.status === "success";
    const isError = state.status === "error";

    /* ── Colour tokens per state ── */
    const colorMap = {
        running: {
            accent: "#9c1328",
            accentLight: "#e8526b",
            iconBg: "linear-gradient(135deg,#fce8eb,#fbd0d7)",
            iconBorder: "rgba(192,37,61,0.2)",
            trackBg: "rgba(156,19,40,0.08)",
            barGradient: "linear-gradient(90deg,#7a0f1f 0%,#c0253d 55%,#e8526b 100%)",
            pctColor: "#c0253d",
        },
        success: {
            accent: "#059669",
            accentLight: "#34d399",
            iconBg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
            iconBorder: "rgba(52,211,153,0.3)",
            trackBg: "rgba(5,150,105,0.08)",
            barGradient: "linear-gradient(90deg,#059669,#34d399)",
            pctColor: "#059669",
        },
        error: {
            accent: "#dc2626",
            accentLight: "#f87171",
            iconBg: "linear-gradient(135deg,#fee2e2,#fecaca)",
            iconBorder: "rgba(248,113,113,0.3)",
            trackBg: "rgba(220,38,38,0.08)",
            barGradient: "linear-gradient(90deg,#dc2626,#f87171)",
            pctColor: "#dc2626",
        },
    };
    const C = colorMap[state.status === "idle" ? "running" : state.status];

    return (
        <ExportProgressContext.Provider value={{ startExport, tickProgress, finishExport, failExport, dismiss }}>
            {children}

            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="export-progress"
                        initial={{ opacity: 0, y: 50, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 360, damping: 28 }}
                        className="fixed bottom-6 right-6 z-[9999] w-[400px] pointer-events-auto select-none"
                        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                    >
                        <div
                            className="relative rounded-3xl overflow-hidden"
                            style={{
                                background: "rgba(255,255,255,0.96)",
                                backdropFilter: "blur(32px) saturate(200%)",
                                WebkitBackdropFilter: "blur(32px) saturate(200%)",
                                border: `1.5px solid rgba(${isSuccess ? "5,150,105" : isError ? "220,38,38" : "122,15,31"},0.14)`,
                                boxShadow: `0 20px 60px rgba(${isSuccess ? "5,150,105" : isError ? "220,38,38" : "122,15,31"},0.14), 0 4px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset`,
                            }}
                        >
                            {/* ── Subtle coloured glow patch top-right ── */}
                            <div
                                className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-30"
                                style={{
                                    background: `radial-gradient(circle, ${C.accentLight}, transparent 70%)`,
                                    filter: "blur(20px)",
                                }}
                            />

                            {/* ── Inner padding ── */}
                            <div className="relative px-6 pt-5 pb-6">

                                {/* ── Row 1: Icon + title + dismiss ── */}
                                <div className="flex items-start gap-4 mb-5">

                                    {/* Animated icon */}
                                    <div
                                        className="flex-shrink-0 relative w-12 h-12 rounded-2xl flex items-center justify-center"
                                        style={{
                                            background: C.iconBg,
                                            border: `1.5px solid ${C.iconBorder}`,
                                            boxShadow: `0 4px 14px rgba(${isSuccess ? "5,150,105" : isError ? "220,38,38" : "192,37,61"},0.18)`,
                                        }}
                                    >
                                        {isRunning && (
                                            <>
                                                <Loader2 className="w-5 h-5 text-[#c0253d] animate-spin" />
                                                {/* Ring pulse */}
                                                <motion.div
                                                    className="absolute inset-0 rounded-2xl"
                                                    style={{ border: "2px solid rgba(192,37,61,0.35)" }}
                                                    animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0, 0.8] }}
                                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                                />
                                            </>
                                        )}
                                        {isSuccess && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -20 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 16 }}
                                            >
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            </motion.div>
                                        )}
                                        {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
                                    </div>

                                    {/* Titles */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <p className="text-[13.5px] font-extrabold text-gray-800 leading-tight tracking-tight">
                                                {isRunning && "Generating Export…"}
                                                {isSuccess && "Export Complete!"}
                                                {isError && "Export Failed"}
                                            </p>
                                            {isSuccess && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.2, type: "spring" }}
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-gray-400 font-medium truncate leading-snug">
                                            {isError
                                                ? (state.errorMessage || "An unexpected error occurred.")
                                                : state.label}
                                        </p>
                                    </div>

                                    {/* Dismiss button — only after done */}
                                    <AnimatePresence>
                                        {(isSuccess || isError) && (
                                            <motion.button
                                                key="dismiss"
                                                initial={{ opacity: 0, scale: 0.3 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.3 }}
                                                transition={{ type: "spring", stiffness: 520, damping: 22 }}
                                                onClick={dismiss}
                                                className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all mt-0.5"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* ── Row 2: Progress section ── */}
                                <div className="space-y-3">

                                    {/* Sheet count badges */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: C.pctColor }} />
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                                {isRunning ? "Processing sheets" : isSuccess ? "Sheets exported" : "Export stopped"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {state.total > 0 && (
                                                <span
                                                    className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: `rgba(${isSuccess ? "5,150,105" : isError ? "220,38,38" : "192,37,61"},0.08)`,
                                                        color: C.pctColor,
                                                    }}
                                                >
                                                    {state.current} / {state.total}
                                                </span>
                                            )}
                                            <span
                                                className="text-[13px] font-black tabular-nums"
                                                style={{ color: C.pctColor }}
                                            >
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress bar track */}
                                    <div
                                        className="relative h-3 rounded-full overflow-hidden"
                                        style={{ background: C.trackBg }}
                                    >
                                        {/* Fill */}
                                        <motion.div
                                            className="absolute inset-y-0 left-0 h-full rounded-full"
                                            style={{ background: C.barGradient }}
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ ease: "easeOut", duration: 0.5 }}
                                        />

                                        {/* Moving shimmer on fill */}
                                        {isRunning && pct > 0 && (
                                            <motion.div
                                                className="absolute top-0 bottom-0 w-20 rounded-full"
                                                style={{
                                                    background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.55) 50%,transparent 100%)",
                                                    left: `${Math.max(0, pct - 10)}%`,
                                                }}
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                        )}

                                        {/* Gloss */}
                                        <div
                                            className="absolute inset-0 rounded-full pointer-events-none"
                                            style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.4) 0%,transparent 60%)" }}
                                        />
                                    </div>

                                    {/* Step dots — one per sheet */}
                                    {state.total > 1 && state.total <= 12 && (
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            {Array.from({ length: state.total }).map((_, i) => {
                                                const done = i < state.current;
                                                const active = i === state.current && isRunning;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        className="h-1.5 flex-1 rounded-full"
                                                        style={{
                                                            background: done
                                                                ? C.barGradient
                                                                : active
                                                                    ? `rgba(${isSuccess ? "5,150,105" : "192,37,61"},0.35)`
                                                                    : "rgba(0,0,0,0.07)",
                                                        }}
                                                        animate={active ? { opacity: [0.5, 1, 0.5] } : {}}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── Success footer ── */}
                                <AnimatePresence>
                                    {isSuccess && (
                                        <motion.div
                                            key="success-footer"
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                                                style={{
                                                    background: "linear-gradient(135deg,rgba(5,150,105,0.07),rgba(52,211,153,0.07))",
                                                    border: "1px solid rgba(52,211,153,0.2)",
                                                }}
                                            >
                                                {[0, 1, 2].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                                                    />
                                                ))}
                                                <span className="text-[11.5px] text-emerald-700 font-semibold ml-1">
                                                    Your file has been downloaded successfully
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ExportProgressContext.Provider>
    );
}
