"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, ArrowUpToLine, ArrowDownToLine, Calendar } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";

interface UnitBudget {
    id: number;
    owner_id: number;
    budget_name: string;
    opening_balance: string;
    current_balance: string;
    status: string;
}

export default function UnitBudgetTransactionPanel({
    open,
    budget,
    initialAction,
    onClose,
    onSuccess,
}: {
    open: boolean;
    budget: UnitBudget | null;
    initialAction: "ADD" | "DEDUCT" | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { showToast } = useAppToast();
    const [isClosing, setIsClosing] = useState(false);

    const [amount, setAmount] = useState("");
    const [voucherNo, setVoucherNo] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reset state on open
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            setAmount("");
            setVoucherNo("");
            setReferenceNo("");
            setDescription("");
            setDate(new Date().toISOString().split("T")[0]);
            setError("");
        }
    }, [open, budget, initialAction]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 350);
    };

    const submitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!budget || !initialAction) return;

        setError("");

        const parsedAmount = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid amount greater than 0");
            return;
        }

        const currentBalance = parseFloat(budget.current_balance);
        if (initialAction === "DEDUCT" && parsedAmount > currentBalance) {
            setError("Deduction amount cannot exceed the current running balance");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/accountant/budgets/${budget.id}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction_type: initialAction,
                    amount: parsedAmount,
                    voucher_no: voucherNo || null,
                    fund_reference: referenceNo || null,
                    description,
                    transaction_date: date
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast("Success", "Transaction processed successfully.", "success");
                onSuccess(); // Triggers refresh on parent
                handleClose(); // Auto-close
            } else {
                setError(data.message || "Failed to process transaction");
            }
        } catch (err: any) {
            setError(err.message || "Network error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open && !isClosing) return null;

    const accentColor = initialAction === "ADD" ? "bg-green-600" : "bg-[#7a0f1f]";
    const textAccentColor = initialAction === "ADD" ? "text-green-700" : "text-[#7a0f1f]";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full max-w-sm bg-white z-50 flex flex-col shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
            >
                {/* Header */}
                <div className={`flex-shrink-0 px-6 py-4 text-white flex justify-between items-center ${accentColor}`}>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            {initialAction === 'ADD' ? <ArrowUpToLine className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
                            {initialAction === 'ADD' ? 'Add Funds' : 'Deduct Funds'}
                        </h2>
                        {budget && (
                            <p className="text-white/80 text-xs mt-0.5">
                                {budget.budget_name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-md hover:bg-black/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30 p-6 overflow-y-auto">
                    {budget && (
                        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Balance</p>
                            <p className={`text-2xl font-black ${textAccentColor}`}>
                                ₱{parseFloat(budget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form id="txForm" onSubmit={submitTransaction} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₱) <span className="text-red-500">*</span></label>
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-shadow font-bold text-lg ${initialAction === "ADD" ? "focus:border-green-600 focus:ring-green-600" : "focus:border-[#7a0f1f] focus:ring-[#7a0f1f]"}`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-shadow text-sm ${initialAction === "ADD" ? "focus:border-green-600 focus:ring-green-600" : "focus:border-[#7a0f1f] focus:ring-[#7a0f1f]"}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Voucher No. (Optional)</label>
                            <input
                                type="text"
                                value={voucherNo}
                                onChange={(e) => setVoucherNo(e.target.value)}
                                placeholder="e.g. VOUCHER-ABCD"
                                className={`w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-shadow ${initialAction === "ADD" ? "focus:border-green-600 focus:ring-green-600" : "focus:border-[#7a0f1f] focus:ring-[#7a0f1f]"}`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reference No. (Optional)</label>
                            <input
                                type="text"
                                value={referenceNo}
                                onChange={(e) => setReferenceNo(e.target.value)}
                                placeholder="Cheque / Draft No."
                                className={`w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-shadow ${initialAction === "ADD" ? "focus:border-green-600 focus:ring-green-600" : "focus:border-[#7a0f1f] focus:ring-[#7a0f1f]"}`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Particulars / Reason..."
                                rows={2}
                                className={`w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-shadow resize-none ${initialAction === "ADD" ? "focus:border-green-600 focus:ring-green-600" : "focus:border-[#7a0f1f] focus:ring-[#7a0f1f]"}`}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                    <button
                        type="submit"
                        form="txForm"
                        disabled={isSubmitting}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors shadow-sm disabled:opacity-70 ${initialAction === 'ADD' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#7a0f1f] hover:bg-[#5b0815]'}`}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialAction === 'ADD' ? 'Confirm Addition' : 'Confirm Deduction')}
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full mt-3 py-2.5 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    );
}
