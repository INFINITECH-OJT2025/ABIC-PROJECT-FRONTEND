"use client";
// ─── ViewImagePanel import ───────────────────────────────────────────────────
import ViewImagePanelComponent, { ViewImagePanelFile } from "@/components/app/ViewImagePanel";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import LoadingModal from "@/components/app/LoadingModal";
import { useAppToast } from "@/components/app/toast/AppToastProvider";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    FileText,
    Upload,
    X,
    Search,
    ChevronDown,
    User,
    Building2,
    AlertTriangle,
    CheckSquare,
    Square,
    Calendar,
    DollarSign,
    AlignLeft,
    Tag,
    UserCheck,
    Paperclip,
    Eye,
    Trash2,
    AlertCircle,
    Info,
    Plus,
    SendHorizonal,
    Printer,
    Lock,
    RefreshCw,
} from "lucide-react";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import OwnerCreateEditPanel from "@/components/app/super/accountant/OwnerCreateEditPanel";
import UnitCreateEditPanel from "@/components/app/super/accountant/UnitCreateEditPanel";
import { generateReceiptPDF } from "@/components/app/super/accountant/ReceiptGenerator";
import TransactionSuccessPanel from "@/components/app/super/accountant/TransactionSuccessPanel";
import type { SuccessTransactionData } from "@/components/app/super/accountant/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#7a0f1f";
const BORDER = "rgba(0,0,0,0.12)";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionMode = "DEPOSIT" | "WITHDRAWAL";
export type VoucherMode = "WITH_VOUCHER" | "NO_VOUCHER";
export type TransactionType = "CASH DEPOSIT" | "BANK TRANSFER" | "CHEQUE DEPOSIT" | "CHEQUE";

export type OwnerType = "COMPANY" | "CLIENT" | "MAIN" | "SYSTEM";

export interface Owner {
    id: number;
    name: string;
    owner_type: OwnerType;
    status: string;
}

export interface Unit {
    id: number;
    unit_name: string;
    status: string;
}

export interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    name: string;
    size: number;
}

interface TransactionFormData {
    transaction_type: TransactionType;
    from_owner_id: number | null;
    to_owner_id: number | null;
    unit_id: number | null;
    amount: string;
    particulars: string;
    fund_reference: string;
    person_in_charge: string;
    voucher_date: string;
}

// ─── Helper: strip file extension to get instrument number ───────────────────

function fileNameToInstrumentNo(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, "");
}

// ─── Helper: human-readable file size ────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Helper: format date for display ─────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return "—";
    }
}

// ─── Helper: transaction type label ──────────────────────────────────────────
function getTransactionTypeLabel(t: string): string {
    const labels: Record<string, string> = {
        "CASH DEPOSIT": "Cash Deposit",
        "BANK TRANSFER": "Bank Transfer",
        "CHEQUE": "Cheque",
        "CHEQUE DEPOSIT": "Cheque Deposit",
    };
    return labels[t] ?? t;
}

// ─── Helper: format amount for display ───────────────────────────────────────
function formatAmountDisplay(amount: string): string {
    if (!amount) return "₱0.00";
    const n = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(n)) return "₱0.00";
    return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Helper: currency format ──────────────────────────────────────────────────

