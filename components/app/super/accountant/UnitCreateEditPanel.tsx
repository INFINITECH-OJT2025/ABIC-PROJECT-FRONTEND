"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Hash, AlignLeft, Building2, RefreshCw, User, Calendar, Save, Info, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UnitStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Unit {
    id: number;
    owner_id?: number | null;
    property_id?: number | null;
    unit_name: string;
    status: UnitStatus;
    notes?: string | null;
    property?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

interface PropertyOption {
    id: number;
    name: string;
}

export interface UnitCreateEditPanelProps {
    open: boolean;
    unit: Unit | null;
    defaultOwnerId?: number | null;
    defaultPropertyId?: number | null;
    /** Pre-fill the unit name field in create mode (e.g. from a search query). */
    defaultName?: string;
    onClose: () => void;
    /** Called after save. Passes the created/updated unit when available. */
    onSaved: (savedUnit?: { id: number; unit_name: string; status: string } | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnitCreateEditPanel({
    open,
    unit,
    defaultOwnerId,
    defaultPropertyId,
    defaultName,
    onClose,
    onSaved,
}: UnitCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!unit;

    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Form fields
    const [unitName, setUnitName] = useState("");
    const [propertyId, setPropertyId] = useState<number | "">("");
    const [status, setStatus] = useState<UnitStatus>("ACTIVE");
    const [notes, setNotes] = useState("");
    const [openingBalance, setOpeningBalance] = useState("");
    const [openingDate, setOpeningDate] = useState("");

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Owner (when creating from property page — no defaultOwnerId)
    const [ownerId, setOwnerId] = useState<number | "">("");
    const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(false);
    const [ownerSearch, setOwnerSearch] = useState("");
    const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
    const ownerDropdownRef = useRef<HTMLDivElement>(null);

    // Properties search-dropdown
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertySearch, setPropertySearch] = useState("");
    const [propDropdownOpen, setPropDropdownOpen] = useState(false);
    const propDropdownRef = useRef<HTMLDivElement>(null);

    // SSR guard — portal needs the browser DOM
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch owners (CLIENT, COMPANY) when creating from property page
    const fetchOwners = useCallback(async () => {
        setOwnersLoading(true);
        try {
            const res = await fetch("/api/accountant/maintenance/owners?per_page=all");
            const data = await res.json();
            if (res.ok && data.success) {
                const list = data.data?.data ?? data.data ?? [];
                const arr = Array.isArray(list) ? list : [];
                const withUnits = arr.filter((o: { owner_type?: string }) =>
                    o.owner_type === "CLIENT" || o.owner_type === "COMPANY"
                );
                setOwners(withUnits.map((o: { id: number; name: string }) => ({ id: o.id, name: o.name })));
            }
        } catch { /* fail silently */ } finally {
            setOwnersLoading(false);
        }
    }, []);

    // Fetch available properties for the dropdown (only active properties)
    const fetchProperties = useCallback(async () => {
        setPropertiesLoading(true);
        try {
            const res = await fetch("/api/accountant/maintenance/properties?per_page=200&status=ACTIVE");
            if (!res.ok) return;
            const data = await res.json();
            if (data.success) {
                const list: PropertyOption[] = (data.data?.data ?? data.data ?? [])
                    .filter((p: { status?: string }) => p.status === "ACTIVE")
                    .map(
                        (p: { id: number; name: string }) => ({ id: p.id, name: p.name })
                    );
                setProperties(list);
            }
        } catch { /* fail silently */ } finally {
            setPropertiesLoading(false);
        }
    }, []);

    // Update propertySearch when properties load and defaultPropertyId is set
    useEffect(() => {
        if (defaultPropertyId && properties.length > 0 && propertyId === defaultPropertyId) {
            const prop = properties.find((p) => p.id === defaultPropertyId);
            if (prop && propertySearch !== prop.name) {
                setPropertySearch(prop.name);
            }
        }
    }, [properties, defaultPropertyId, propertyId, propertySearch]);

    // Close property dropdown on outside click
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (propDropdownRef.current && !propDropdownRef.current.contains(e.target as Node)) {
                setPropDropdownOpen(false);
            }
            if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target as Node)) {
                setOwnerDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    // Reset form whenever the panel opens or the target unit changes
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            fetchProperties();
            if (!unit && !defaultOwnerId) {
                fetchOwners();
            }
            if (unit) {
                setUnitName(unit.unit_name);
                setPropertyId(unit.property_id ?? "");
                setOwnerId(unit.owner_id ?? "");
                setPropertySearch("");
                setStatus(unit.status);
                setNotes(unit.notes ?? "");
            } else {
                setUnitName(defaultName ?? "");
                const propId = defaultPropertyId ?? "";
                setPropertyId(propId);
                setOwnerId(defaultOwnerId ?? "");
                setPropertySearch(""); // Will be populated when properties load
                setOwnerSearch("");
                setStatus("ACTIVE");
                setNotes("");
                setOpeningBalance("");
                setOpeningDate("");
            }
            setPropDropdownOpen(false);
            setOwnerDropdownOpen(false);
            setErrors({});
            setTouched({});
        }
    }, [open, unit, defaultOwnerId, defaultPropertyId, fetchProperties, fetchOwners]);

    function validate() {
        const errs: Record<string, string> = {};
        if (!unitName.trim()) errs.unitName = "Unit name is required.";
        if (!isEdit && !defaultOwnerId && ownerId === "") {
            errs.ownerId = "Owner is required.";
        }
        if (openingBalance && isNaN(Number(openingBalance))) errs.openingBalance = "Must be a valid number.";
        if (openingBalance && Number(openingBalance) < 0) errs.openingBalance = "Must be 0 or greater.";
        if (openingBalance && !openingDate) errs.openingDate = "Opening date is required when balance is set.";
        return errs;
    }

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setErrors({});
            setTouched({});
        }, 350);
    };

    function handleSave() {
        setTouched({ unitName: true, ownerId: true, openingBalance: true, openingDate: true });
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        // Show confirmation modal
        setShowConfirmModal(true);
    }

    async function performSave() {
        setShowConfirmModal(false);
        setIsSaving(true);
        try {
            const payload: Record<string, unknown> = {
                unit_name: unitName.trim(),
                property_id: propertyId !== "" ? propertyId : null,
                status,
                notes: notes.trim() || null,
            };
            const oid = isEdit
                ? (unit!.owner_id ?? (unit as Unit & { owner?: { id: number } })?.owner?.id)
                : (defaultOwnerId ?? (ownerId !== "" ? ownerId : null));
            if (oid != null) payload.owner_id = oid;

            // Add opening balance (only in create mode)
            if (!isEdit && openingBalance) {
                payload.opening_balance = parseFloat(openingBalance);
                payload.opening_date = openingDate || null;
            }

            const url = isEdit
                ? `/api/accountant/maintenance/units/${unit!.id}`
                : "/api/accountant/maintenance/units";
            const method = isEdit ? "PUT" : "POST";

            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                if (data.errors) {
                    const fe: Record<string, string> = {};
                    for (const [key, msgs] of Object.entries(data.errors)) {
                        fe[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
                    }
                    setErrors(fe);
                }
                throw new Error(data.message || "Failed to save unit.");
            }

            showToast(
                isEdit ? "Unit Updated" : "Unit Created",
                isEdit ? "Unit details updated successfully." : "New unit created successfully.",
                "success"
            );
            const savedUnit = data.data
                ? { id: data.data.id, unit_name: data.data.unit_name ?? unitName.trim(), status: data.data.status ?? "ACTIVE" }
                : null;
            onSaved(savedUnit);
            handleClose();
        } catch (err: unknown) {
            showToast("Save Failed", err instanceof Error ? err.message : "An error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    // Don't render anything until mounted (portal needs document.body)
    // and don't render when fully closed
    if (!mounted || (!open && !isClosing)) return null;

    const fieldClass =
        "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

    const formatBalance = (val: string) => {
        if (!val) return "";
        const parts = val.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const animationStyle = isClosing
        ? "unitPanelSlideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
        : "unitPanelSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)";

    return (
        <>
            {createPortal(
                <>
                    {/* Global keyframes — injected once, portal-safe */}
                    <style>{`
                        @keyframes unitPanelSlideIn {
                            from { transform: translateX(100%); }
                            to   { transform: translateX(0); }
                        }
                        @keyframes unitPanelSlideOut {
                            from { transform: translateX(0); }
                            to   { transform: translateX(100%); }
                        }
                    `}</style>

                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black/50 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                        style={{ zIndex: 200 }}
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white flex flex-col rounded-md overflow-hidden shadow-xl"
                        style={{
                            zIndex: 210,
                            maxWidth: "32rem",
                            animation: animationStyle,
                            boxShadow: "-8px 0 24px rgba(0,0,0,0.18)",
                        }}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                            <div>
                                <h2 className="text-lg font-bold">
                                    {isEdit ? "Edit Unit" : "Add New Unit"}
                                </h2>
                                <p className="text-sm text-white/90 mt-0.5">
                                    {isEdit ? "Update unit details" : "Create a new unit record"}
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

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-white">

                            {/* Owner (when creating from property page — no defaultOwnerId) */}
                            {!isEdit && !defaultOwnerId && (
                                <div ref={ownerDropdownRef}>
                                    <label className={labelClass}>Owner <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        {/* Flex wrapper that IS the field */}
                                        <div className={`flex items-center h-10 w-full rounded-lg border bg-white focus-within:ring-2 transition-all overflow-hidden ${touched.ownerId && errors.ownerId ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20" : "border-gray-300 focus-within:border-[#7B0F2B] focus-within:ring-[#7B0F2B]/20"}`}>
                                            {/* Left icon */}
                                            <div className="pl-3 pr-2 flex-shrink-0 text-gray-400 pointer-events-none">
                                                {ownersLoading
                                                    ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                    : <User className="h-4 w-4" />}
                                            </div>

                                            {/* Input */}
                                            <input
                                                type="text"
                                                placeholder={ownerId !== "" ? (owners.find((o) => o.id === ownerId)?.name ?? "Search owner…") : "Search owner…"}
                                                value={ownerSearch}
                                                disabled={ownersLoading}
                                                onChange={(e) => {
                                                    setOwnerSearch(e.target.value);
                                                    setOwnerDropdownOpen(true);
                                                    if (errors.ownerId) setErrors((p) => { const n = { ...p }; delete n.ownerId; return n; });
                                                }}
                                                onFocus={() => {
                                                    setOwnerDropdownOpen(true);
                                                    setTouched((p) => ({ ...p, ownerId: true }));
                                                }}
                                                onBlur={() => setTouched((p) => ({ ...p, ownerId: true }))}
                                                onKeyDown={(e) => { if (e.key === "Escape") setOwnerDropdownOpen(false); }}
                                                className={`flex-1 h-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 ${ownerId !== "" ? "placeholder:text-gray-900" : ""}`}
                                            />

                                            {/* Right: Clear (✕) or chevron (↓) */}
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                className="px-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                                onClick={() => {
                                                    setOwnerId("");
                                                    setOwnerSearch("");
                                                    setOwnerDropdownOpen(false);
                                                }}
                                            >
                                                {ownerId !== "" ? (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                ) : (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                )}
                                            </button>
                                        </div>

                                        {/* Dropdown list */}
                                        {ownerDropdownOpen && (
                                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                                <div className="max-h-52 overflow-y-auto">
                                                    {/* No owner option */}
                                                    <button
                                                        type="button"
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${ownerId === "" ? "bg-[#7a0f1f]/5 text-[#7a0f1f] font-semibold" : "text-gray-500"}`}
                                                        onClick={() => { setOwnerId(""); setOwnerSearch(""); setOwnerDropdownOpen(false); }}
                                                    >
                                                        <span className="italic">— No owner —</span>
                                                    </button>

                                                    {/* Filtered owner list */}
                                                    {owners
                                                        .filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase()))
                                                        .map(o => (
                                                            <button
                                                                key={o.id}
                                                                type="button"
                                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${ownerId === o.id ? "bg-[#7a0f1f]/5 text-[#7a0f1f] font-semibold" : "text-gray-800"}`}
                                                                onClick={() => {
                                                                    setOwnerId(o.id);
                                                                    setOwnerSearch("");
                                                                    setOwnerDropdownOpen(false);
                                                                    if (errors.ownerId) setErrors((p) => { const n = { ...p }; delete n.ownerId; return n; });
                                                                }}
                                                            >
                                                                {ownerId === o.id && (
                                                                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                )}
                                                                {o.name}
                                                            </button>
                                                        ))
                                                    }

                                                    {/* Empty state */}
                                                    {owners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).length === 0 && ownerSearch && (
                                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners match &ldquo;{ownerSearch}&rdquo;</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {touched.ownerId && errors.ownerId && (
                                        <FormTooltipError message={errors.ownerId} />
                                    )}
                                    {/* Info message about MAIN/SYSTEM owners */}
                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-800">
                                            <strong>Note:</strong> Only Client and Company owners can have units. Main and System owners cannot be associated with units.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Unit Name */}
                            <div className="relative">
                                <label className={labelClass}>
                                    Unit Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Hash className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={unitName}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setUnitName(val);
                                            if (errors.unitName && val.trim()) {
                                                setErrors((prev: Record<string, string>) => { const n = { ...prev }; delete n.unitName; return n; });
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched((prev: Record<string, boolean>) => ({ ...prev, unitName: true }));
                                            if (!unitName.trim()) setErrors((prev: Record<string, string>) => ({ ...prev, unitName: "Unit name is required." }));
                                        }}
                                        placeholder="e.g. UNIT-101"
                                        maxLength={100}
                                        className={`${fieldClass} ${touched.unitName && errors.unitName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                    />
                                </div>
                                {touched.unitName && (
                                    <FormTooltipError
                                        message={errors.unitName}
                                        onClose={() => setErrors((prev: Record<string, string>) => { const n = { ...prev }; delete n.unitName; return n; })}
                                    />
                                )}
                            </div>

                            {/* Property — searchable combobox (disabled when defaultPropertyId is set) */}
                            <div ref={propDropdownRef}>
                                <label className={labelClass}>Property</label>
                                <div className="relative">
                                    {/* Flex wrapper that IS the field */}
                                    <div className={`flex items-center h-10 w-full rounded-lg border bg-white transition-all overflow-hidden ${defaultPropertyId ? "border-gray-200 bg-gray-50" : "border-gray-300 focus-within:border-[#7B0F2B] focus-within:ring-2 focus-within:ring-[#7B0F2B]/20"}`}>
                                        {/* Left icon */}
                                        <div className="pl-3 pr-2 flex-shrink-0 text-gray-400 pointer-events-none">
                                            {propertiesLoading
                                                ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                : <Building2 className="h-4 w-4" />}
                                        </div>

                                        {/* Input */}
                                        <input
                                            type="text"
                                            placeholder={propertyId !== "" ? (properties.find((p: PropertyOption) => p.id === propertyId)?.name ?? "Search property…") : "Search property…"}
                                            value={defaultPropertyId && propertyId !== ""
                                                ? (properties.find((p: PropertyOption) => p.id === propertyId)?.name ?? propertySearch)
                                                : propertySearch}
                                            disabled={propertiesLoading || !!defaultPropertyId}
                                            readOnly={!!defaultPropertyId}
                                            onChange={(e) => {
                                                if (!defaultPropertyId) {
                                                    setPropertySearch(e.target.value);
                                                    setPropDropdownOpen(true);
                                                }
                                            }}
                                            onFocus={() => {
                                                if (!defaultPropertyId) {
                                                    setPropDropdownOpen(true);
                                                }
                                            }}
                                            onKeyDown={(e) => { if (e.key === "Escape") setPropDropdownOpen(false); }}
                                            className={`flex-1 h-full text-sm outline-none placeholder:text-gray-400 ${propertyId !== "" ? "placeholder:text-gray-900" : ""} ${defaultPropertyId ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "text-gray-900 bg-transparent"}`}
                                        />

                                        {/* Right: Clear (✕) or chevron (↓) - disabled when defaultPropertyId */}
                                        {!defaultPropertyId && (
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                className="px-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                                onClick={() => {
                                                    setPropertyId("");
                                                    setPropertySearch("");
                                                    setPropDropdownOpen(false);
                                                }}
                                            >
                                                {propertyId !== "" ? (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                ) : (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown list - only show when not defaultPropertyId */}
                                    {propDropdownOpen && !defaultPropertyId && (
                                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                            <div className="max-h-52 overflow-y-auto">
                                                {/* No property option */}
                                                <button
                                                    type="button"
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${propertyId === "" ? "bg-[#7a0f1f]/5 text-[#7a0f1f] font-semibold" : "text-gray-500"
                                                        }`}
                                                    onClick={() => { setPropertyId(""); setPropertySearch(""); setPropDropdownOpen(false); }}
                                                >
                                                    <span className="italic">— No property —</span>
                                                </button>

                                                {/* Filtered property list */}
                                                {properties
                                                    .filter(p => p.name.toLowerCase().includes(propertySearch.toLowerCase()))
                                                    .map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${propertyId === p.id ? "bg-[#7a0f1f]/5 text-[#7a0f1f] font-semibold" : "text-gray-800"
                                                                }`}
                                                            onClick={() => {
                                                                setPropertyId(p.id);
                                                                setPropertySearch("");
                                                                setPropDropdownOpen(false);
                                                            }}
                                                        >
                                                            {propertyId === p.id && (
                                                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                            {p.name}
                                                        </button>
                                                    ))
                                                }

                                                {/* Empty state */}
                                                {properties.filter(p => p.name.toLowerCase().includes(propertySearch.toLowerCase())).length === 0 && propertySearch && (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">No properties match &ldquo;{propertySearch}&rdquo;</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status — edit only */}
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
                                            onChange={(e) => setStatus(e.target.value as UnitStatus)}
                                            className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="SUSPENDED">Suspended</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {unit?.status !== status && (
                                        <p className="text-xs text-amber-600 mt-2">
                                            Status will change from <strong>{unit?.status}</strong> to <strong>{status}</strong>.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Opening Balance — only in create mode */}
                            {!isEdit && (
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50 mt-4">
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

                            {/* Notes */}
                            <div>
                                <label className={labelClass}>Notes</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <AlignLeft className="h-4 w-4" />
                                    </div>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Optional notes"
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none resize-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Backend field error */}
                            {errors.unit_name && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                    {errors.unit_name}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div
                            className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t bg-gray-50"
                            style={{ borderColor: BORDER }}
                        >
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
                                disabled={isSaving}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                                style={{ background: ACCENT, height: 40 }}
                            >
                                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Unit"}
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Confirmation Modal - rendered separately with higher z-index to overlay panel */}
            {showConfirmModal && createPortal(
                <ConfirmationModal
                    open={showConfirmModal}
                    icon={Save}
                    color={ACCENT}
                    title={isEdit ? "Confirm Update" : "Confirm Creation"}
                    message={
                        <>
                            Are you sure you want to {isEdit ? "update" : "create"} the unit{" "}
                            <strong>{unitName.trim() || "with the provided details"}</strong>?
                            {!isEdit && openingBalance && (
                                <> An opening balance of <strong>₱{parseFloat(openingBalance).toLocaleString()}</strong> will be set.</>
                            )}
                        </>
                    }
                    confirmLabel={isEdit ? "Update Unit" : "Create Unit"}
                    onCancel={() => setShowConfirmModal(false)}
                    onConfirm={performSave}
                    isConfirming={isSaving}
                    zIndex={400}
                />,
                document.body
            )}

            {/* Loading Modal - above panel and confirmation for visibility */}
            {isSaving && createPortal(
                <LoadingModal
                    isOpen={isSaving}
                    title={isEdit ? "Updating Unit" : "Creating Unit"}
                    message={isEdit ? "Please wait while we update the unit details..." : "Please wait while we create the new unit..."}
                    zIndex={410}
                />,
                document.body
            )}
        </>
    );
}
