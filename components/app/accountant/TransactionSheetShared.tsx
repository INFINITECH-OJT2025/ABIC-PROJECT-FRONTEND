"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import {
    Building2,
    ChevronDown,
    Download,
    Eye,
    EyeOff,
    FileText,
    Search,
    Calendar,
    Check,
    Pencil,
    PencilOff,
    Upload,
    User,
    X,
    ImagePlus,
    AlertTriangle,
    RefreshCw,
    Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import AppHeader from "@/components/app/AppHeader";
import DataSheetLedge, {
    InstrumentFilesPopover,
    VoucherPreviewButton,
    DataSheetColumn,
} from "@/components/app/DataSheetLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import SharedToolbar from "@/components/app/SharedToolbar";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import { superAdminNav, accountantNav } from "@/lib/navigation";
import { 
    InlineUpsertTransaction, 
    type LedgerEntry, 
    type AllOwner, 
    toDateInputValue,
    useOutsideClick
} from "./InlineUpsertTransaction";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";

// ─── Helpers ──────────────────────────────────────────────────────────────────




function ContextMenu({
    x,
    y,
    visible,
    onClose,
    actions,
}: {
    x: number;
    y: number;
    visible: boolean;
    onClose: () => void;
    actions: { label: string; icon: React.ElementType; onClick: () => void; variant?: "default" | "danger" }[];
}) {
    const ref = useRef<HTMLDivElement>(null);
    useOutsideClick(ref, onClose);

    if (!visible) return null;

    return (
        <div
            ref={ref}
            className="fixed z-[10000] min-w-[160px] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in duration-100"
            style={{ top: y, left: x }}
        >
            {actions.map((action, i) => (
                <button
                    key={i}
                    onClick={() => {
                        action.onClick();
                        onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors text-left
                        ${action.variant === "danger"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#7a0f1f]"
                        }`}
                >
                    <action.icon className="w-4 h-4 shrink-0" />
                    {action.label}
                </button>
            ))}
        </div>
    );
}

// ─── Owner Dropdown ───────────────────────────────────────────────────────────

function OwnerSelectDropdown({
    owners,
    selectedId,
    onChange,
    loading,
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

    const selectedOwner = owners.find((o) => String(o.id) === String(selectedId));
    const filteredOwners = owners.filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div ref={ref} className="relative shrink-0 w-72">
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white cursor-pointer transition-colors ${open ? "border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20" : "border-gray-300 hover:border-gray-400"}`}
            >
                <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {loading ? "Loading owners..." : (selectedOwner?.name ?? "Select Owner...")}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? "rotate-180" : ""}`} />
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
                            placeholder="Search owner..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners found</div>
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

// ─── Inner Page ───────────────────────────────────────────────────────────────

function TransactionSheetPage({ role }: { role: "superadmin" | "accountant" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");
    const initialOwnerId = searchParams.get("owner_id");

    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(true);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | number | null>(null);

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [runningBalance, setRunningBalance] = useState<number>(0);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [lastEditedId, setLastEditedId] = useState<number | null>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, row: LedgerEntry | null, index: number | null }>({
        x: 0,
        y: 0,
        visible: false,
        row: null,
        index: null,
    });

    const [editingTxId, setEditingTxId] = useState<number | null>(null);
    const [editingRowDraft, setEditingRowDraft] = useState<LedgerEntry | null>(null);
    const [editingChequeFiles, setEditingChequeFiles] = useState<File[]>([]);
    const [editingField, setEditingField] = useState<"date" | null>(null);
    const [editingTransMethod, setEditingTransMethod] = useState<"DEPOSIT" | "WITHDRAWAL" | null>(null);
    const [editingSaving, setEditingSaving] = useState(false);
    const [editingVoucherFile, setEditingVoucherFile] = useState<File | null>(null);

    // ── Inline Add Transaction State ──────────────────────────────────────────
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newTxRow, setNewTxRow] = useState<LedgerEntry | null>(null);
    const [newTxFile, setNewTxFile] = useState<File | null>(null);
    const [newTxInstFiles, setNewTxInstFiles] = useState<File[]>([]);
    const [newTxSaving, setNewTxSaving] = useState(false);
    const [addingIndex, setAddingIndex] = useState<number>(0);

    // All owners for inline owner dropdown (includes CLIENT, COMPANY, MAIN)
    const [allOwners, setAllOwners] = useState<AllOwner[]>([]);
    const [allOwnersLoading, setAllOwnersLoading] = useState(false);

    // Units for the new transaction row
    const [newTxUnits, setNewTxUnits] = useState<{ id: number; name: string }[]>([]);
    const [newTxUnitsLoading, setNewTxUnitsLoading] = useState(false);

    const { showToast } = useAppToast();

    // ── Fetch owners (MAIN type only) ─────────────────────────────────────────

    useEffect(() => {
        setOwnersLoading(true);
        fetch("/api/accountant/maintenance/owners?per_page=all")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    const rawData = Array.isArray(data.data?.data)
                        ? data.data.data
                        : Array.isArray(data.data)
                            ? data.data
                            : [];
                    const mains = rawData.filter((o: Owner) => o.owner_type === "MAIN");
                    setOwners(mains);
                    if (initialOwnerId) {
                        const exists = mains.find((o: Owner) => String(o.id) === initialOwnerId);
                        if (exists) setSelectedOwnerId(initialOwnerId);
                        else if (mains.length > 0) setSelectedOwnerId(mains[0].id);
                    } else if (mains.length > 0) {
                        setSelectedOwnerId(mains[0].id);
                    }
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setOwnersLoading(false));
    }, [initialOwnerId]);

    // ── Fetch all owners for inline owner edit dropdown ────────────────────────

    useEffect(() => {
        if (!editingTxId && !isAddingNew) return; // Only fetch when editing or adding
        if (allOwners.length > 0) return; // Already fetched
        setAllOwnersLoading(true);
        fetch("/api/accountant/maintenance/owners?per_page=all&status=ACTIVE")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    const list = Array.isArray(data.data?.data)
                        ? data.data.data
                        : Array.isArray(data.data)
                            ? data.data
                            : [];
                    setAllOwners(list);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setAllOwnersLoading(false));
    }, [editingTxId, isAddingNew, allOwners.length]);

    // ── Fetch units for new transaction row ───────────────────────────────────

    useEffect(() => {
        if (!isAddingNew || !newTxRow?.otherOwnerId) {
            setNewTxUnits([]);
            return;
        }

        // Only fetch for CLIENT or COMPANY
        const otherOwner = allOwners.find(o => String(o.id) === String(newTxRow.otherOwnerId));
        if (!otherOwner || (otherOwner.owner_type !== "CLIENT" && otherOwner.owner_type !== "COMPANY")) {
            setNewTxUnits([]);
            return;
        }

        setNewTxUnitsLoading(true);
        fetch(`/api/accountant/maintenance/units?owner_id=${newTxRow.otherOwnerId}&per_page=100`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    const list = Array.isArray(data.data?.data)
                        ? data.data.data
                        : Array.isArray(data.data)
                            ? data.data
                            : [];
                    setNewTxUnits(list.map((u: any) => ({ id: u.id, name: u.unit_name })));
                } else {
                    setNewTxUnits([]);
                }
            })
            .catch(() => setNewTxUnits([]))
            .finally(() => setNewTxUnitsLoading(false));
    }, [isAddingNew, newTxRow?.otherOwnerId, allOwners]);

    // ── Fetch ledger entries ──────────────────────────────────────────────────

    const fetchLedger = useCallback(() => {
        if (!selectedOwnerId) return;
        setEntriesLoading(true);
        const url = `/api/accountant/ledger/mains?owner_id=${selectedOwnerId}&sort=oldest`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    const mapped = (data.data.transactions || []).map((t: LedgerEntry) => ({
                        ...t,
                        transMethod: t.transMethod || (t.deposit > 0 ? "DEPOSIT" : "WITHDRAWAL")
                    }));
                    setEntries(mapped);
                    setOpeningBalance(data.data.openingBalance || 0);
                    setRunningBalance(data.data.runningBalance || 0);
                } else {
                    setEntries([]);
                    setOpeningBalance(0);
                    setRunningBalance(0);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setEntriesLoading(false));
    }, [selectedOwnerId]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    // ── Patch date field on a transaction ─────────────────────────────────────
    //
    // Strategy: fetch the full transaction first so we can pass all required
    // fields to PUT /api/accountant/transactions/{id}, then update only
    // voucher_date.
    //

    const handleSaveDate = useCallback(async (transactionId: number, newDate: string) => {
        try {
            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-date`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voucher_date: newDate }),
            });
            const data = await res.json();

            if (data.success) {
                showToast("Date Updated", "Transaction date has been saved.", "success");
                // Format the ISO date to match how the backend returns voucherDate (e.g. "Mar 10, 2026")
                const displayDate = new Date(newDate + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
                // Update local state, re-sort by date, highlight the edited row
                setLastEditedId(transactionId);
                setEntries((prev) => {
                    const updated = prev.map((e) =>
                        e.transactionId === transactionId ? { ...e, voucherDate: displayDate } : e
                    );
                    // Re-sort oldest first using the ISO date (newDate) for the edited row
                    return [...updated].sort((a, b) => {
                        const parseD = (v: string) => {
                            // Handle both ISO (2026-03-10) and locale strings (Mar 10, 2026)
                            const d = new Date(v);
                            return isNaN(d.getTime()) ? 0 : d.getTime();
                        };
                        // For the edited row use newDate directly for accurate comparison
                        const da = a.transactionId === transactionId ? new Date(newDate).getTime() : parseD(a.voucherDate);
                        const db = b.transactionId === transactionId ? new Date(newDate).getTime() : parseD(b.voucherDate);
                        return da - db;
                    });
                });

            } else {
                showToast("Error", data.message || "Failed to update date.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast]);

    // ── Patch trans type ──────────────────────────────────────────────────────

    const handleSaveTransType = useCallback(async (transactionId: number, transType: string, transMethod: "DEPOSIT" | "WITHDRAWAL", chequeFiles?: File[], removedInstruments?: string[]) => {
        setEditingTransMethod(transMethod); // Update local state immediately
        try {
            const formData = new FormData();
            formData.append("trans_type", transType);
            formData.append("trans_method", transMethod);

            const hasFiles = chequeFiles && chequeFiles.length > 0;
            const hasRemovals = removedInstruments && removedInstruments.length > 0;

            if (hasFiles) {
                chequeFiles?.forEach(f => {
                    formData.append("attachments_files[]", f);
                    // For simplified inline, we might just assume they are all cheques
                    // If we need more metadata, we'd need to send an 'instruments' JSON too
                });
            }

            if (hasRemovals) {
                formData.append("remove_instruments", JSON.stringify(removedInstruments));
            }

            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-trans-type`, {
                method: (hasFiles || hasRemovals) ? "POST" : "PATCH",
                headers: (hasFiles || hasRemovals) ? { "X-HTTP-Method-Override": "PATCH" } : { "Content-Type": "application/json" },
                body: (hasFiles || hasRemovals) ? formData : JSON.stringify({ trans_type: transType, trans_method: transMethod }),
            });

            let data;
            const textResp = await res.text();
            try {
                data = JSON.parse(textResp);
            } catch (e) {
                showToast("Error", `Proxy Error: ${textResp.substring(0, 200)}`, "error");
                return;
            }

            if (data.success) {
                showToast("Trans Type Updated", `Changed to ${transType} (${transMethod}).`, "success");
                setLastEditedId(transactionId);
                fetchLedger();
            } else {
                showToast("Error", data.message || "Failed to update trans type.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast, fetchLedger]);

    // ── Patch amount ──────────────────────────────────────────────────────────

    const handleSaveAmount = useCallback(async (transactionId: number, amount: number) => {
        try {
            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-amount`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Amount Updated", "Transaction amount saved.", "success");
                setLastEditedId(transactionId);
                fetchLedger();
            } else {
                showToast("Error", data.message || "Failed to update amount.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast, fetchLedger]);

    // ── Patch particulars ─────────────────────────────────────────────────────

    const handleSaveParticulars = useCallback(async (transactionId: number, particulars: string, unitId: number | null, saveToUnitLedger: boolean) => {
        try {
            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-particulars`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    particulars,
                    unit_id: unitId,
                    save_to_unit_ledger: saveToUnitLedger
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Particulars Updated", "Transaction particulars saved.", "success");
                setLastEditedId(transactionId);
                // Refresh ledger to get the updated particulars with unit prefix and potential ledger balance changes
                fetchLedger();
            } else {
                showToast("Error", data.message || "Failed to update particulars.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast, fetchLedger]);

    // ── Patch owner ───────────────────────────────────────────────────────────

    const handleSaveOwner = useCallback(async (transactionId: number, toOwnerId: number) => {
        try {
            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-owner`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to_owner_id: toOwnerId }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Owner Updated", "Transaction owner changed.", "success");
                setLastEditedId(transactionId);
                // Refresh full ledger since balances changed
                fetchLedger();
            } else {
                showToast("Error", data.message || "Failed to update owner.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast, fetchLedger]);

    const handleSaveVoucher = useCallback(async (transactionId: number, file: File | null, remove: boolean) => {
        try {
            const formData = new FormData();
            if (remove) {
                formData.append("remove_voucher", "1");
            } else if (file) {
                formData.append("voucher", file);
            } else {
                return; // Nothing to do
            }

            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-voucher`, {
                method: "POST",
                headers: { "X-HTTP-Method-Override": "PATCH" },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                showToast(remove ? "Voucher Removed" : "Voucher Updated", "Voucher changes saved successfully.", "success");
            } else {
                throw new Error(data.message || "Failed to update voucher.");
            }
        } catch (err: any) {
            throw err;
        }
    }, [showToast]);

    // ── Patch extra fields ────────────────────────────────────────────────────

    const handleSaveExtra = useCallback(async (transactionId: number, fundReference: string | null, personInCharge: string | null) => {
        try {
            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-extra`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    fund_reference: fundReference,
                    person_in_charge: personInCharge
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast("Fields Updated", "Reference information saved.", "success");
                setLastEditedId(transactionId);
                fetchLedger();
            } else {
                showToast("Error", data.message || "Failed to update additional fields.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        }
    }, [showToast, fetchLedger]);

    const handleSaveAllChanges = useCallback(async () => {
        if (!editingTxId || !editingRowDraft) return;
        
        const original = entries.find(e => e.transactionId === editingTxId);
        if (!original) return;

        setEditingSaving(true);
        try {
            // 1. Date
            if (editingRowDraft.voucherDate !== original.voucherDate) {
                await handleSaveDate(editingTxId, editingRowDraft.voucherDate);
            }

            // 2. Trans Type / Method
            const isMethodChanged = editingRowDraft.transMethod !== original.transMethod;
            const isTypeChanged = editingRowDraft.transType !== original.transType;
            const hasNewCheques = editingChequeFiles.length > 0;
            const hasRemovals = (editingRowDraft._removeInstruments || []).length > 0;

            if (isMethodChanged || isTypeChanged || hasNewCheques || hasRemovals) {
                await handleSaveTransType(
                    editingTxId, 
                    editingRowDraft.transType, 
                    editingRowDraft.transMethod as "DEPOSIT" | "WITHDRAWAL", 
                    editingChequeFiles,
                    editingRowDraft._removeInstruments
                );
            }

            // 3. Amount
            const draftAmt = editingRowDraft.transMethod === "DEPOSIT" ? editingRowDraft.deposit : editingRowDraft.withdrawal;
            const origAmt = original.transMethod === "DEPOSIT" ? original.deposit : original.withdrawal;
            if (draftAmt !== origAmt) {
                await handleSaveAmount(editingTxId, draftAmt);
            }

            // 4. Particulars & Unit
            const isPartChanged = editingRowDraft.particulars !== original.particulars;
            const isUnitChanged = editingRowDraft.otherUnitId !== original.otherUnitId;
            const isLedgerTagChanged = editingRowDraft.saveToUnitLedger !== (original.otherUnitId ? true : false);
            
            if (isPartChanged || isUnitChanged || isLedgerTagChanged) {
                const saveToLedger = editingRowDraft.saveToUnitLedger ?? !!editingRowDraft.otherUnitId;
                const finalParticulars = editingRowDraft.particulars;
                
                await handleSaveParticulars(editingTxId, finalParticulars, editingRowDraft.otherUnitId, saveToLedger);
            }

            // 5. Owner
            if (editingRowDraft.otherOwnerId !== original.otherOwnerId) {
                await handleSaveOwner(editingTxId, Number(editingRowDraft.otherOwnerId));
            }

            // 6. Extra Fields (Fund Reference & Person In Charge)
            const isFundRefChanged = editingRowDraft.fundReference !== original.fundReference;
            const isPICChanged = editingRowDraft.personInCharge !== original.personInCharge;
            if (isFundRefChanged || isPICChanged) {
                await handleSaveExtra(editingTxId, editingRowDraft.fundReference, editingRowDraft.personInCharge);
            }

            // 7. Voucher (File upload or Removal)
            if (editingVoucherFile || editingRowDraft._removeVoucher) {
                await handleSaveVoucher(editingTxId, editingVoucherFile, !!editingRowDraft._removeVoucher);
            }

            showToast("Success", "All changes saved successfully.", "success");
            setEditingTxId(null);
            setEditingRowDraft(null);
            setEditingChequeFiles([]);
            setEditingVoucherFile(null);
            setLastEditedId(editingTxId);
            fetchLedger();
        } catch (err: any) {
            showToast("Error", err.message || "Failed to save some changes. Please refresh and try again.", "error");
        } finally {
            setEditingSaving(false);
        }
    }, [editingTxId, editingRowDraft, entries, handleSaveDate, handleSaveTransType, handleSaveAmount, handleSaveParticulars, handleSaveOwner, handleSaveVoucher, handleSaveExtra, editingVoucherFile, editingChequeFiles, showToast, fetchLedger]);


    // ── Handle Inline New Row Creation ────────────────────────────────────────

    const startAddingNewRow = useCallback((atIndex: number = 0) => {
        if (!selectedOwnerId) {
            showToast("Warning", "Please select an owner first.", "warning");
            return;
        }
        
        // Find the selected owner details
        const ownerDetails = owners.find(o => String(o.id) === String(selectedOwnerId));
        if (!ownerDetails) return;

        // Initialize empty LedgerEntry for creation mode
        const d = new Date();
        const ysd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        setIsAddingNew(true);
        setAddingIndex(atIndex);
        setNewTxFile(null);
        setNewTxInstFiles([]);
        setNewTxSaving(false);
        setNewTxRow({
            id: -1,
            transactionId: -1,
            createdAt: ysd,
            voucherDate: ysd,
            isVoucherDate: true,
            voucherNo: "",
            otherOwnerId: null,      // For deposit: From whom? For withdrawal: To whom?
            otherOwnerType: null,
            otherUnitId: null,
            transType: "CASH DEPOSIT", 
            owner: "",               // We don't need text for saving, just the otherOwnerId
            particulars: "",
            deposit: 0,
            withdrawal: 0,
            outsBalance: 0,
            transferGroupId: null,
            voucherAttachmentUrl: null,
            voucherFileType: null,
            voucherFileSize: null,
            instrumentAttachments: [],
            fundReference: null,
            personInCharge: null,
            saveToUnitLedger: false,
            _unitName: undefined,
            _removeVoucher: false,
            transMethod: "DEPOSIT", // Default mode
        });
    }, [owners, selectedOwnerId, showToast]);

    const handleSubmitNewRow = useCallback(async () => {
        if (!newTxRow || !selectedOwnerId) return;
        
        // 1. Validation
        if (!newTxRow.voucherDate) { showToast("Validation Error", "Date is required.", "error"); return; }
        if (!newTxRow.transType) { showToast("Validation Error", "Transaction type is required.", "error"); return; }
        if (!newTxRow.otherOwnerId) { showToast("Validation Error", "Counterparty Owner is required.", "error"); return; }
        if (!newTxRow.particulars || newTxRow.particulars.trim() === "") { showToast("Validation Error", "Particulars are required.", "error"); return; }
        
        const isDeposit = newTxRow.transMethod === "DEPOSIT";
        const amt = isDeposit ? newTxRow.deposit : newTxRow.withdrawal;
        if (amt <= 0 || amt > 10000000) { showToast("Validation Error", "Amount must be between 0.01 and 10,000,000.", "error"); return; }

        if (newTxRow.transMethod === "WITHDRAWAL" && newTxRow.transType === "CHEQUE" && (newTxInstFiles || []).length === 0) {
            showToast("Validation Error", "Cheque image is required for cheque withdrawals.", "error"); return;
        }

        setNewTxSaving(true);
        try {
            // 2. Build Payload exactly like TransactionForm.tsx
            const saveToLedger = newTxRow.saveToUnitLedger !== false && !!newTxRow.otherUnitId;
            const finalParticulars = newTxRow.particulars;

            // Align voucher_no logic with TransactionForm.tsx (optional: derive from file if empty)
            let finalVoucherNo = newTxRow.voucherNo || null;
            if (!finalVoucherNo && newTxFile) {
                finalVoucherNo = newTxFile.name.replace(/\.[^.]+$/, "").toUpperCase();
            }

            const transactionPayload = {
                voucher_date: newTxRow.voucherDate,
                voucher_no: finalVoucherNo,
                trans_type: newTxRow.transType,
                amount: amt,
                particulars: finalParticulars,
                status: "ACTIVE",

                // Routing IDs
                // 🔥 CRITICAL: Backend and TransactionForm.tsx expect from=MAIN, to=CLIENT
                // The unit belongs to the CLIENT (to_owner_id), so we must map it this way
                // for the backend validation to pass.
                from_owner_id: selectedOwnerId,
                to_owner_id: newTxRow.otherOwnerId,
                
                // Unit specifics
                unit_id: newTxRow.otherUnitId,
                save_to_unit_ledger: saveToLedger,

                // Extra Fields
                fund_reference: newTxRow.fundReference || null,
                person_in_charge: newTxRow.personInCharge || null,
            };

            const instrumentsPayload: any[] = [];
            if (newTxInstFiles.length > 0 && (newTxRow.transType === "CHEQUE" || newTxRow.transType === "CHEQUE DEPOSIT")) {
                newTxInstFiles.forEach(f => {
                    instrumentsPayload.push({
                        instrument_type: newTxRow.transType,
                        instrument_no: f.name.replace(/\.[^.]+$/, ""),
                    });
                });
            }

            const formData = new FormData();
            formData.append('transaction', JSON.stringify(transactionPayload));
            if (instrumentsPayload.length > 0) {
                formData.append('instruments', JSON.stringify(instrumentsPayload));
            }
            if (newTxFile) {
                formData.append('voucher', newTxFile);
            }
            // 🔥 BACKEND EXPECTS file_0, file_1, etc. for instrument attachments
            if (newTxInstFiles.length > 0) {
                newTxInstFiles.forEach((f, idx) => {
                    formData.append(`file_${idx}`, f);
                });
            }

            // 3. Send Request
            const endpoint = isDeposit ? '/api/accountant/transactions/deposit' : '/api/accountant/transactions/withdrawal';
            const res = await fetch(endpoint, {
                method: "POST",
                body: formData, // fetch automatically sets multipart matching boundary
            });
            const data = await res.json();
            
            if (data.success) {
                showToast("Success", data.message || "Transaction added successfully.", "success");
                setIsAddingNew(false);
                setAddingIndex(0);
                setNewTxRow(null);
                setNewTxFile(null);
                setNewTxInstFiles([]);
                fetchLedger();
            } else {
                // If validation errors are returned, show the first one
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0] as string[];
                    showToast("Validation Error", firstError[0], "error");
                } else {
                    showToast("Error", data.message || "Failed to create transaction.", "error");
                }
            }
        } catch (err: any) {
            showToast("Error", err.message || "An unexpected error occurred.", "error");
        } finally {
            setNewTxSaving(false);
        }
    }, [newTxRow, selectedOwnerId, newTxFile, newTxInstFiles, showToast, fetchLedger]);

    // ── Columns ───────────────────────────────────────────────────────────────

    const columns = React.useMemo<DataSheetColumn<LedgerEntry>[]>(() => [
        // ── # (row number) ──
        {
            key: "__rowNum",
            label: "#",
            align: "center",
            width: "52px",
            minWidth: "52px",
            renderCell: (row, rowIndex) => {
                if ((row as any).isPlaceholder) return null;
                if (row.id === -1) {
                    return (
                        <div className="flex items-center justify-center w-full h-full">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7B0F2B] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                +
                            </span>
                        </div>
                    );
                }
                return (
                    <span className="text-xs font-bold text-gray-400 tabular-nums">
                        {rowIndex + 1}
                    </span>
                );
            },
        },

        // ── DATE (editable) ──
        {
            key: "createdAt",
            label: (
                <InfoTooltip text="The date when the voucher was issued or transaction occurred.">
                    <span>DATE</span>
                </InfoTooltip>
            ),
            align: "center",
            width: "170px",
            minWidth: "170px",
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="date"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    editingTxId={editingTxId}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                    newTxInstFiles={newTxInstFiles}
                    setNewTxInstFiles={setNewTxInstFiles}
                    editingChequeFiles={editingChequeFiles}
                    setEditingChequeFiles={setEditingChequeFiles}
                />
            ),
        },

        // ── VOUCHER NO. (editable) ──
        {
            key: "voucherNo",
            label: (
                <InfoTooltip text="The unique reference number on the physical or digital voucher.">
                    <span>VOUCHER NO.</span>
                </InfoTooltip>
            ),
            align: "center",
            width: (isAddingNew || editingTxId) ? "280px" : "200px",
            minWidth: (isAddingNew || editingTxId) ? "280px" : "200px",
            maxWidth: (isAddingNew || editingTxId) ? "280px" : "200px",
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="voucher"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    newTxFile={newTxFile}
                    setNewTxFile={setNewTxFile}
                    editingTxId={editingTxId}
                    onTransMethodChange={setEditingTransMethod}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                    voucherFile={editingVoucherFile}
                    setVoucherFile={setEditingVoucherFile}
                />
            ),
        },

        // ── TRANS TYPE (editable) ──
        {
            key: "transType",
            label: (
                <InfoTooltip text="The classification of the transaction (e.g. Cash, Cheque, Bank Transfer).">
                    <span>TRANS TYPE</span>
                </InfoTooltip>
            ),
            align: "center",
            width: (isAddingNew || editingTxId) ? "250px" : "170px",
            minWidth: (isAddingNew || editingTxId) ? "250px" : "170px",
            maxWidth: (isAddingNew || editingTxId) ? "250px" : "170px",
            sortable: true,
            renderCell: (row) => {
                if ((row as any).isPlaceholder) return null;
                const files: { name: string; url?: string | null; type?: string | null; size?: number | null }[] =
                    (row.instrumentAttachments ?? []).map((a: any) => ({
                        name: a.instrumentNo ?? a.file_name ?? a.name ?? "—",
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null,
                        type: a.fileType ?? a.file_type ?? a.mimeType ?? a.mime_type ?? null,
                        size: a.fileSize ?? a.file_size ?? null,
                    }));

                const isEditing = editingTxId === row.transactionId;
                const hasFiles = row.id !== -1 && files.length > 0;

                const transTypeContent = (
                    <div className={`flex items-center justify-center gap-2 w-full ${hasFiles && !isEditing ? "cursor-pointer group/trans" : ""}`}>
                        <div className={hasFiles && !isEditing ? "text-[#7a0f1f] font-semibold underline decoration-dotted underline-offset-2" : ""}>
                <InlineUpsertTransaction
                    type="transType"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    newTxInstFiles={newTxInstFiles}
                    setNewTxInstFiles={setNewTxInstFiles}
                    editingTxId={editingTxId}
                    onTransMethodChange={setEditingTransMethod}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                    editingChequeFiles={editingChequeFiles}
                    setEditingChequeFiles={setEditingChequeFiles}
                />
                        </div>
                        {hasFiles && (
                            <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-sm bg-[#7a0f1f]/10 text-[#7a0f1f] transition-colors ${!isEditing ? "group-hover/trans:bg-[#7a0f1f]/20" : ""}`}>
                                    <FileText className="w-2.5 h-2.5" />
                                </span>
                                {isEditing && (
                                    <span className="text-[10px] font-semibold text-[#7a0f1f] whitespace-nowrap">
                                        {files.length} file{files.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );

                if (hasFiles && !isEditing) {
                    return (
                        <InstrumentFilesPopover label={`${row.transType} files`} files={files}>
                            {transTypeContent}
                        </InstrumentFilesPopover>
                    );
                }

                return transTypeContent;
            },
        },

        // ── OWNER (editable) ──
        {
            key: "owner",
            label: "OWNER",
            align: "center",
            width: (isAddingNew || editingTxId) ? "300px" : "200px",
            minWidth: (isAddingNew || editingTxId) ? "300px" : "200px",
            maxWidth: (isAddingNew || editingTxId) ? "300px" : "200px",
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="owner"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    allOwners={allOwners}
                    allOwnersLoading={allOwnersLoading}
                    editingTxId={editingTxId}
                    role={role}
                    router={router}
                    selectedOwnerId={selectedOwnerId}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── PARTICULARS (editable) ──
        {
            key: "particulars",
            label: "PARTICULARS",
            align: "left",
            width: "500px",
            minWidth: "500px",
            maxWidth: "500px",
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="particulars"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    newTxUnits={newTxUnits}
                    newTxUnitsLoading={newTxUnitsLoading}
                    editingTxId={editingTxId}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── DEPOSIT ──
        {
            key: "deposit",
            label: (
                <InfoTooltip text="Amount received (increases the account balance).">
                    <span>DEPOSIT</span>
                </InfoTooltip>
            ),
            align: "right",
            width: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "DEPOSIT";
                const isInitialNew = isAddingNew && !editingTransMethod && (newTxRow?.transMethod === "DEPOSIT" || !newTxRow?.transMethod);
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            minWidth: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "DEPOSIT";
                const isInitialNew = isAddingNew && !editingTransMethod && (newTxRow?.transMethod === "DEPOSIT" || !newTxRow?.transMethod);
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            maxWidth: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "DEPOSIT";
                const isInitialNew = isAddingNew && !editingTransMethod && (newTxRow?.transMethod === "DEPOSIT" || !newTxRow?.transMethod);
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="deposit"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    editingTxId={editingTxId}
                    onTransMethodChange={setEditingTransMethod}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── WITHDRAWAL ──
        {
            key: "withdrawal",
            label: (
                <InfoTooltip text="Amount paid out (decreases the account balance).">
                    <span>WITHDRAWAL</span>
                </InfoTooltip>
            ),
            align: "right",
            width: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "WITHDRAWAL";
                const isInitialNew = isAddingNew && !editingTransMethod && newTxRow?.transMethod === "WITHDRAWAL";
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            minWidth: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "WITHDRAWAL";
                const isInitialNew = isAddingNew && !editingTransMethod && newTxRow?.transMethod === "WITHDRAWAL";
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            maxWidth: (() => {
                const isActive = (isAddingNew || editingTxId) && editingTransMethod === "WITHDRAWAL";
                const isInitialNew = isAddingNew && !editingTransMethod && newTxRow?.transMethod === "WITHDRAWAL";
                return (isActive || isInitialNew) ? "300px" : "140px";
            })(),
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="withdrawal"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    editingTxId={editingTxId}
                    onTransMethodChange={setEditingTransMethod}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── OUTS. BALANCE ──
        {
            key: "outsBalance",
            label: (
                <InfoTooltip text="The running total balance of the account at this point in time.">
                    <span>OUTS. BALANCE</span>
                </InfoTooltip>
            ),
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => {
                if ((row as any).isPlaceholder) return null;
                if (row.id === -1) return <span className="text-gray-300 font-bold italic">TBC</span>;
                return (
                    <span className="font-bold text-gray-900">
                        {typeof row.outsBalance === 'number' 
                            ? `₱${row.outsBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : "—"
                        }
                    </span>
                );
            },
        },

        // ── FUND REFERENCES (extra) ──
        {
            key: "fundReference",
            label: (
                <InfoTooltip text="Additional reference information such as cheque numbers or bank transaction IDs.">
                    <span>FUND REFERENCES</span>
                </InfoTooltip>
            ),
            align: "left",
            minWidth: "350px",
            maxWidth: "350px",
            hidden: !showExtraColumns && !editingTxId && !isAddingNew,
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="fundReference"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    editingTxId={editingTxId}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── PERSON IN CHARGE (extra) ──
        {
            key: "personInCharge",
            label: (
                <InfoTooltip text="The individual responsible for initiating or overseeing this transaction.">
                    <span>PERSON IN CHARGE</span>
                </InfoTooltip>
            ),
            align: "center",
            minWidth: "220px",
            maxWidth: "220px",
            hidden: !showExtraColumns && !editingTxId && !isAddingNew,
            sortable: true,
            renderCell: (row) => (
                <InlineUpsertTransaction
                    type="personInCharge"
                    row={row}
                    isNew={row.id === -1}
                    newTxRow={newTxRow}
                    setNewTxRow={setNewTxRow}
                    editingTxId={editingTxId}
                    draft={editingRowDraft}
                    setDraft={setEditingRowDraft}
                />
            ),
        },

        // ── EDIT ACTIONS (shown only for editing row) ──
        {
            key: "__editActions",
            label: "",
            align: "center",
            width: "120px",
            minWidth: "120px",
            maxWidth: "120px",
            renderCell: (row) => {
                if ((row as any).isPlaceholder) return null;
                if (row.id === -1) {
                    return (
                        <div className="flex flex-col gap-2 w-full mt-1">
                            <button
                                type="button"
                                onClick={handleSubmitNewRow}
                                disabled={newTxSaving}
                                className="w-full h-10 px-3 text-xs font-black rounded-lg bg-[#7a0f1f] text-white hover:bg-[#5f0c18] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                {newTxSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-4 h-4" /> SAVE</>}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAddingNew(false); setNewTxRow(null); }}
                                disabled={newTxSaving}
                                className="w-full h-10 px-3 text-xs font-black rounded-lg bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <X className="w-4 h-4" /> CANCEL
                            </button>
                        </div>
                    );
                }
                
                if (editingTxId !== row.transactionId) return null;
                return (
                    <div className="flex flex-col gap-2 py-1">
                        <button
                            type="button"
                            disabled={editingSaving}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSaveAllChanges();
                            }}
                            className="flex flex-col items-center justify-center w-full h-10 px-2 rounded-lg bg-[#7a0f1f] text-white hover:bg-[#5f0c18] transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {editingSaving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="text-[10px] font-black leading-none uppercase">SAVE</span>
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={editingSaving}
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingTxId(null);
                                setEditingRowDraft(null);
                                setEditingTransMethod(null);
                                setEditingVoucherFile(null);
                                setEditingChequeFiles([]);
                            }}
                            className="flex items-center justify-center w-full h-10 px-2 rounded-lg bg-white text-gray-400 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm text-[10px] font-black uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                );
            },
        },
    ], [showExtraColumns, role, handleSaveDate, handleSaveTransType, handleSaveParticulars, handleSaveOwner, handleSaveAmount, handleSaveAllChanges, editingTxId, editingField, editingTransMethod, editingRowDraft, editingSaving, allOwners, allOwnersLoading, router, fetchLedger, isAddingNew, newTxRow, newTxFile, newTxInstFiles, newTxSaving, handleSubmitNewRow, selectedOwnerId, newTxUnits, newTxUnitsLoading, entries]);

    // ── Compute virtual outsBalance for each row ──────────────────────────────

    const entriesWithBalance = useMemo(() => {
        let balance = 0;
        return entries.map(e => {
            balance = balance + e.deposit - e.withdrawal;
            return { ...e, outsBalance: balance };
        });
    }, [entries]);

    // ── Filter + Pagination ───────────────────────────────────────────────────

    const filteredEntries = useMemo(() => {
        let current = [...entriesWithBalance];
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            current = current.filter((e) =>
                (e.particulars && e.particulars.toLowerCase().includes(lowerQuery)) ||
                (e.transType && e.transType.toLowerCase().includes(lowerQuery)) ||
                (e.voucherNo && e.voucherNo.toLowerCase().includes(lowerQuery)) ||
                (e.owner && e.owner.toLowerCase().includes(lowerQuery)) ||
                (String(e.id).includes(lowerQuery))
            );
        }
        if (isAddingNew && newTxRow) {
            // If target index is beyond current length, pad with placeholders
            if (addingIndex >= current.length) {
                const gapCount = addingIndex - current.length;
                for (let i = 0; i < gapCount; i++) {
                    current.push({ 
                        id: `gap-${i}`, 
                        transactionId: -99 - i, 
                        isPlaceholder: true 
                    } as any);
                }
                current.push(newTxRow);
            } else {
                current.splice(addingIndex, 0, newTxRow);
            }
        }
        return current;
    }, [entriesWithBalance, query, isAddingNew, newTxRow, addingIndex]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col">
            <AppHeader
                navigation={[]}
                title="Transaction Sheet"
                subtitle="Right-click a row to see more actions."
                primaryAction={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    {/* ── Section header ── */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Ledger Entries</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Browse and manage transactions.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {role !== "superadmin" && (
                                <button
                                    onClick={() => startAddingNewRow(0)}
                                    disabled={isAddingNew || entriesLoading || ownersLoading}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-[#7a0f1f] hover:bg-[#5f0c18] rounded-lg transition-colors disabled:opacity-50"
                                >
                                    + Add Transaction
                                </button>
                            )}
                            {/* Extra columns toggle */}
                            <button
                                onClick={() => setShowExtraColumns(!showExtraColumns)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                {showExtraColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showExtraColumns ? "Hide Extra Columns" : "Show Extra Columns"}
                            </button>
                        </div>
                    </div>

                    {/* ── Toolbar ── */}
                    <div className="mt-4">
                        <SharedToolbar
                            searchQuery={query}
                            onSearchChange={(val: string) => setQuery(val)}
                            searchPlaceholder="Search transaction..."
                            onRefresh={fetchLedger}
                            containerMaxWidth="max-w-4xl"
                        >
                            <div className="flex items-center gap-3">
                                <OwnerSelectDropdown
                                    owners={owners}
                                    selectedId={selectedOwnerId}
                                    onChange={setSelectedOwnerId}
                                    loading={ownersLoading}
                                />
                                <button
                                    onClick={() => startAddingNewRow(0)}
                                    disabled={isAddingNew || !selectedOwnerId}
                                    className="inline-flex items-center gap-2 px-4 h-10 text-sm font-bold text-white bg-[#7a0f1f] hover:bg-[#5f0c18] rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Transaction</span>
                                </button>
                            </div>
                        </SharedToolbar>
                    </div>

                    {/* ── Balance banner + Table ── */}
                    <div className="mt-6">
                        <div
                            className="bg-white rounded-md border-x border-t p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between"
                            style={{ borderColor: BORDER }}
                        >
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#5f0c18]">
                                    ABIC REALTY &amp; CONSULTANCY CORPORATION 2025
                                </h1>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">
                                    {ownersLoading ? "Loading..." : (owners.find((o) => String(o.id) === String(selectedOwnerId))?.name ?? "Select Owner")}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0 text-right">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Balance</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                                        {entriesLoading ? "..." : `₱${openingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Running Balance</p>
                                    <p className="text-lg font-bold text-[#7a0f1f] mt-0.5">
                                        {entriesLoading
                                            ? "..."
                                            : `₱${runningBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DataSheetLedge
                            columns={columns}
                            rows={filteredEntries}
                            itemName="entries"
                            loading={entriesLoading}
                            getRowId={(row) => `row-${row.transactionId}`}
                            highlightRowId={lastEditedId ? `row-${lastEditedId}` : (highlightTx ? `row-${highlightTx}` : undefined)}
                            sortKey={isAddingNew ? null : undefined}
                            sortDirection={isAddingNew ? null : undefined}
                            onRowContextMenu={(e, row, index) => {
                                if (!e || !e.clientX || !e.clientY) return;
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    visible: true,
                                    row,
                                    index
                                });
                            }}
                        />
                    </div>
                </section>
            </div>

            <ContextMenu
                {...contextMenu}
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                actions={[
                    // Global Add: only show if right-clicked on empty space (no row)
                    ...(!contextMenu.row ? [
                        {
                            label: "Add New Transaction",
                            icon: Plus,
                            onClick: () => {
                                startAddingNewRow(contextMenu.index ?? 0);
                            }
                        }
                    ] : []),
                    // Actions for existing rows
                    ...(contextMenu.row ? [
                        {
                            label: editingTxId === contextMenu.row.transactionId ? "Cancel Edit" : "Edit Transaction",
                            icon: editingTxId === contextMenu.row.transactionId ? PencilOff : Pencil,
                            onClick: () => {
                                if (contextMenu.row) {
                                    if (editingTxId === contextMenu.row.transactionId) {
                                        setEditingTxId(null);
                                        setEditingRowDraft(null);
                                        setEditingChequeFiles([]);
                                        setEditingTransMethod(null);
                                    } else {
                                        setEditingTxId(contextMenu.row.transactionId);
                                        setEditingRowDraft({ ...contextMenu.row });
                                        setEditingChequeFiles([]);
                                        setEditingTransMethod(contextMenu.row.deposit > 0 ? "DEPOSIT" : "WITHDRAWAL");
                                    }
                                    setEditingField(null);
                                }
                            }
                        },
                        {
                            label: "View Transaction",
                            icon: Eye,
                            onClick: () => {
                                // Future action
                            }
                        }
                    ] : []),
                ]}
            />


        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function TransactionSheetShared({ role }: { role: "superadmin" | "accountant" }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <TransactionSheetPage role={role} />
        </Suspense>
    );
}