function formatCurrency(raw: string): string {
    if (!raw) return "";
    const parts = raw.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// ─── Owner Type Badge ─────────────────────────────────────────────────────────

function OwnerTypeBadge({ type }: { type: OwnerType }) {
    const map: Record<OwnerType, { bg: string; text: string; label: string }> = {
        COMPANY: { bg: "bg-blue-100", text: "text-blue-700", label: "Company" },
        CLIENT: { bg: "bg-purple-100", text: "text-purple-700", label: "Client" },
        MAIN: { bg: "bg-amber-100", text: "text-amber-700", label: "Main" },
        SYSTEM: { bg: "bg-gray-100", text: "text-gray-500", label: "System" },
    };
    const s = map[type] ?? { bg: "bg-gray-100", text: "text-gray-600", label: type };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

// ─── Searchable Owner Dropdown ────────────────────────────────────────────────

interface OwnerDropdownProps {
    label: string;
    required?: boolean;
    placeholder: string;
    owners: Owner[];
    loading: boolean;
    selectedOwner: Owner | null;
    onSelect: (owner: Owner | null) => void;
    error?: string;
    onCloseError?: () => void;
    filterFn?: (o: Owner) => boolean;
    icon?: React.ReactNode;
    onCreateNew?: (searchQuery: string) => void;
}

function OwnerDropdown({
    label,
    required,
    placeholder,
    owners,
    loading,
    selectedOwner,
    onSelect,
    error,
    onCloseError,
    filterFn,
    icon,
    onCreateNew,
}: OwnerDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    const filtered = (filterFn ? owners.filter(filterFn) : owners).filter((o) =>
        o.name.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div
                className={`flex items-center h-10 rounded-lg border bg-white cursor-pointer transition-all ${error ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-300 hover:border-gray-400"
                    } ${open ? `border-[${ACCENT}] ring-2 ring-[${ACCENT}]/20` : ""}`}
                onClick={() => setOpen((v) => !v)}
            >
                <div className="pl-3 text-gray-400 flex-shrink-0">
                    {icon ?? <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 px-3 text-sm truncate">
                    {selectedOwner ? (
                        <span className="font-semibold text-gray-900 uppercase">{selectedOwner.name}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 pr-3">
                    {selectedOwner && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelect(null); setQuery(""); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </div>

            {open && (
                <div className="absolute top-full mt-1 left-0 right-0 z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
                        {loading ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners found</div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => { onSelect(o); setOpen(false); setQuery(""); }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedOwner?.id === o.id ? "bg-red-50" : ""
                                        }`}
                                >
                                    <span className="font-semibold text-gray-900 uppercase truncate">{o.name}</span>
                                    <OwnerTypeBadge type={o.owner_type} />
                                </button>
                            ))
                        )}
                    </div>
                    {onCreateNew && (
                        <div className="border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); onCreateNew(query); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#7a0f1f] hover:bg-red-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Owner
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <FormTooltipError message={error} onClose={() => { if (onCloseError) onCloseError() }} />
            )}
        </div>
    );
}

// ─── File Drop Zone ───────────────────────────────────────────────────────────

interface FileDropZoneProps {
    label: string;
    files: UploadedFile[];
    onAdd: (files: File[]) => void;
    onRemove: (id: string) => void;
    accept?: string;
    multiple?: boolean;
    error?: string;
    onCloseError?: () => void;
}

function FileDropZone({ label, files, onAdd, onRemove, accept, multiple = true, error, onCloseError }: FileDropZoneProps) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) onAdd(dropped);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.length) {
            onAdd(Array.from(e.target.files));
            e.target.value = "";
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <div
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragging
                    ? "border-[#7a0f1f] bg-[#7a0f1f]/5"
                    : error
                        ? "border-red-400 bg-red-50/50"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, JPG, PNG, PDF — max 10 MB each</p>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept ?? ".jpg,.jpeg,.png,.pdf"}
                    multiple={multiple}
                    onChange={handleChange}
                />
            </div>

            {error && (
                <FormTooltipError message={error} onClose={() => { if (onCloseError) onCloseError() }} />
            )}

            {/* File previews */}
            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((f) => (
                        <div
                            key={f.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white"
                        >
                            {f.preview ? (
                                <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200" />
                            ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                            </div>
                            {f.preview && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); window.open(f.preview, "_blank"); }}
                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(f.id); }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children, icon, className = "" }: { title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border bg-white shadow-sm relative ${className}`} style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50/60 rounded-t-xl" style={{ borderColor: BORDER }}>
                {icon && <span className="text-[#7a0f1f]">{icon}</span>}
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
            </div>
            <div className="px-6 py-5 space-y-4">{children}</div>
        </div>
    );
}

// ─── Input Field with Icon ────────────────────────────────────────────────────

function InputField({
    label,
    required,
    icon,
    error,
    onCloseError,
    characterCount,
    children,
}: {
    label: string;
    required?: boolean;
    icon?: React.ReactNode;
    error?: string;
    onCloseError?: () => void;
    characterCount?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {characterCount && (
                    <span className="text-xs font-semibold text-gray-400">{characterCount}</span>
                )}
            </div>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-3 text-gray-400 z-10 flex items-center justify-center pointer-events-none">
                        {icon}
                    </div>
                )}
                {children}
            </div>
            {error && <FormTooltipError message={error} onClose={onCloseError} />}
        </div>
    );
}

const inputCls = (hasIcon: boolean, error?: string) =>
    `w-full h-10 rounded-lg border text-sm text-gray-900 bg-white focus:outline-none transition-all
  ${hasIcon ? "pl-10 pr-3" : "px-3"}
  ${error ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-gray-300 focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20"}`;

// ─── Toggle Button Group ──────────────────────────────────────────────────────

function ToggleGroup<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
    return (
        <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-gray-100 p-1 gap-1">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${value === opt.value
                        ? "bg-[#7a0f1f] text-white shadow-md"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                        }`}
                >
                    {opt.icon}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── Main TransactionForm Component ──────────────────────────────────────────

export interface TransactionFormProps {
    /** Initial mode, can be synced to URL query param */
    initialMode?: TransactionMode;
    onModeChange?: (mode: TransactionMode) => void;
}

export default function TransactionForm({ initialMode = "DEPOSIT", onModeChange }: TransactionFormProps) {
    // ── Toast ─────────────────────────────────────────────────────────────────
    const { showToast } = useAppToast();

    // ── Top-level mode ────────────────────────────────────────────────────────
    const [mode, setMode] = useState<TransactionMode>(initialMode);
    const [voucherMode, setVoucherMode] = useState<VoucherMode>("WITH_VOUCHER");

    // ── Form data ─────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<TransactionFormData>({
        transaction_type: initialMode === "WITHDRAWAL" ? "CHEQUE" : "CASH DEPOSIT",
        from_owner_id: null,
        to_owner_id: null,
        unit_id: null,
        amount: "",
        particulars: "",
        fund_reference: "",
        person_in_charge: "",
        voucher_date: "",
    });

    // ── Owner data ────────────────────────────────────────────────────────────
    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(false);
    const [selectedMainOwner, setSelectedMainOwner] = useState<Owner | null>(null);
    const [selectedToOwner, setSelectedToOwner] = useState<Owner | null>(null);

    // ── Unit data ─────────────────────────────────────────────────────────────
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [saveToUnitLedger, setSaveToUnitLedger] = useState(false);
    const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
    const [unitQuery, setUnitQuery] = useState("");
    const unitDropdownRef = useRef<HTMLDivElement>(null);

    // ── Balance data ──────────────────────────────────────────────────────────
    const [mainOwnerBalance, setMainOwnerBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // ── File uploads ──────────────────────────────────────────────────────
    const [voucherFile, setVoucherFile] = useState<UploadedFile | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    // ── Create panels ─────────────────────────────────────────────────────
    const [showOwnerPanel, setShowOwnerPanel] = useState(false);
    const [showUnitPanel, setShowUnitPanel] = useState(false);
    const [createOwnerName, setCreateOwnerName] = useState("");
    const [createUnitName, setCreateUnitName] = useState("");

    // ── Preview panel ─────────────────────────────────────────────────────────
    const [previewFile, setPreviewFile] = useState<ViewImagePanelFile | null>(null);

    // ── Confirmation / Loading modal ──────────────────────────────────────────
    const [showConfirm, setShowConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Print state ───────────────────────────────────────────────────────────
    const [isPrinting, setIsPrinting] = useState(false);

    // ── Success panel state ───────────────────────────────────────────────────
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);
    const [successPanelData, setSuccessPanelData] = useState<SuccessTransactionData | null>(null);
    const [successPanelMode, setSuccessPanelMode] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");

    // ── Voucher duplicate check state ─────────────────────────────────────────
    const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

    // ── Cheque duplicate check state ──────────────────────────────────────────
    const [isCheckingCheque, setIsCheckingCheque] = useState(false);

    // ── Validation errors ─────────────────────────────────────────────────────
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ─── Derived Flags ────────────────────────────────────────────────────────

    const DEPOSIT_TYPES: TransactionType[] = ["CASH DEPOSIT", "BANK TRANSFER", "CHEQUE DEPOSIT"];
    const WITHDRAWAL_TYPES: TransactionType[] = ["CHEQUE"];
    const transactionTypeOptions = mode === "DEPOSIT" ? DEPOSIT_TYPES : WITHDRAWAL_TYPES;

    const requiresFileUpload = formData.transaction_type === "CHEQUE";

    const showUnitSection =
        !!selectedToOwner &&
        (selectedToOwner.owner_type === "CLIENT" || selectedToOwner.owner_type === "COMPANY");

    const shouldShowAttachments =
        voucherMode === "WITH_VOUCHER"
            ? !!voucherFile || uploadedFiles.length > 0
            : requiresFileUpload && uploadedFiles.length > 0;

    const amountNum = parseFloat(formData.amount.replace(/,/g, "")) || 0;
    const projectedBalance =
        mainOwnerBalance !== null ? mainOwnerBalance - amountNum : null;
    const showBalanceWarning =
        mode === "WITHDRAWAL" &&
        mainOwnerBalance !== null &&
        amountNum > 0 &&
        projectedBalance !== null &&
        projectedBalance < 0;

    // ─── Fetch Owners ─────────────────────────────────────────────────────────

    const fetchOwners = useCallback(async () => {
        setOwnersLoading(true);
        try {
            const res = await fetch("/api/accountant/maintenance/owners?per_page=all&status=ACTIVE");
            const data = await res.json();
            if (data.success) {
                const list = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : [];
                setOwners(list);
            }
        } catch {
            console.error("Failed to fetch owners");
        } finally {
            setOwnersLoading(false);
        }
    }, []);

    useEffect(() => { fetchOwners(); }, [fetchOwners]);

    // ─── Fetch Units (when to-owner changes) ─────────────────────────────────

    const fetchUnits = useCallback(() => {
        if (!selectedToOwner || !showUnitSection) {
            setUnits([]);
            setSelectedUnit(null);
            return;
        }
        setUnitsLoading(true);
        fetch(`/api/accountant/maintenance/units?owner_id=${selectedToOwner.id}&per_page=all&status=ACTIVE`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    const list = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : [];
                    setUnits(list);
                }
            })
            .catch(() => setUnits([]))
            .finally(() => setUnitsLoading(false));
    }, [selectedToOwner, showUnitSection]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    // ─── Fetch Main Owner Balance (withdrawal) ────────────────────────────────

    useEffect(() => {
        if (mode !== "WITHDRAWAL" || !selectedMainOwner) {
            setMainOwnerBalance(null);
            return;
        }
        setBalanceLoading(true);
        fetch(`/api/accountant/ledger/mains?owner_id=${selectedMainOwner.id}`)
            .then((r) => r.json())
            .then((data) => {
                // Backend returns: { data: { transactions: [...sorted desc...], openingBalance, owner } }
                // The running_balance for the owner is the outsBalance from the first item
                // when sorted descending (i.e. the most recent entry).
                if (!data.success) {
                    setMainOwnerBalance(null);
                    return;
                }
                const transactions: { outsBalance?: number }[] = data.data?.transactions ?? [];
                // The API defaults to sort=newest (desc), so transactions[0] is the latest entry.
                // If there are no transactions yet, the balance is 0 (not unavailable).
                const latestBalance = transactions.length > 0
                    ? (transactions[0].outsBalance ?? 0)
                    : 0;
                setMainOwnerBalance(latestBalance);
            })
            .catch(() => setMainOwnerBalance(null))
            .finally(() => setBalanceLoading(false));
    }, [mode, selectedMainOwner]);

    // ─── Mode change propagation ──────────────────────────────────────────────

    function handleModeChange(newMode: TransactionMode) {
        setMode(newMode);
        onModeChange?.(newMode);
        // Clear balance warning state
        setMainOwnerBalance(null);
        // Reset transaction type to first valid option for the new mode
        const defaultType = newMode === "DEPOSIT" ? "CASH DEPOSIT" : "CHEQUE";
        setFormData((prev) => ({ ...prev, transaction_type: defaultType, instrument_no: "" }));
        setUploadedFiles([]);
    }

    // ─── Transaction type change ──────────────────────────────────────────────

    function handleTypeChange(type: TransactionType) {
        setFormData((prev) => ({ ...prev, transaction_type: type, instrument_no: "" }));
        // Clear uploaded instrument files when switching to a type that doesn't need them
        if (type !== "CHEQUE") {
            setUploadedFiles([]);
        }
        if (errors.transaction_type || errors.uploadedFiles) {
            setErrors((prev) => { const n = { ...prev }; delete n.transaction_type; delete n.uploadedFiles; return n; });
        }
    }

    // ─── File helpers ─────────────────────────────────────────────────────────

    function makeUploadedFile(file: File): UploadedFile {
        const id = `${Date.now()}-${Math.random()}`;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        return { id, file, preview, name: file.name, size: file.size };
    }

    async function addFiles(files: File[]) {
        const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
        if (valid.length === 0) return;

        setIsCheckingCheque(true);
        // Clear any previous uploadedFiles error
        setErrors((p) => { const n = { ...p }; delete n.uploadedFiles; return n; });

        try {
            // Check each new file against the existing in-memory list (name-based dedup)
            const existingNames = new Set(uploadedFiles.map((f) => f.name));
            const candidateFiles = valid.filter((f) => !existingNames.has(f.name));

            if (candidateFiles.length === 0) return;

            // Check all candidates concurrently against the database
            const results = await Promise.all(
                candidateFiles.map(async (f) => {
                    const instrumentNo = fileNameToInstrumentNo(f.name);
                    try {
                        const res = await fetch(
                            `/api/head/accountant/transactions/check-instrument-no?instrument_no=${encodeURIComponent(instrumentNo)}`
                        );
                        const data = await res.json().catch(() => ({}));
                        return { file: f, instrumentNo, exists: !!data.exists };
                    } catch {
                        // Network error — allow the file
                        return { file: f, instrumentNo, exists: false };
                    }
                })
            );

            const duplicates = results.filter((r) => r.exists);
            const accepted = results.filter((r) => !r.exists);

            // Add accepted files
            if (accepted.length > 0) {
                setUploadedFiles((prev) => [...prev, ...accepted.map((r) => makeUploadedFile(r.file))]);
            }

            // Show error for duplicates
            if (duplicates.length > 0) {
                const names = duplicates.map((r) => `"${r.instrumentNo}"`).join(", ");
                const label = duplicates.length === 1 ? "Cheque number" : "Cheque numbers";
                setErrors((p) => ({
                    ...p,
                    uploadedFiles: `${label} ${names} already exist${duplicates.length === 1 ? "s" : ""}.`,
                }));
            }
        } finally {
            setIsCheckingCheque(false);
        }
    }

    function removeFile(id: string) {
        setUploadedFiles((prev) => {
            const f = prev.find((x) => x.id === id);
            if (f?.preview) URL.revokeObjectURL(f.preview);
            return prev.filter((x) => x.id !== id);
        });
    }

    async function addVoucherFile(files: File[]) {
        const f = files[0];
        if (!f || f.size > 10 * 1024 * 1024) return;
        if (voucherFile?.preview) URL.revokeObjectURL(voucherFile.preview);

        const newFile = makeUploadedFile(f);
        setVoucherFile(newFile);
        setIsCheckingVoucher(true);

        // Clear any previous voucher file error optimistically
        setErrors((p) => { const n = { ...p }; delete n.voucherFile; return n; });

        try {
            const voucherNo = fileNameToInstrumentNo(f.name);
            const res = await fetch(
                `/api/head/accountant/transactions/check-voucher-no?voucher_no=${encodeURIComponent(voucherNo)}`
            );
            const data = await res.json().catch(() => ({}));

            if (data.exists) {
                // Duplicate found — reject the file and show error
                setVoucherFile(null);
                setErrors((p) => ({
                    ...p,
                    voucherFile: `Voucher "${voucherNo}" already exists.`,
                }));
            }
        } catch {
            // Network error — allow the file but warn softly via console
            console.warn("Could not verify voucher uniqueness. Proceeding anyway.");
        } finally {
            setIsCheckingVoucher(false);
        }
    }

    // ─── Unit dropdown outside click ─────────────────────────────────────────

    useEffect(() => {
        function handle(e: MouseEvent) {
            if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) {
                setUnitDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // ─── Validation & Submission ──────────────────────────────────────────────

    function validateForm(): Record<string, string> {
        const newErrors: Record<string, string> = {};

        if (voucherMode === "WITH_VOUCHER") {
            if (!formData.voucher_date) newErrors.voucher_date = "Voucher date is required.";
            if (!voucherFile) newErrors.voucherFile = "Voucher file is required.";
        }

        if (!formData.transaction_type) {
            newErrors.transaction_type = "Transaction type is required.";
        }

        if (requiresFileUpload && uploadedFiles.length === 0) {
            newErrors.uploadedFiles = "At least one cheque file is required.";
        }

        if (!formData.from_owner_id) {
            newErrors.from_owner_id = "Main owner is required.";
        }

        if (!formData.to_owner_id) {
            newErrors.to_owner_id = "Owner is required.";
        }

        if (showUnitSection && saveToUnitLedger && !formData.unit_id) {
            newErrors.unit_id = "Unit is required when saving to unit ledger.";
        }

        const amt = parseFloat(formData.amount.replace(/,/g, ""));
        if (!formData.amount || isNaN(amt) || amt <= 0) {
            newErrors.amount = "A valid amount greater than 0 is required.";
        }

        if (!formData.particulars || !formData.particulars.trim()) {
            newErrors.particulars = "Particulars are required.";
        }

        setErrors(newErrors);
        return newErrors;
    }

    /** Priority-ordered list of field IDs — top to bottom in the form */
    const FIELD_ORDER = [
        "field-voucher_date",
        "field-voucherFile",
        "field-transaction_type",
        "field-uploadedFiles",
        "field-from_owner_id",
        "field-to_owner_id",
        "field-unit_id",
        "field-amount",
        "field-particulars",
    ];

    function scrollToFirstError(errs: Record<string, string>) {
        for (const fieldId of FIELD_ORDER) {
            const key = fieldId.replace("field-", "");
            if (errs[key]) {
                const el = document.getElementById(fieldId);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return;
            }
        }
    }

    function handleSubmit() {
        const errs = validateForm();
        if (Object.keys(errs).length > 0) {
            scrollToFirstError(errs);
            return;
        }
        // Open confirmation modal — actual submission happens in handleConfirmSubmit
        setShowConfirm(true);
    }

    async function handleConfirmSubmit() {
        setShowConfirm(false);
        setIsSubmitting(true);
        try {
            const transactionPayload = {
                trans_type: formData.transaction_type,
                from_owner_id: formData.from_owner_id,
                to_owner_id: formData.to_owner_id,
                unit_id: formData.unit_id ?? null,
                amount: formData.amount.replace(/,/g, ""),
                particulars: formData.particulars,
                fund_reference: formData.fund_reference || null,
                person_in_charge: formData.person_in_charge || null,
                voucher_no: voucherMode === "WITH_VOUCHER" && voucherFile
                    ? voucherFile.name.replace(/\.[^.]+$/, "").toUpperCase()
                    : null,
                voucher_date: voucherMode === "WITH_VOUCHER" ? formData.voucher_date || null : null,
                save_to_unit_ledger: saveToUnitLedger,
            };

            // Build instruments array (e.g. for CHEQUE)
            const instruments = uploadedFiles.map((f) => ({
                instrument_type: formData.transaction_type,
                instrument_no: f.name.replace(/\.[^.]+$/, ""),
            }));

            const body = new FormData();
            body.append("transaction", JSON.stringify(transactionPayload));
            if (instruments.length > 0) {
                body.append("instruments", JSON.stringify(instruments));
            }

            // Voucher file
            if (voucherMode === "WITH_VOUCHER" && voucherFile) {
                body.append("voucher", voucherFile.file);
            }

            // Attachment files (cheque files etc.)
            uploadedFiles.forEach((f, idx) => {
                body.append(`file_${idx}`, f.file);
            });

            const endpoint = mode === "DEPOSIT"
                ? "/api/head/accountant/transactions/deposit"
                : "/api/head/accountant/transactions/withdrawal";

            const res = await fetch(endpoint, { method: "POST", body });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                showToast(
                    mode === "DEPOSIT" ? "Deposit Submitted" : "Withdrawal Submitted",
                    data.message ?? "Transaction recorded successfully.",
                    "success"
                );
                // Build receipt data for the success panel
                const receiptData: SuccessTransactionData = {
                    id: data.data?.id,
                    voucherMode,
                    voucher_date: voucherMode === "WITH_VOUCHER" ? (formData.voucher_date || undefined) : undefined,
                    voucher_no: voucherMode === "WITH_VOUCHER" && voucherFile
                        ? voucherFile.name.replace(/\.[^.]+$/, "").toUpperCase()
                        : undefined,
                    transaction_type: formData.transaction_type,
                    instrumentNumbers: uploadedFiles.map((f) => f.name.replace(/\.[^.]+$/, "")),
                    fromOwnerName: selectedMainOwner?.name ?? "—",
                    toOwnerName: selectedToOwner?.name ?? "—",
                    unit_name: saveToUnitLedger && selectedUnit ? selectedUnit.unit_name : undefined,
                    particulars: formData.particulars || undefined,
                    fund_reference: formData.fund_reference || undefined,
                    person_in_charge: formData.person_in_charge || undefined,
                    attachmentsCount: uploadedFiles.length + (voucherFile ? 1 : 0),
                    amount: formData.amount,
                };

                // Open success panel THEN reset the form
                setSuccessPanelData(receiptData);
                setSuccessPanelMode(mode);
                setShowSuccessPanel(true);
                handleReset();
            } else {
                // Surface first validation error if available
                const firstError = data.errors
                    ? Object.values(data.errors as Record<string, string[]>).flat()[0]
                    : undefined;
                showToast(
                    "Submission Failed",
                    firstError ?? data.message ?? "Could not submit the transaction. Please try again.",
                    "error"
                );
            }
        } catch {
            showToast("Submission Failed", "An unexpected error occurred. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }

    // ─── Print Handler ────────────────────────────────────────────────────────

    async function handlePrint() {
        setIsPrinting(true);
        try {
            const receiptData = {
                id: 0,
                voucherMode,
                voucher_date: formData.voucher_date || undefined,
                voucher_no: voucherFile ? fileNameToInstrumentNo(voucherFile.name) : undefined,
                transaction_type: formData.transaction_type,
                instrumentNumbers: uploadedFiles.map((f) => fileNameToInstrumentNo(f.name)),
                fromOwnerName: selectedMainOwner?.name ?? "—",
                toOwnerName: selectedToOwner?.name ?? "—",
                unit_name: saveToUnitLedger && selectedUnit ? selectedUnit.unit_name : undefined,
                particulars: formData.particulars || undefined,
                fund_reference: formData.fund_reference || undefined,
                person_in_charge: formData.person_in_charge || undefined,
                attachmentsCount: uploadedFiles.length + (voucherFile ? 1 : 0),
                amount: formData.amount,
            };
            const blob = await generateReceiptPDF(receiptData, mode);
            const url = URL.createObjectURL(blob);

            // Open in a new window and trigger the browser print dialog
            const printWindow = window.open(url, "_blank");
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                };
            }

            // Revoke the object URL after a short delay to allow the window to load
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
            console.error("Failed to generate receipt PDF:", err);
        } finally {
            setIsPrinting(false);
        }
    }

    function handleReset() {
        setFormData({
            transaction_type: mode === "DEPOSIT" ? "CASH DEPOSIT" : "CHEQUE",
            from_owner_id: null,
            to_owner_id: null,
            unit_id: null,
            amount: "",
            particulars: "",
            fund_reference: "",
            person_in_charge: "",
            voucher_date: "",
        });
        setSelectedMainOwner(null);
        setSelectedToOwner(null);
        setSelectedUnit(null);
        setVoucherFile(null);
        setUploadedFiles([]);
        setErrors({});
        setSaveToUnitLedger(false);
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <style jsx>{`
                @media (min-width: 1024px) {
                    .transaction-grid {
                        grid-template-columns: calc(66% - 0.75rem) calc(33% - 0.75rem);
                    }
                }
            `}</style>
            <ViewImagePanelComponent
                open={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                zIndex={70}
            />
            <div className="transaction-grid grid grid-cols-1 gap-4 items-start">

                {/* ── LEFT: Main form ── */}
                <div className="min-w-0">

                    {/* ROW 1: Mode toggles & Voucher Details (separate rows) */}
                    <div className="flex flex-col gap-4 items-start w-full">
                        {/* Mode toggles */}
                        <div className="w-full">
                            <SectionCard title="Transaction Mode" icon={<ArrowDownCircle className="w-4 h-4" />}>
                                <div className="flex flex-col gap-4">
                                    <ToggleGroup<TransactionMode>
                                        value={mode}
                                        onChange={handleModeChange}
                                        options={[
                                            { value: "DEPOSIT", label: "Deposit", icon: <ArrowDownCircle className="w-4 h-4" /> },
                                            { value: "WITHDRAWAL", label: "Withdrawal", icon: <ArrowUpCircle className="w-4 h-4" /> },
                                        ]}
                                    />
                                    <ToggleGroup<VoucherMode>
                                        value={voucherMode}
                                        onChange={setVoucherMode}
                                        options={[
                                            { value: "WITH_VOUCHER", label: "With Voucher" },
                                            { value: "NO_VOUCHER", label: "No Voucher" },
                                        ]}
                                    />
                                </div>
                            </SectionCard>
                        </div>

                        {/* Voucher Details (conditional) */}
                        <div className={`transition-all duration-500 ease-in-out w-full overflow-hidden ${voucherMode === "WITH_VOUCHER" ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0 !p-0"}`}>
                            <div className="w-full">
                                <SectionCard title="Voucher Details" icon={<FileText className="w-4 h-4" />}>
                                    <div id="field-voucher_date">
                                        <InputField
                                            label="Date"
                                            required
                                            icon={<Calendar className="w-4 h-4" />}
                                            error={errors.voucher_date}
                                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.voucher_date; return n; })}
                                        >
                                            <input
                                                type="date"
                                                value={formData.voucher_date}
                                                onChange={(e) => {
                                                    setFormData((p) => ({ ...p, voucher_date: e.target.value }));
                                                    if (errors.voucher_date && e.target.value)
                                                        setErrors((p) => { const n = { ...p }; delete n.voucher_date; return n; });
                                                }}
                                                className={`${inputCls(true, errors.voucher_date)} cursor-pointer`}
                                            />
                                        </InputField>
                                    </div>{/* /field-voucher_date */}
                                    <div id="field-voucherFile" className={`relative transition-all duration-300 ${errors.voucherFile ? "pb-12" : ""}`}>
                                        {isCheckingVoucher && (
                                            <div className="absolute -top-1 right-0 z-10 flex items-center gap-1.5 text-xs font-semibold text-[#7a0f1f] bg-white px-2 py-0.5 rounded-full shadow-sm border border-[#7a0f1f]/20">
                                                <span className="w-3 h-3 rounded-full border-2 border-[#7a0f1f] border-t-transparent animate-spin inline-block" />
                                                Checking…
                                            </div>
                                        )}
                                        <FileDropZone
                                            label="Voucher Upload *"
                                            files={voucherFile ? [voucherFile] : []}
                                            onAdd={addVoucherFile}
                                            onRemove={() => setVoucherFile(null)}
                                            multiple={false}
                                            error={errors.voucherFile}
                                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.voucherFile; return n; })}
                                        />
                                    </div>
                                </SectionCard>
                            </div>
                        </div>
                    </div>

                    {/* 2. Payment Details */}
                    <SectionCard title="Payment Details" icon={<DollarSign className="w-4 h-4" />} className="mt-6">
                        {/* Transaction Type */}
                        <div id="field-transaction_type" className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Transaction Type <span className="text-red-500">*</span>
                            </label>

                            {mode === "WITHDRAWAL" ? (
                                /* ── Locked: Withdrawal is always CHEQUE ── */
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className={`w-full h-10 rounded-lg border text-sm font-semibold bg-gray-50 pl-10 pr-10 flex items-center uppercase tracking-wide select-none border-gray-200 text-gray-500 cursor-not-allowed`}>
                                        CHEQUE
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            ) : (
                                /* ── Normal dropdown for DEPOSIT ── */
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <select
                                        value={formData.transaction_type}
                                        onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                                        className={`w-full h-10 rounded-lg border text-sm font-semibold text-gray-900 bg-white pl-10 pr-8 appearance-none cursor-pointer focus:outline-none transition-all uppercase tracking-wide ${errors.transaction_type
                                            ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                            : "border-gray-300 focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20"
                                            }`}
                                    >
                                        {transactionTypeOptions.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            )}

                            {errors.transaction_type && <FormTooltipError message={errors.transaction_type} onClose={() => setErrors((p) => { const n = { ...p }; delete n.transaction_type; return n; })} />}
                        </div>

                        {/* Cheque upload — always in WITHDRAWAL, also for CHEQUE type in DEPOSIT */}
                        {(mode === "WITHDRAWAL" || requiresFileUpload) && (
                            <div id="field-uploadedFiles" className="relative">
                                {isCheckingCheque && (
                                    <div className="absolute -top-1 right-0 z-10 flex items-center gap-1.5 text-xs font-semibold text-[#7a0f1f] bg-white px-2 py-0.5 rounded-full shadow-sm border border-[#7a0f1f]/20">
                                        <span className="w-3 h-3 rounded-full border-2 border-[#7a0f1f] border-t-transparent animate-spin inline-block" />
                                        Checking…
                                    </div>
                                )}
                                <FileDropZone
                                    label="Cheque Upload"
                                    files={uploadedFiles}
                                    onAdd={addFiles}
                                    onRemove={removeFile}
                                    error={errors.uploadedFiles}
                                    onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.uploadedFiles; return n; })}
                                />
                            </div>
                        )}

                        {/* Main Owner */}
                        <div id="field-from_owner_id">
                            <OwnerDropdown
                                label="Main Owner"
                                required
                                placeholder="Select main owner…"
                                owners={owners}
                                loading={ownersLoading}
                                selectedOwner={selectedMainOwner}
                                onSelect={(o) => {
                                    setSelectedMainOwner(o);
                                    setFormData((p) => ({ ...p, from_owner_id: o?.id ?? null }));
                                    if (errors.from_owner_id) setErrors((p) => { const n = { ...p }; delete n.from_owner_id; return n; });
                                }}
                                filterFn={(o) => o.owner_type === "MAIN" && o.status === "ACTIVE"}
                                icon={<Building2 className="w-4 h-4" />}
                                error={errors.from_owner_id}
                                onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.from_owner_id; return n; })}
                            />
                        </div>

                        {/* Balance info / warning */}
                        {mode === "WITHDRAWAL" && selectedMainOwner && (
                            <div className={`flex items-start gap-4 rounded-xl px-4 py-4 text-sm mt-3 shadow-sm border ${balanceLoading
                                ? "bg-slate-50 border-slate-200 border-l-[6px] border-l-slate-400"
                                : showBalanceWarning
                                    ? "bg-red-50 border-red-200 border-l-[6px] border-l-red-500"
                                    : "bg-blue-50 border-blue-200 border-l-[6px] border-l-blue-500"
                                }`}>
                                {balanceLoading ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                                ) : showBalanceWarning ? (
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    {balanceLoading ? (
                                        <span className="text-slate-600 font-medium">Fetching balance…</span>
                                    ) : mainOwnerBalance !== null ? (
                                        <div className="space-y-1.5">
                                            <div className={showBalanceWarning ? "text-red-800 font-medium" : "text-blue-900 font-medium"}>
                                                Current balance:{" "}
                                                <strong className={showBalanceWarning ? "text-red-700 text-base" : "text-blue-700 text-base"}>
                                                    ₱{mainOwnerBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                </strong>
                                            </div>
                                            {amountNum > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    Projected after withdrawal:{" "}
                                                    <strong className={showBalanceWarning ? "text-red-600" : "text-blue-700"}>
                                                        ₱{projectedBalance!.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                    </strong>
                                                </div>
                                            )}
                                            {showBalanceWarning && (
                                                <div className="text-xs pt-1 font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 mt-1 border-t border-red-200/50">
                                                    ⚠ Insufficient balance — withdrawal exceeds available funds.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 font-medium">Balance unavailable for this owner.</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Owner */}
                        <div id="field-to_owner_id">
                            <OwnerDropdown
                                label="Owner"
                                required
                                placeholder="Select owner…"
                                owners={owners}
                                loading={ownersLoading}
                                selectedOwner={selectedToOwner}
                                onSelect={(o) => {
                                    setSelectedToOwner(o);
                                    setFormData((p) => ({ ...p, to_owner_id: o?.id ?? null, unit_id: null }));
                                    setSelectedUnit(null);
                                    setSaveToUnitLedger(false);
                                    if (errors.to_owner_id) setErrors((p) => { const n = { ...p }; delete n.to_owner_id; return n; });
                                }}
                                filterFn={(o) => o.owner_type !== "SYSTEM" && o.owner_type !== "MAIN"}
                                icon={<User className="w-4 h-4" />}
                                error={errors.to_owner_id}
                                onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.to_owner_id; return n; })}
                                onCreateNew={(q) => { setCreateOwnerName(q); setShowOwnerPanel(true); }}
                            />
                        </div>
                    </SectionCard>

                    {/* 3. Unit Section (conditional) */}
                    {showUnitSection && (
                        <SectionCard title="Unit" icon={<Building2 className="w-4 h-4" />} className="mt-6">
                            <button
                                type="button"
                                onClick={() => setSaveToUnitLedger((v) => !v)}
                                className="flex items-center gap-2.5 w-full text-left group"
                            >
                                <div className={`flex-shrink-0 transition-colors ${saveToUnitLedger ? "text-[#7a0f1f]" : "text-gray-400 group-hover:text-gray-600"}`}>
                                    {saveToUnitLedger ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Save to Unit Ledger</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Link this transaction to a specific unit ledger entry.</p>
                                </div>
                            </button>

                            <div ref={unitDropdownRef} className="relative flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">Unit <span className="text-red-500">*</span></label>
                                <div
                                    className={`flex items-center h-10 rounded-lg border bg-white cursor-pointer transition-all ${errors.unit_id ? "border-red-400" : "border-gray-300 hover:border-gray-400"
                                        }`}
                                    onClick={() => setUnitDropdownOpen((v) => !v)}
                                >
                                    <div className="pl-3 text-gray-400"><Building2 className="w-4 h-4" /></div>
                                    <div className="flex-1 px-3 text-sm truncate">
                                        {selectedUnit
                                            ? <span className="font-semibold text-gray-900 uppercase">{selectedUnit.unit_name}</span>
                                            : <span className="text-gray-400">Select unit…</span>}
                                    </div>
                                    <div className="flex items-center gap-1 pr-3">
                                        {selectedUnit && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedUnit(null); setFormData((p) => ({ ...p, unit_id: null })); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${unitDropdownOpen ? "rotate-180" : ""}`} />
                                    </div>
                                </div>
                                {unitDropdownOpen && (
                                    <div className="absolute top-full mt-1 left-0 right-0 z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                                            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <input autoFocus type="text" value={unitQuery} onChange={(e) => setUnitQuery(e.target.value)} placeholder="Search units…" className="flex-1 text-sm outline-none bg-transparent" onClick={(e) => e.stopPropagation()} />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {unitsLoading ? (
                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading…</div>
                                            ) : units.filter((u) => u.unit_name.toLowerCase().includes(unitQuery.toLowerCase())).length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">No units found</div>
                                            ) : (
                                                units.filter((u) => u.unit_name.toLowerCase().includes(unitQuery.toLowerCase())).map((u) => (
                                                    <button key={u.id} type="button"
                                                        onClick={() => { setSelectedUnit(u); setFormData((p) => ({ ...p, unit_id: u.id })); setUnitDropdownOpen(false); setUnitQuery(""); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${selectedUnit?.id === u.id ? "bg-red-50" : ""}`}>
                                                        <span className="font-semibold text-gray-900 uppercase">{u.unit_name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        <div className="border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => { setUnitDropdownOpen(false); setCreateUnitName(unitQuery); setShowUnitPanel(true); }}
                                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#7a0f1f] hover:bg-red-50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create New Unit
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {errors.unit_id && <FormTooltipError message={errors.unit_id} onClose={() => setErrors((p) => { const n = { ...p }; delete n.unit_id; return n; })} />}
                            </div>
                        </SectionCard>
                    )}

                    {/* 4. Amount & Details */}
                    <SectionCard title="Amount & Details" icon={<DollarSign className="w-4 h-4" />} className="mt-6">
                        {/* Amount */}
                        <div id="field-amount" className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">Amount <span className="text-red-500">*</span></label>
                            <div className="relative flex items-center h-10 rounded-lg border bg-white focus-within:ring-2 transition-all overflow-hidden text-sm focus-within:border-[#7B0F2B] focus-within:ring-[#7B0F2B]/20 border-gray-300">
                                <div className="flex h-full items-center px-3 bg-gray-50 border-r border-gray-200 text-[#800020] font-bold select-none">₱</div>
                                <input
                                    type="text"
                                    value={formatCurrency(formData.amount)}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/,/g, "");
                                        if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                                            if (raw !== "" && Number(raw) > 999999999.99) return;
                                            setFormData((p) => ({ ...p, amount: raw }));
                                            if (errors.amount) setErrors((p) => { const n = { ...p }; delete n.amount; return n; });
                                        }
                                    }}
                                    placeholder="0.00"
                                    className="flex-1 h-full px-3 outline-none"
                                />
                            </div>
                            {errors.amount && <FormTooltipError message={errors.amount} onClose={() => setErrors((p) => { const n = { ...p }; delete n.amount; return n; })} />}
                        </div>

                        {/* Particulars */}
                        <div id="field-particulars">
                            <InputField
                                label="Particulars"
                                required
                                icon={<AlignLeft className="w-4 h-4" />}
                                error={errors.particulars}
                                onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.particulars; return n; })}
                                characterCount={`${formData.particulars.length}/500`}
                            >
                                <textarea
                                    value={formData.particulars}
                                    onChange={(e) => {
                                        setFormData((p) => ({ ...p, particulars: e.target.value }));
                                        if (errors.particulars && e.target.value.trim()) setErrors((p) => { const n = { ...p }; delete n.particulars; return n; });
                                    }}
                                    placeholder="Transaction description…"
                                    rows={3}
                                    maxLength={500}
                                    className={`w-full rounded-lg border text-sm text-gray-900 bg-white pl-10 pr-3 py-2 resize-none focus:outline-none transition-all ${errors.particulars
                                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                                        : "border-gray-300 focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20"
                                        }`}
                                />
                            </InputField>
                        </div>{/* /field-particulars */}

                        {/* Fund Reference */}
                        <InputField
                            label="Fund Reference"
                            icon={<Tag className="w-4 h-4" />}
                            error={errors.fund_reference}
                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.fund_reference; return n; })}
                            characterCount={`${formData.fund_reference.length}/50`}
                        >
                            <input
                                type="text"
                                maxLength={50}
                                value={formData.fund_reference}
                                onChange={(e) => {
                                    setFormData((p) => ({ ...p, fund_reference: e.target.value }));
                                    if (errors.fund_reference) setErrors((p) => { const n = { ...p }; delete n.fund_reference; return n; });
                                }}
                                placeholder="Optional"
                                className={inputCls(true, errors.fund_reference)}
                            />
                        </InputField>

                        {/* Person in Charge */}
                        <InputField
                            label="Person in Charge"
                            icon={<UserCheck className="w-4 h-4" />}
                            error={errors.person_in_charge}
                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.person_in_charge; return n; })}
                            characterCount={`${formData.person_in_charge.length}/100`}
                        >
                            <input
                                type="text"
                                maxLength={100}
                                value={formData.person_in_charge}
                                onChange={(e) => {
                                    setFormData((p) => ({ ...p, person_in_charge: e.target.value }));
                                    if (errors.person_in_charge) setErrors((p) => { const n = { ...p }; delete n.person_in_charge; return n; });
                                }}
                                placeholder="Optional"
                                className={inputCls(true, errors.person_in_charge)}
                            />
                        </InputField>
                    </SectionCard>

                </div>{/* end LEFT */}

                {/* ── RIGHT: Attachments + Summary ── */}
                <div className="flex flex-col gap-4 w-full pb-8 sticky top-6 self-start">

                    {/* Uploaded Attachments Section - Inspiration layout */}
                    {shouldShowAttachments && (uploadedFiles.length > 0 || voucherFile) && (
                        <div className="rounded-md border p-6 bg-white" style={{ borderColor: BORDER }}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                                    Uploaded Attachments
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {(uploadedFiles.length + (voucherFile ? 1 : 0))} file{(uploadedFiles.length + (voucherFile ? 1 : 0)) !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Voucher File */}
                                {voucherFile && (
                                    <>
                                        <div className="mb-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Voucher
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                                    {voucherFile.preview && voucherFile.preview.trim() !== "" ? (
                                                        <img src={voucherFile.preview} alt="Voucher Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileText className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-neutral-900 truncate">{voucherFile.name.replace(/\.[^/.]+$/, "")}</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewFile({ name: voucherFile.name, src: voucherFile.preview ?? (voucherFile.file ? URL.createObjectURL(voucherFile.file) : ""), type: voucherFile.file.type, size: voucherFile.size })}
                                                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setVoucherFile(null)}
                                                        className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Separator */}
                                {voucherFile && uploadedFiles.length > 0 && (
                                    <div className="my-4 border-t" style={{ borderColor: BORDER }}></div>
                                )}

                                {/* Payment Attachments */}
                                {uploadedFiles.length > 0 && (
                                    <>
                                        {voucherFile && (
                                            <div className="mb-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Payment Attachments
                                                </p>
                                            </div>
                                        )}
                                        {uploadedFiles.map((f) => (
                                            <div
                                                key={f.id}
                                                className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                                                style={{ borderColor: BORDER }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                                        {f.preview && f.preview.trim() !== "" ? (
                                                            <img src={f.preview} alt={`Preview ${f.name}`} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {requiresFileUpload && (
                                                            <p className="text-[11px] font-semibold text-[#7a0f1f] uppercase tracking-wide mb-0.5">#{fileNameToInstrumentNo(f.name)}</p>
                                                        )}
                                                        <div className="font-semibold text-neutral-900 truncate">{f.name.replace(/\.[^/.]+$/, "")}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewFile({ name: f.name, src: f.preview ?? URL.createObjectURL(f.file), type: f.file.type, size: f.size })}
                                                            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                                            title="Preview"
                                                        >
                                                            <Eye className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(f.id)}
                                                            className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transaction Summary - Original header, inspiration content layout */}
                    <div className="rounded-lg border shadow-lg bg-white w-full flex flex-col lg:max-h-[calc(100vh-6rem)]" style={{ borderColor: BORDER }}>
                        <div className="flex-1 overflow-y-auto rounded-t-lg" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f1f1" }}>
                            {/* Header - Original layout (amount, badges) */}
                            <div className="px-6 py-6 text-white" style={{ background: "linear-gradient(135deg, #7a0f1f, #a4163a)" }}>
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Transaction Summary</p>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        disabled={isPrinting}
                                        title="Download Receipt PDF"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {isPrinting ? (
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-transparent animate-spin inline-block" />
                                        ) : (
                                            <Printer className="w-3.5 h-3.5" />
                                        )}
                                        {isPrinting ? "Generating…" : "Print"}
                                    </button>
                                </div>
                                <p className="text-3xl font-bold mb-3">
                                    ₱{amountNum > 0 ? amountNum.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "0.00"}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${mode === "DEPOSIT" ? "bg-green-500/20 text-green-200" : "bg-red-500/30 text-red-200"}`}>
                                        {mode === "DEPOSIT" ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                                        {mode}
                                    </span>
                                    <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-white/20 text-white/90">
                                        {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                                    </span>
                                </div>
                            </div>

                            {/* Content - Inspiration layout (bordered sections) */}
                            <div className="bg-white p-6">
                                <div className="space-y-4">
                                    {/* Deposit/Withdrawal Type */}
                                    <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-700 shrink-0">Type</span>
                                            <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Voucher Information */}
                                    {voucherMode === "WITH_VOUCHER" && (formData.voucher_date || voucherFile) && (
                                        <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                                            {voucherFile && (
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs text-gray-600 shrink-0">Voucher No.</span>
                                                    <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                        {fileNameToInstrumentNo(voucherFile.name)}
                                                    </span>
                                                </div>
                                            )}
                                            {formData.voucher_date && (
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs text-gray-600 shrink-0">Date</span>
                                                    <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                        {formatDate(formData.voucher_date)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Transaction Type */}
                                    <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-700 shrink-0">Transaction Type</span>
                                            <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                {getTransactionTypeLabel(formData.transaction_type) || "—"}
                                            </span>
                                        </div>
                                        {(formData.transaction_type === "CHEQUE" || formData.transaction_type === "CHEQUE DEPOSIT") && uploadedFiles.length > 0 && (
                                            <div className="mt-2">
                                                <div className="text-xs text-gray-600 mb-1">
                                                    {formData.transaction_type === "CHEQUE" ? "Cheque Numbers" : "Deposit Slip Numbers"}
                                                </div>
                                                <div className="space-y-1">
                                                    {uploadedFiles.map((f) => (
                                                        <div key={f.id} className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0">
                                                            {fileNameToInstrumentNo(f.name)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Owners */}
                                    <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-700 shrink-0">Main</span>
                                            <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                {selectedMainOwner?.name ?? "—"}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-700 shrink-0">Owner</span>
                                            <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                {selectedToOwner?.name ?? "—"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Unit */}
                                    {saveToUnitLedger && selectedUnit && (
                                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-semibold text-gray-700 shrink-0">Unit</span>
                                                <div className="flex flex-col items-end gap-1.5 min-w-0 max-w-[65%]">
                                                    <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal">
                                                        {selectedUnit.unit_name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#7a0f1f] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                        Saves to Unit Ledger
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Particulars */}
                                    {formData.particulars && (
                                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-gray-700 block">Particulars</span>
                                                <p className="text-sm text-gray-900 text-right break-words whitespace-pre-wrap leading-relaxed min-w-0">
                                                    {formData.particulars}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fund Reference */}
                                    {formData.fund_reference && (
                                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-semibold text-gray-700 shrink-0">Fund Reference</span>
                                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                    {formData.fund_reference}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Person in Charge */}
                                    {formData.person_in_charge && (
                                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-semibold text-gray-700 shrink-0">Person in Charge</span>
                                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                    {formData.person_in_charge}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {(uploadedFiles.length > 0 || voucherFile) && (
                                        <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-semibold text-gray-700 shrink-0">Attachments</span>
                                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                                    {(uploadedFiles.length + (voucherFile ? 1 : 0))} file{(uploadedFiles.length + (voucherFile ? 1 : 0)) !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Amount */}
                                    <div className="pb-3">
                                        <div className="bg-gray-100 rounded-md p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-bold text-gray-900 uppercase tracking-wide shrink-0">
                                                    Total Amount
                                                </span>
                                                <span className="text-2xl font-bold text-right break-words whitespace-normal min-w-0 max-w-[65%]" style={{ color: "#4A081A" }}>
                                                    {formatAmountDisplay(formData.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance warning */}
                            {showBalanceWarning && (
                                <div className="mx-6 mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-300 border-l-4 border-l-red-500 flex items-start gap-3 shadow-sm">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-800 font-semibold leading-relaxed">
                                        This withdrawal will exceed the current available balance.
                                        <span className="block text-xs font-normal text-red-700 mt-0.5">Please verify the amount before submitting.</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions (Docked at the bottom) */}
                        <div className="px-5 py-4 bg-white border-t rounded-b-lg flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0" style={{ borderColor: BORDER }}>
                            <button type="button" onClick={() => setShowResetConfirm(true)} className="h-11 px-4 rounded-lg text-sm font-medium text-gray-600 border hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0" style={{ borderColor: BORDER }}>
                                Reset Form
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 h-11 rounded-lg font-semibold text-sm text-white shadow transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: ACCENT }}
                            >
                                <SendHorizonal className="w-4 h-4" />
                                {mode === "DEPOSIT" ? "Submit Deposit" : "Submit Withdrawal"}
                            </button>
                        </div>
                    </div>

                </div>{/* end RIGHT */}

            </div>

            {/* ── Create Panels ── */}
            <OwnerCreateEditPanel
                open={showOwnerPanel}
                owner={null}
                defaultName={createOwnerName}
                onClose={() => setShowOwnerPanel(false)}
                onSaved={() => { setShowOwnerPanel(false); fetchOwners(); }}
            />
            <UnitCreateEditPanel
                open={showUnitPanel}
                unit={null}
                defaultOwnerId={selectedToOwner?.id ?? null}
                defaultName={createUnitName}
                onClose={() => { setShowUnitPanel(false); setCreateUnitName(""); }}
                onSaved={(savedUnit) => {
                    setShowUnitPanel(false);
                    setCreateUnitName("");
                    fetchUnits();
                    if (savedUnit) {
                        setSelectedUnit(savedUnit);
                        setFormData((p) => ({ ...p, unit_id: savedUnit.id }));
                        setUnitQuery("");
                    }
                }}
            />

            {/* ── Reset Confirmation Modal ── */}
            <ConfirmationModal
                open={showResetConfirm}
                icon={RefreshCw}
                color="#6b7280"
                title="Reset Form"
                message={
                    <>
                        Are you sure you want to <strong>reset the form</strong>?
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">All entered data and uploaded files will be cleared.</span>
                    </>
                }
                confirmLabel="Yes, Reset"
                cancelLabel="Go Back"
                onCancel={() => setShowResetConfirm(false)}
                onConfirm={() => { setShowResetConfirm(false); handleReset(); }}
                zIndex={110}
            />

            {/* ── Confirmation Modal ── */}
            <ConfirmationModal
                open={showConfirm}
                icon={SendHorizonal}
                color={ACCENT}
                title={mode === "DEPOSIT" ? "Confirm Deposit" : "Confirm Withdrawal"}
                message={
                    <>
                        Are you sure you want to submit this{" "}
                        <strong>{mode === "DEPOSIT" ? "deposit" : "withdrawal"}</strong> of{" "}
                        <strong>
                            ₱{parseFloat(formData.amount.replace(/,/g, "") || "0").toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>?
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">This action cannot be undone.</span>
                    </>
                }
                confirmLabel={mode === "DEPOSIT" ? "Submit Deposit" : "Submit Withdrawal"}
                cancelLabel="Go Back"
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleConfirmSubmit}
                isConfirming={isSubmitting}
                zIndex={110}
            />

            {/* ── Loading Modal ── */}
            <LoadingModal
                isOpen={isSubmitting}
                title={mode === "DEPOSIT" ? "Submitting Deposit" : "Submitting Withdrawal"}
                message="Please wait while your transaction is being processed…"
                zIndex={120}
            />
            {/* ── Transaction Success Panel ── */}
            <TransactionSuccessPanel
                open={showSuccessPanel}
                transactionData={successPanelData}
                transactionType={successPanelMode}
                onClose={() => setShowSuccessPanel(false)}
            />
        </>
    );
}
