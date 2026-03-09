"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import DataTableLedge from "@/components/app/DataTableLedge";
import { DataTableColumn } from "@/components/app/DataTable";

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
    voucher_no: string | null;
    fund_reference: string | null;
    running_balance: string;
}

export default function UnitBudgetLedgerPanel({
    open,
    budget,
    onClose
}: {
    open: boolean;
    budget: UnitBudget | null;
    onClose: () => void;
}) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [showExtraColumns, setShowExtraColumns] = useState(false);

    const fetchTransactions = React.useCallback(() => {
        if (!budget) return;
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
    }, [budget]);

    useEffect(() => {
        if (open && budget) {
            setIsClosing(false);
            fetchTransactions();
        }
    }, [open, budget, fetchTransactions]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setTransactions([]);
        }, 350);
    };

    const columns = React.useMemo<DataTableColumn<Transaction>[]>(() => [
        {
            key: "transaction_date",
            label: "DATE",
            align: "center",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => new Date(row.transaction_date).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' })
        },
        {
            key: "voucher_no",
            label: "VOUCHER NO.",
            align: "center",
            width: "180px",
            minWidth: "180px",
            maxWidth: "180px",
            sortable: true,
            renderCell: (row) => row.voucher_no || "—"
        },
        {
            key: "transaction_type",
            label: "TRANS TYPE",
            align: "center",
            width: "150px",
            minWidth: "150px",
            maxWidth: "150px",
            sortable: true,
            renderCell: (row) => {
                if (row.transaction_type === "OPENING") return <span className="font-semibold text-gray-600">OPENING</span>;
                if (row.transaction_type === "ADD") return <span className="font-semibold text-green-700">ADDITION</span>;
                return <span className="font-semibold text-[#7a0f1f]">DEDUCTION</span>;
            }
        },
        {
            key: "description",
            label: "PARTICULARS",
            align: "left",
            width: "400px",
            minWidth: "400px",
            maxWidth: "400px",
            sortable: true,
            renderCell: (row) => row.description || "—"
        },
        {
            key: "deposit",
            label: "DEPOSIT",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-medium text-green-600">
                    {row.transaction_type !== "DEDUCT" ? `₱${parseFloat(row.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "withdrawal",
            label: "WITHDRAWAL",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-medium text-red-600">
                    {row.transaction_type === "DEDUCT" ? `₱${parseFloat(row.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "running_balance",
            label: "OUTS. BALANCE",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-bold text-gray-900">
                    ₱{parseFloat(row.running_balance || row.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: "fund_reference",
            label: "FUND REFERENCES",
            align: "left",
            minWidth: "180px",
            maxWidth: "180px",
            hidden: !showExtraColumns,
            sortable: true,
            renderCell: (row) => row.fund_reference || "-"
        }
    ], [showExtraColumns]);

    if (!open && !isClosing) return null;

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
                className="fixed top-0 right-0 bottom-0 h-screen w-full max-w-[85vw] md:max-w-5xl bg-white z-50 flex flex-col shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-4 bg-[#7a0f1f] text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {budget?.budget_name} Ledger
                        </h2>
                        {budget && (
                            <p className="text-red-100 text-sm mt-0.5 flex items-center gap-1.5 font-medium">
                                RUNNING BALANCE: <span className="font-black text-white tracking-widest text-lg ml-1">₱{parseFloat(budget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-md hover:bg-[#a3152d] transition-colors bg-[#8c1325]"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 p-6 overflow-hidden">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 border-l-4 border-[#7a0f1f] pl-3">Transaction History</h3>
                        <button
                            onClick={() => setShowExtraColumns(!showExtraColumns)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                        >
                            {showExtraColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showExtraColumns ? "Hide Extra Columns" : "Show Extra Columns"}
                        </button>
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col min-h-0">
                        <DataTableLedge
                            columns={columns}
                            rows={transactions}
                            itemName="transactions"
                            loading={loading}
                            getRowId={(row) => `tx-${row.id}`}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
