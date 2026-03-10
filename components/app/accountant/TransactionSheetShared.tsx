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

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

interface AllOwner {
    id: number;
    name: string;
    owner_type: string;
    status: string;
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
    transMethod: string | null;
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
    // Use local date parts to avoid UTC timezone shift (toISOString would shift -1 day in UTC+ zones)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
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
        } else {
            setEditing(false);
        }
    }, [forceEdit, row.voucherDate]);

    // Focus the input once editing begins
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing]);

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal = e.target.value;
        setValue(newVal);

        // Auto-save immediately when date changes
        const iso = toDateInputValue(newVal);
        const original = toDateInputValue(row.voucherDate);

        if (!iso || iso === original) return;

        setSaving(true);
        try {
            await onSave(row.transactionId, iso);
        } finally {
            setSaving(false);
        }
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
                    onChange={handleChange}
                    disabled={saving}
                    className={`w-full h-7 text-xs rounded border border-[#7a0f1f]/60 bg-white px-1.5 focus:outline-none focus:ring-2 focus:ring-[#7a0f1f]/30 font-medium text-gray-800 ${saving ? "opacity-50" : ""}`}
                />
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
    const [showConfirm, setShowConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const { showToast } = useAppToast();

    useOutsideClick(optionsRef, () => setShowOptions(false));

    function handleNoVoucherClick() {
        setShowOptions(false);
        // If there's an existing voucher, ask for confirmation first
        if (row.voucherNo) {
            setShowConfirm(true);
        } else {
            handleNoVoucher();
        }
    }

    async function handleNoVoucher() {
        setShowConfirm(false);
        setLoading(true);
        setShowOptions(false);
        try {
            const formData = new FormData();
            formData.append("remove_voucher", "1");

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
                        onClick={handleNoVoucherClick}
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

            <ConfirmationModal
                open={showConfirm}
                title="Remove Voucher?"
                message="Are you sure you want to remove this voucher? The voucher image will be permanently deleted."
                icon={AlertTriangle}
                color="#dc2626"
                confirmLabel="Yes, Remove"
                cancelLabel="Keep Voucher"
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleNoVoucher}
                isConfirming={loading}
                zIndex={10000}
            />

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

// ─── Inline Trans Type Cell ───────────────────────────────────────────────────

function InlineTransTypeCell({
    row,
    onSave,
    forceEdit,
    onEditDone,
}: {
    row: LedgerEntry;
    onSave: (transactionId: number, transType: string, transMethod: "DEPOSIT" | "WITHDRAWAL", chequeFile?: File) => Promise<void>;
    forceEdit?: boolean;
    onEditDone?: () => void;
}) {
    // Determine the initial mode from the row data
    const initialMode = row.deposit > 0 ? "DEPOSIT" : "WITHDRAW";
    const [mode, setMode] = useState<"DEPOSIT" | "WITHDRAW">(initialMode);

    const depositTypes = ["CASH DEPOSIT", "BANK TRANSFER", "CHEQUE DEPOSIT"];
    const withdrawTypes = ["CHEQUE"];
    const options = mode === "DEPOSIT" ? depositTypes : withdrawTypes;

    const [selectedType, setSelectedType] = useState(row.transType || options[0]);
    const [saving, setSaving] = useState(false);
    const [openMode, setOpenMode] = useState(false);
    const [openType, setOpenType] = useState(false);
    const [chequeFile, setChequeFile] = useState<File | null>(null);
    const chequeInputRef = useRef<HTMLInputElement>(null);
    const modeRef = useRef<HTMLDivElement>(null);
    const typeRef = useRef<HTMLDivElement>(null);

    useOutsideClick(modeRef, () => setOpenMode(false));
    useOutsideClick(typeRef, () => setOpenType(false));

    // When mode changes, reset type to the first option of the new mode
    function handleModeChange(newMode: "DEPOSIT" | "WITHDRAW") {
        setMode(newMode);
        setOpenMode(false);
        const newType = newMode === "DEPOSIT" ? "CASH DEPOSIT" : "CHEQUE";
        setSelectedType(newType);
        setChequeFile(null);
        
        // Auto-save the mode immediately if DEPOSIT (no file needed)
        if (newMode === "DEPOSIT") {
            setSaving(true);
            onSave(row.transactionId, newType, "DEPOSIT").finally(() => setSaving(false));
        }
    }

    function handleTypeSelect(type: string) {
        setSelectedType(type);
        setOpenType(false);
        // For DEPOSIT mode, auto-save immediately when type changes
        if (mode === "DEPOSIT" && type !== row.transType) {
            setSaving(true);
            onSave(row.transactionId, type, "DEPOSIT").finally(() => setSaving(false));
        }
    }

    const requiresChequeImage = mode === "WITHDRAW" && selectedType === "CHEQUE";

    async function handleSaveWithCheque() {
        if (requiresChequeImage && !chequeFile) {
            return; // The UI will show validation message
        }
        setSaving(true);
        try {
            await onSave(row.transactionId, selectedType, "WITHDRAWAL", chequeFile || undefined);
        } finally {
            setSaving(false);
        }
    }

    if (!forceEdit) {
        return <span className="text-sm font-medium">{row.transType}</span>;
    }

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {/* Row 1: Mode selector + Type selector */}
            <div className="flex items-center gap-1.5">
                {/* ── Mode Selector ── */}
                <div className="relative" ref={modeRef}>
                    <button
                        disabled={saving}
                        onClick={() => setOpenMode(!openMode)}
                        className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-all
                            ${mode === "DEPOSIT"
                                ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                            } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        {mode}
                        <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {openMode && (
                        <div className="absolute top-full mt-1 z-[120] bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden py-0.5 min-w-[100px] animate-in fade-in slide-in-from-top-1 duration-100">
                            {(["DEPOSIT", "WITHDRAW"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleModeChange(m)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors text-left
                                        ${m === mode ? (m === "DEPOSIT" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700") : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                    {m === mode && <Check className="w-3 h-3" />}
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Type Selector ── */}
                <div className="relative flex-1" ref={typeRef}>
                    {mode === "WITHDRAW" ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-md bg-gray-100 text-gray-600">
                            CHEQUE
                        </span>
                    ) : (
                        <>
                            <button
                                disabled={saving}
                                onClick={() => setOpenType(!openType)}
                                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md border-2 border-dashed transition-all
                                    bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100
                                    ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                                {selectedType}
                                <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                            {openType && (
                                <div className="absolute top-full mt-1 z-[120] bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden py-0.5 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-100">
                                    {options.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleTypeSelect(opt)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors text-left
                                                ${opt === selectedType ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                                        >
                                            {opt === selectedType && <Check className="w-3 h-3" />}
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Row 2: Cheque image upload + Save button (WITHDRAW only) */}
            {requiresChequeImage && (
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => chequeInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-md border-2 border-dashed transition-all cursor-pointer
                            ${chequeFile
                                ? "bg-green-50 border-green-300 text-green-700"
                                : "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                            }`}
                    >
                        <ImagePlus className="w-3 h-3" />
                        {chequeFile ? chequeFile.name : "Upload Cheque Image *"}
                    </button>
                    {!chequeFile && (
                        <span className="text-[9px] text-red-500 font-semibold">Cheque image is required</span>
                    )}
                    <input
                        ref={chequeInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                                setChequeFile(f);
                                // Auto-save cheque immediately after file selection
                                setSaving(true);
                                onSave(row.transactionId, selectedType, "WITHDRAWAL", f).finally(() => setSaving(false));
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Inline Particulars Cell ──────────────────────────────────────────────────

function InlineParticularsCell({
    row,
    onSave,
    forceEdit,
    onEditDone,
}: {
    row: LedgerEntry;
    onSave: (transactionId: number, particulars: string, unitId: number | null, saveToUnitLedger: boolean) => Promise<void>;
    forceEdit?: boolean;
    onEditDone?: () => void;
}) {
    // Basic state
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Text field state (strip unit prefix for editing)
    const rawParticulars = useMemo(() => {
        const text = row.particulars ?? "";
        const sepIdx = text.indexOf(" - ");
        return sepIdx === -1 ? text : text.slice(sepIdx + 3);
    }, [row.particulars]);

    const [value, setValue] = useState(rawParticulars);

    // Unit-related state
    const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(row.otherUnitId || null);
    const [saveToUnitLedger, setSaveToUnitLedger] = useState<boolean>(row.otherUnitId ? true : false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Check if the owner can have units
    const showUnitSection =
        row.otherOwnerId &&
        row.otherOwnerType &&
        (row.otherOwnerType === "CLIENT" || row.otherOwnerType === "COMPANY");

    // Fetch units when editing starts
    useEffect(() => {
        if (forceEdit) {
            setValue(rawParticulars);
            setSelectedUnitId(row.otherUnitId || null);
            setSaveToUnitLedger(row.otherUnitId ? true : false);
            setEditing(true);

            if (showUnitSection && row.otherOwnerId) {
                setUnitsLoading(true);
                fetch(`/api/accountant/maintenance/units?owner_id=${row.otherOwnerId}&per_page=100`)
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.success && res.data) {
                            const unitsArray = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
                            setUnits(unitsArray.map((u: any) => ({ id: u.id, name: u.unit_name })));
                        }
                    })
                    .catch(() => {})
                    .finally(() => setUnitsLoading(false));
            }
        }
    }, [forceEdit, rawParticulars, showUnitSection, row.otherOwnerId, row.otherUnitId]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    const finish = useCallback(() => {
        if (forceEdit) return; // Don't close if whole row is editing
        setEditing(false);
        onEditDone?.();
    }, [onEditDone, forceEdit]);

    async function commit() {
        if (!editing) return;
        const trimmed = value.trim();

        // Check if anything changed (text, unit, or ledger flag)
        const hasTextChanged = trimmed !== rawParticulars;
        const hasUnitChanged = selectedUnitId !== (row.otherUnitId || null);
        const hadUnitBefore = !!row.otherUnitId;
        const hasLedgerFlagChanged = saveToUnitLedger !== hadUnitBefore;

        if (!trimmed || (!hasTextChanged && !hasUnitChanged && !hasLedgerFlagChanged)) {
            finish();
            return;
        }

        setSaving(true);
        try {
            await onSave(
                row.transactionId,
                trimmed,
                selectedUnitId,
                selectedUnitId ? saveToUnitLedger : false // only save to ledger if unit is selected
            );
        } finally {
            setSaving(false);
            finish();
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            commit();
        }
        if (e.key === "Escape" && !forceEdit) {
            finish();
            setValue(rawParticulars);
            setSelectedUnitId(row.otherUnitId || null);
        }
    }

    if (editing) {
        return (
            <div className="flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                {/* Text Input Row */}
                <div className="flex items-center gap-1 w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={(e) => {
                            // Only commit on blur if we click outside the whole cell container
                            if (!e.currentTarget.parentElement?.parentElement?.contains(e.relatedTarget as Node)) {
                                commit();
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full h-7 text-xs rounded border border-[#7a0f1f]/60 bg-white px-1.5 focus:outline-none focus:ring-2 focus:ring-[#7a0f1f]/30 font-medium text-gray-800"
                        placeholder="Transaction particulars"
                    />
                    <button
                        type="button"
                        onClick={commit}
                        className="flex items-center justify-center w-7 h-7 rounded bg-[#7a0f1f] text-white hover:bg-[#5f0c18] transition-colors shrink-0"
                        title="Save"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                </div>

                {/* Unit Selection Row (if applicable) */}
                {showUnitSection && (
                    <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2 flex-1">
                            {unitsLoading ? (
                                <span className="text-xs text-gray-400 italic">Loading units...</span>
                            ) : (
                                <select
                                    value={selectedUnitId || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedUnitId(val ? Number(val) : null);
                                    }}
                                    className="h-6 text-xs rounded border border-gray-300 bg-gray-50 px-1 text-gray-700 outline-none focus:border-[#7a0f1f] max-w-[150px]"
                                >
                                    <option value="">-- Optional Unit --</option>
                                    {units.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        {selectedUnitId && (
                            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={saveToUnitLedger}
                                    onChange={(e) => setSaveToUnitLedger(e.target.checked)}
                                    className="w-3 h-3 rounded border-gray-300 accent-[#7a0f1f]"
                                />
                                <span className="text-[10px] font-semibold text-gray-600 uppercase">Save to Ledger</span>
                            </label>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Read mode (same render as original)
    const text: string = row.particulars ?? "";
    const sepIdx = text.indexOf(" - ");
    if (sepIdx === -1) return <span className={`text-sm font-medium ${saving ? "opacity-50" : ""}`}>{text}</span>;
    const unitText = text.slice(0, sepIdx);
    const restText = text.slice(sepIdx + 3);
    return (
        <span className={saving ? "opacity-50" : ""}>
            <span className="font-bold">{unitText}</span>
            <span className="text-gray-400 mx-1">-</span>
            <span>{restText}</span>
        </span>
    );
}

// ─── Inline Amount Cell ───────────────────────────────────────────────────────

function InlineAmountCell({
    row,
    type,
    onSave,
    forceEdit,
}: {
    row: LedgerEntry;
    type: "DEPOSIT" | "WITHDRAWAL";
    onSave: (transactionId: number, amount: number) => Promise<void>;
    forceEdit?: boolean;
}) {
    // Mode depends on whether the transaction is currently a DEPOSIT or WITHDRAWAL
    const mode = row.deposit > 0 ? "DEPOSIT" : "WITHDRAWAL";
    const amount = type === "DEPOSIT" ? row.deposit : row.withdrawal;
    
    const [editAmount, setEditAmount] = useState(amount.toString());
    const [saving, setSaving] = useState(false);

    // If we're forcing edit but this column doesn't match the mode, just show a disabled state or dash
    if (forceEdit && mode !== type) {
        return <span className="text-gray-300">-</span>;
    }

    if (!forceEdit) {
        if (amount === 0) return <span className="font-medium text-gray-400">-</span>;
        return (
            <span className={`font-medium ${type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}>
                ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        );
    }

    function handleSave() {
        const parsed = parseFloat(editAmount);
        if (isNaN(parsed) || parsed <= 0) return;
        if (parsed === amount) return; // No change
        
        setSaving(true);
        onSave(row.transactionId, parsed).finally(() => setSaving(false));
    }

    return (
        <div className="flex items-center gap-1 w-full max-w-[130px] ml-auto">
            <input
                type="number"
                step="1.00"
                min="1.00   "
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={saving}
                className={`w-full h-8 px-2 text-right rounded-md border text-sm font-bold shadow-sm outline-none transition-all
                    ${type === "DEPOSIT" ? "border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-green-700 bg-green-50 placeholder-green-300" 
                                       : "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-700 bg-red-50 placeholder-red-300"}
                    ${saving ? "opacity-50" : ""}`}
            />
            <button
                type="button"
                onClick={handleSave}
                disabled={saving || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0 || parseFloat(editAmount) === amount}
                className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors shrink-0"
            >
                {saving ? <div className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── Inline Owner Cell ────────────────────────────────────────────────────────

function InlineOwnerCell({
    row,
    allOwners,
    allOwnersLoading,
    onSave,
    forceEdit,
    role,
    router,
}: {
    row: LedgerEntry;
    allOwners: AllOwner[];
    allOwnersLoading: boolean;
    onSave: (transactionId: number, toOwnerId: number) => Promise<void>;
    forceEdit?: boolean;
    role: "superadmin" | "accountant";
    router: any;
}) {
    const [open, setOpen] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    // Filter owners — exclude SYSTEM, and exclude the current MAIN owner (from_owner)
    const filtered = allOwners.filter(
        (o) =>
            o.owner_type !== "SYSTEM" &&
            o.name.toLowerCase().includes(searchQ.toLowerCase())
    );

    async function handleSelect(owner: AllOwner) {
        if (String(owner.id) === String(row.otherOwnerId)) { setOpen(false); return; }
        setSaving(true);
        setOpen(false);
        try { await onSave(row.transactionId, owner.id); } finally { setSaving(false); }
    }

    if (!forceEdit) {
        // Read mode — same as original
        if (!row.otherOwnerType || !row.otherOwnerId) {
            return <span className="truncate block cursor-default">{row.owner}</span>;
        }
        const destType = row.otherOwnerType.toLowerCase();
        let targetUrl = `/${role === "superadmin" ? "super/accountant" : "accountant"}/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
        if (row.otherUnitId) targetUrl += `&targetUnitId=${row.otherUnitId}`;
        return (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); router.push(targetUrl); }}
                className="truncate block w-full font-semibold text-[#7a0f1f] underline decoration-dotted underline-offset-2 hover:text-[#5f0c18] transition-colors cursor-pointer"
            >
                {row.owner}
            </button>
        );
    }

    return (
        <div className="relative w-full" ref={ref}>
            <button
                disabled={saving || allOwnersLoading}
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-8 px-2 rounded-lg border-2 border-dashed text-xs font-bold transition-all
                    bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100
                    ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <User className="w-3 h-3 mr-1.5 shrink-0" />
                <span className="truncate flex-1 text-left">{saving ? "Updating..." : (allOwnersLoading ? "Loading..." : row.owner)}</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
            </button>

            {open && !allOwnersLoading && (
                <div className="absolute top-full mt-1 left-0 w-64 z-[110] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Search owner..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners found</div>
                        ) : (
                            filtered.map((o) => {
                                const typeBg: Record<string, string> = {
                                    COMPANY: "bg-blue-100 text-blue-700",
                                    CLIENT: "bg-purple-100 text-purple-700",
                                    MAIN: "bg-amber-100 text-amber-700",
                                };
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => { handleSelect(o); setSearchQ(""); }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${String(row.otherOwnerId) === String(o.id) ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                                    >
                                        <span className="truncate uppercase">{o.name}</span>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${typeBg[o.owner_type] ?? "bg-gray-100 text-gray-600"}`}>
                                            {o.owner_type}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
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

    // All owners for inline owner dropdown (includes CLIENT, COMPANY, MAIN)
    const [allOwners, setAllOwners] = useState<AllOwner[]>([]);
    const [allOwnersLoading, setAllOwnersLoading] = useState(false);

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
        if (!editingTxId) return; // Only fetch when editing
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
    }, [editingTxId, allOwners.length]);

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

    // ── Patch trans type ──────────────────────────────────────────────────────

    const handleSaveTransType = useCallback(async (transactionId: number, transType: string, transMethod: "DEPOSIT" | "WITHDRAWAL", chequeFile?: File) => {
        try {
            const formData = new FormData();
            formData.append("trans_type", transType);
            formData.append("trans_method", transMethod);

            if (chequeFile) {
                formData.append("cheque_file", chequeFile);
                formData.append("instrument_no", chequeFile.name.replace(/\.[^.]+$/, ""));
            }

            const res = await fetch(`/api/accountant/transactions/${transactionId}/patch-trans-type`, {
                method: chequeFile ? "POST" : "PATCH", // Use POST + override for FormData
                headers: chequeFile ? { "X-HTTP-Method-Override": "PATCH" } : { "Content-Type": "application/json" },
                body: chequeFile ? formData : JSON.stringify({ trans_type: transType, trans_method: transMethod }),
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
            renderCell: (row) => {
                const isEditing = editingTxId === row.transactionId;
                return (
                    <InlineDateCell
                        row={row}
                        onSave={handleSaveDate}
                        forceEdit={isEditing}
                        onEditDone={() => { /* whole row editing stays on */ }}
                    />
                );
            },
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

        // ── TRANS TYPE (editable) ──
        {
            key: "transType",
            label: "TRANS TYPE",
            align: "center",
            width: "170px",
            minWidth: "170px",
            maxWidth: "170px",
            sortable: true,
            renderCell: (row) => {
                // Build instrument files for popover (used in both edit and read modes)
                const files: { name: string; url?: string | null; type?: string | null; size?: number | null }[] =
                    (row.instrumentAttachments ?? []).map((a: any) => ({
                        name: a.instrumentNo ?? a.file_name ?? a.name ?? "—",
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null,
                        type: a.fileType ?? a.file_type ?? a.mimeType ?? a.mime_type ?? null,
                        size: a.fileSize ?? a.file_size ?? null,
                    }));

                // Show inline edit cell when editing this row
                if (editingTxId === row.transactionId) {
                    return (
                        <div className="flex flex-col gap-1.5 w-full">
                            <InlineTransTypeCell
                                row={row}
                                onSave={handleSaveTransType}
                                forceEdit={true}
                                onEditDone={() => { /* whole row editing stays on */ }}
                            />
                            {files.length > 0 && (
                                <InstrumentFilesPopover label={`${row.transType} files`} files={files}>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7a0f1f] cursor-pointer hover:underline">
                                        <FileText className="w-3 h-3" />
                                        {files.length} attached file{files.length > 1 ? "s" : ""}
                                    </span>
                                </InstrumentFilesPopover>
                            )}
                        </div>
                    );
                }
                // Read mode with file popover
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

        // ── OWNER (editable) ──
        {
            key: "owner",
            label: "OWNER",
            align: "center",
            width: "200px",
            minWidth: "200px",
            maxWidth: "200px",
            sortable: true,
            renderCell: (row) => {
                // Always use InlineOwnerCell — it handles both read and edit modes
                return (
                    <InlineOwnerCell
                        row={row}
                        allOwners={allOwners}
                        allOwnersLoading={allOwnersLoading}
                        onSave={handleSaveOwner}
                        forceEdit={editingTxId === row.transactionId}
                        role={role}
                        router={router}
                    />
                );
            },
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
                <InlineParticularsCell
                    row={row}
                    onSave={handleSaveParticulars}
                    forceEdit={editingTxId === row.transactionId}
                    onEditDone={() => { /* whole row editing stays on */ }}
                />
            ),
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
                <InlineAmountCell
                    row={row}
                    type="DEPOSIT"
                    onSave={handleSaveAmount}
                    forceEdit={editingTxId === row.transactionId}
                />
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
                <InlineAmountCell
                    row={row}
                    type="WITHDRAWAL"
                    onSave={handleSaveAmount}
                    forceEdit={editingTxId === row.transactionId}
                />
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

        // ── EDIT ACTIONS (shown only for editing row) ──
        {
            key: "__editActions",
            label: "",
            align: "center",
            width: "120px",
            minWidth: "120px",
            maxWidth: "120px",
            renderCell: (row) => {
                if (editingTxId !== row.transactionId) return null;
                return (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingTxId(null);
                                setEditingField(null);
                                fetchLedger();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#7a0f1f] text-white hover:bg-[#5f0c18] transition-colors"
                            title="Save and finish editing"
                        >
                            <Check className="w-3 h-3" />
                            
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingTxId(null);
                                setEditingField(null);
                                fetchLedger();
                            }}
                            className="flex items-center border gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Cancel editing"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            },
        },
    ], [showExtraColumns, role, handleSaveDate, handleSaveTransType, handleSaveParticulars, handleSaveOwner, editingTxId, editingField, allOwners, allOwnersLoading, router, fetchLedger]);

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
                        label: editingTxId === contextMenu.row?.transactionId ? "Cancel Edit" : "Edit Transaction",
                        icon: editingTxId === contextMenu.row?.transactionId ? PencilOff : Pencil,
                        onClick: () => {
                            if (contextMenu.row) {
                                if (editingTxId === contextMenu.row.transactionId) {
                                    setEditingTxId(null);
                                } else {
                                    setEditingTxId(contextMenu.row.transactionId);
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
