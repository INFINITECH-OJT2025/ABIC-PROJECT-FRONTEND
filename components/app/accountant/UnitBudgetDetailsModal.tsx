"use client";
import React, { useState, useEffect } from "react";
import { X, ArrowDownToLine, ArrowUpToLine, Loader2, Calendar } from "lucide-react";

interface UnitBudget {
    id: number;
    owner_id: number;
    budget_name: string;
    opening_balance: string;
    current_balance: string;
    status: string;
}

interface Transaction {
    id: number;
    unit_budget_id: number;
    transaction_type: "OPENING" | "ADD" | "DEDUCT";
    amount: string;
    description: string;
    transaction_date: string;
}

export default function UnitBudgetDetailsModal({
    budget,
    initialAction,
    onClose
}: {
    budget: UnitBudget;
    initialAction: "ADD" | "DEDUCT" | null;
    onClose: () => void;
}) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | null>(initialAction);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Use local state to show updated balance immediately upon transaction
    const [currentBalance, setCurrentBalance] = useState<number>(parseFloat(budget.current_balance));

    const fetchTransactions = React.useCallback(() => {
        setLoading(true);
        fetch(`/api/accountant/budgets/${budget.id}/transactions`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTransactions(data.data || []);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [budget.id]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const submitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!actionType) return;

        const parsedAmount = parseFloat(amount.replace(/,/g, ""));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid amount greater than 0");
            return;
        }

        if (actionType === "DEDUCT" && parsedAmount > currentBalance) {
            setError("Deduction amount cannot exceed the current running balance");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/accountant/budgets/${budget.id}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction_type: actionType,
                    amount: parsedAmount,
                    description,
                    transaction_date: date
                })
            });

            const data = await res.json();
            if (data.success) {
                setAmount("");
                setDescription("");
                setActionType(null);
                setCurrentBalance(parseFloat(data.current_balance));
                fetchTransactions(); // Refresh
            } else {
                setError(data.message || "Failed to process transaction");
            }
        } catch (err: any) {
            setError(err.message || "Network error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#7a0f1f] text-white">
                    <div>
                        <h2 className="text-xl font-bold">{budget.budget_name} Ledger</h2>
                        <p className="text-red-100 text-sm mt-0.5">Running Balance: <span className="font-bold text-white tracking-widest text-base ml-1">₱{currentBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></p>
                    </div>
                    <button onClick={onClose} className="text-red-200 hover:text-white transition-colors p-1 rounded-full hover:bg-red-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    {/* Left Side: Ledger Table */}
                    <div className="flex-1 border-r border-gray-100 bg-gray-50/30 flex flex-col min-h-0 p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Transaction History</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActionType("ADD")}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${actionType === 'ADD' ? 'bg-green-100 text-green-800 ring-2 ring-green-500 ring-offset-1' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                >
                                    <ArrowUpToLine className="w-4 h-4" /> Add
                                </button>
                                <button
                                    onClick={() => setActionType("DEDUCT")}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${actionType === 'DEDUCT' ? 'bg-red-100 text-[#7a0f1f] ring-2 ring-[#7a0f1f] ring-offset-1' : 'bg-red-50 text-[#7a0f1f] hover:bg-red-100'}`}
                                >
                                    <ArrowDownToLine className="w-4 h-4" /> Deduct
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-32">Date</th>
                                        <th className="px-4 py-3 font-semibold">Description</th>
                                        <th className="px-4 py-3 font-semibold text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                                Loading ledger...
                                            </td>
                                        </tr>
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                                No transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-500">
                                                    {new Date(tx.transaction_date).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {tx.transaction_type === 'OPENING' && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold tracking-wider">OPENING</span>}
                                                        {tx.transaction_type === 'ADD' && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold tracking-wider">ADDITION</span>}
                                                        {tx.transaction_type === 'DEDUCT' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold tracking-wider">DEDUCTION</span>}
                                                        <span className="font-medium text-gray-800">{tx.description || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold ${tx.transaction_type === "DEDUCT" ? "text-red-600" : "text-green-600"}`}>
                                                    {tx.transaction_type === "DEDUCT" ? "-" : "+"}
                                                    ₱{parseFloat(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side: Action Form (Slide in when ADD or DEDUCT is clicked) */}
                    {actionType && (
                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 bg-white p-6 flex flex-col min-h-0 overflow-y-auto animate-in slide-in-from-right-8 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`font-bold text-lg flex items-center gap-2 ${actionType === 'ADD' ? 'text-green-700' : 'text-[#7a0f1f]'}`}>
                                    {actionType === 'ADD' ? <ArrowUpToLine className="w-5 h-5" /> : <ArrowDownToLine className="w-5 h-5" />}
                                    {actionType === 'ADD' ? 'Add Funds' : 'Deduct Funds'}
                                </h3>
                                <button onClick={() => { setActionType(null); setError(""); }} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <form id="txForm" onSubmit={submitTransaction} className="space-y-4 flex-1">
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
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#7a0f1f] focus:ring-1 focus:ring-[#7a0f1f] outline-none transition-shadow font-bold text-lg"
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
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#7a0f1f] focus:ring-1 focus:ring-[#7a0f1f] outline-none transition-shadow text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional description or reference..."
                                        rows={3}
                                        className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:border-[#7a0f1f] focus:ring-1 focus:ring-[#7a0f1f] outline-none transition-shadow resize-none"
                                    />
                                </div>
                            </form>

                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="submit"
                                    form="txForm"
                                    disabled={isSubmitting}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-colors shadow-sm disabled:opacity-70 ${actionType === 'ADD' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#7a0f1f] hover:bg-red-900'
                                        }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (actionType === 'ADD' ? 'Confirm Addition' : 'Confirm Deduction')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
