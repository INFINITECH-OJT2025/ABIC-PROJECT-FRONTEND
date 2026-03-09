"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    X,
    User,
    Calendar,
    AlignLeft,
    Tag,
    AlertCircle,
    Info,
    Save,
    Search,
    ChevronDown,
    Upload,
    FileText,
    DollarSign,
    UserCheck,
    Eye,
    Trash2,
    ArrowDownCircle,
    ArrowUpCircle,
} from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import ViewImagePanel, { type ViewImagePanelFile } from "@/components/app/ViewImagePanel";

const ACCENT = "#7a0f1f";
const BORDER = "rgba(0,0,0,0.12)";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OwnerType = "COMPANY" | "CLIENT" | "MAIN" | "SYSTEM";
export type TransactionMode = "DEPOSIT" | "WITHDRAWAL";
export type VoucherMode = "WITH_VOUCHER" | "NO_VOUCHER";
export type TransactionType = "CASH DEPOSIT" | "BANK TRANSFER" | "CHEQUE DEPOSIT" | "CHEQUE";

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
    file?: File;
    preview?: string;
    name: string;
    size: number;
    existingUrl?: string;
}

interface EditTransactionPanelProps {
    open: boolean;
    transaction: any | null;
    onClose: () => void;
    onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function OwnerDropdown({
    label, required, placeholder, owners, loading, selectedOwnerId, onSelect, error,
}: {
    label: string; required?: boolean; placeholder: string; owners: Owner[];
    loading: boolean; selectedOwnerId: number | null; onSelect: (owner: Owner | null) => void; error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const selectedOwner = owners.find(o => o.id === selectedOwnerId) || null;
    const filtered = owners.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div
                className={`flex items-center h-10 rounded-lg border bg-white cursor-pointer transition-all ${error ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-300 hover:border-gray-400"} ${open ? "border-[#7a0f1f] ring-2 ring-[#7a0f1f]/20" : ""}`}
                onClick={() => setOpen((v) => !v)}
            >
                <div className="pl-3 text-gray-400 flex-shrink-0"><User className="w-4 h-4" /></div>
                <div className="flex-1 px-3 text-sm truncate">
                    {selectedOwner ? (
                        <span className="font-semibold text-gray-900 uppercase">{selectedOwner.name}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 pr-3">
                    {selectedOwner && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(null); setQuery(""); }} className="text-gray-400 hover:text-red-500 transition-colors">
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
                        <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="flex-1 text-sm outline-none bg-transparent" onClick={(e) => e.stopPropagation()} />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners found</div>
                        ) : (
                            filtered.map((o) => (
                                <button key={o.id} type="button" onClick={() => { onSelect(o); setOpen(false); setQuery(""); }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedOwner?.id === o.id ? "bg-red-50" : ""}`}>
                                    <span className="font-semibold text-gray-900 uppercase truncate">{o.name}</span>
                                    <OwnerTypeBadge type={o.owner_type} />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
            {error && <FormTooltipError message={error} />}
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children, icon, className = "" }: { title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border bg-white shadow-sm relative ${className}`} style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-gray-50/60 rounded-t-xl" style={{ borderColor: BORDER }}>
                {icon && <span className="text-[#7a0f1f]">{icon}</span>}
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
            </div>
            <div className="px-5 py-4 space-y-4">{children}</div>
        </div>
    );
}

// ─── File Drop Zone (with Preview button) ─────────────────────────────────────

function FileDropZone({ label, files, onAdd, onRemove, onPreview, accept, multiple = true, error }: {
    label: string; files: UploadedFile[]; onAdd: (files: File[]) => void; onRemove: (id: string) => void;
    onPreview?: (file: UploadedFile) => void; accept?: string; multiple?: boolean; error?: string;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            <div
                className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragging
                    ? "border-[#7a0f1f] bg-[#7a0f1f]/5"
                    : error ? "border-red-400 bg-red-50/50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault(); setDragging(false);
                    const dropped = Array.from(e.dataTransfer.files);
                    if (dropped.length) onAdd(dropped);
                }}
                onClick={() => inputRef.current?.click()}
            >
                <Upload className="w-5 h-5 mx-auto mb-1.5 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-0.5">JPEG, JPG, PNG, PDF — max 10 MB</p>
                <input ref={inputRef} type="file" className="hidden" accept={accept ?? ".jpg,.jpeg,.png,.pdf"} multiple={multiple}
                    onChange={(e) => { if (e.target.files?.length) { onAdd(Array.from(e.target.files)); e.target.value = ""; } }}
                />
            </div>
            {error && <FormTooltipError message={error} />}

            {files.length > 0 && (
                <div className="mt-2 space-y-1.5">
                    {files.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                            {f.preview || f.existingUrl ? (
                                <img src={f.preview || f.existingUrl} alt={f.name} className="w-9 h-9 rounded object-cover flex-shrink-0 border border-gray-200" />
                            ) : (
                                <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                            </div>
                            {onPreview && (f.preview || f.existingUrl) && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); onPreview(f); }} className="text-gray-400 hover:text-blue-500 transition-colors" title="Preview">
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(f.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Remove">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Edit Panel ──────────────────────────────────────────────────────────

export default function EditTransactionPanel({ open, transaction, onClose, onSaved }: EditTransactionPanelProps) {
    const { showToast } = useAppToast();
    const [isClosing, setIsClosing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(false);

    // ─── Image Preview State ────────────────────────────────────────────
    const [previewFile, setPreviewFile] = useState<ViewImagePanelFile | null>(null);

    // Derive transaction mode from stored transaction
    const transMode: TransactionMode = transaction?.trans_method === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";
    const isDeposit = transMode === "DEPOSIT";
    const isWithdrawal = transMode === "WITHDRAWAL";

    // Voucher mode
    const [voucherMode, setVoucherMode] = useState<VoucherMode>("WITH_VOUCHER");

    // Form States
    const [transType, setTransType] = useState<TransactionType>("CASH DEPOSIT");
    const [voucherNo, setVoucherNo] = useState("");
    const [voucherDate, setVoucherDate] = useState("");
    const [fromOwnerId, setFromOwnerId] = useState<number | null>(null);
    const [toOwnerId, setToOwnerId] = useState<number | null>(null);
    const [unitId, setUnitId] = useState<number | null>(null);
    const [amount, setAmount] = useState("");
    const [fundReference, setFundReference] = useState("");
    const [particulars, setParticulars] = useState("");
    const [personInCharge, setPersonInCharge] = useState("");

    // File states
    const [voucherFile, setVoucherFile] = useState<UploadedFile | null>(null);
    const [chequeFiles, setChequeFiles] = useState<UploadedFile[]>([]);

    // Instrument States
    const [instrumentNo, setInstrumentNo] = useState("");
    const [instrumentNotes, setInstrumentNotes] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    // ─── Derived ──────────────────────────────────────────────────────────

    const DEPOSIT_TYPES: TransactionType[] = ["CASH DEPOSIT", "BANK TRANSFER", "CHEQUE DEPOSIT"];

    const selectedToOwner = owners.find(o => o.id === toOwnerId);
    const showUnitSection = !!selectedToOwner && (selectedToOwner.owner_type === "CLIENT" || selectedToOwner.owner_type === "COMPANY");

    // ─── Fetch Owners ──────────────────────────────────────────────────

    const fetchOwners = useCallback(async () => {
        setOwnersLoading(true);
        try {
            const res = await fetch("/api/accountant/maintenance/owners?per_page=all&status=ACTIVE");
            const data = await res.json();
            if (data.success) {
                const list = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : [];
                setOwners(list);
            }
        } catch { console.error("Failed to fetch owners"); }
        finally { setOwnersLoading(false); }
    }, []);

    useEffect(() => { fetchOwners(); }, [fetchOwners]);

    // ─── Fetch Units ──────────────────────────────────────────────────

    const fetchUnits = useCallback(() => {
        if (!selectedToOwner || !showUnitSection) { setUnits([]); return; }
        setUnitsLoading(true);
        fetch(`/api/accountant/maintenance/units?owner_id=${selectedToOwner.id}&per_page=all&status=ACTIVE`)
            .then((r) => r.json())
            .then((data) => { if (data.success) { const list = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : []; setUnits(list); } })
            .catch(() => setUnits([]))
            .finally(() => setUnitsLoading(false));
    }, [selectedToOwner, showUnitSection]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    // ─── Populate from Transaction ──────────────────────────────────────

    useEffect(() => {
        if (open && transaction) {
            setIsClosing(false);
            setTransType(transaction.trans_type || (isDeposit ? "CASH DEPOSIT" : "CHEQUE"));
            setVoucherNo(transaction.voucher_no || "");
            setVoucherDate(transaction.voucher_date ? transaction.voucher_date.substring(0, 10) : "");
            setFromOwnerId(transaction.from_owner_id || null);
            setToOwnerId(transaction.to_owner_id || null);
            setUnitId(transaction.unit_id || null);
            setAmount(transaction.amount ? String(transaction.amount) : "");
            setFundReference(transaction.fund_reference || "");
            setParticulars(transaction.particulars || "");
            setPersonInCharge(transaction.person_in_charge || "");

            // Determine voucher mode from existing data
            setVoucherMode(transaction.voucher_no ? "WITH_VOUCHER" : "NO_VOUCHER");

            // Load existing attachments as UploadedFile objects
            // Use file_path (not file_name) to identify voucher vs cheque:
            //   file_path contains "voucher_" for voucher uploads, others are cheque/instrument files
            const voucherAtts: UploadedFile[] = [];
            const chequeAtts: UploadedFile[] = [];

            if (transaction.attachments && Array.isArray(transaction.attachments)) {
                transaction.attachments.forEach((att: any, idx: number) => {
                    const isImage = att.file_type?.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(att.file_name || "");
                    const attachmentUrl = `/api/accountant/transactions/${transaction.id}/attachments/${att.id}`;
                    const uploadedFile: UploadedFile = {
                        id: `existing-${att.id || idx}`,
                        name: att.file_name || `Attachment ${idx + 1}`,
                        size: att.file_size || 0,
                        existingUrl: att.file_path ? attachmentUrl : undefined,
                        preview: isImage && att.file_path ? attachmentUrl : undefined,
                    };

                    // Check file_path for voucher prefix (e.g., "transactions/1/voucher_uuid.png")
                    const isVoucherFile = (att.file_path || "").toLowerCase().includes("voucher");
                    if (isVoucherFile) {
                        voucherAtts.push(uploadedFile);
                    } else {
                        chequeAtts.push(uploadedFile);
                    }
                });
            }

            setVoucherFile(voucherAtts[0] || null);
            setChequeFiles(chequeAtts);

            // Instruments
            if (transaction.instruments && transaction.instruments.length > 0) {
                setInstrumentNo(transaction.instruments[0].instrument_no || "");
                setInstrumentNotes(transaction.instruments[0].notes || "");
            } else {
                setInstrumentNo("");
                setInstrumentNotes("");
            }

            setErrors({});
        }
    }, [open, transaction, isDeposit]);

    // ─── Preview Handler ────────────────────────────────────────────────

    function handlePreviewFile(f: UploadedFile) {
        const src = f.preview || f.existingUrl || "";
        if (!src) return;
        setPreviewFile({
            name: f.name,
            src,
            type: f.file?.type || (f.name.match(/\.(jpe?g|png|gif|webp)$/i) ? "image/jpeg" : "application/pdf"),
            size: f.size || undefined,
        });
    }

    // ─── Close Handler ──────────────────────────────────────────────────

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setErrors({});
            setPreviewFile(null);
        }, 350);
    };

    // ─── File Helpers ───────────────────────────────────────────────────

    function makeUploadedFile(file: File): UploadedFile {
        const id = `${Date.now()}-${Math.random()}`;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        return { id, file, preview, name: file.name, size: file.size };
    }

    function addVoucherFile(files: File[]) {
        const f = files[0];
        if (!f || f.size > 10 * 1024 * 1024) return;
        if (voucherFile?.preview && !voucherFile.existingUrl) URL.revokeObjectURL(voucherFile.preview);
        setVoucherFile(makeUploadedFile(f));
        setErrors((p) => { const n = { ...p }; delete n.voucherFile; return n; });
    }

    function removeVoucherFile() {
        if (voucherFile?.preview && !voucherFile.existingUrl) URL.revokeObjectURL(voucherFile.preview);
        setVoucherFile(null);
    }

    function addChequeFiles(files: File[]) {
        const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
        if (valid.length === 0) return;
        setChequeFiles((prev) => [...prev, ...valid.map(makeUploadedFile)]);
        setErrors((p) => { const n = { ...p }; delete n.chequeFiles; return n; });
    }

    function removeChequeFile(id: string) {
        setChequeFiles((prev) => {
            const f = prev.find((x) => x.id === id);
            if (f?.preview && !f.existingUrl) URL.revokeObjectURL(f.preview);
            return prev.filter((x) => x.id !== id);
        });
    }

    // ─── Validation ─────────────────────────────────────────────────────

    function validate() {
        const errs: Record<string, string> = {};
        if (!fromOwnerId) errs.fromOwnerId = "From Owner (Sender) is required.";
        if (!toOwnerId) errs.toOwnerId = "To Owner (Recipient) is required.";
        if (fromOwnerId && toOwnerId && fromOwnerId === toOwnerId) errs.toOwnerId = "From and To owners cannot be the same.";
        if (!amount || isNaN(Number(amount.replace(/,/g, ""))) || Number(amount.replace(/,/g, "")) <= 0) {
            errs.amount = "Valid amount is required.";
        }
        if (!particulars.trim()) errs.particulars = "Particulars are required.";

        // ── DEPOSIT validation ──
        if (isDeposit) {
            if (voucherMode === "WITH_VOUCHER") {
                if (!voucherDate) errs.voucherDate = "Voucher date is required.";
                if (!voucherFile) errs.voucherFile = "Voucher image is required when 'With Voucher' is selected.";
            }
            // No Voucher → no voucher image required (will be removed on save)
        }

        // ── WITHDRAWAL validation ──
        if (isWithdrawal) {
            // Cheque image is always required for withdrawal (both with/without voucher)
            if (chequeFiles.length === 0) {
                errs.chequeFiles = "At least one cheque image is required for withdrawals.";
            }
            if (voucherMode === "WITH_VOUCHER") {
                if (!voucherFile) errs.voucherFile = "Voucher image is required when 'With Voucher' is selected.";
                if (!voucherDate) errs.voucherDate = "Voucher date is required.";
            }
            // No Voucher → voucher image not required (will be removed on save)
        }

        return errs;
    }

    function handleSave() {
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setShowConfirmModal(true);
    }

    // ─── Submit ─────────────────────────────────────────────────────────

    async function performSave() {
        setShowConfirmModal(false);
        setIsSaving(true);
        try {
            const numAmount = parseFloat(amount.replace(/,/g, ""));

            const instruments = instrumentNo ? [
                { instrument_type: transType, instrument_no: instrumentNo, notes: instrumentNotes || null }
            ] : [];

            // Check if we have a NEW voucher file to upload (not an existing one from backend)
            const hasNewVoucherFile = voucherFile?.file instanceof File;

            let res: Response;

            if (hasNewVoucherFile) {
                // Use FormData so we can send the file
                const formData = new FormData();
                formData.append("trans_type", transType);
                formData.append("voucher_no", voucherMode === "WITH_VOUCHER" ? (voucherNo || "") : "");
                formData.append("voucher_date", voucherMode === "WITH_VOUCHER" ? (voucherDate || "") : "");
                formData.append("from_owner_id", String(fromOwnerId || ""));
                formData.append("to_owner_id", String(toOwnerId || ""));
                if (unitId) formData.append("unit_id", String(unitId));
                formData.append("amount", String(numAmount));
                if (fundReference) formData.append("fund_reference", fundReference);
                if (particulars) formData.append("particulars", particulars);
                if (personInCharge) formData.append("person_in_charge", personInCharge);
                formData.append("remove_voucher", voucherMode === "NO_VOUCHER" ? "1" : "0");

                if (instruments.length > 0) {
                    formData.append("instruments", JSON.stringify(instruments));
                }

                // Attach the new voucher file
                formData.append("voucher", voucherFile!.file!);

                res = await fetch(`/api/accountant/transactions/${transaction.id}`, {
                    method: "PUT",
                    body: formData,
                    // Do NOT set Content-Type — browser auto-sets multipart/form-data with boundary
                });
            } else {
                // No new file — send JSON
                const requestBody = {
                    trans_type: transType,
                    voucher_no: voucherMode === "WITH_VOUCHER" ? (voucherNo || null) : null,
                    voucher_date: voucherMode === "WITH_VOUCHER" ? (voucherDate || null) : null,
                    from_owner_id: fromOwnerId,
                    to_owner_id: toOwnerId,
                    unit_id: unitId || null,
                    amount: numAmount,
                    fund_reference: fundReference || null,
                    particulars: particulars || null,
                    person_in_charge: personInCharge || null,
                    remove_voucher: voucherMode === "NO_VOUCHER",
                    instruments: instruments.length > 0 ? instruments : [],
                };

                res = await fetch(`/api/accountant/transactions/${transaction.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
                if (data.errors) {
                    const fe: Record<string, string> = {};
                    for (const [key, msgs] of Object.entries(data.errors)) {
                        fe[key === 'voucher_no' ? 'voucherNo' : key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
                    }
                    setErrors(fe);
                }
                throw new Error(data.message || "Failed to update transaction.");
            }

            showToast("Transaction Updated", "The transaction details have been updated successfully.", "success");
            onSaved();
            handleClose();
        } catch (err: any) {
            showToast("Update Failed", err.message || "An error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    if (!open && !isClosing) return null;

    // ─── Shared Styles ──────────────────────────────────────────────────

    const fieldClass = "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const fieldClassNoIcon = "w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

    return (
        <>
            <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`} onClick={handleClose} />

            <LoadingModal isOpen={isSaving} title="Updating Transaction" message="Please wait while saving transaction details..." />

            <ConfirmationModal
                open={showConfirmModal}
                title="Confirm Update"
                icon={AlertCircle}
                color="#7a0f1f"
                confirmLabel="Yes, update transaction"
                message="Are you sure you want to update this transaction? The running balances of related ledgers will be recalculated automatically."
                onConfirm={performSave}
                onCancel={() => setShowConfirmModal(false)}
            />

            {/* Image Preview Panel */}
            <ViewImagePanel
                open={!!previewFile}
                file={previewFile}
                onClose={() => setPreviewFile(null)}
                zIndex={70}
            />

            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full lg:w-[48rem] max-w-full bg-white z-50 flex flex-col shadow-xl"
                style={{ animation: isClosing ? "editPanelSlideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "editPanelSlideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                            {isDeposit ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                Edit {isDeposit ? "Deposit" : "Withdrawal"} #{transaction?.id}
                            </h2>
                            <p className="text-sm text-white/80 mt-0.5">
                                {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"} • Modify details below
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-md hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50/50 space-y-5">

                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3.5 rounded-lg flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-blue-900">Important Note on Edits</p>
                            <p className="mt-0.5 text-xs">Modifying amount or owners will automatically recalculate downstream ledger balances.
                                {voucherMode === "NO_VOUCHER" && " Saving with 'No Voucher' will remove the existing voucher image from this transaction."}
                            </p>
                        </div>
                    </div>

                    {/* Voucher Mode Toggle */}
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-gray-100 p-1 gap-1">
                        <button type="button" onClick={() => setVoucherMode("WITH_VOUCHER")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${voucherMode === "WITH_VOUCHER" ? "bg-[#7a0f1f] text-white shadow-md" : "text-gray-500 hover:text-gray-700 hover:bg-white/60"}`}>
                            <FileText className="w-4 h-4" />
                            With Voucher
                        </button>
                        <button type="button" onClick={() => setVoucherMode("NO_VOUCHER")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${voucherMode === "NO_VOUCHER" ? "bg-[#7a0f1f] text-white shadow-md" : "text-gray-500 hover:text-gray-700 hover:bg-white/60"}`}>
                            No Voucher
                        </button>
                    </div>

                    {/* ───── SECTION 1: Core Details ───── */}
                    <SectionCard
                        title={isDeposit ? "Deposit Details" : "Withdrawal Details"}
                        icon={isDeposit ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount */}
                            <div>
                                <label className={labelClass}>Amount <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</div>
                                    <input type="text" value={amount}
                                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className={fieldClass} placeholder="0.00" />
                                </div>
                                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                            </div>

                            {/* Voucher Date */}
                            <div>
                                <label className={labelClass}>
                                    Voucher Date {voucherMode === "WITH_VOUCHER" && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Calendar className="w-4 h-4" /></div>
                                    <input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className={fieldClass} />
                                </div>
                                {errors.voucherDate && <p className="text-xs text-red-500 mt-1">{errors.voucherDate}</p>}
                            </div>

                            {/* Particulars */}
                            <div className="col-span-1 md:col-span-2">
                                <label className={labelClass}>Particulars <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400"><AlignLeft className="w-4 h-4" /></div>
                                    <textarea value={particulars} onChange={(e) => setParticulars(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 resize-none h-20"
                                        placeholder="Transaction remarks here..." />
                                </div>
                                {errors.particulars && <p className="text-xs text-red-500 mt-1">{errors.particulars}</p>}
                            </div>

                            {/* Fund Reference */}
                            <div>
                                <label className={labelClass}>Fund Reference</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Tag className="w-4 h-4" /></div>
                                    <input type="text" value={fundReference} onChange={(e) => setFundReference(e.target.value)} className={fieldClass} placeholder="Fund reference..." />
                                </div>
                            </div>

                            {/* Person In Charge */}
                            <div>
                                <label className={labelClass}>Person In Charge</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserCheck className="w-4 h-4" /></div>
                                    <input type="text" value={personInCharge} onChange={(e) => setPersonInCharge(e.target.value)} className={fieldClass} placeholder="Person in charge..." />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ───── SECTION 2: Uploads ───── */}
                    <SectionCard title="Uploads" icon={<Upload className="w-4 h-4" />}>
                        {/* Voucher Image Upload */}
                        {voucherMode === "WITH_VOUCHER" ? (
                            <FileDropZone
                                label="Voucher Image (Required)"
                                files={voucherFile ? [voucherFile] : []}
                                onAdd={addVoucherFile}
                                onRemove={() => removeVoucherFile()}
                                onPreview={handlePreviewFile}
                                multiple={false}
                                error={errors.voucherFile}
                            />
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">No Voucher Mode</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        {isDeposit
                                            ? "The existing voucher image will be removed when you save changes."
                                            : "The existing voucher image will be removed when you save. Cheque images below are still required."
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cheque Upload for WITHDRAWAL — always shown, always required */}
                        {isWithdrawal && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <FileDropZone
                                    label="Cheque Upload Images (Required)"
                                    files={chequeFiles}
                                    onAdd={addChequeFiles}
                                    onRemove={removeChequeFile}
                                    onPreview={handlePreviewFile}
                                    multiple={true}
                                    error={errors.chequeFiles}
                                />
                            </div>
                        )}
                    </SectionCard>

                    {/* ───── SECTION 3: Instrument / Cheque Details (WITHDRAWAL only) ───── */}
                    {isWithdrawal && (
                        <SectionCard title="Instrument / Cheque Details" icon={<FileText className="w-4 h-4" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Instrument / Cheque Number</label>
                                    <input type="text" value={instrumentNo} onChange={(e) => setInstrumentNo(e.target.value)}
                                        className={fieldClassNoIcon} placeholder="Ref / Cheque #" />
                                </div>
                                <div>
                                    <label className={labelClass}>Notes / Details</label>
                                    <input type="text" value={instrumentNotes} onChange={(e) => setInstrumentNotes(e.target.value)}
                                        className={fieldClassNoIcon} placeholder="Bank, Branch, etc." />
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* ───── SECTION 4: Payment Details ───── */}
                    <SectionCard title="Payment Details" icon={<DollarSign className="w-4 h-4" />}>
                        <div className="space-y-4">
                            {/* Transaction Type */}
                            {isDeposit ? (
                                <div>
                                    <label className={labelClass}>Transaction Type</label>
                                    <select value={transType} onChange={(e) => setTransType(e.target.value as TransactionType)} className={fieldClassNoIcon}>
                                        {DEPOSIT_TYPES.map((t) => (
                                            <option key={t} value={t}>{t === "CASH DEPOSIT" ? "Cash Deposit" : t === "BANK TRANSFER" ? "Bank Transfer" : "Cheque Deposit"}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Type</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">Cheque (Withdrawal)</p>
                                </div>
                            )}

                            {/* From / To Owners */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <OwnerDropdown label="From Owner (Sender)" required placeholder="Select sender..."
                                    owners={owners} loading={ownersLoading} selectedOwnerId={fromOwnerId}
                                    onSelect={(o) => setFromOwnerId(o?.id || null)} error={errors.fromOwnerId} />
                                <OwnerDropdown label="To Owner (Recipient)" required placeholder="Select recipient..."
                                    owners={owners} loading={ownersLoading} selectedOwnerId={toOwnerId}
                                    onSelect={(o) => setToOwnerId(o?.id || null)} error={errors.toOwnerId} />
                            </div>

                            {/* Unit Selection */}
                            {showUnitSection && (
                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                    <label className={labelClass}>To Owner - Assigned Unit</label>
                                    {unitsLoading ? (
                                        <p className="text-xs text-gray-400">Loading units...</p>
                                    ) : (
                                        <select value={unitId || ""} onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : null)} className={fieldClassNoIcon}>
                                            <option value="">General Ledger (No Unit Assigned)</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Footer Controls */}
                <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-3.5 border-t bg-gray-50/80 mt-auto">
                    <button type="button" onClick={handleClose} disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#7a0f1f] hover:opacity-90 rounded-lg transition-all shadow-sm">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes editPanelSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes editPanelSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
            `}</style>
        </>
    );
}
