"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, RefreshCw, User, Mail, MapPin, AlignLeft, Calendar, Building2, Shield, Settings, Plus, Save, Info, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import DataTable, { DataTableColumn, PaginationMeta } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";
import UnitCreateEditPanel, { Unit as UnitRecord } from "@/components/app/super/accountant/UnitCreateEditPanel";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

export type OwnerType = "COMPANY" | "CLIENT" | "MAIN" | "SYSTEM";
export type OwnerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Owner {
    id: number;
    owner_type: OwnerType;
    name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    status: OwnerStatus;
    is_system?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface OwnerCreateEditPanelProps {
    open: boolean;
    /** The owner currently being edited. If null, panel is in create mode. */
    owner: Owner | null;
    /** Called when the panel should be closed. */
    onClose: () => void;
    /** Called when the owner has been successfully saved to the backend. */
    onSaved: () => void;
    /** Called to deactivate an existing owner. */
    onDeactivate?: (owner: Owner) => void;
    /** Called to restore an existing owner. */
    onRestore?: (owner: Owner) => void;
}

export default function OwnerCreateEditPanel({
    open,
    owner,
    onClose,
    onSaved,
    onDeactivate,
    onRestore
}: OwnerCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!owner;

    const [isClosing, setIsClosing] = useState(false);

    // Form fields
    const [ownerType, setOwnerType] = useState<OwnerType>("CLIENT");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [status, setStatus] = useState<OwnerStatus>("ACTIVE");
    const [openingBalance, setOpeningBalance] = useState("");
    const [openingDate, setOpeningDate] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // ── Async name uniqueness check (create mode only) ────────────────────────
    type NameCheckStatus = "idle" | "checking" | "available" | "taken";
    const [nameCheckStatus, setNameCheckStatus] = useState<NameCheckStatus>("idle");
    const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Units sub-table state ─────────────────────────────────────────────────
    type UnitRow = {
        id: number;
        unit_name: string;
        status: string;
        property?: { id: number; name: string } | null;
    };

    const [units, setUnits] = useState<UnitRow[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [unitsPagination, setUnitsPagination] = useState<PaginationMeta | null>(null);
    const [unitsSearch, setUnitsSearch] = useState("");
    const [unitsStatus, setUnitsStatus] = useState("all");
    const [unitsPage, setUnitsPage] = useState(1);

    // ── Unit panel state ──────────────────────────────────────────────────────
    const [unitPanelOpen, setUnitPanelOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<UnitRecord | null>(null);

    const fetchUnits = useCallback(async () => {
        if (!owner) return;
        setUnitsLoading(true);
        try {
            const url = new URL(
                `/api/accountant/maintenance/units`,
                window.location.origin
            );
            url.searchParams.set("owner_id", owner.id.toString());
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

                // Populate pagination meta if the backend returned paginated data
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
    }, [owner, unitsSearch, unitsStatus, unitsPage]);

    // Reset units state when panel opens/closes or owner changes
    useEffect(() => {
        if (open && owner) {
            setUnitsSearch("");
            setUnitsStatus("all");
            setUnitsPage(1);
            // also close any open unit sub-panel
            setUnitPanelOpen(false);
            setSelectedUnit(null);
        }
    }, [open, owner]);

    // Re-fetch units whenever dependencies change
    useEffect(() => {
        if (open && owner) {
            fetchUnits();
        }
    }, [open, owner, fetchUnits]);

    // Reset fields when panel opens or owner changes
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            if (owner) {
                setOwnerType(owner.owner_type);
                setName(owner.name);
                setDescription(owner.description ?? "");
                setEmail(owner.email ?? "");
                let p = owner.phone ?? "";
                if (p) {
                    p = p.replace(/\D/g, "");
                    if (p.startsWith("63")) p = p.substring(2);
                    else if (p.startsWith("0")) p = p.substring(1);
                }
                setPhone(p);
                setAddress(owner.address ?? "");
                setStatus(owner.status);
                setOpeningBalance("");
                setOpeningDate("");
            } else {
                setOwnerType("CLIENT");
                setName("");
                setDescription("");
                setEmail("");
                setPhone("");
                setAddress("");
                setStatus("ACTIVE");
                setOpeningBalance("");
                setOpeningDate("");
            }
            setErrors({});
            setTouched({});
        }
    }, [open, owner]);

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
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email address.";
        if (openingBalance && isNaN(Number(openingBalance))) errs.openingBalance = "Must be a valid number.";
        if (openingBalance && Number(openingBalance) < 0) errs.openingBalance = "Must be 0 or greater.";
        if (openingBalance && !openingDate) errs.openingDate = "Opening date is required when balance is set.";
        return errs;
    }

    function handleSave() {
        setTouched({ name: true, email: true, openingBalance: true, openingDate: true });

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
                owner_type: ownerType,
                name: name.trim(),
                description: description.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() ? `+63${phone.trim()}` : null,
                address: address.trim() || null,
            };

            if (isEdit) {
                payload.status = status;
            } else {
                if (openingBalance) {
                    payload.opening_balance = parseFloat(openingBalance);
                    payload.opening_date = openingDate || null;
                }
            }

            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            let res: Response;
            if (isEdit) {
                res = await fetch(`/api/accountant/maintenance/owners/${owner!.id}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/accountant/maintenance/owners", {
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
                throw new Error(data.message || "Failed to save owner.");
            }

            showToast(
                isEdit ? "Owner Updated" : "Owner Created",
                isEdit
                    ? "Owner details have been updated successfully."
                    : "New owner has been created successfully.",
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

    const formatBalance = (val: string) => {
        if (!val) return "";
        const parts = val.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

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
                title={isEdit ? "Updating Owner" : "Creating Owner"}
                message={isEdit ? "Please wait while we update the owner details..." : "Please wait while we save the new owner..."}
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    maxWidth: isEdit ? "72rem" : "32rem", /* max-w-3xl vs max-w-lg explicitly */
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">
                            {isEdit ? "Owner Details" : "Add New Owner"}
                        </h2>
                        <p className="text-sm text-white/90 mt-0.5">
                            {isEdit ? "Update owner details" : "Create a new owner record"}
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
                    {/* LEFT COLUMN: Owner Form */}
                    <div className={`flex flex-col overflow-y-auto px-6 py-6 space-y-5 bg-white transition-all duration-300 ${isEdit ? "w-[360px] border-r border-gray-200 flex-shrink-0" : "w-full"}`}>
                        {/* Owner Type */}
                        <div>
                            <label className={labelClass}>Owner Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {ownerType === "COMPANY" ? <Building2 className="h-4 w-4" /> :
                                        ownerType === "MAIN" ? <Shield className="h-4 w-4" /> :
                                            ownerType === "SYSTEM" ? <Settings className="h-4 w-4" /> :
                                                <User className="h-4 w-4" />}
                                </div>
                                <select
                                    value={ownerType}
                                    onChange={(e) => setOwnerType(e.target.value as OwnerType)}
                                    className={fieldClass}
                                    disabled={isEdit && owner?.is_system}
                                >
                                    <option value="CLIENT">Client</option>
                                    <option value="COMPANY">Company</option>
                                    <option value="MAIN">Main</option>
                                    {isEdit && owner?.owner_type === "SYSTEM" && (
                                        <option value="SYSTEM">System</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="relative">
                            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User className="h-4 w-4" />
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
                                                    const res = await fetch(
                                                        `/api/accountant/maintenance/owners/check-name?name=${encodeURIComponent(trimmed)}`
                                                    );
                                                    const data = await res.json();
                                                    setNameCheckStatus(data.taken ? "taken" : "available");
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
                                    placeholder="Enter owner name"
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
                                    message="An owner with this name already exists."
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

                        {/* Email */}
                        <div className="relative">
                            <label className={labelClass}>Email</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEmail(val);
                                        if (errors.email) {
                                            if (!val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                                                setErrors((prev) => { const nv = { ...prev }; delete nv.email; return nv; });
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        setTouched((prev) => ({ ...prev, email: true }));
                                        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                            setErrors((prev) => ({ ...prev, email: "Invalid email address." }));
                                        }
                                    }}
                                    placeholder="owner@example.com"
                                    maxLength={100}
                                    className={`${fieldClass} ${touched.email && errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                />
                            </div>
                            {touched.email && (
                                <FormTooltipError
                                    message={errors.email}
                                    onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.email; return nv; })}
                                />
                            )}
                        </div>

                        {/* Phone */}
                        <div className="relative">
                            <label className={labelClass}>Phone</label>
                            <div className="relative flex items-center h-10 rounded-lg border border-gray-300 bg-white focus-within:border-[#7B0F2B] focus-within:ring-2 focus-within:ring-[#7B0F2B]/20 transition-all overflow-hidden text-sm">
                                <div className="flex h-full items-center px-3 bg-gray-50 border-r border-gray-300 text-[#800020] font-bold select-none whitespace-nowrap">
                                    +63
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPhone(val);
                                    }}
                                    placeholder="9XX XXX XXXX"
                                    className="flex-1 h-full px-3 outline-none min-w-0"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className={labelClass}>Address</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Full address"
                                    rows={2}
                                    maxLength={255}
                                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelClass}>Description</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <AlignLeft className="h-4 w-4" />
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                    rows={3}
                                    maxLength={500}
                                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Status Toggle — only in edit mode */}
                        {isEdit && (
                            <div>
                                <label className={labelClass}>Account Status</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {status === "ACTIVE" ? <CheckCircle className="h-4 w-4" /> :
                                            status === "INACTIVE" ? <XCircle className="h-4 w-4" /> :
                                                <AlertCircle className="h-4 w-4" />}
                                    </div>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as OwnerStatus)}
                                        disabled={owner?.is_system}
                                        className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none disabled:bg-gray-100"
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
                                {owner?.status !== status && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        Status will change from <strong>{owner?.status}</strong> to <strong>{status}</strong>.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Opening Balance — only in create mode */}
                        {!isEdit && (
                            <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening Balance (Optional)</p>
                                <div className="relative">
                                    <label className={labelClass}>Opening Balance</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none flex items-center justify-center w-4 h-4">
                                            <span className="font-bold text-[15px] leading-none mb-0.5 ml-0.5">₱</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={formatBalance(openingBalance)}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                                                    if (raw !== '' && Number(raw) > 999999999.99) return;
                                                    setOpeningBalance(raw);
                                                    if (errors.openingBalance) {
                                                        if (raw === '' || !isNaN(Number(raw))) {
                                                            setErrors((prev) => { const nv = { ...prev }; delete nv.openingBalance; return nv; });
                                                        }
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                setTouched((prev) => ({ ...prev, openingBalance: true }));
                                                if (openingBalance && isNaN(Number(openingBalance))) {
                                                    setErrors((prev) => ({ ...prev, openingBalance: "Must be a valid number." }));
                                                }
                                            }}
                                            placeholder="0.00"
                                            maxLength={15}
                                            className={`${fieldClass} ${touched.openingBalance && errors.openingBalance ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                        />
                                    </div>
                                    {touched.openingBalance && (
                                        <FormTooltipError
                                            message={errors.openingBalance}
                                            onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.openingBalance; return nv; })}
                                        />
                                    )}
                                </div>
                                <div className="relative">
                                    <label className={labelClass}>Opening Date {openingBalance ? <span className="text-red-500">*</span> : ""}</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="date"
                                            value={openingDate}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setOpeningDate(val);
                                                if (errors.openingDate && val) {
                                                    setErrors((prev) => { const nv = { ...prev }; delete nv.openingDate; return nv; });
                                                }
                                            }}
                                            onBlur={() => {
                                                setTouched((prev) => ({ ...prev, openingDate: true }));
                                                if (openingBalance && !openingDate) {
                                                    setErrors((prev) => ({ ...prev, openingDate: "Opening date is required when balance is set." }));
                                                }
                                            }}
                                            className={`${fieldClass} ${touched.openingDate && errors.openingDate ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                        />
                                    </div>
                                    {touched.openingDate && (
                                        <FormTooltipError
                                            message={errors.openingDate}
                                            onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.openingDate; return nv; })}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Validation errors from backend (general errors) */}
                        {errors.name && errors.name.toLowerCase().includes("unique") && (
                            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                An owner with this name already exists.
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Units List */}
                    {isEdit && (
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/30 relative">
                            {/* Units Header */}
                            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-2 bg-white mt-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Associated Units</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Manage spaces and properties assigned to this owner.</p>
                                </div>
                                {owner && (owner.owner_type === "MAIN" || owner.owner_type === "SYSTEM") ? null : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedUnit(null);
                                            setUnitPanelOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95 transition active:scale-95 shadow-sm"
                                        style={{ background: ACCENT }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Unit
                                    </button>
                                )}
                            </div>

                            {/* Info message for MAIN/SYSTEM owners */}
                            {owner && (owner.owner_type === "MAIN" || owner.owner_type === "SYSTEM") && (
                                <div className="flex-shrink-0 px-6 pt-4 pb-2 bg-white">
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                                                Units Not Available
                                            </h4>
                                            <p className="text-sm text-blue-800">
                                                {owner.owner_type === "MAIN" 
                                                    ? "Main owners cannot have units associated with their accounts. Only Client and Company owners can have units."
                                                    : "System owners cannot have units associated with their accounts. Only Client and Company owners can have units."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Units Toolbar - Only show if not MAIN/SYSTEM */}
                            {owner && (owner.owner_type !== "MAIN" && owner.owner_type !== "SYSTEM") && (
                                <div className="flex-shrink-0 px-6 bg-white border-b border-gray-200 pb-4">
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
                            )}

                            {/* Units Body - Only show if not MAIN/SYSTEM */}
                            {owner && (owner.owner_type !== "MAIN" && owner.owner_type !== "SYSTEM") && (
                                <div className="flex-1 overflow-y-auto p-6">
                                    <DataTable<UnitRow>
                                        loading={unitsLoading}
                                        rows={units}
                                        pagination={unitsPagination}
                                        onPageChange={(p) => { setUnitsPage(p); }}
                                        itemName="units"
                                        emptyTitle="No units assigned"
                                        emptyDescription="This owner does not have any attached properties or unit ledgers currently registered in the database."
                                        onRowClick={(row) => {
                                            setSelectedUnit(row as unknown as UnitRecord);
                                            setUnitPanelOpen(true);
                                        }}
                                        columns={[
                                        {
                                            key: "avatar",
                                            label: "",
                                            width: "56px",
                                            renderCell: (row) => (
                                                <div className="w-9 h-9 rounded-md bg-[#7a0f1f] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-white">
                                                        {row.unit_name?.charAt(0).toUpperCase() ?? "?"}
                                                    </span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "unit_name",
                                            label: "Unit Name",
                                            sortable: true,
                                            flex: true,
                                            width: "50%",
                                        },
                                        {
                                            key: "building",
                                            label: "Property",
                                            flex: true,
                                            width: "50%",
                                            renderCell: (row) => row.property?.name ?? <span className="text-gray-300">—</span>,
                                        },
                                        {
                                            key: "status",
                                            label: "Status",
                                            width: "110px",
                                            align: "center",
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
                            )}
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
                            {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Owner"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                open={showConfirmModal}
                icon={Save}
                color={ACCENT}
                title={isEdit ? "Confirm Update" : "Confirm Creation"}
                message={
                    <>
                        Are you sure you want to {isEdit ? "update" : "create"} the owner{" "}
                        <strong>{name.trim() || "with the provided details"}</strong>?
                        {!isEdit && openingBalance && (
                            <> An opening balance of <strong>₱{parseFloat(openingBalance).toLocaleString()}</strong> will be set.</>
                        )}
                    </>
                }
                confirmLabel={isEdit ? "Update Owner" : "Create Owner"}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={performSave}
                isConfirming={isSaving}
            />

            {/* Loading Modal */}
            <LoadingModal
                isOpen={isSaving}
                title={isEdit ? "Updating Owner" : "Creating Owner"}
                message={isEdit ? "Please wait while we update the owner details..." : "Please wait while we create the new owner..."}
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
            {/* Unit Create/Edit sub-panel — stacked on top */}
            <UnitCreateEditPanel
                open={unitPanelOpen}
                unit={selectedUnit}
                defaultOwnerId={owner?.id ?? null}
                onClose={() => {
                    setUnitPanelOpen(false);
                    setSelectedUnit(null);
                }}
                onSaved={() => {
                    setUnitPanelOpen(false);
                    setSelectedUnit(null);
                    fetchUnits();
                }}
            />
        </>
    );
}
