"use client";
import React, { useState, useEffect } from "react";
import { Plus, List, ArrowDownToLine, ArrowUpToLine, Wallet } from "lucide-react";
import UnitBudgetDetailsModal from "@/components/app/accountant/UnitBudgetDetailsModal";
import SharedToolbar from "@/components/app/SharedToolbar";

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

    const [detailsModalBudget, setDetailsModalBudget] = useState<UnitBudget | null>(null);
    const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | null>(null);

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
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[200px] animate-pulse">
                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="mb-3 mt-4">
                                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                                        <div className="h-7 bg-gray-200 rounded w-40"></div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
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
                    <div className="grid grid-cols-1 gap-4">
                        {filteredBudgets.map((budget) => (
                            <div key={budget.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-[#7a0f1f]/30 transition-colors">
                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-gray-900 text-base">{budget.budget_name}</h3>
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                            {budget.status}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Running Balance</p>
                                        <p className="text-xl font-black text-[#7a0f1f]">
                                            ₱{parseFloat(budget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        <p className="mb-1"><span className="font-semibold text-gray-600">Opening:</span> ₱{parseFloat(budget.opening_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                                        {budget.units && budget.units.length > 0 && (
                                            <p className="inline-flex bg-gray-50 px-2 py-1.5 rounded text-[11px] font-medium text-gray-600 border border-gray-100 mt-2">
                                                Linked to {budget.units.length} unit{budget.units.length > 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50/80 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setDetailsModalBudget(budget)}
                                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-gray-700 hover:text-gray-900 transition-colors bg-white border border-gray-200 shadow-sm rounded-md"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        Ledger
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setDetailsModalBudget(budget); setActionType("ADD"); }}
                                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-green-50/80 border border-green-100 text-green-700 hover:bg-green-100 transition-colors text-[13px] font-bold"
                                        >
                                            <ArrowUpToLine className="w-3.5 h-3.5" /> Add
                                        </button>
                                        <button
                                            onClick={() => { setDetailsModalBudget(budget); setActionType("DEDUCT"); }}
                                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-red-50/80 border border-red-100 text-[#7a0f1f] hover:bg-red-100 transition-colors text-[13px] font-bold"
                                        >
                                            <ArrowDownToLine className="w-3.5 h-3.5" /> Deduct
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {detailsModalBudget && (
                <UnitBudgetDetailsModal
                    budget={detailsModalBudget}
                    initialAction={actionType}
                    onClose={() => {
                        setDetailsModalBudget(null);
                        setActionType(null);
                        fetchBudgets();
                    }}
                />
            )}
        </div>
    );
}
