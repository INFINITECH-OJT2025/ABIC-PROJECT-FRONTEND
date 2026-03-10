"use client";
import React, { useState, useEffect } from "react";
import { Plus, List, ArrowDownToLine, ArrowUpToLine, Wallet } from "lucide-react";
import SharedToolbar from "@/components/app/SharedToolbar";

import UnitBudgetLedgerPanel from "@/components/app/accountant/UnitBudgetLedgerPanel";
import UnitBudgetTransactionPanel from "@/components/app/accountant/UnitBudgetTransactionPanel";
import CreateUnitBudgetPanel from "@/components/app/super/accountant/CreateUnitBudgetPanel";

interface Unit {
    id: number | string;
    unit_name: string;
}

interface UnitBudget {
    id: number;
    owner_id: number;
    budget_name: string;
    opening_balance: string;
    current_balance: string;
    status: string;
    units: Unit[];
}

export default function OwnerBudgetsTab({
    ownerId,
    refreshTrigger,
    onRequestCreate
}: {
    ownerId: number;
    refreshTrigger: number;
    onRequestCreate: () => void;
}) {
    const [budgets, setBudgets] = useState<UnitBudget[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // Panel states
    const [ledgerPanelBudget, setLedgerPanelBudget] = useState<UnitBudget | null>(null);
    const [transactionPanelBudget, setTransactionPanelBudget] = useState<UnitBudget | null>(null);
    const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | null>(null);
    const [editPanelBudget, setEditPanelBudget] = useState<UnitBudget | null>(null);

    const fetchBudgets = React.useCallback(() => {
        setLoading(true);
        fetch(`/api/accountant/budgets/owner/${ownerId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBudgets(data.data || []);
                } else {
                    setBudgets([]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [ownerId]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets, refreshTrigger]);

    const filteredBudgets = budgets.filter(b => b.budget_name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30">
            {/* Toolbar Area */}
            <div className="flex-shrink-0 px-6 bg-white border-b border-gray-200 pb-4 pt-2">
                <SharedToolbar
                    searchQuery={query}
                    onSearchChange={(val: string) => setQuery(val)}
                    searchPlaceholder="Search budgets..."
                    onRefresh={fetchBudgets}
                    containerMaxWidth="max-w-full"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[160px] animate-pulse">
                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="mb-3 mt-4">
                                        <div className="h-2 bg-gray-200 rounded w-24 mb-2"></div>
                                        <div className="h-6 bg-gray-200 rounded w-40"></div>
                                    </div>
                                </div>
                                <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBudgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-white text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Wallet className="w-6 h-6 text-gray-400" />
                        </div>
                        <h4 className="text-gray-900 font-semibold mb-1">No Budgets Found</h4>
                        <p className="text-sm text-gray-500 max-w-sm mb-4">There are no budget allocations set up for this owner yet.</p>
                        <button
                            onClick={onRequestCreate}
                            className="text-sm font-semibold text-[#7a0f1f] hover:text-red-900 transition-colors"
                        >
                            + Create First Budget
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredBudgets.map((budget) => (
                            <div
                                key={budget.id}
                                onClick={() => setEditPanelBudget(budget)}
                                className="cursor-pointer bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden group"
                            >

                                {/* HEADER */}
                                <div className="bg-gradient-to-r from-[#7a0f1f] to-[#9f1d2d] px-5 py-3 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 opacity-90" />
                                        <h3 className="font-semibold text-sm tracking-wide">
                                            {budget.budget_name}
                                        </h3>
                                    </div>

                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wider ${budget.status === "ACTIVE"
                                        ? "bg-green-500 text-white shadow-sm"
                                        : "bg-white/20 text-gray-100"
                                        }`}>
                                        {budget.status}
                                    </span>
                                </div>

                                {/* BODY */}
                                <div className="px-5 py-2 space-y-2">

                                    <div className="pt-2">
                                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                                            Running Budget
                                        </p>

                                        <p className="text-[26px] font-bold text-[#7a0f1f] tracking-tight">
                                            ₱{parseFloat(budget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                </div>

                                {/* FOOTER */}
                                <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between">

                                    {budget.units && budget.units.length > 0 ? (
                                        <div className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-white border flex items-center justify-center text-[#7a0f1f] font-semibold">
                                                {budget.units.length}
                                            </div>
                                            Linked Unit{budget.units.length > 1 ? "s" : ""}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Plus className="w-3.5 h-3.5" />
                                            Assign Units
                                        </div>
                                    )}

                                    <div className="flex gap-1">

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setLedgerPanelBudget(budget); }}
                                            className="p-1.5 rounded-md border text-gray-600 hover:text-[#7a0f1f] hover:border-[#7a0f1f]/40 bg-white"
                                            title="Ledger"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTransactionPanelBudget(budget); setActionType("ADD"); }}
                                            className="p-1.5 rounded-md border text-green-700 hover:bg-green-600 hover:text-white"
                                            title="Add Funds"
                                        >
                                            <ArrowUpToLine className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTransactionPanelBudget(budget); setActionType("DEDUCT"); }}
                                            className="p-1.5 rounded-md border text-red-700 hover:bg-red-600 hover:text-white"
                                            title="Deduct Funds"
                                        >
                                            <ArrowDownToLine className="w-4 h-4" />
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

            <UnitBudgetLedgerPanel
                open={!!ledgerPanelBudget}
                budget={ledgerPanelBudget}
                onClose={() => setLedgerPanelBudget(null)}
            />

            <UnitBudgetTransactionPanel
                open={!!transactionPanelBudget}
                budget={transactionPanelBudget}
                initialAction={actionType}
                onClose={() => {
                    setTransactionPanelBudget(null);
                    setActionType(null);
                }}
                onSuccess={() => {
                    fetchBudgets();
                }}
            />

            <CreateUnitBudgetPanel
                ownerId={ownerId}
                open={!!editPanelBudget}
                editBudget={editPanelBudget}
                onClose={() => setEditPanelBudget(null)}
                onCreated={() => {
                    setEditPanelBudget(null);
                    fetchBudgets();
                }}
            />
        </div>
    );
}
