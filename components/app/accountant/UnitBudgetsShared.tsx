"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { superAdminNav, accountantNav } from "@/lib/navigation";
import AppHeader from "@/components/app/AppHeader";
import { Building2, ChevronDown, Search, Plus, List, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import UnitBudgetDetailsModal from "@/components/app/accountant/UnitBudgetDetailsModal";
import CreateUnitBudgetPanel from "@/components/app/super/accountant/CreateUnitBudgetPanel";
import SharedToolbar from "@/components/app/SharedToolbar";

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

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
    transactions: any[];
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handler();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [ref, handler]);
}

function OwnerSelectDropdown({
    owners,
    selectedId,
    onChange,
    loading
}: {
    owners: Owner[];
    selectedId: string | number | null;
    onChange: (id: string | number) => void;
    loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    const selectedOwner = owners.find(o => String(o.id) === String(selectedId));
    const filteredOwners = owners.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={ref} className="relative shrink-0 w-72">
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white cursor-pointer transition-colors ${open ? 'border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {loading ? "Loading clients..." : (selectedOwner?.name ?? "Select Owner...")}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && !loading && (
                <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                        ) : (
                            filteredOwners.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${String(selectedId) === String(o.id) ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                                >
                                    <span className="truncate block">{o.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function UnitBudgetsPage({ role, ownerType }: { role: "superadmin" | "accountant", ownerType: "CLIENT" | "COMPANY" }) {
    const nav = role === "superadmin" ? superAdminNav : accountantNav;
    const title = ownerType === "CLIENT" ? "Client Budgets" : "Company Budgets";

    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(true);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | number | null>(null);

    const [budgets, setBudgets] = useState<UnitBudget[]>([]);
    const [budgetsLoading, setBudgetsLoading] = useState(false);

    const [query, setQuery] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [detailsModalBudget, setDetailsModalBudget] = useState<UnitBudget | null>(null);
    const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | null>(null);

    // Fetch Owners
    useEffect(() => {
        setOwnersLoading(true);
        fetch('/api/accountant/maintenance/owners?per_page=all')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const rawData = Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []);
                    const filtered = rawData.filter((o: Owner) => o.owner_type === ownerType);
                    setOwners(filtered);
                    if (filtered.length > 0) {
                        setSelectedOwnerId(filtered[0].id);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setOwnersLoading(false));
    }, [ownerType]);

    // Fetch Budgets for Selected Owner
    const fetchBudgets = React.useCallback(() => {
        if (!selectedOwnerId) return;
        setBudgetsLoading(true);
        fetch(`/api/accountant/budgets/owner/${selectedOwnerId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBudgets(data.data || []);
                } else {
                    setBudgets([]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setBudgetsLoading(false));
    }, [selectedOwnerId]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const filteredBudgets = budgets.filter(b => b.budget_name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col">
            <AppHeader
                navigation={nav}
                title={title}
                primaryAction={
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!selectedOwnerId}
                        className="flex items-center gap-2 px-4 py-2 bg-[#7a0f1f] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        New Budget
                    </button>
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full">
                <section className="rounded-md bg-white p-5 shadow-sm border border-[rgba(0,0,0,0.12)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Active Budget Allocations</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage secondary ledgers independent of the main transactions</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <SharedToolbar
                            searchQuery={query}
                            onSearchChange={(val: string) => setQuery(val)}
                            searchPlaceholder="Search budgets..."
                            onRefresh={fetchBudgets}
                            containerMaxWidth="max-w-4xl"
                        >
                            <OwnerSelectDropdown
                                owners={owners}
                                selectedId={selectedOwnerId}
                                onChange={setSelectedOwnerId}
                                loading={ownersLoading}
                            />
                        </SharedToolbar>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {budgetsLoading ? (
                            <>
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
                            </>
                        ) : filteredBudgets.length === 0 ? (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500 mb-2">No budgets allocated for this owner yet.</p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-[#7a0f1f] font-semibold text-sm hover:underline"
                                >
                                    Create the first budget
                                </button>
                            </div>
                        ) : (
                            filteredBudgets.map((budget) => (
                                <div key={budget.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-[#7a0f1f]/30 transition-colors">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-gray-900 text-lg">{budget.budget_name}</h3>
                                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">
                                                ACTIVE
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Running Balance</p>
                                            <p className="text-2xl font-black text-[#7a0f1f]">
                                                ₱{parseFloat(budget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>

                                        <div className="text-sm text-gray-600">
                                            <p className="mb-1"><span className="font-semibold text-gray-700">Opening:</span> ₱{parseFloat(budget.opening_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                                            {budget.units && budget.units.length > 0 && (
                                                <div className="mt-3 inline-flex bg-gray-50 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-700 border border-gray-100">
                                                    Linked to {budget.units.length} unit{budget.units.length > 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => setDetailsModalBudget(budget)}
                                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                        >
                                            <List className="w-4 h-4" />
                                            Ledger
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setDetailsModalBudget(budget); setActionType("ADD"); }}
                                                className="flex items-center justify-center gap-1 w-8 h-8 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors" title="Add Funds"
                                            >
                                                <ArrowUpToLine className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setDetailsModalBudget(budget); setActionType("DEDUCT"); }}
                                                className="flex items-center justify-center gap-1 w-8 h-8 rounded-md bg-red-50 text-[#7a0f1f] hover:bg-red-100 transition-colors" title="Deduct Funds"
                                            >
                                                <ArrowDownToLine className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {selectedOwnerId && (
                <CreateUnitBudgetPanel
                    ownerId={selectedOwnerId}
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        setIsCreateModalOpen(false);
                        fetchBudgets();
                    }}
                />
            )}

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

export default function UnitBudgetsShared({ role, ownerType }: { role: "superadmin" | "accountant", ownerType: "CLIENT" | "COMPANY" }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <UnitBudgetsPage role={role} ownerType={ownerType} />
        </Suspense>
    );
}
