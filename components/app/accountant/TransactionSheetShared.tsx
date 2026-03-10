"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
import { superAdminNav, accountantNav } from "@/lib/navigation";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

interface LedgerEntry {
    id: number;
    transactionId: number;
    createdAt: string;
    voucherDate: string;
    isVoucherDate: boolean;
    voucherNo: string;
    otherOwnerId: number | null;
    otherOwnerType: string | null;
    otherUnitId: number | null;
    transType: string;
    owner: string;
    particulars: string;
    deposit: number;
    withdrawal: number;
    outsBalance: number;
    transferGroupId: number | null;
    voucherAttachmentUrl: string | null;
    voucherFileType: string | null;
    voucherFileSize: number | null;
    instrumentAttachments: any[];
    fundReference: string | null;
    personInCharge: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Convert a display date string like "Jan 1, 2025" or "2025-01-01" to "YYYY-MM-DD" for <input type="date"> */
function toDateInputValue(dateStr: string): string {
    if (!dateStr) return "";
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Try parsing
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

// ─── Inline Date Cell ─────────────────────────────────────────────────────────

function InlineDateCell({
    row,
    onSave,
    forceEdit,
    onEditDone,
}: {
    row: LedgerEntry;
    onSave: (transactionId: number, newDate: string) => Promise<void>;
    forceEdit?: boolean;
    onEditDone?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(toDateInputValue(row.voucherDate));
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Trigger editing when forceEdit becomes true
    useEffect(() => {
        if (forceEdit) {
            setValue(toDateInputValue(row.voucherDate));
            setEditing(true);
        }
    }, [forceEdit, row.voucherDate]);

    // Focus the input once editing begins
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            setTimeout(() => inputRef.current?.showPicker?.(), 50);
        }
    }, [editing]);

    const finish = useCallback(() => {
        setEditing(false);
        onEditDone?.();
    }, [onEditDone]);

    async function commit() {
        if (!editing) return;
        const iso = toDateInputValue(value);
        const original = toDateInputValue(row.voucherDate);

        if (!iso || iso === original) {
            finish();
            return;
        }

        setSaving(true);
        try {
            await onSave(row.transactionId, iso);
        } finally {
            setSaving(false);
            finish();
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { finish(); setValue(toDateInputValue(row.voucherDate)); }
    }

    if (editing) {
        return (
            <div
                className="flex items-center gap-1 w-full"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <input
                    ref={inputRef}
                    type="date"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKeyDown}
                    className="w-full h-7 text-xs rounded border border-[#7a0f1f]/60 bg-white px-1.5 focus:outline-none focus:ring-2 focus:ring-[#7a0f1f]/30 font-medium text-gray-800"
                />
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); commit(); }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-[#7a0f1f] text-white hover:bg-[#5f0c18] transition-colors"
                    title="Save"
                >
                    <Check className="w-3 h-3" />
                </button>
            </div>
        );
    }

    // Read mode
    return (
        <span className={`text-sm font-medium ${saving ? "opacity-50" : ""}`}>
            {row.voucherDate || "—"}
        </span>
    );
}

// ─── Inline Voucher Cell ──────────────────────────────────────────────────────

