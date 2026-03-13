"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    ChevronDown,
    EyeOff,
    FileText,
    Search,
    Check,
    Upload,
    User,
    X,
    ImagePlus,
    AlertTriangle,
    Paperclip,
    Plus,
    RefreshCw,
    Building2,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InstrumentFilesPopover, VoucherPreviewButton } from "@/components/app/DataSheetLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import ConfirmationModal from "@/components/app/ConfirmationModal";

const ACCENT = "#7a0f1f";
const BORDER = "rgba(0,0,0,0.12)";
const INPUT_BASE = "w-full rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] shadow-sm hover:border-gray-400";
const CELL_INPUT = `h-10 px-4 ${INPUT_BASE}`;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AllOwner {
    id: number;
    name: string;
    owner_type: string;
    status: string;
}

export interface LedgerEntry {
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
    saveToUnitLedger?: boolean; // Temporary flag for draft
    _unitName?: string;         // Temporary name for draft
    personInCharge: string | null;
    transMethod: string | null;
    _removeVoucher?: boolean;
    _removeInstruments?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
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

export function toDateInputValue(dateStr: string): string {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// task.md
// - [ ] Analyze `OwnerDropdown` design in `TransactionForm.tsx` [x]
// - [x] Refine `InlineOwnerCell` styling and behavior
//     - [x] Create `OwnerTypeBadge` helper component
//     - [x] Update dropdown button styles (icon, opacity, border)
//     - [x] Restyle owner list items (badges, remove ID)
//     - [x] Standardization of search input
// - [x] Update `NewTransactionCell` owner selection
//     - [x] Replace native `select` with searchable dropdown
// - [x] Spliting Unit and Particulars in Edit UI [x]
//     - [x] Refactor `InlineParticularsCell` for clean splitting
//     - [x] Implement unit pre-filling and separation
//     - [x] Fix unit display in dropdown (sync draft with matched ID)
//     - [x] Add fallback display for loading/display-only units
//     - [x] Ensure input starts stripped and joins on save
//     - [x] Update `NewTransactionCell` for same logic
//     - [x] Update `TransactionSheetShared.tsx` for smart joining on save
// - [ ] Finalize walkthrough and notify user

const formatBalance = (val: string | number) => {
    if (val === null || val === undefined || val === "") return "";
    const s = String(val);
    const parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
};

function OwnerTypeBadge({ type }: { type: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        COMPANY: { bg: "bg-blue-100", text: "text-blue-700", label: "Company" },
        CLIENT: { bg: "bg-purple-100", text: "text-purple-700", label: "Client" },
        MAIN: { bg: "bg-amber-100", text: "text-amber-700", label: "Main" },
        SYSTEM: { bg: "bg-gray-100", text: "text-gray-500", label: "System" },
    };
    const s = map[type.toUpperCase()] ?? { bg: "bg-gray-100", text: "text-gray-600", label: type };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface InlineUpsertTransactionProps {
    type: "date" | "voucher" | "transType" | "owner" | "particulars" | "deposit" | "withdrawal";
    row: LedgerEntry;
    isNew?: boolean;
    // Props for Updates
    onRefresh?: () => void;
    editingTxId?: number | null;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
    editingChequeFiles?: File[];
    setEditingChequeFiles?: React.Dispatch<React.SetStateAction<File[]>>;
    voucherFile?: File | null;
    setVoucherFile?: React.Dispatch<React.SetStateAction<File | null>>;
    // Props for New Row
    newTxRow?: any;
    setNewTxRow?: React.Dispatch<React.SetStateAction<any>>;
    newTxFile?: File | null;
    setNewTxFile?: React.Dispatch<React.SetStateAction<File | null>>;
    newTxInstFiles?: File[];
    setNewTxInstFiles?: React.Dispatch<React.SetStateAction<File[]>>;
    allOwners?: AllOwner[];
    allOwnersLoading?: boolean;
    role?: "superadmin" | "accountant";
    router?: any;
    selectedOwnerId?: number | string | null;
    newTxUnits?: any[];
    newTxUnitsLoading?: boolean;
    onTransMethodChange?: (method: "DEPOSIT" | "WITHDRAWAL") => void;
}

export function InlineUpsertTransaction(props: InlineUpsertTransactionProps) {
    const { type, row, isNew, ...rest } = props;

    if (isNew) {
        return <NewTransactionCell type={type} {...rest} />;
    }

    const forceEdit = rest.editingTxId === row.transactionId;

    switch (type) {
        case "date":
            return <InlineDateCell row={row} forceEdit={forceEdit} draft={rest.draft} setDraft={rest.setDraft} />;
        case "voucher":
            return (
                <InlineVoucherCell
                    row={row}
                    forceEdit={forceEdit}
                    draft={rest.draft}
                    setDraft={rest.setDraft}
                    voucherFile={isNew ? rest.newTxFile : rest.voucherFile}
                    setVoucherFile={isNew ? rest.setNewTxFile : rest.setVoucherFile}
                    role={rest.role}
                />
            );
        case "transType":
            return (
                <InlineTransTypeCell 
                    row={row} 
                    forceEdit={forceEdit} 
                    onModeChange={rest.onTransMethodChange} 
                    draft={rest.draft} 
                    setDraft={rest.setDraft} 
                    chequeFiles={rest.editingChequeFiles}
                    setChequeFiles={rest.setEditingChequeFiles}
                    role={rest.role}
                />
            );
        case "owner":
            return (
                <InlineOwnerCell
                    row={row}
                    allOwners={rest.allOwners || []}
                    allOwnersLoading={rest.allOwnersLoading || false}
                    forceEdit={forceEdit}
                    role={rest.role!}
                    router={rest.router}
                    draft={rest.draft}
                    setDraft={rest.setDraft}
                />
            );
        case "particulars":
            return <InlineParticularsCell row={row} forceEdit={forceEdit} draft={rest.draft} setDraft={rest.setDraft} />;
        case "deposit":
            return <InlineAmountCell row={row} type="DEPOSIT" forceEdit={forceEdit} draft={rest.draft} setDraft={rest.setDraft} />;
        case "withdrawal":
            return <InlineAmountCell row={row} type="WITHDRAWAL" forceEdit={forceEdit} draft={rest.draft} setDraft={rest.setDraft} />;
        default:
            return null;
    }
}

// ─── Sub-Components for New Transactions ─────────────────────────────────────

function NewTransactionCell({ type, ...props }: any) {
    const [openOwner, setOpenOwner] = useState(false);
    const [ownerSearchQ, setOwnerSearchQ] = useState("");
    const ownerRef = useRef<HTMLDivElement>(null);
    useOutsideClick(ownerRef, () => setOpenOwner(false));

    const [openUnit, setOpenUnit] = useState(false);
    const [unitSearchQ, setUnitSearchQ] = useState("");
    const unitRef = useRef<HTMLDivElement>(null);
    useOutsideClick(unitRef, () => setOpenUnit(false));
    const [isCheckingCheque, setIsCheckingCheque] = useState(false);
    const { showToast } = useAppToast();

    const { 
        newTxRow, setNewTxRow, newTxFile, setNewTxFile, 
        newTxInstFiles, setNewTxInstFiles, allOwners, allOwnersLoading,
        selectedOwnerId, newTxUnits, newTxUnitsLoading, onTransMethodChange
    } = props;

    useEffect(() => {
        if (newTxRow?.particulars && newTxRow?.particulars.includes(" - ")) {
            const p = newTxRow.particulars;
            const sepIdx = p.indexOf(" - ");
            const unitPart = p.slice(0, sepIdx).trim();
            const cleanPart = p.slice(sepIdx + 3).trim();
            
            if (newTxUnits && newTxUnits.length > 0) {
                const matched = newTxUnits.find((u: any) => u.name.toUpperCase() === unitPart.toUpperCase());
                if (matched && String(matched.id) !== String(newTxRow.otherUnitId)) {
                    setNewTxRow((prev: any) => prev ? { 
                        ...prev, 
                        otherUnitId: matched.id, 
                        _unitName: matched.name,
                        saveToUnitLedger: true,
                        particulars: cleanPart 
                    } : null);
                }
            }
        }
    }, [newTxRow?.particulars, newTxUnits, newTxRow?.otherUnitId, setNewTxRow]);

    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    switch (type) {
        case "date":
            return (
                <input
                    type="date"
                    value={newTxRow?.voucherDate || ""}
                    onChange={(e) => setNewTxRow((prev: any) => prev ? { ...prev, voucherDate: e.target.value } : null)}
                    className={`${CELL_INPUT} border-gray-200`}
                />
            );
        case "voucher":
            return (
                <div className="flex items-center gap-2">
                    <label className={cn(
                        "flex items-center justify-center h-10 px-4 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all truncate max-w-[160px] shadow-sm hover:border-gray-400",
                        isCheckingVoucher && "opacity-60 pointer-events-none"
                    )}>
                        {isCheckingVoucher ? (
                            <RefreshCw className="w-4 h-4 mr-2 text-gray-400 animate-spin" />
                        ) : (
                            <Paperclip className="w-4 h-4 mr-2 text-gray-400" />
                        )}
                        {isCheckingVoucher ? "Checking..." : (newTxFile ? newTxFile.name.replace(/\.[^.]+$/, "") : "Upload Voucher")}
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;

                                const voucherNo = f.name.replace(/\.[^.]+$/, "");
                                const apiPrefix = props.role === "superadmin" ? "/api/head" : "/api";
                                setIsCheckingVoucher(true);

                                try {
                                    const res = await fetch(`${apiPrefix}/accountant/transactions/check-voucher-no?voucher_no=${encodeURIComponent(voucherNo)}`);
                                    const data = await res.json();

                                    if (data.success && data.exists) {
                                        showToast("Duplicate Voucher", `Voucher number "${voucherNo}" already exists.`, "error");
                                        e.target.value = "";
                                        return;
                                    }

                                    setNewTxFile(f);
                                    if (!newTxRow?.voucherNo) {
                                        setNewTxRow((prev: any) => prev ? { ...prev, voucherNo: voucherNo } : null);
                                    }
                                } catch (err) {
                                    console.error("Voucher check failed:", err);
                                    setNewTxFile(f);
                                    if (!newTxRow?.voucherNo) {
                                        setNewTxRow((prev: any) => prev ? { ...prev, voucherNo: voucherNo } : null);
                                    }
                                } finally {
                                    setIsCheckingVoucher(false);
                                }
                            }}
                        />
                    </label>
                    {newTxFile && !isCheckingVoucher && (
                        <button type="button" onClick={() => { setNewTxFile(null); setNewTxRow((prev: any) => prev ? { ...prev, voucherNo: "" } : null); }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            );
        case "transType":
            return (
                <div className="flex flex-col gap-2 w-full">
                    <select
                        value={newTxRow?.transMethod || "DEPOSIT"}
                        onChange={(e) => {
                            const m = e.target.value as "DEPOSIT" | "WITHDRAWAL";
                            if (onTransMethodChange) onTransMethodChange(m);
                            setNewTxRow((prev: any) => prev ? { 
                                ...prev, 
                                transMethod: m, 
                                transType: m === "DEPOSIT" ? "CASH DEPOSIT" : "CHEQUE",
                                deposit: 0, 
                                withdrawal: 0 
                            } : null);
                        }}
                        className={`w-full text-xs font-bold rounded-lg px-3 h-10 appearance-none text-center cursor-pointer transition-all border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-[#7a0f1f] focus:ring-2 focus:ring-[#7a0f1f]/10 shadow-sm uppercase tracking-wider`}
                    >
                        <option value="DEPOSIT">DEPOSIT</option>
                        <option value="WITHDRAWAL">WITHDRAWAL</option>
                    </select>
                    <select
                        value={newTxRow?.transType || ""}
                        onChange={(e) => setNewTxRow((prev: any) => prev ? { ...prev, transType: e.target.value } : null)}
                        className={CELL_INPUT}
                    >
                        {newTxRow?.transMethod === "DEPOSIT" ? (
                            <>
                                <option value="CASH DEPOSIT">CASH DEPOSIT</option>
                                <option value="BANK TRANSFER">BANK TRANSFER</option>
                                <option value="CHEQUE DEPOSIT">CHEQUE DEPOSIT</option>
                            </>
                        ) : (
                            <>
                                <option value="CASH">CASH</option>
                                <option value="CHEQUE">CHEQUE</option>
                                <option value="WIRE TRANSFER">WIRE TRANSFER</option>
                            </>
                        )}
                    </select>
                    {newTxRow?.transMethod === "WITHDRAWAL" && newTxRow?.transType === "CHEQUE" && (
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="flex items-center justify-center w-full h-11 px-4 text-xs font-bold text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#7a0f1f]/30 hover:bg-gray-50 hover:text-[#7a0f1f] transition-all shadow-sm group">
                                <ImagePlus className={cn("w-4 h-4 mr-2 transition-transform", isCheckingCheque ? "animate-spin text-gray-400" : "text-orange-500 group-hover:scale-110")} />
                                {isCheckingCheque ? "Checking..." : "Upload Cheques"}
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    multiple
                                    disabled={isCheckingCheque}
                                    onChange={async (e) => {
                                        const selectedFiles = Array.from(e.target.files || []);
                                        if (selectedFiles.length === 0) return;

                                        setIsCheckingCheque(true);
                                        const apiPrefix = props.role === "superadmin" ? "/api/head" : "/api";

                                        try {
                                            const results = await Promise.all(
                                                selectedFiles.map(async (f) => {
                                                    const instrumentNo = f.name.replace(/\.[^.]+$/, "");
                                                    
                                                    // Local check against currently added files
                                                    const isLocalDuplicate = (newTxInstFiles || []).some(
                                                        (existing: File) => existing.name.replace(/\.[^.]+$/, "") === instrumentNo
                                                    );
                                                    
                                                    if (isLocalDuplicate) {
                                                        return { file: f, instrumentNo, exists: true, error: `Cheque "${instrumentNo}" is already in your selection.` };
                                                    }

                                                    try {
                                                        const res = await fetch(`${apiPrefix}/accountant/transactions/check-instrument-no?instrument_no=${encodeURIComponent(instrumentNo)}`);
                                                        const data = await res.json();
                                                        return { file: f, instrumentNo, exists: !!data.exists, error: data.exists ? `Cheque "${instrumentNo}" already exists in the ledger.` : null };
                                                    } catch (err) {
                                                        return { file: f, instrumentNo, exists: false, error: null };
                                                    }
                                                })
                                            );

                                            const duplicates = results.filter((r) => r.exists);
                                            const accepted = results.filter((r) => !r.exists);

                                            if (duplicates.length > 0) {
                                                duplicates.forEach(d => showToast("Duplicate Cheque", d.error || `Cheque "${d.instrumentNo}" is invalid.`, "error"));
                                            }

                                            if (accepted.length > 0) {
                                                setNewTxInstFiles?.((prev: File[]) => [...(prev || []), ...accepted.map(a => a.file)]);
                                            }
                                        } finally {
                                            setIsCheckingCheque(false);
                                            if (e.target) e.target.value = "";
                                        }
                                    }}
                                />
                            </label>
                            {(newTxInstFiles || []).map((file: File, idx: number) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg group animate-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="text-[11px] font-bold text-gray-700 truncate">
                                            {file.name.replace(/\.[^.]+$/, "")}
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setNewTxInstFiles?.((prev: File[]) => (prev || []).filter((_, i: number) => i !== idx))} 
                                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        case "owner":
            const selectedOwner = allOwners?.find((o: any) => String(o.id) === String(newTxRow?.otherOwnerId));
            const filteredOwners = allOwners?.filter((o: any) => 
                o.owner_type !== "SYSTEM" && 
                String(o.id) !== String(selectedOwnerId) && 
                o.name.toLowerCase().includes(ownerSearchQ.toLowerCase())
            ) || [];

            return (
                <div className="w-full relative py-0.5" ref={ownerRef}>
                    <button 
                        disabled={allOwnersLoading} 
                        onClick={() => setOpenOwner(!openOwner)} 
                        className={`flex items-center w-full h-10 px-4 rounded-lg border shadow-sm text-sm font-bold bg-white text-gray-800 transition-all ${
                            openOwner ? "border-[#7a0f1f] ring-2 ring-[#7a0f1f]/20" : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <User className="w-4 h-4 mr-3 shrink-0 text-[#7a0f1f]" />
                        <span className="truncate flex-1 text-left uppercase">
                            {allOwnersLoading ? "Loading..." : (selectedOwner ? selectedOwner.name : "-- Select Owner --")}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 opacity-40 shrink-0 transition-transform ${openOwner ? "rotate-180" : ""}`} />
                    </button>
                    {openOwner && (
                        <div className="absolute top-full mt-2 left-0 w-72 z-[110] bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden py-1 ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                                <input 
                                    autoFocus 
                                    value={ownerSearchQ} 
                                    onChange={(e) => setOwnerSearchQ(e.target.value)} 
                                    placeholder="Search owner..." 
                                    className="flex-1 text-sm bg-transparent outline-none font-bold placeholder:text-gray-300" 
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto pt-1">
                                {filteredOwners.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-400 italic text-xs">No owners found...</div>
                                ) : filteredOwners.map((o: any) => (
                                    <button 
                                        key={o.id} 
                                        onClick={() => { 
                                            setNewTxRow((prev: any) => prev ? { ...prev, otherOwnerId: o.id } : null);
                                            setOpenOwner(false); 
                                            setOwnerSearchQ(""); 
                                        }} 
                                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group ${
                                            String(o.id) === String(newTxRow?.otherOwnerId) ? "bg-red-50/50" : ""
                                        }`}
                                    >
                                        <span className={`text-sm font-bold truncate uppercase ${
                                            String(o.id) === String(newTxRow?.otherOwnerId) ? "text-[#7a0f1f]" : "text-gray-700"
                                        }`}>
                                            {o.name}
                                        </span>
                                        <OwnerTypeBadge type={o.owner_type} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        case "particulars":
            return (
                <div className="flex flex-col gap-3 w-full py-1">
                    <input
                        type="text"
                        placeholder="Enter particulars (max 35 chars)"
                        maxLength={35}
                        value={newTxRow?.particulars || ""}
                        onChange={(e) => setNewTxRow((prev: any) => prev ? { ...prev, particulars: e.target.value } : null)}
                        className={`${CELL_INPUT}`}
                    />
                    {newTxUnits && newTxUnits.length > 0 && (
                        <div className="flex items-center gap-4 px-1">
                            <div className="relative flex-1 max-w-[200px]" ref={unitRef}>
                                <button 
                                    onClick={() => setOpenUnit(!openUnit)}
                                    className={`flex items-center w-full h-10 px-3 rounded-lg border shadow-sm text-xs font-bold bg-white text-gray-700 transition-all ${
                                        openUnit ? "border-[#7a0f1f] ring-2 ring-[#7a0f1f]/20" : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <Building2 className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                                    <span className="truncate flex-1 text-left uppercase">
                                        {newTxUnits.find((u: any) => String(u.id) === String(newTxRow?.otherUnitId))?.name || newTxRow?._unitName || "-- Select Unit --"}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${openUnit ? "rotate-180" : ""}`} />
                                </button>
                                {openUnit && (
                                    <div className="absolute top-full mt-2 left-0 w-64 z-[110] bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden py-1 ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                                            <Search className="w-3 h-3 text-gray-400" />
                                            <input 
                                                autoFocus 
                                                value={unitSearchQ} 
                                                onChange={(e) => setUnitSearchQ(e.target.value)} 
                                                placeholder="Search unit..." 
                                                className="flex-1 text-xs bg-transparent outline-none font-bold placeholder:text-gray-300" 
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {newTxUnits.filter((u: any) => u.name.toLowerCase().includes(unitSearchQ.toLowerCase())).length === 0 ? (
                                                <div className="px-3 py-4 text-center text-gray-400 italic text-[10px]">No units found...</div>
                                            ) : newTxUnits.filter((u: any) => u.name.toLowerCase().includes(unitSearchQ.toLowerCase())).map((u: any) => (
                                                <button 
                                                    key={u.id} 
                                                    onClick={() => { 
                                                        setNewTxRow((prev: any) => prev ? { 
                                                            ...prev, 
                                                            otherUnitId: u.id,
                                                            _unitName: u.name,
                                                            saveToUnitLedger: false
                                                        } : null);
                                                        setOpenUnit(false);
                                                        setUnitSearchQ("");
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-gray-50 transition-colors ${
                                                        String(u.id) === String(newTxRow?.otherUnitId) ? "bg-red-50 text-[#7a0f1f]" : "text-gray-600"
                                                    }`}
                                                >
                                                    {u.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {newTxRow?.otherUnitId && (
                                <label className="flex items-center gap-1.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#7a0f1f] focus:ring-[#7a0f1f]/30"
                                        checked={newTxRow?.saveToUnitLedger !== false}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setNewTxRow((prev: any) => prev ? { ...prev, saveToUnitLedger: isChecked } : null);
                                        }}
                                    />
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#7a0f1f] transition-colors">
                                        Save to Ledger
                                    </span>
                                </label>
                            )}
                        </div>
                    )}
                    {newTxUnitsLoading && <span className="text-[10px] text-gray-400 italic px-1">Loading units...</span>}
                </div>
            );
        case "deposit":
            if (newTxRow?.transMethod !== "DEPOSIT") return <span className="text-gray-300">—</span>;
            return (
                <div className="relative w-full py-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 select-none flex items-center justify-center w-5 h-5">
                        <span className="font-bold text-[18px] leading-none mb-0.5">₱</span>
                    </div>
                    <input
                        type="text"
                        value={formatBalance(newTxRow?.deposit === 0 ? "" : (newTxRow?.deposit || ""))}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                                if (raw !== "" && Number(raw) > 999999999.99) return;
                                setNewTxRow((prev: any) => prev ? { ...prev, deposit: raw === "" ? 0 : raw, withdrawal: 0 } : null);
                            }
                        }}
                        className={`${CELL_INPUT} text-right pl-10 font-bold text-green-700`}
                        placeholder="0.00"
                    />
                </div>
            );
        case "withdrawal":
            if (newTxRow?.transMethod !== "WITHDRAWAL") return <span className="text-gray-300">—</span>;
            return (
                <div className="relative w-full py-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 select-none flex items-center justify-center w-5 h-5">
                        <span className="font-bold text-[18px] leading-none mb-0.5">₱</span>
                    </div>
                    <input
                        type="text"
                        value={formatBalance(newTxRow?.withdrawal === 0 ? "" : (newTxRow?.withdrawal || ""))}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                                if (raw !== "" && Number(raw) > 999999999.99) return;
                                setNewTxRow((prev: any) => prev ? { ...prev, withdrawal: raw === "" ? 0 : raw, deposit: 0 } : null);
                            }
                        }}
                        className={`${CELL_INPUT} text-right pl-10 font-bold text-red-700`}
                        placeholder="0.00"
                    />
                </div>
            );
        default:
            return null;
    }
}

// ─── Inline Date Cell ─────────────────────────────────────────────────────────

function InlineDateCell({
    row,
    forceEdit,
    draft,
    setDraft,
}: {
    row: LedgerEntry;
    forceEdit?: boolean;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
}) {
    const value = toDateInputValue(draft?.voucherDate || row.voucherDate);

    if (forceEdit) {
        return (
            <div className="flex items-center gap-3 w-full py-0.5" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                <input
                    type="date"
                    value={value}
                    onChange={(e) => setDraft?.((prev: any) => prev ? { ...prev, voucherDate: e.target.value } : null)}
                    className={`${CELL_INPUT} font-semibold flex-1`}
                />
            </div>
        );
    }

    return (
        <span className="text-sm font-medium">
            {row.voucherDate || "—"}
        </span>
    );
}

// ─── Inline Voucher Cell ──────────────────────────────────────────────────────

function InlineVoucherCell({
    row,
    forceEdit,
    draft,
    setDraft,
    voucherFile,
    setVoucherFile,
    role,
}: {
    row: LedgerEntry;
    forceEdit?: boolean;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
    voucherFile?: File | null;
    setVoucherFile?: React.Dispatch<React.SetStateAction<File | null>>;
    role?: "superadmin" | "accountant";
}) {
    const [showOptions, setShowOptions] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const { showToast } = useAppToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    useOutsideClick(optionsRef, () => setShowOptions(false));

    function handleNoVoucherClick() {
        setShowOptions(false);
        // Intent to remove: show confirmation if there's currently a voucher
        if (row.voucherAttachmentUrl || voucherFile) {
            setShowConfirm(true);
        } else {
            handleNoVoucher();
        }
    }

    function handleNoVoucher() {
        setShowConfirm(false);
        setVoucherFile?.(null);
        setDraft?.((prev: any) => prev ? { ...prev, _removeVoucher: true } : null);
        setShowOptions(false);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const voucherNo = file.name.replace(/\.[^.]+$/, "");
        const apiPrefix = role === "superadmin" ? "/api/head" : "/api";
        setIsChecking(true);

        try {
            const res = await fetch(`${apiPrefix}/accountant/transactions/check-voucher-no?voucher_no=${encodeURIComponent(voucherNo)}`);
            const data = await res.json();

            if (data.success && data.exists) {
                showToast("Duplicate Voucher", `Voucher number "${voucherNo}" already exists.`, "error");
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }

            setVoucherFile?.(file);
            setDraft?.((prev: any) => prev ? { ...prev, _removeVoucher: false } : null);
        } catch (err) {
            console.error("Voucher check failed:", err);
            // Fallback: allow if check fails? Or block? Main form allows on network error.
            setVoucherFile?.(file);
            setDraft?.((prev: any) => prev ? { ...prev, _removeVoucher: false } : null);
        } finally {
            setIsChecking(false);
            setShowOptions(false);
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
        <div className="relative w-full py-0.5" ref={optionsRef}>
            <button
                disabled={isChecking}
                onClick={() => setShowOptions(!showOptions)}
                className={cn(
                    "flex items-center w-full h-10 px-4 rounded-lg border border-gray-300 shadow-sm text-sm font-bold bg-white text-gray-800 hover:border-gray-400 focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] transition-all",
                    isChecking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                {isChecking ? (
                    <RefreshCw className="w-4 h-4 mr-3 animate-spin text-[#7a0f1f] shrink-0" />
                ) : (
                    <FileText className="w-4 h-4 mr-3 opacity-30 shrink-0 text-[#7a0f1f]" />
                )}
                <span className={cn(
                    "truncate flex-1 text-left",
                    isChecking ? "text-gray-400" : ((!row.voucherNo && !voucherFile) || draft?._removeVoucher ? "text-amber-600" : "text-gray-800")
                )}>
                    {isChecking ? "Checking..." : (draft?._removeVoucher ? "No Voucher" : (voucherFile ? voucherFile.name.replace(/\.[^.]+$/, "") : (row.voucherNo || "No Voucher")))}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 opacity-30 shrink-0 transition-transform", showOptions ? "rotate-180" : "")} />
            </button>
            {showOptions && (
                <div className="absolute top-full mt-2 z-[110] bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/10">
                    <button onClick={handleNoVoucherClick} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-700 transition-colors text-left group">
                        <EyeOff className="w-4 h-4 opacity-40" />
                        No Voucher
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-green-700 transition-colors text-left group border-t border-gray-50">
                        <Upload className="w-4 h-4 opacity-40" />
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
                isConfirming={false}
                zIndex={10000}
            />
            <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
        </div>
    );
}

// ─── Inline Trans Type Cell ───────────────────────────────────────────────────

function InlineTransTypeCell({
    row,
    forceEdit,
    onModeChange,
    draft,
    setDraft,
    chequeFiles,
    setChequeFiles,
    role,
}: {
    row: LedgerEntry;
    forceEdit?: boolean;
    onModeChange?: (method: "DEPOSIT" | "WITHDRAWAL") => void;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
    chequeFiles?: File[];
    setChequeFiles?: React.Dispatch<React.SetStateAction<File[]>>;
    role?: "superadmin" | "accountant";
}) {
    const mode = draft?.transMethod === "WITHDRAWAL" || (row.withdrawal > 0 && !draft?.transMethod) ? "WITHDRAW" : "DEPOSIT";
    const depositTypes = ["CASH DEPOSIT", "BANK TRANSFER", "CHEQUE DEPOSIT"];
    const withdrawTypes = ["CHEQUE"];
    const options = mode === "DEPOSIT" ? depositTypes : withdrawTypes;
    const selectedType = draft?.transType || row.transType || options[0];
    const [openMode, setOpenMode] = useState(false);
    const [openType, setOpenType] = useState(false);
    const chequeInputRef = useRef<HTMLInputElement>(null);
    const modeRef = useRef<HTMLDivElement>(null);
    const typeRef = useRef<HTMLDivElement>(null);

    useOutsideClick(modeRef, () => setOpenMode(false));
    useOutsideClick(typeRef, () => setOpenType(false));
    const [isCheckingCheque, setIsCheckingCheque] = useState(false);
    const { showToast } = useAppToast();

    const removedIds = draft?._removeInstruments || [];

    function handleRemoveExisting(id: string | number) {
        const sid = String(id);
        if (!removedIds.includes(sid)) {
            setDraft?.((prev: any) => prev ? { 
                ...prev, 
                _removeInstruments: [...(prev._removeInstruments || []), sid] 
            } : null);
        }
    }

    function handleUndoRemove(id: string | number) {
        const sid = String(id);
        setDraft?.((prev: any) => prev ? { 
            ...prev, 
            _removeInstruments: (prev._removeInstruments || []).filter((i: string) => i !== sid) 
        } : null);
    }

    function handleRemoveLocal(idx: number) {
        setChequeFiles?.((prev: File[]) => (prev || []).filter((_, i) => i !== idx));
    }

    function handleModeChange(newMode: "DEPOSIT" | "WITHDRAW") {
        setOpenMode(false);
        const transMethod: "DEPOSIT" | "WITHDRAWAL" = newMode === "DEPOSIT" ? "DEPOSIT" : "WITHDRAWAL";
        if (onModeChange) onModeChange(transMethod);
        
        const newType = newMode === "DEPOSIT" ? "CASH DEPOSIT" : "CHEQUE";
        setDraft?.((prev: any) => prev ? { ...prev, transMethod, transType: newType } : null);
    }

    function handleTypeSelect(type: string) {
        setOpenType(false);
        setDraft?.((prev: any) => prev ? { ...prev, transType: type } : null);
    }

    if (!forceEdit) {
        return (
            <div className="flex flex-col gap-1 items-center">
                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 uppercase tracking-widest">{mode}</span>
                <span className="text-xs font-bold text-[#7a0f1f] truncate w-full text-center">{row.transType}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full py-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="relative" ref={modeRef}>
                <button 
                    onClick={() => setOpenMode(!openMode)} 
                    className={`flex items-center justify-between gap-2 px-3 h-10 w-full text-xs font-bold rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 transition-all cursor-pointer`}
                >
                    <span className="truncate">{mode}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openMode ? "rotate-180" : ""}`} />
                </button>
                {openMode && (
                    <div className="absolute top-full mt-2 z-[120] bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden py-1 min-w-[140px] ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                        {(["DEPOSIT", "WITHDRAW"] as const).map((m) => (
                            <button key={m} onClick={() => handleModeChange(m)} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors text-left ${m === mode ? "bg-gray-50 text-[#7a0f1f]" : "text-gray-600 hover:bg-gray-50"}`}>
                                {m}
                                {m === mode && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative" ref={typeRef}>
                {mode === "WITHDRAW" ? (
                    <div className="flex flex-col gap-2 w-full">
                        <button 
                            type="button" 
                            disabled={isCheckingCheque}
                            onClick={() => chequeInputRef.current?.click()} 
                            className="flex items-center justify-center gap-2.5 h-11 w-full px-4 text-xs font-bold rounded-lg border border-dashed border-gray-300 bg-white text-gray-500 shadow-sm hover:border-[#7a0f1f]/30 hover:bg-gray-50 hover:text-[#7a0f1f] transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ImagePlus className={cn("w-4 h-4 transition-transform", isCheckingCheque ? "animate-spin text-gray-400" : "text-orange-500 group-hover:scale-110")} />
                            {isCheckingCheque ? "Checking..." : "Upload Cheques"}
                        </button>
                        
                        <div className="flex flex-col gap-2">
                            {/* Existing Attachments */}
                            {(row.instrumentAttachments || []).map((att: any) => {
                                const id = att.id || att.transaction_id || att.url; // Use unique ID
                                const sid = String(id);
                                const isRemoved = removedIds.includes(sid);
                                const fileName = (att.instrumentNo || att.file_name || att.name || "Attachment").replace(/\.[^.]+$/, "");

                                return (
                                    <div key={sid} className={cn(
                                        "flex items-center justify-between px-3 py-2 border rounded-lg animate-in slide-in-from-top-1",
                                        isRemoved ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                                    )}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className={cn("w-3.5 h-3.5 shrink-0", isRemoved ? "text-amber-400" : "text-gray-400")} />
                                            <span className={cn(
                                                "text-[11px] font-bold truncate",
                                                isRemoved ? "text-amber-700 font-black italic line-through" : "text-gray-700"
                                            )}>
                                                {fileName} {isRemoved ? "(REMOVING)" : ""}
                                            </span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                isRemoved ? handleUndoRemove(sid) : handleRemoveExisting(sid);
                                            }} 
                                            className={cn(
                                                "p-1 transition-colors",
                                                isRemoved ? "text-amber-400 hover:text-amber-600" : "text-gray-400 hover:text-red-500"
                                            )}
                                        >
                                            {isRemoved ? <RefreshCw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                );
                            })}

                            {/* New Uploads */}
                            {(chequeFiles || []).map((file, idx) => (
                                <div key={`new-${idx}`} className="flex items-center justify-between px-3 py-2 bg-[#7a0f1f]/5 border border-[#7a0f1f]/20 rounded-lg group animate-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <FileText className="w-3.5 h-3.5 text-[#7a0f1f]/40 shrink-0" />
                                        <span className="text-[11px] font-black text-[#7a0f1f] truncate uppercase tracking-tight">
                                            {file.name.replace(/\.[^.]+$/, "")}
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveLocal(idx)} 
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <input 
                            ref={chequeInputRef} 
                            type="file" 
                            accept="image/jpeg,image/png,image/jpg,application/pdf" 
                            className="hidden" 
                            multiple
                            onChange={async (e) => { 
                                const selectedFiles = Array.from(e.target.files || []); 
                                if (selectedFiles.length === 0) return;

                                setIsCheckingCheque(true);
                                const apiPrefix = role === "superadmin" ? "/api/head" : "/api";

                                try {
                                    const results = await Promise.all(
                                        selectedFiles.map(async (f) => {
                                            const instrumentNo = f.name.replace(/\.[^.]+$/, "");
                                            
                                            // 1. Local check (already in list)
                                            const isLocalDuplicate = (chequeFiles || []).some(
                                                (existing) => existing.name.replace(/\.[^.]+$/, "") === instrumentNo
                                            );
                                            if (isLocalDuplicate) {
                                                return { file: f, instrumentNo, exists: true, error: `Cheque "${instrumentNo}" is already in your selection.` };
                                            }

                                            // 2. Existing check (already in this transaction's official attachments)
                                            const isOfficialDuplicate = (row.instrumentAttachments || []).some((att: any) => {
                                                const attNo = (att.instrumentNo || att.file_name || "").replace(/\.[^.]+$/, "");
                                                return attNo === instrumentNo;
                                            });
                                            if (isOfficialDuplicate) {
                                                return { file: f, instrumentNo, exists: true, error: `Cheque "${instrumentNo}" is already attached to this transaction.` };
                                            }

                                            // 3. Database check
                                            try {
                                                const res = await fetch(`${apiPrefix}/accountant/transactions/check-instrument-no?instrument_no=${encodeURIComponent(instrumentNo)}`);
                                                const data = await res.json();
                                                return { file: f, instrumentNo, exists: !!data.exists, error: data.exists ? `Cheque "${instrumentNo}" already exists in the ledger.` : null };
                                            } catch (err) {
                                                return { file: f, instrumentNo, exists: false, error: null };
                                            }
                                        })
                                    );

                                    const duplicates = results.filter((r) => r.exists);
                                    const accepted = results.filter((r) => !r.exists);

                                    if (duplicates.length > 0) {
                                        duplicates.forEach(d => showToast("Duplicate Cheque", d.error || `Cheque "${d.instrumentNo}" is invalid.`, "error"));
                                    }

                                    if (accepted.length > 0) {
                                        setChequeFiles?.((prev: File[]) => [...(prev || []), ...accepted.map(a => a.file)]);
                                    }
                                } finally {
                                    setIsCheckingCheque(false);
                                    if (e.target) e.target.value = "";
                                }
                            }} 
                        />
                    </div>
                ) : (
                    <>
                        <button 
                            onClick={() => setOpenType(!openType)} 
                            className={`flex items-center justify-between gap-2 px-4 h-10 w-full text-xs font-bold rounded-lg border border-gray-300 bg-white text-[#7a0f1f] shadow-sm hover:border-gray-400 transition-all cursor-pointer`}
                        >
                            <span className="truncate">{selectedType}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${openType ? "rotate-180" : ""}`} />
                        </button>
                        {openType && (
                            <div className="absolute top-full mt-2 z-[120] bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden py-1 min-w-[170px] ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                {options.map((opt) => (
                                    <button key={opt} onClick={() => handleTypeSelect(opt)} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors text-left ${opt === selectedType ? "bg-gray-50 text-[#7a0f1f]" : "text-gray-600 hover:bg-gray-50"}`}>
                                        {opt}
                                        {opt === selectedType && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Inline Particulars Cell ──────────────────────────────────────────────────

function InlineParticularsCell({
    row,
    forceEdit,
    draft,
    setDraft,
}: {
    row: LedgerEntry;
    forceEdit?: boolean;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
}) {
    const rawParticulars = useMemo(() => {
        const text = row.particulars ?? "";
        const sepIdx = text.indexOf(" - ");
        return sepIdx === -1 ? text : text.slice(sepIdx + 3);
    }, [row.particulars]);
    const value = draft?.particulars !== undefined ? draft.particulars : rawParticulars;
    const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [openUnit, setOpenUnit] = useState(false);
    const [unitSearchQ, setUnitSearchQ] = useState("");
    const unitRef = useRef<HTMLDivElement>(null);
    useOutsideClick(unitRef, () => setOpenUnit(false));

    const effectiveUnitId = draft?.otherUnitId !== undefined ? draft.otherUnitId : (row.otherUnitId || null);
    const saveToUnitLedger = draft?.saveToUnitLedger !== undefined ? draft.saveToUnitLedger : !!row.otherUnitId;
    
    // Extraction of unit name from particulars for pre-filling
    const parsedUnitName = useMemo(() => {
        const text = row.particulars ?? "";
        const sepIdx = text.indexOf(" - ");
        return sepIdx === -1 ? null : text.slice(0, sepIdx).trim();
    }, [row.particulars]);

    const showUnitSection = row.otherOwnerId && row.otherOwnerType && (row.otherOwnerType === "CLIENT" || row.otherOwnerType === "COMPANY");

    useEffect(() => {
        if (forceEdit && showUnitSection && row.otherOwnerId) {
            setUnitsLoading(true);
            fetch(`/api/accountant/maintenance/units?owner_id=${row.otherOwnerId}&per_page=100`)
                .then((r) => r.json())
                .then((res) => {
                    if (res.success && res.data) {
                        const unitsArray = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.data) ? res.data.data : []);
                        setUnits(unitsArray.map((u: any) => ({ id: u.id, name: u.unit_name })));
                    }
                }).finally(() => setUnitsLoading(false));
        }
    }, [forceEdit, showUnitSection, row.otherOwnerId]);

    // Ensure _unitName is in draft if we have a match, and strip prefix from particulars input
    useEffect(() => {
        if (forceEdit && units.length > 0) {
            // Check if we still need to initialize the "split" state
            // If draft.particulars still matches row.particulars (full string), and it contains a separator
            if (draft?.particulars === row.particulars && row.particulars?.includes(" - ")) {
                const text = row.particulars;
                const sepIdx = text.indexOf(" - ");
                const unitNamePart = text.slice(0, sepIdx).trim();
                const cleanPart = text.slice(sepIdx + 3).trim();
                
                const matched = units.find(u => u.name.toUpperCase() === unitNamePart.toUpperCase());
                
                setDraft?.((prev: any) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        particulars: cleanPart,
                        otherUnitId: matched ? matched.id : prev.otherUnitId,
                        _unitName: matched ? matched.name : unitNamePart,
                        saveToUnitLedger: matched ? !!row.otherUnitId : false
                    };
                });
            } else if (effectiveUnitId && !draft?._unitName) {
                // Just sync _unitName if it's missing but we have an ID
                const unit = units.find(u => u.id === effectiveUnitId);
                if (unit) {
                    setDraft?.((prev: any) => prev ? { ...prev, _unitName: unit.name } : null);
                }
            }
        }
    }, [forceEdit, units, row.particulars, draft?.particulars, draft?._unitName, effectiveUnitId, row.otherUnitId, setDraft]);


    if (forceEdit) {
        return (
            <div className="flex flex-col gap-3 w-full py-0.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 w-full">
                    <input type="text" value={value} onChange={(e) => setDraft?.((prev: any) => prev ? { ...prev, particulars: e.target.value } : null)} maxLength={35} className={`${CELL_INPUT} flex-1`} placeholder="Transaction particulars" />
                </div>
                {showUnitSection && (
                    <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2 flex-1 relative" ref={unitRef}>
                            {unitsLoading ? <span className="text-xs text-gray-400 italic">Loading units...</span> : (
                                <>
                                    <button 
                                        onClick={() => setOpenUnit(!openUnit)}
                                        className={`flex items-center w-full h-10 px-3 rounded-lg border shadow-sm text-xs font-bold bg-white text-gray-700 transition-all ${
                                            openUnit ? "border-[#7a0f1f] ring-2 ring-[#7a0f1f]/20" : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <Building2 className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                                        <span className="truncate flex-1 text-left uppercase">
                                            {units.find(u => String(u.id) === String(effectiveUnitId))?.name || draft?._unitName || parsedUnitName || "-- Select Unit --"}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${openUnit ? "rotate-180" : ""}`} />
                                    </button>
                                    {openUnit && (
                                        <div className="absolute top-full mt-2 left-0 w-64 z-[110] bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden py-1 ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-3 py-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                                                <Search className="w-3 h-3 text-gray-400" />
                                                <input 
                                                    autoFocus 
                                                    value={unitSearchQ} 
                                                    onChange={(e) => setUnitSearchQ(e.target.value)} 
                                                    placeholder="Search unit..." 
                                                    className="flex-1 text-xs bg-transparent outline-none font-bold placeholder:text-gray-300" 
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {units.filter(u => u.name.toLowerCase().includes(unitSearchQ.toLowerCase())).length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-gray-400 italic text-[10px]">No units found...</div>
                                                ) : units.filter(u => u.name.toLowerCase().includes(unitSearchQ.toLowerCase())).map(u => (
                                                    <button 
                                                        key={u.id} 
                                                        onClick={() => { 
                                                            setDraft?.((prev: any) => prev ? { 
                                                                ...prev, 
                                                                otherUnitId: u.id,
                                                                _unitName: u.name,
                                                                saveToUnitLedger: false 
                                                            } : null);
                                                            setOpenUnit(false);
                                                            setUnitSearchQ("");
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-gray-50 transition-colors ${
                                                            String(u.id) === String(effectiveUnitId) ? "bg-red-50 text-[#7a0f1f]" : "text-gray-600"
                                                        }`}
                                                    >
                                                        {u.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {(effectiveUnitId || saveToUnitLedger) && (
                            <label className="flex items-center gap-2 cursor-pointer group shrink-0 bg-white px-2 py-1 rounded-lg border border-gray-100 hover:border-red-100 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={saveToUnitLedger} 
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setDraft?.((prev: any) => {
                                            if (!prev) return null;
                                            const unitName = units.find(u => u.id === effectiveUnitId)?.name;
                                            return { 
                                                ...prev, 
                                                saveToUnitLedger: isChecked,
                                                otherUnitId: effectiveUnitId,
                                                _unitName: unitName
                                            };
                                        });
                                    }} 
                                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#7a0f1f]" 
                                />
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#7a0f1f] uppercase tracking-tighter">Save to Ledger</span>
                            </label>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const text: string = row.particulars ?? "";
    const sepIdx = text.indexOf(" - ");
    if (sepIdx === -1) return <InfoTooltip text={text}><span className="text-sm font-medium block truncate cursor-default">{text}</span></InfoTooltip>;
    const unitText = text.slice(0, sepIdx);
    const restText = text.slice(sepIdx + 3);
    return <InfoTooltip text={text}><span className="block truncate cursor-default"><span className="font-bold">{unitText}</span><span className="text-gray-400 mx-1">-</span><span>{restText}</span></span></InfoTooltip>;
}

// ─── Inline Amount Cell ───────────────────────────────────────────────────────

function InlineAmountCell({
    row,
    type,
    forceEdit,
    draft,
    setDraft,
}: {
    row: LedgerEntry;
    type: "DEPOSIT" | "WITHDRAWAL";
    forceEdit?: boolean;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
}) {
    const amount = type === "DEPOSIT" ? row.deposit : row.withdrawal;
    const editAmount = draft ? (type === "DEPOSIT" ? draft.deposit : draft.withdrawal) : amount;
    // Fix: isModeMatch should consider the current transMethod in the draft OR the original row
    const currentMethod = draft?.transMethod || (row.deposit > 0 ? "DEPOSIT" : "WITHDRAWAL");
    const isModeMatch = type === currentMethod;

    if (forceEdit && !isModeMatch) return <span className="text-gray-300">-</span>;

    if (!forceEdit) {
        if (amount === 0) return <span className="font-medium text-gray-400">-</span>;
        return <span className={`font-medium ${type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}>₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>;
    }

    return (
        <div className="flex items-center gap-3 w-full ml-auto py-0.5">
            <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 select-none flex items-center justify-center w-4 h-4">
                    <span className="font-bold text-[16px] leading-none mb-0.5">₱</span>
                </div>
                <input 
                    type="text" 
                    value={formatBalance(editAmount)} 
                    onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                            if (raw !== "" && Number(raw) > 999999999.99) return;
                            const val = raw === "" ? 0 : Number(raw);
                            setDraft?.((prev: any) => prev ? { 
                                ...prev, 
                                [type === "DEPOSIT" ? "deposit" : "withdrawal"]: val,
                                [type === "DEPOSIT" ? "withdrawal" : "deposit"]: 0
                            } : null);
                        }
                    }} 
                    className={`${CELL_INPUT} text-right pl-10 font-bold ${type === "DEPOSIT" ? "text-green-700" : "text-red-700"}`} 
                    placeholder="0.00"
                />
            </div>
        </div>
    );
}

// ─── Inline Owner Cell ────────────────────────────────────────────────────────

function InlineOwnerCell({
    row,
    allOwners,
    allOwnersLoading,
    forceEdit,
    role,
    router,
    draft,
    setDraft,
}: {
    row: LedgerEntry;
    allOwners: AllOwner[];
    allOwnersLoading: boolean;
    forceEdit?: boolean;
    role: "superadmin" | "accountant";
    router: any;
    draft?: LedgerEntry | null;
    setDraft?: React.Dispatch<React.SetStateAction<LedgerEntry | null>>;
}) {
    const [open, setOpen] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    useOutsideClick(ref, () => setOpen(false));

    function handleSelect(owner: AllOwner) {
        if (String(owner.id) === String(draft?.otherOwnerId || row.otherOwnerId)) { setOpen(false); return; }
        setDraft?.((prev: any) => prev ? { ...prev, otherOwnerId: owner.id, owner: owner.name } : null);
        setOpen(false);
    }

    if (!forceEdit) {
        if (!row.otherOwnerType || !row.otherOwnerId) return <InfoTooltip text={row.owner}><span className="truncate block cursor-default">{row.owner}</span></InfoTooltip>;
        const destType = row.otherOwnerType.toLowerCase();
        let targetUrl = `/${role === "superadmin" ? "super/accountant" : "accountant"}/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
        if (row.otherUnitId) targetUrl += `&targetUnitId=${row.otherUnitId}`;
        return <InfoTooltip text={row.owner}><button type="button" onClick={(e) => { e.stopPropagation(); router.push(targetUrl); }} className="truncate block w-full font-semibold text-[#7a0f1f] underline decoration-dotted underline-offset-2 text-left">{row.owner}</button></InfoTooltip>;
    }

    const filtered = allOwners.filter(o => o.owner_type !== "SYSTEM" && o.name.toLowerCase().includes(searchQ.toLowerCase()));

    return (
        <div className="relative w-full py-0.5" ref={ref}>
            <button 
                disabled={allOwnersLoading} 
                onClick={() => setOpen(!open)} 
                className={`flex items-center w-full h-10 px-4 rounded-lg border shadow-sm text-sm font-bold bg-white text-gray-800 transition-all ${
                    open ? "border-[#7a0f1f] ring-2 ring-[#7a0f1f]/20" : "border-gray-300 hover:border-gray-400"
                }`}
            >
                <User className="w-4 h-4 mr-3 shrink-0 text-[#7a0f1f]" />
                <span className="truncate flex-1 text-left uppercase">{allOwnersLoading ? "Loading..." : (draft?.owner || row.owner)}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-2 left-0 w-72 z-[110] bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden py-1 ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <input 
                            autoFocus 
                            value={searchQ} 
                            onChange={(e) => setSearchQ(e.target.value)} 
                            placeholder="Search owner..." 
                            className="flex-1 text-sm bg-transparent outline-none font-bold placeholder:text-gray-300" 
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto pt-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 italic text-xs">No owners found...</div>
                        ) : filtered.map(o => (
                            <button 
                                key={o.id} 
                                onClick={() => { handleSelect(o); setSearchQ(""); }} 
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group ${
                                    String(o.id) === String(draft?.otherOwnerId || row.otherOwnerId) ? "bg-red-50/50" : ""
                                }`}
                            >
                                <span className={`text-sm font-bold truncate uppercase ${
                                    String(o.id) === String(draft?.otherOwnerId || row.otherOwnerId) ? "text-[#7a0f1f]" : "text-gray-700"
                                }`}>
                                    {o.name}
                                </span>
                                <OwnerTypeBadge type={o.owner_type} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
