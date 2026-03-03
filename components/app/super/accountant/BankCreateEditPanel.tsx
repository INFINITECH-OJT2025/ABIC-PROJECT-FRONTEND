"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Banknote, MapPin, Plus, Save, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import DataTable, { DataTableColumn, PaginationMeta } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";
import BankBranchCreateEditPanel, { BankContact as BankContactRecord } from "@/components/app/super/accountant/BankBranchCreateEditPanel";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

export type BankStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Bank {
    id: number;
    name: string;
    short_name: string | null;
    country: string | null;
    status: BankStatus;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface BankContact {
    id: number;
    bank_id: number;
    branch_name: string | null;
    contact_person: string | null;
    position: string | null;
    notes: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface BankCreateEditPanelProps {
    open: boolean;
    /** The bank currently being edited. If null, panel is in create mode. */
    bank: Bank | null;
    /** Called when the panel should be closed. */
    onClose: () => void;
    /** Called when the bank has been successfully saved to the backend. */
    onSaved: () => void;
}

export default function BankCreateEditPanel({
    open,
    bank,
    onClose,
    onSaved,
}: BankCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!bank;

    const [isClosing, setIsClosing] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [country, setCountry] = useState("");
    const [status, setStatus] = useState<BankStatus>("ACTIVE");

    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // ── Async name uniqueness check (create mode only) ────────────────────────
    type NameCheckStatus = "idle" | "checking" | "available" | "taken";
    const [nameCheckStatus, setNameCheckStatus] = useState<NameCheckStatus>("idle");
    const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Branches sub-table state ─────────────────────────────────────────────────
    type BranchRow = {
        id: number;
        branch_name: string | null;
        contact_person: string | null;
        position: string | null;
    };

    const [branches, setBranches] = useState<BranchRow[]>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesPagination, setBranchesPagination] = useState<PaginationMeta | null>(null);
    const [branchesSearch, setBranchesSearch] = useState("");
    const [branchesPage, setBranchesPage] = useState(1);

    // Branch panel state
    const [branchPanelOpen, setBranchPanelOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<BankContactRecord | null>(null);

    const fetchBranches = useCallback(async () => {
        if (!bank) return;
        setBranchesLoading(true);
        try {
            const url = new URL(
                `/api/accountant/maintenance/bank-contacts`,
                window.location.origin
            );
            url.searchParams.set("bank_id", bank.id.toString());

            const res = await fetch(url.toString());
            if (!res.ok) { setBranches([]); setBranchesPagination(null); return; }
            const data = await res.json();
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : [];
                setBranches(list);

                // Bank contacts API doesn't paginate, so no pagination meta
                setBranchesPagination(null);
            } else {
                setBranches([]);
                setBranchesPagination(null);
            }
        } catch {
            setBranches([]);
            setBranchesPagination(null);
        } finally {
            setBranchesLoading(false);
        }
    }, [bank]);

    // Reset branches state when panel opens/closes or bank changes
    useEffect(() => {
        if (open && bank) {
            setBranchesSearch("");
            setBranchesPage(1);
            // also close any open branch sub-panel
            setBranchPanelOpen(false);
            setSelectedBranch(null);
        }
    }, [open, bank]);

    // Re-fetch branches whenever dependencies change
    useEffect(() => {
        if (open && bank) {
            fetchBranches();
        }
    }, [open, bank, fetchBranches]);

    // Reset fields when panel opens or bank changes
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            if (bank) {
                setName(bank.name);
                setShortName(bank.short_name ?? "");
                setCountry(bank.country ?? "");
                setStatus(bank.status);
            } else {
                setName("");
                setShortName("");
                setCountry("");
                setStatus("ACTIVE");
            }
            setErrors({});
            setTouched({});
        }
    }, [open, bank]);

    const handleClose = () => {
        setIsClosing(true);
        setNameCheckStatus("idle");
        if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setErrors({});
            setTouched({});
        }, 350);
    };

    function validate() {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Name is required.";
        if (shortName && shortName.length > 20) errs.shortName = "Short name must not exceed 20 characters.";
        if (country && country.length > 100) errs.country = "Country must not exceed 100 characters.";
        return errs;
    }

    function handleSave() {
        setTouched({ name: true, shortName: true, country: true });

        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        // Block if name check hasn't resolved yet
        if (!isEdit && (nameCheckStatus === "checking" || nameCheckStatus === "taken")) return;

        // Show confirmation modal
        setShowConfirmModal(true);
    }

    async function performSave() {
        setShowConfirmModal(false);
        setIsSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: name.trim(),
                short_name: shortName.trim() || null,
                country: country.trim() || null,
            };

            if (isEdit) {
                payload.status = status;
            }

            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            let res: Response;
            if (isEdit) {
                res = await fetch(`/api/accountant/maintenance/banks/${bank!.id}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/accountant/maintenance/banks", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
                // Try to parse validation errors
                if (data.errors) {
                    const fe: Record<string, string> = {};
                    for (const [key, msgs] of Object.entries(data.errors)) {
                        fe[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
                    }
                    setErrors(fe);
                }
                throw new Error(data.message || "Failed to save bank.");
            }

            showToast(
                isEdit ? "Bank Updated" : "Bank Created",
                isEdit
                    ? "Bank details have been updated successfully."
                    : "New bank has been created successfully.",
                "success"
            );
            onSaved();
            handleClose();
        } catch (err: unknown) {
            showToast("Save Failed", err instanceof Error ? err.message : "An error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    if (!open && !isClosing) return null;

    const fieldClass =
        "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1 mt-2";

    // Filter branches by search
    const filteredBranches = branches.filter((branch) => {
        if (!branchesSearch.trim()) return true;
        const search = branchesSearch.toLowerCase();
        return (
            branch.branch_name?.toLowerCase().includes(search) ||
            branch.contact_person?.toLowerCase().includes(search) ||
            branch.position?.toLowerCase().includes(search)
        );
    });

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Loading Modal Overlay */}
            <LoadingModal
                isOpen={isSaving}
                title={isEdit ? "Updating Bank" : "Creating Bank"}
                message={isEdit ? "Please wait while we update the bank details..." : "Please wait while we create the new bank..."}
                zIndex={400}
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    maxWidth: isEdit ? "72rem" : "32rem",
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">
                            {isEdit ? "Bank Details" : "Add New Bank"}
                        </h2>
                        <p className="text-sm text-white/90 mt-0.5">
                            {isEdit ? "Update bank details" : "Create a new bank record"}
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

                {/* Body container */}
                <div className={`flex-1 flex overflow-hidden bg-gray-50/50 ${isEdit ? "flex-row" : "flex-col"}`}>
                    {/* LEFT COLUMN: Bank Form */}
                    <div className={`flex flex-col overflow-y-auto px-6 py-6 space-y-5 bg-white transition-all duration-300 ${isEdit ? "w-[360px] border-r border-gray-200 flex-shrink-0" : "w-full"}`}>
                        {/* Name */}
                        <div className="relative">
                            <label className={labelClass}>Bank Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setName(val);
                                        if (errors.name && val.trim()) setErrors((prev) => { const nv = { ...prev }; delete nv.name; return nv; });
                                        // Async uniqueness check — only in create mode
                                        if (!isEdit) {
                                            if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
                                            const trimmed = val.trim();
                                            if (!trimmed) {
                                                setNameCheckStatus("idle");
                                                return;
                                            }
                                            setNameCheckStatus("checking");
                                            nameCheckTimer.current = setTimeout(async () => {
                                                try {
                                                    // Check if bank name exists
                                                    const res = await fetch(
                                                        `/api/accountant/maintenance/banks?search=${encodeURIComponent(trimmed)}`
                                                    );
                                                    const data = await res.json();
                                                    const banksList = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? []);
                                                    const exists = banksList.some((b: Bank) => b.name.toUpperCase() === trimmed.toUpperCase());
                                                    setNameCheckStatus(exists ? "taken" : "available");
                                                } catch {
                                                    setNameCheckStatus("idle");
                                                }
                                            }, 500);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTouched((prev) => ({ ...prev, name: true }));
                                        if (!name.trim()) setErrors((prev) => ({ ...prev, name: "Name is required." }));
                                    }}
                                    placeholder="Enter bank name"
                                    maxLength={100}
                                    className={`${fieldClass} pr-10 ${touched.name && errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : nameCheckStatus === "taken" ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : nameCheckStatus === "available" ? "border-green-500 focus:border-green-500 focus:ring-green-500/20" : ""}`}
                                />
                                {/* Async check indicator */}
                                {!isEdit && nameCheckStatus !== "idle" && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                        {nameCheckStatus === "checking" && (
                                            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        )}
                                        {nameCheckStatus === "available" && (
                                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {nameCheckStatus === "taken" && (
                                            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Name taken → tooltip-style error */}
                            {!isEdit && nameCheckStatus === "taken" && (
                                <FormTooltipError
                                    message="A bank with this name already exists."
                                    onClose={() => setNameCheckStatus("idle")}
                                />
                            )}
                            {/* Name available → inline green message */}
                            {!isEdit && nameCheckStatus === "available" && (
                                <p className="mt-1 text-xs text-green-600 font-medium">Name is available.</p>
                            )}
                            {touched.name && (
                                <FormTooltipError
                                    message={errors.name}
                                    onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.name; return nv; })}
                                />
                            )}
                        </div>

                        {/* Short Name */}
                        <div>
                            <label className={labelClass}>Short Name</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Banknote className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={shortName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setShortName(val);
                                        if (errors.shortName && val.length <= 20) setErrors((prev) => { const nv = { ...prev }; delete nv.shortName; return nv; });
                                    }}
                                    onBlur={() => {
                                        setTouched((prev) => ({ ...prev, shortName: true }));
                                        if (shortName && shortName.length > 20) {
                                            setErrors((prev) => ({ ...prev, shortName: "Short name must not exceed 20 characters." }));
                                        }
                                    }}
                                    placeholder="e.g., BDO, Metrobank"
                                    maxLength={20}
                                    className={`${fieldClass} ${touched.shortName && errors.shortName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                />
                            </div>
                            {touched.shortName && (
                                <FormTooltipError
                                    message={errors.shortName}
                                    onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.shortName; return nv; })}
                                />
                            )}
                        </div>

                        {/* Country */}
                        <div>
                            <label className={labelClass}>Country</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCountry(val);
                                        if (errors.country && val.length <= 100) setErrors((prev) => { const nv = { ...prev }; delete nv.country; return nv; });
                                    }}
                                    onBlur={() => {
                                        setTouched((prev) => ({ ...prev, country: true }));
                                        if (country && country.length > 100) {
                                            setErrors((prev) => ({ ...prev, country: "Country must not exceed 100 characters." }));
                                        }
                                    }}
                                    placeholder="e.g., Philippines"
                                    maxLength={100}
                                    className={`${fieldClass} ${touched.country && errors.country ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                />
                            </div>
                            {touched.country && (
                                <FormTooltipError
                                    message={errors.country}
                                    onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.country; return nv; })}
                                />
                            )}
                        </div>

                        {/* Status Toggle — only in edit mode */}
                        {isEdit && (
                            <div>
                                <label className={labelClass}>Status</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {status === "ACTIVE" ? <CheckCircle className="h-4 w-4" /> :
                                            status === "INACTIVE" ? <XCircle className="h-4 w-4" /> :
                                                <AlertCircle className="h-4 w-4" />}
                                    </div>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as BankStatus)}
                                        className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 max-h-10">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {bank?.status !== status && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        Status will change from <strong>{bank?.status}</strong> to <strong>{status}</strong>.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Validation errors from backend (general errors) */}
                        {errors.name && errors.name.toLowerCase().includes("unique") && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                A bank with this name already exists.
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Branches List */}
                    {isEdit && (
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/30 relative">
                            {/* Branches Header */}
                            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-2 bg-white mt-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Branches</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Manage branches and contacts for this bank.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedBranch(null);
                                        setBranchPanelOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95 transition active:scale-95 shadow-sm"
                                    style={{ background: ACCENT }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Branch
                                </button>
                            </div>

                            {/* Branches Toolbar */}
                            <div className="flex-shrink-0 px-6 bg-white border-b border-gray-200 pb-4">
                                <SharedToolbar
                                    searchQuery={branchesSearch}
                                    onSearchChange={(q) => { setBranchesSearch(q); setBranchesPage(1); }}
                                    searchPlaceholder="Search branches…"
                                    statusFilter="all"
                                    onStatusChange={() => { }}
                                    onRefresh={fetchBranches}
                                    statusOptions={[{ label: "All", value: "all" }]}
                                    containerMaxWidth="max-w-full"
                                />
                            </div>

                            {/* Branches Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <DataTable<BranchRow>
                                    loading={branchesLoading}
                                    rows={filteredBranches}
                                    pagination={branchesPagination}
                                    onPageChange={(p) => { setBranchesPage(p); }}
                                    itemName="branches"
                                    emptyTitle="No branches found"
                                    emptyDescription="This bank does not have any branches registered yet."
                                    onRowClick={async (row) => {
                                        // Fetch full branch details with channels
                                        try {
                                            const res = await fetch(`/api/accountant/maintenance/bank-contacts/${row.id}`);
                                            const data = await res.json();
                                            if (res.ok && data.success) {
                                                setSelectedBranch(data.data);
                                                setBranchPanelOpen(true);
                                            } else {
                                                showToast("Error", "Failed to load branch details.", "error");
                                            }
                                        } catch {
                                            showToast("Error", "Failed to load branch details.", "error");
                                        }
                                    }}
                                    columns={[
                                        {
                                            key: "avatar",
                                            label: "",
                                            width: "56px",
                                            renderCell: (row) => (
                                                <div className="w-9 h-9 rounded-md bg-[#7a0f1f] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-white">
                                                        {row.branch_name?.charAt(0).toUpperCase() ?? "?"}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "branch_name",
                                            label: "Branch Name",
                                            sortable: true,
                                            flex: true,
                                            width: "40%",
                                            renderCell: (row) => row.branch_name ?? <span className="text-gray-300">—</span>,
                                        },
                                        {
                                            key: "contact_person",
                                            label: "Contact Person",
                                            flex: true,
                                            width: "30%",
                                            renderCell: (row) => row.contact_person ?? <span className="text-gray-300">—</span>,
                                        },
                                        {
                                            key: "position",
                                            label: "Position",
                                            flex: true,
                                            width: "30%",
                                            renderCell: (row) => row.position ?? <span className="text-gray-300">—</span>,
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 flex items-center justify-between gap-3 p-4 border-t bg-gray-50" style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleClose}
                            disabled={isSaving}
                            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-neutral-100 transition-colors"
                            style={{ borderColor: BORDER, color: "#111", height: 40 }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (!isEdit && (nameCheckStatus === "checking" || nameCheckStatus === "taken"))}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Bank"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Branch Create/Edit sub-panel — rendered after bank panel to appear on top */}
            <BankBranchCreateEditPanel
                open={branchPanelOpen}
                contact={selectedBranch}
                defaultBankId={bank?.id ?? null}
                onClose={() => {
                    setBranchPanelOpen(false);
                    setSelectedBranch(null);
                }}
                onSaved={() => {
                    setBranchPanelOpen(false);
                    setSelectedBranch(null);
                    fetchBranches();
                }}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                open={showConfirmModal}
                icon={Save}
                color={ACCENT}
                title={isEdit ? "Confirm Update" : "Confirm Creation"}
                message={
                    <>
                        Are you sure you want to {isEdit ? "update" : "create"} the bank{" "}
                        <strong>{name.trim() || "with the provided details"}</strong>?
                    </>
                }
                confirmLabel={isEdit ? "Update Bank" : "Create Bank"}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={performSave}
                isConfirming={isSaving}
                zIndex={400}
            />

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
}
