"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Printer,
    Download,
    CheckCircle2,
    ArrowDownCircle,
    ArrowUpCircle,
    Tag,
    FileText,
} from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import { SuccessTransactionData } from "./types";
import { generateReceiptPDF } from "./ReceiptGenerator";
import { formatDate, getTransactionTypeLabel } from "@/components/app/super/accountant/helpers";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = "#7a0f1f";
const BORDER = "rgba(0,0,0,0.12)";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtAmount(amount: string): string {
    const n = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(n)) return "₱0.00";
    return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────────
export interface TransactionSuccessPanelProps {
    open: boolean;
    transactionData: SuccessTransactionData | null;
    transactionType: "DEPOSIT" | "WITHDRAWAL";
    onClose: () => void;
}

// ─── Row Component ─────────────────────────────────────────────────────────────
function SummaryRow({
    label,
    value,
    labelClass = "text-xs font-semibold text-gray-700",
    valueClass = "text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]",
    border = true,
}: {
    label: string;
    value: React.ReactNode;
    labelClass?: string;
    valueClass?: string;
    border?: boolean;
}) {
    return (
        <div
            className={`flex items-start justify-between gap-2 ${border ? "pb-3 border-b" : ""}`}
            style={border ? { borderColor: BORDER } : {}}
        >
            <span className={labelClass}>{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function TransactionSuccessPanel({
    open,
    transactionData,
    transactionType,
    onClose,
}: TransactionSuccessPanelProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [receiptUploaded, setReceiptUploaded] = useState(false);

    const { showToast } = useAppToast();
    const d = transactionData;

    // ── Auto-Upload Receipt to Firebase ────────────────────────────────────────
    useEffect(() => {
        if (open && d && !receiptUploaded && !isUploadingReceipt) {
            const uploadReceipt = async () => {
                setIsUploadingReceipt(true);
                try {
                    // 1. Generate PDF blob
                    const blob = await generateReceiptPDF(d, transactionType);

                    // 2. Prepare form data
                    const body = new FormData();
                    const fileName = `Receipt_${d.voucher_no ?? d.id}.pdf`;
                    body.append("receipt", new File([blob], fileName, { type: "application/pdf" }));

                    // 3. Upload to backend
                    const endpoint = `/api/accountant/transactions/${d.id}/receipt`;
                    const res = await fetch(endpoint, {
                        method: "POST",
                        body,
                    });

                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                        setReceiptUploaded(true);
                        console.log("Receipt successfully uploaded to Firebase");
                    } else {
                        console.error("Failed to upload receipt:", data.message);
                    }
                } catch (err) {
                    console.error("Error auto-uploading receipt:", err);
                } finally {
                    setIsUploadingReceipt(false);
                }
            };

            uploadReceipt();
        }
    }, [open, d, receiptUploaded, isUploadingReceipt, transactionType]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    function handleClose() {
        if (isUploadingReceipt) return; // Prevent closing while uploading
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 350);
    }

    async function handlePrint() {
        if (!d) return;
        setIsPrinting(true);
        try {
            const blob = await generateReceiptPDF(d, transactionType);
            const url = URL.createObjectURL(blob);
            const win = window.open(url, "_blank");
            if (win) {
                win.onload = () => { win.focus(); win.print(); };
            }
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
            console.error("Print failed:", err);
        } finally {
            setIsPrinting(false);
        }
    }

    async function handleDownload() {
        if (!d) return;
        setIsDownloading(true);
        try {
            const blob = await generateReceiptPDF(d, transactionType);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `receipt_${d.voucher_no ?? Date.now()}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setIsDownloading(false);
        }
    }

    // ── Guards ──────────────────────────────────────────────────────────────────
    if (!open && !isClosing) return null;
    if (!d) return null;

    const voucherMode = d.voucherMode ?? "NO_VOUCHER";
    const instrumentNumbers = d.instrumentNumbers ?? [];
    const isChequeType = d.transaction_type === "CHEQUE" || d.transaction_type === "CHEQUE DEPOSIT" || d.transaction_type === "DEPOSIT SLIP";
    const hasInstruments = isChequeType && (instrumentNumbers.length > 0 || (d.instrument_no && d.instrument_no.trim()));
    const instrumentLabel = d.transaction_type === "CHEQUE" ? "Cheque Numbers" : "Deposit Slip Numbers";

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"} ${isUploadingReceipt ? "pointer-events-none cursor-wait" : ""}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Slide-in Panel */}
            <div
                className="fixed top-0 rounded-md right-0 bottom-0 h-screen w-full bg-white z-50 flex flex-col overflow-hidden shadow-2xl"
                style={{
                    maxWidth: "28rem",
                    animation: isClosing
                        ? "slideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
                        : "slideIn 0.4s cubic-bezier(0.32,0.72,0,1)",
                    boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
                }}
            >
                {/* ── Panel Header (gradient, same as Transaction Summary) ── */}
                <div
                    className="flex-shrink-0 px-6 py-6 text-white relative"
                    style={{ background: "linear-gradient(135deg, #7a0f1f, #a4163a)" }}
                >
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploadingReceipt}
                        className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors ${isUploadingReceipt ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20"
                            }`}
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Success badge */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white/90 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                            Transaction Successful
                        </div>
                    </div>

                    {/* Label */}
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">
                        Transaction Summary
                    </p>

                    {/* Amount */}
                    <p className="text-3xl font-bold mb-3">{fmtAmount(d.amount)}</p>

                    {/* Mode + voucher badges */}
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${transactionType === "DEPOSIT" ? "bg-green-500/20 text-green-200" : "bg-red-500/30 text-red-200"}`}>
                            {transactionType === "DEPOSIT"
                                ? <ArrowDownCircle className="w-3 h-3" />
                                : <ArrowUpCircle className="w-3 h-3" />}
                            {transactionType}
                        </span>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-white/20 text-white/90">
                            {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                        </span>
                    </div>
                </div>

                {/* ── Action Buttons ──────────────────────────────────────── */}
                <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b bg-gray-50/80" style={{ borderColor: BORDER }}>
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                        style={{ background: isPrinting ? "#555" : ACCENT }}
                    >
                        {isPrinting
                            ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                            : <Printer className="w-4 h-4" />}
                        {isPrinting ? "Generating…" : "Print"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold border transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 bg-white text-gray-700 hover:bg-gray-50"
                        style={{ borderColor: BORDER }}
                    >
                        {isDownloading
                            ? <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                            : <Download className="w-4 h-4" />}
                        {isDownloading ? "Saving…" : "Download"}
                    </button>
                    {isUploadingReceipt && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 animate-pulse ml-2">
                            <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                            Saving to cloud...
                        </div>
                    )}
                </div>

                {/* ── Scrollable Content (mirrors Transaction Summary) ──── */}
                <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f1f1" }}>
                    <div className="p-6 space-y-4">

                        {/* Type */}
                        <SummaryRow
                            label="Type"
                            value={voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                        />

                        {/* Voucher group */}
                        {voucherMode === "WITH_VOUCHER" && (d.voucher_no || d.voucher_date) && (
                            <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                                {d.voucher_no && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs text-gray-600 shrink-0">Voucher No.</span>
                                        <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                            {d.voucher_no}
                                        </span>
                                    </div>
                                )}
                                {d.voucher_date && (
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs text-gray-600 shrink-0">Voucher Date</span>
                                        <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                            {formatDate(d.voucher_date)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transaction Type */}
                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Transaction Type</span>
                                <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                    {getTransactionTypeLabel(d.transaction_type) || "—"}
                                </span>
                            </div>
                            {hasInstruments && (
                                <div className="mt-2">
                                    <div className="text-xs text-gray-600 mb-1">{instrumentLabel}</div>
                                    <div className="space-y-1">
                                        {instrumentNumbers.length > 0
                                            ? instrumentNumbers.map((num, idx) => (
                                                <div key={idx} className="text-sm font-medium text-gray-900 text-right">
                                                    {num}
                                                </div>
                                            ))
                                            : d.instrument_no && d.instrument_no.trim()
                                                ? <div className="text-sm font-medium text-gray-900 text-right">{d.instrument_no}</div>
                                                : null}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Owners group */}
                        <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Main</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                    {d.fromOwnerName || "—"}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Owner</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                    {d.toOwnerName || "—"}
                                </span>
                            </div>
                        </div>

                        {/* Unit */}
                        {d.unit_name && (
                            <SummaryRow label="Unit" value={d.unit_name} labelClass="text-xs font-semibold text-gray-700 shrink-0" valueClass="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]" />
                        )}

                        {/* Particulars — stacked */}
                        {d.particulars && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                <span className="text-xs font-semibold text-gray-700 block mb-1">Particulars</span>
                                <span className="text-sm font-medium text-gray-900 block text-right break-words whitespace-pre-wrap">
                                    {d.particulars}
                                </span>
                            </div>
                        )}

                        {/* Fund Reference */}
                        {d.fund_reference && (
                            <SummaryRow label="Fund Reference" value={d.fund_reference} labelClass="text-xs font-semibold text-gray-700 shrink-0" valueClass="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]" />
                        )}

                        {/* Person in Charge */}
                        {d.person_in_charge && (
                            <SummaryRow label="Person in Charge" value={d.person_in_charge} labelClass="text-xs font-semibold text-gray-700 shrink-0" valueClass="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]" />
                        )}

                        {/* Attachments */}
                        {(d.attachmentsCount ?? 0) > 0 && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-700 shrink-0 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                                        Attachments
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {d.attachmentsCount} file{d.attachmentsCount !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Total Amount box */}
                        <div className="rounded-md bg-gray-100 p-4 flex items-center justify-between mt-2">
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Total Amount</span>
                            <span className="text-2xl font-bold" style={{ color: "#4A081A" }}>
                                {fmtAmount(d.amount)}
                            </span>
                        </div>

                        {/* Tag line */}
                        <div className="flex items-center justify-center gap-1.5 pt-2 pb-1 text-xs text-gray-400">
                            <Tag className="w-3 h-3" />
                            ABIC Realty &amp; Consultancy Corporation
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
