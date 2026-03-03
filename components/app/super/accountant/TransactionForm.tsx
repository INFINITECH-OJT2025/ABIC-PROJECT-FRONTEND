"use client";
// ─── ViewImagePanel import ───────────────────────────────────────────────────
import ViewImagePanelComponent, { ViewImagePanelFile } from "@/components/app/ViewImagePanel";

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
} from "lucide-react";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import OwnerCreateEditPanel from "@/components/app/super/accountant/OwnerCreateEditPanel";
import UnitCreateEditPanel from "@/components/app/super/accountant/UnitCreateEditPanel";

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
        <div ref={ref} className="relative flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 mt-1.5">
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
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 mt-1.5">{label}</label>
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
            <div className="px-6 py-5 space-y-7">{children}</div>
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
    children,
}: {
    label: string;
    required?: boolean;
    icon?: React.ReactNode;
    error?: string;
    onCloseError?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 mt-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
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
    // ── Top-level mode ────────────────────────────────────────────────────────
    const [mode, setMode] = useState<TransactionMode>(initialMode);
    const [voucherMode, setVoucherMode] = useState<VoucherMode>("WITH_VOUCHER");

    // ── Form data ─────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState<TransactionFormData>({
        transaction_type: "CASH DEPOSIT",
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
                const balance = data.data?.running_balance ?? data.running_balance ?? null;
                setMainOwnerBalance(typeof balance === "number" ? balance : null);
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

    function addFiles(files: File[]) {
        const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
        setUploadedFiles((prev) => {
            const existingNames = new Set(prev.map((f) => f.name));
            const newFiles = valid
                .filter((f) => !existingNames.has(f.name))
                .map(makeUploadedFile);
            return [...prev, ...newFiles];
        });
    }

    function removeFile(id: string) {
        setUploadedFiles((prev) => {
            const f = prev.find((x) => x.id === id);
            if (f?.preview) URL.revokeObjectURL(f.preview);
            return prev.filter((x) => x.id !== id);
        });
    }

    function addVoucherFile(files: File[]) {
        const f = files[0];
        if (!f || f.size > 10 * 1024 * 1024) return;
        if (voucherFile?.preview) URL.revokeObjectURL(voucherFile.preview);
        setVoucherFile(makeUploadedFile(f));
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
            <div className="transaction-grid grid grid-cols-1 gap-6 items-start">

                {/* ── LEFT: Main form ── */}
                <div className="min-w-0">

                    {/* ROW 1: Mode toggles + Voucher Details side-by-side */}
                    <div className="grid grid-cols-[400px_1fr] gap-6">
                        {/* Mode toggles */}
                        <SectionCard title="Transaction Mode" icon={<ArrowDownCircle className="w-4 h-4" />}>
                            <div className="flex flex-col gap-6">
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

                        {/* Voucher Details (conditional) */}
                        {voucherMode === "WITH_VOUCHER" ? (
                            <SectionCard title="Voucher Details" icon={<FileText className="w-4 h-4" />}>
                                <InputField
                                    label="Voucher Date"
                                    required
                                    icon={<Calendar className="w-4 h-4" />}
                                    error={errors.voucher_date}
                                    onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.voucher_date; return n; })}
                                >
                                    <input
                                        type="date"
                                        value={formData.voucher_date}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => {
                                            setFormData((p) => ({ ...p, voucher_date: e.target.value }));
                                            if (errors.voucher_date && e.target.value)
                                                setErrors((p) => { const n = { ...p }; delete n.voucher_date; return n; });
                                        }}
                                        className={`${inputCls(true, errors.voucher_date)} cursor-pointer`}
                                    />
                                </InputField>
                                <FileDropZone
                                    label="Voucher Upload *"
                                    files={voucherFile ? [voucherFile] : []}
                                    onAdd={addVoucherFile}
                                    onRemove={() => setVoucherFile(null)}
                                    multiple={false}
                                    error={errors.voucherFile}
                                    onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.voucherFile; return n; })}
                                />
                            </SectionCard>
                        ) : (
                            /* placeholder so grid stays balanced */
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 flex items-center justify-center">
                                <p className="text-sm text-gray-400 font-medium">No Voucher Mode</p>
                            </div>
                        )}
                    </div>

                    {/* 2. Payment Details */}
                    <SectionCard title="Payment Details" icon={<DollarSign className="w-4 h-4" />} className="mt-6">
                        {/* Transaction Type */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700 mt-1.5">
                                Transaction Type <span className="text-red-500">*</span>
                            </label>
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
                            {errors.transaction_type && <FormTooltipError message={errors.transaction_type} onClose={() => setErrors((p) => { const n = { ...p }; delete n.transaction_type; return n; })} />}
                        </div>

                        {/* Cheque upload — only for CHEQUE */}
                        {requiresFileUpload && (
                            <FileDropZone
                                label="Cheque Files * (instrument # derived from file name)"
                                files={uploadedFiles}
                                onAdd={addFiles}
                                onRemove={removeFile}
                                error={errors.uploadedFiles}
                                onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.uploadedFiles; return n; })}
                            />
                        )}

                        {/* Main Owner */}
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

                        {/* Balance info / warning */}
                        {mode === "WITHDRAWAL" && selectedMainOwner && (
                            <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${showBalanceWarning ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                                }`}>
                                {showBalanceWarning
                                    ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    : <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                                <div>
                                    {balanceLoading ? (
                                        <span className="text-gray-500">Fetching balance…</span>
                                    ) : mainOwnerBalance !== null ? (
                                        <>
                                            <span className={showBalanceWarning ? "text-red-700 font-semibold" : "text-blue-700"}>
                                                Current balance: <strong>₱{mainOwnerBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                                            </span>
                                            {amountNum > 0 && (
                                                <span className="block text-xs mt-0.5 text-gray-500">
                                                    Projected after withdrawal: <strong className={showBalanceWarning ? "text-red-600" : "text-gray-700"}>₱{projectedBalance!.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong>
                                                </span>
                                            )}
                                            {showBalanceWarning && (
                                                <span className="block text-xs mt-1 font-semibold text-red-600">⚠ Insufficient balance.</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-blue-700">Balance unavailable for this owner.</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Owner */}
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
                                <label className="text-sm font-semibold text-gray-700 mt-1.5">Unit <span className="text-red-500">*</span></label>
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
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700 mt-1.5">Amount <span className="text-red-500">*</span></label>
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
                        <InputField
                            label="Particulars"
                            required
                            icon={<AlignLeft className="w-4 h-4" />}
                            error={errors.particulars}
                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.particulars; return n; })}
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
                            <span className="block text-right text-xs text-gray-400 mt-1">{formData.particulars.length}/500</span>
                        </InputField>

                        {/* Fund Reference */}
                        <InputField
                            label="Fund Reference"
                            icon={<Tag className="w-4 h-4" />}
                            error={errors.fund_reference}
                            onCloseError={() => setErrors((p) => { const n = { ...p }; delete n.fund_reference; return n; })}
                        >
                            <input
                                type="text"
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
                        >
                            <input
                                type="text"
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
                <div className="flex flex-col gap-6 w-full h-full pb-8">

                    {/* Attachments panel */}
                    {shouldShowAttachments && (
                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden w-full" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                            <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50/60" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                <Paperclip className="w-4 h-4 text-[#7a0f1f]" />
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Uploaded Attachments</h3>
                                <span className="ml-auto text-xs font-bold text-gray-400">
                                    {(voucherFile && voucherMode === "WITH_VOUCHER" ? 1 : 0) + uploadedFiles.length} file(s)
                                </span>
                            </div>
                            <div className="px-6 py-5 space-y-3">
                                {voucherFile && voucherMode === "WITH_VOUCHER" && (
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50">
                                        <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Voucher</p>
                                            <p className="text-sm font-medium text-gray-800 truncate">{voucherFile.name}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({ name: voucherFile.name, src: voucherFile.preview ?? voucherFile.file ? URL.createObjectURL(voucherFile.file) : "", type: voucherFile.file.type, size: voucherFile.size })}
                                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                            title="Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {uploadedFiles.map((f) => (
                                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                                        {f.preview
                                            ? <img src={f.preview} alt={f.name} className="w-9 h-9 rounded object-cover border border-gray-200 flex-shrink-0" />
                                            : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            {requiresFileUpload && (
                                                <p className="text-[11px] font-semibold text-[#7a0f1f] uppercase tracking-wide mb-0.5">#{fileNameToInstrumentNo(f.name)}</p>
                                            )}
                                            <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 mr-1">{formatFileSize(f.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({ name: f.name, src: f.preview ?? URL.createObjectURL(f.file), type: f.file.type, size: f.size })}
                                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                            title="Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary panel */}
                    <div className="rounded-xl border bg-white shadow-sm overflow-hidden w-full" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                        {/* Header */}
                        <div className="px-6 py-6 text-white" style={{ background: "linear-gradient(135deg, #7a0f1f, #a4163a)" }}>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Transaction Summary</p>
                            <p className="text-3xl font-bold mb-3">
                                ₱{amountNum > 0 ? amountNum.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "0.00"}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${mode === "DEPOSIT" ? "bg-green-500/20 text-green-200" : "bg-red-500/30 text-red-200"
                                    }`}>
                                    {mode === "DEPOSIT" ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                                    {mode}
                                </span>
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-white/20 text-white/90">
                                    {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                                </span>
                            </div>
                        </div>

                        {/* Details rows */}
                        <div className="px-6 py-5 space-y-3 text-sm">
                            {[
                                {
                                    label: "Transaction Type",
                                    value: mode === "WITHDRAWAL" && formData.transaction_type === "CHEQUE" ? (
                                        <div className="flex flex-col items-end gap-1 w-full">
                                            <span>{formData.transaction_type || "—"}</span>
                                            {uploadedFiles.length > 0 && (
                                                <div className="flex flex-col items-end mt-0.5">
                                                    {uploadedFiles.map(f => (
                                                        <span key={f.id} className="text-[11px] text-gray-500 normal-case truncate max-w-[200px]" title={f.name}>
                                                            {f.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (formData.transaction_type || "—")
                                },
                                ...(voucherMode === "WITH_VOUCHER" ? [{ label: "Voucher Date", value: formData.voucher_date || "—" }] : []),
                                ...(mode === "DEPOSIT" && voucherMode !== "NO_VOUCHER" ? [{ label: "Transaction Number", value: requiresFileUpload && uploadedFiles.length > 0 ? uploadedFiles.map((f) => fileNameToInstrumentNo(f.name)).join(", ") : "—" }] : []),
                                { label: "Main Owner", value: selectedMainOwner?.name ?? "—" },
                                { label: "Owner", value: selectedToOwner?.name ?? "—" },
                                { label: "Unit", value: saveToUnitLedger && selectedUnit ? selectedUnit.unit_name : "—" },
                                { label: "Particulars", value: formData.particulars || "—" },
                                { label: "Fund Ref.", value: formData.fund_reference || "—" },
                                { label: "PIC", value: formData.person_in_charge || "—" },
                                { label: "Attachments", value: `${(voucherFile && voucherMode === "WITH_VOUCHER" ? 1 : 0) + uploadedFiles.length} file(s)` },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-start justify-between gap-4">
                                    <span className="text-gray-400 font-medium flex-shrink-0 w-32">{label}</span>
                                    {typeof value === "string" ? (
                                        <span className="text-gray-800 font-semibold text-right uppercase truncate flex-1 min-w-0" title={value}>{value}</span>
                                    ) : (
                                        <div className="text-gray-800 font-semibold text-right uppercase flex-1 min-w-0">{value}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Balance warning */}
                        {showBalanceWarning && (
                            <div className="mx-6 mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 font-medium">Balance will go negative after this withdrawal.</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 pt-2 space-y-3">
                            <button type="button" className="w-full h-11 rounded-lg font-semibold text-sm text-white shadow transition-opacity hover:opacity-90 active:scale-95" style={{ background: ACCENT }}>
                                {mode === "DEPOSIT" ? "Submit Deposit" : "Submit Withdrawal"}
                            </button>
                            <button type="button" className="w-full h-10 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                                Reset Form
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
                onClose={() => setShowUnitPanel(false)}
                onSaved={() => { setShowUnitPanel(false); fetchUnits(); }}
            />
        </>
    );
}
