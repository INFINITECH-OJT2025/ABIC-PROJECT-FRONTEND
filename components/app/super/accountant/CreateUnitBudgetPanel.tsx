"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Wallet, PhilippinePeso, ClipboardList, CheckSquare, Square } from "lucide-react";
import { createPortal } from "react-dom";
import DataTable, { PaginationMeta } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";

interface UnitRow {
    id: number;
    unit_name: string;
    status: string;
    property?: { id: number; name: string } | null;
}

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

export default function CreateUnitBudgetPanel({
    ownerId,
    open,
    onClose,
    onCreated
}: {
    ownerId: string | number;
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Form fields
    const [budgetName, setBudgetName] = useState("");
    const [openingBalance, setOpeningBalance] = useState("");
    const [selectedUnitIds, setSelectedUnitIds] = useState<(string | number)[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Units sub-table state
    const [units, setUnits] = useState<UnitRow[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [unitsPagination, setUnitsPagination] = useState<PaginationMeta | null>(null);
    const [unitsSearch, setUnitsSearch] = useState("");
    const [unitsStatus, setUnitsStatus] = useState("all");
    const [unitsPage, setUnitsPage] = useState(1);

    // SSR Guard
    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchUnits = useCallback(async () => {
        if (!ownerId) return;
        setUnitsLoading(true);
        try {
            const url = new URL(
                `/api/accountant/maintenance/units`,
                window.location.origin
            );
            url.searchParams.set("owner_id", ownerId.toString());
            url.searchParams.set("page", unitsPage.toString());
            url.searchParams.set("per_page", "10");
            if (unitsSearch.trim()) url.searchParams.set("search", unitsSearch.trim());
            if (unitsStatus !== "all") url.searchParams.set("status", unitsStatus);

            const res = await fetch(url.toString());
            if (!res.ok) { setUnits([]); setUnitsPagination(null); return; }
            const data = await res.json();
            if (data.success) {
                const page = data.data;
                const list = page?.data ?? data.data ?? [];
                setUnits(Array.isArray(list) ? list : []);

                // Populate pagination
                if (page && page.current_page !== undefined) {
                    setUnitsPagination({
                        current_page: page.current_page ?? 1,
                        last_page: page.last_page ?? 1,
                        per_page: page.per_page ?? 10,
                        total: page.total ?? 0,
                        from: page.from ?? 0,
                        to: page.to ?? 0,
                    });
                } else {
                    setUnitsPagination(null);
                }
            } else {
                setUnits([]);
                setUnitsPagination(null);
            }
        } catch {
            setUnits([]);
            setUnitsPagination(null);
        } finally {
            setUnitsLoading(false);
        }
    }, [ownerId, unitsSearch, unitsStatus, unitsPage]);

    // Reset state when opened
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            setBudgetName("");
            setOpeningBalance("");
            setSelectedUnitIds([]);
            setError("");

            setUnitsSearch("");
            setUnitsStatus("all");
            setUnitsPage(1);

            document.body.style.overflow = "hidden";
            fetchUnits();
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open, ownerId, fetchUnits]);

    if (!mounted || (!open && !isClosing)) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 350);
    };

    const toggleUnit = (id: string | number) => {
        setSelectedUnitIds(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    const toggleAllUnits = () => {
        const allVisibleIds: (string | number)[] = units.map(u => u.id);
        if (allVisibleIds.length === 0) return;

        const allSelected = allVisibleIds.every(id => selectedUnitIds.includes(id));

        if (allSelected) {
            // Deselect all visible
            setSelectedUnitIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
        } else {
            // Select all visible
            setSelectedUnitIds(prev => {
                const newIds = [...prev];
                allVisibleIds.forEach(id => {
                    if (!newIds.includes(id)) newIds.push(id);
                });
                return newIds;
            });
        }
    };

    // check if all currently visible are selected
    const allVisibleSelected = units.length > 0 && units.every(u => selectedUnitIds.includes(u.id));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!budgetName.trim()) {
            setError("Budget name is required");
            return;
        }

        const parsedBalance = parseFloat(openingBalance.replace(/,/g, ""));
        if (isNaN(parsedBalance) || parsedBalance < 0) {
            setError("Please enter a valid opening balance");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/accountant/budgets/owner/${ownerId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    budget_name: budgetName,
                    opening_balance: parsedBalance,
                    unit_ids: selectedUnitIds.length > 0 ? selectedUnitIds : null
                })
            });

            const data = await res.json();
            if (data.success) {
                handleClose();
                setTimeout(() => onCreated(), 350);
            } else {
                setError(data.message || "Failed to create budget");
            }
        } catch (err: any) {
            setError(err.message || "Network error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldClass = "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

    const panelContent = (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white z-[70] flex flex-col rounded-md overflow-hidden shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    maxWidth: "72rem",
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">
                            Create New Budget
                        </h2>
                        <p className="text-sm text-white/90 mt-0.5">
                            Set up a new secondary ledger for this owner
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-md hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body container: 2 columns */}
                <div className="flex-1 flex overflow-hidden bg-gray-50/50 flex-row">
                    {/* LEFT COLUMN: Budget Form */}
                    <div className="flex flex-col overflow-y-auto px-6 py-6 space-y-5 bg-white transition-all duration-300 w-[360px] border-r border-gray-200 flex-shrink-0">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium flex gap-3 items-center text-sm">
                                <X className="w-4 h-4 flex-shrink-0 text-red-500" />
                                {error}
                            </div>
                        )}

                        {/* Budget Name */}
                        <div>
                            <label className={labelClass}>Budget Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <ClipboardList className="h-4 w-4" />
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    value={budgetName}
                                    onChange={(e) => setBudgetName(e.target.value)}
                                    placeholder="e.g. Renovation Budget 2026"
                                    maxLength={100}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        {/* Opening Balance */}
                        <div>
                            <label className={labelClass}>Opening Balance (₱) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <PhilippinePeso className="h-4 w-4" />
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    placeholder="0.00"
                                    className={fieldClass}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                Defining an opening balance will automatically create the first 'OPENING' transaction in this budget's ledger.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Units List */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/30 relative">
                        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-3 bg-white border-b border-gray-200">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Assign Units <span className="text-sm font-normal text-gray-500">(Optional)</span></h3>
                                <p className="text-sm text-gray-500 mt-0.5">Select units that will draw their budget from this allocation.</p>
                            </div>
                            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                Selected: <span className="font-bold text-[#7B0F2B]">{selectedUnitIds.length}</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-shrink-0 px-6 bg-white border-b border-gray-200 pb-4 pt-4">
                                <SharedToolbar
                                    searchQuery={unitsSearch}
                                    onSearchChange={(q) => { setUnitsSearch(q); setUnitsPage(1); }}
                                    searchPlaceholder="Search units…"
                                    statusFilter={unitsStatus}
                                    onStatusChange={(s) => { setUnitsStatus(s); setUnitsPage(1); }}
                                    onRefresh={fetchUnits}
                                    statusOptions={[
                                        { label: "All Status", value: "all" },
                                        { label: "Active", value: "ACTIVE" },
                                        { label: "Inactive", value: "INACTIVE" },
                                        { label: "Suspended", value: "SUSPENDED" },
                                    ]}
                                    containerMaxWidth="max-w-full"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <DataTable<UnitRow>
                                    loading={unitsLoading}
                                    rows={units}
                                    pagination={unitsPagination}
                                    onPageChange={(p) => { setUnitsPage(p); }}
                                    itemName="units"
                                    emptyTitle="No units assigned"
                                    emptyDescription="This owner does not have any attached properties or unit ledgers currently registered in the database."
                                    onRowClick={(row) => toggleUnit(row.id)}
                                    columns={[
                                        {
                                            key: "checkbox",
                                            label: (
                                                <button onClick={(e) => { e.stopPropagation(); toggleAllUnits(); }} className="flex items-center justify-center p-1 text-gray-500 hover:text-[#7B0F2B] focus:outline-none">
                                                    {allVisibleSelected ? <CheckSquare className="w-5 h-5 text-[#7B0F2B]" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            ),
                                            width: "50px",
                                            renderCell: (row) => {
                                                const isSelected = selectedUnitIds.includes(row.id);
                                                return (
                                                    <div className="flex items-center justify-center">
                                                        {isSelected ? <CheckSquare className="w-5 h-5 text-[#7B0F2B]" /> : <Square className="w-5 h-5 text-gray-400" />}
                                                    </div>
                                                );
                                            }
                                        },
                                        {
                                            key: "unit_name",
                                            label: "Unit Name",
                                            sortable: true,
                                            flex: true,
                                            width: "50%",
                                            renderCell: (row) => (
                                                <div>
                                                    <span className="font-semibold text-gray-900 block truncate text-[14px]">
                                                        {row.unit_name}
                                                    </span>
                                                    {row.property && (
                                                        <span className="text-xs text-gray-500 block truncate" style={{ maxWidth: '200px' }}>
                                                            {row.property.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "status",
                                            label: "Status",
                                            width: "120px",
                                            renderCell: (row) => {
                                                const s = row.status?.toUpperCase();
                                                const cfg: Record<string, { bg: string; text: string; label: string }> = {
                                                    ACTIVE: { bg: "#dcfce7", text: "#166534", label: "Active" },
                                                    INACTIVE: { bg: "#f1f5f9", text: "#475569", label: "Inactive" },
                                                    SUSPENDED: { bg: "#fef9c3", text: "#854d0e", label: "Suspended" },
                                                };
                                                const c = cfg[s] ?? { bg: "#f1f5f9", text: "#475569", label: row.status };
                                                return (
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                                        style={{ background: c.bg, color: c.text }}
                                                    >
                                                        {c.label}
                                                    </span>
                                                );
                                            },
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 p-4 border-t bg-gray-50" style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-neutral-100 transition-colors"
                            style={{ borderColor: BORDER, color: "#111", height: 40 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={isSubmitting}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                "Create Budget"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>
        </>
    );

    return createPortal(panelContent, document.body);
}