function InlineVoucherCell({
    row,
    onRefresh,
    forceEdit,
}: {
    row: LedgerEntry;
    onRefresh: () => void;
    forceEdit?: boolean;
}) {
    const [loading, setLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const { showToast } = useAppToast();

    useOutsideClick(optionsRef, () => setShowOptions(false));

    async function handleNoVoucher() {
        setLoading(true);
        setShowOptions(false);
        try {
            const formData = new FormData();
            formData.append("remove_voucher", "true");

            const res = await fetch(`/api/accountant/transactions/${row.transactionId}/patch-voucher`, {
                method: "POST", // multipart/form-data doesn't play well with PATCH in some PHP versions, using POST + override
                headers: { "X-HTTP-Method-Override": "PATCH" },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                showToast("Voucher Removed", "Transaction updated to 'No Voucher'.", "success");
                onRefresh();
            } else {
                showToast("Error", data.message || "Failed to update voucher.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("voucher", file);

            const res = await fetch(`/api/accountant/transactions/${row.transactionId}/patch-voucher`, {
                method: "POST",
                headers: { "X-HTTP-Method-Override": "PATCH" },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                showToast("Voucher Uploaded", "Transaction voucher has been updated.", "success");
                onRefresh();
            } else {
                showToast("Error", data.message || "Failed to upload voucher.", "error");
            }
        } catch (err: any) {
            showToast("Error", err.message, "error");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    if (!forceEdit) {
        return (
            <VoucherPreviewButton
                voucherNo={row.voucherNo}
                attachmentUrl={row.voucherAttachmentUrl}
                fileType={row.voucherFileType}
                fileSize={row.voucherFileSize}
            />
        );
    }

    return (
        <div className="relative w-full flex justify-center" ref={optionsRef}>
            <button
                disabled={loading}
                onClick={() => setShowOptions(!showOptions)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border-2 border-dashed transition-all
                    ${row.voucherNo
                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                {loading ? "Updating..." : (row.voucherNo || "No Voucher")}
                <ChevronDown className="w-3 h-3" />
            </button>

            {showOptions && (
                <div className="absolute top-full mt-1.5 z-[110] bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                        onClick={handleNoVoucher}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                        <EyeOff className="w-4 h-4 shrink-0" />
                        No Voucher
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
                    >
                        <Upload className="w-4 h-4 shrink-0" />
                        With Voucher
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
            />
        </div>
    );
}


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
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [lastEditedId, setLastEditedId] = useState<number | null>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, row: LedgerEntry | null }>({
        x: 0,
        y: 0,
        visible: false,
        row: null,
    });

    const [editingTxId, setEditingTxId] = useState<number | null>(null);
    const [editingField, setEditingField] = useState<"date" | null>(null);

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

    // ── Fetch ledger entries ──────────────────────────────────────────────────

    const fetchLedger = useCallback(() => {
        if (!selectedOwnerId) return;
        setEntriesLoading(true);
        const url = `/api/accountant/ledger/mains?owner_id=${selectedOwnerId}&sort=oldest`;
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setEntries(data.data.transactions || []);
                    setOpeningBalance(data.data.openingBalance || 0);
                } else {
                    setEntries([]);
                    setOpeningBalance(0);
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


    // ── Columns ───────────────────────────────────────────────────────────────

    const columns = React.useMemo<DataSheetColumn<LedgerEntry>[]>(() => [
        // ── # (row number) ──
        {
            key: "__rowNum",
            label: "#",
            align: "center",
            width: "52px",
            minWidth: "52px",
            renderCell: (_row, rowIndex) => (
                <span className="text-xs font-bold text-gray-400 tabular-nums">
                    {rowIndex + 1}
                </span>
            ),
        },

        // ── DATE (editable) ──
        {
            key: "createdAt",
            label: "DATE",
            align: "center",
            width: "170px",
            minWidth: "170px",
            sortable: true,
            renderCell: (row) => (
                <InlineDateCell
                    row={row}
                    onSave={handleSaveDate}
                    forceEdit={editingTxId === row.transactionId}
                    onEditDone={() => { /* whole row editing stays on */ }}
                />
            ),
        },

        // ── VOUCHER NO. (editable) ──
        {
            key: "voucherNo",
            label: "VOUCHER NO.",
            align: "center",
            width: "200px",
            minWidth: "200px",
            maxWidth: "200px",
            sortable: true,
            renderCell: (row) => (
                <InlineVoucherCell
                    row={row}
                    onRefresh={fetchLedger}
                    forceEdit={editingTxId === row.transactionId}
                />
            ),
        },

        // ── TRANS TYPE ──
        {
            key: "transType",
            label: "TRANS TYPE",
            align: "center",
            width: "150px",
            minWidth: "150px",
            maxWidth: "150px",
            sortable: true,
            renderCell: (row) => {
                const files: { name: string; url?: string | null; type?: string | null; size?: number | null }[] =
                    (row.instrumentAttachments ?? []).map((a: any) => ({
                        name: a.instrumentNo ?? a.file_name ?? a.name ?? "—",
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null,
                        type: a.fileType ?? a.file_type ?? a.mimeType ?? a.mime_type ?? null,
                        size: a.fileSize ?? a.file_size ?? null,
                    }));
                if (files.length === 0) return row.transType as string;
                const trigger = (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#7a0f1f] cursor-pointer group/chip">
                        <span className="underline decoration-dotted underline-offset-2">{row.transType}</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-[#7a0f1f]/10 text-[#7a0f1f] group-hover/chip:bg-[#7a0f1f]/20 transition-colors">
                            <FileText className="w-2.5 h-2.5" />
                        </span>
                    </span>
                );
                return (
                    <InstrumentFilesPopover label={`${row.transType} files`} files={files}>
                        {trigger}
                    </InstrumentFilesPopover>
                );
            },
        },

        // ── OWNER ──
        {
            key: "owner",
            label: "OWNER",
            align: "center",
            width: "180px",
            minWidth: "180px",
            maxWidth: "180px",
            sortable: true,
            renderCell: (row) => {
                if (!row.otherOwnerType || !row.otherOwnerId) {
                    return (
                        <InfoTooltip text={row.owner}>
                            <span className="truncate block cursor-default">{row.owner}</span>
                        </InfoTooltip>
                    );
                }
                const destType = row.otherOwnerType.toLowerCase();
                let targetUrl = `/${role === "superadmin" ? "super/accountant" : "accountant"}/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
                if (row.otherUnitId) targetUrl += `&targetUnitId=${row.otherUnitId}`;
                return (
                    <InfoTooltip text={row.owner}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); router.push(targetUrl); }}
                            className="truncate block w-full font-semibold text-[#7a0f1f] underline decoration-dotted underline-offset-2 hover:text-[#5f0c18] transition-colors cursor-pointer"
                        >
                            {row.owner}
                        </button>
                    </InfoTooltip>
                );
            },
        },

        // ── PARTICULARS ──
        {
            key: "particulars",
            label: "PARTICULARS",
            align: "left",
            width: "500px",
            minWidth: "500px",
            maxWidth: "500px",
            sortable: true,
            renderCell: (row) => {
                const text: string = row.particulars ?? "";
                const sepIdx = text.indexOf(" - ");
                if (sepIdx === -1) return text;
                const unit = text.slice(0, sepIdx);
                const rest = text.slice(sepIdx + 3);
                return (
                    <span>
                        <span className="font-bold">{unit}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span>{rest}</span>
                    </span>
                );
            },
        },

        // ── DEPOSIT ──
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
                    {row.deposit > 0 ? `₱${row.deposit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            ),
        },

        // ── WITHDRAWAL ──
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
                    {row.withdrawal > 0 ? `₱${row.withdrawal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            ),
        },

        // ── OUTS. BALANCE ──
        {
            key: "outsBalance",
            label: "OUTS. BALANCE",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-bold text-gray-900">
                    ₱{row.outsBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
            ),
        },

        // ── FUND REFERENCES (extra) ──
        {
            key: "fundReference",
            label: "FUND REFERENCES",
            align: "left",
            minWidth: "180px",
            maxWidth: "180px",
            hidden: !showExtraColumns,
            sortable: true,
            renderCell: (row) => row.fundReference || "-",
        },

        // ── PERSON IN CHARGE (extra) ──
        {
            key: "personInCharge",
            label: "PERSON IN CHARGE",
            align: "center",
            minWidth: "160px",
            maxWidth: "160px",
            hidden: !showExtraColumns,
            sortable: true,
            renderCell: (row) => row.personInCharge || "-",
        },
    ], [showExtraColumns, role, handleSaveDate, editingTxId, editingField]);

    // ── Filter + Pagination ───────────────────────────────────────────────────

    const filteredEntries = React.useMemo(() => {
        if (!query.trim()) return entries;
        const lowerQuery = query.toLowerCase();
        return entries.filter((e) =>
            (e.particulars && e.particulars.toLowerCase().includes(lowerQuery)) ||
            (e.transType && e.transType.toLowerCase().includes(lowerQuery)) ||
            (e.voucherNo && e.voucherNo.toLowerCase().includes(lowerQuery)) ||
            (e.owner && e.owner.toLowerCase().includes(lowerQuery)) ||
            (String(e.id).includes(lowerQuery))
        );
    }, [entries, query]);

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
                            <OwnerSelectDropdown
                                owners={owners}
                                selectedId={selectedOwnerId}
                                onChange={setSelectedOwnerId}
                                loading={ownersLoading}
                            />
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
                                            : entries.length > 0
                                                ? `₱${entries[entries.length - 1].outsBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                                                : "₱0.00"}
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
                            onRowContextMenu={(e, row) => {
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    visible: true,
                                    row
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
                    {
                        label: "Edit Transaction",
                        icon: Pencil,
                        onClick: () => {
                            if (contextMenu.row) {
                                setEditingTxId(contextMenu.row.transactionId);
                                setEditingField(null); // No specific field, whole row
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
