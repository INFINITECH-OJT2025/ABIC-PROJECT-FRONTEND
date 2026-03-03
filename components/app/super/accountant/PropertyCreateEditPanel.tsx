"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Building2, MapPin, Plus, Save, Home, Square, Store, LayoutGrid, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import DataTable, { DataTableColumn, PaginationMeta } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";
import UnitCreateEditPanel, { Unit as UnitRecord } from "@/components/app/super/accountant/UnitCreateEditPanel";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

type UnitRow = {
    id: number;
    unit_name: string;
    status: string;
    owner?: { id: number; name: string } | null;
};

export type PropertyType = "CONDOMINIUM" | "HOUSE" | "LOT" | "COMMERCIAL" | "SUBDIVISION";
export type PropertyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Property {
    id: number;
    name: string;
    property_type: PropertyType;
    address?: string | null;
    status: PropertyStatus;
    created_at?: string;
    updated_at?: string;
}

export interface PropertyCreateEditPanelProps {
    open: boolean;
    property: Property | null;
    onClose: () => void;
    onSaved: () => void;
}

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
    { value: "CONDOMINIUM", label: "Condominium" },
    { value: "HOUSE", label: "House" },
    { value: "LOT", label: "Lot" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "SUBDIVISION", label: "Subdivision" },
];

export default function PropertyCreateEditPanel({
    open,
    property,
    onClose,
    onSaved,
}: PropertyCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!property;

    const [isClosing, setIsClosing] = useState(false);
    const [name, setName] = useState("");
    const [propertyType, setPropertyType] = useState<PropertyType>("CONDOMINIUM");
    const [address, setAddress] = useState("");
    const [status, setStatus] = useState<PropertyStatus>("ACTIVE");
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Units list (edit mode only)
    const [units, setUnits] = useState<UnitRow[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [unitsPagination, setUnitsPagination] = useState<PaginationMeta | null>(null);
    const [unitsSearch, setUnitsSearch] = useState("");
    const [unitsStatus, setUnitsStatus] = useState("all");
    const [unitsPage, setUnitsPage] = useState(1);

    // Unit panel state (only when editing property)
    const [unitPanelOpen, setUnitPanelOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<UnitRecord | null>(null);

    const fetchUnits = useCallback(async () => {
        if (!property) return;
        setUnitsLoading(true);
        try {
            const url = new URL("/api/accountant/maintenance/units", window.location.origin);
            url.searchParams.set("property_id", property.id.toString());
            url.searchParams.set("page", unitsPage.toString());
            url.searchParams.set("per_page", "10");
            if (unitsSearch.trim()) url.searchParams.set("search", unitsSearch.trim());
            if (unitsStatus !== "all") url.searchParams.set("status", unitsStatus);

            const res = await fetch(url.toString());
            if (!res.ok) {
                setUnits([]);
                setUnitsPagination(null);
                return;
            }
            const data = await res.json();
            if (data.success) {
                const page = data.data;
                const list = page?.data ?? data.data ?? [];
                setUnits(Array.isArray(list) ? list : []);

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
    }, [property, unitsSearch, unitsStatus, unitsPage]);

    useEffect(() => {
        if (open && property) {
            setUnitsSearch("");
            setUnitsStatus("all");
            setUnitsPage(1);
        }
    }, [open, property]);

    useEffect(() => {
        if (open && property) {
            fetchUnits();
        }
    }, [open, property, fetchUnits]);

    useEffect(() => {
        if (open) {
            setIsClosing(false);
            if (property) {
                setName(property.name);
                setPropertyType(property.property_type);
                setAddress(property.address ?? "");
                setStatus(property.status);
            } else {
                setName("");
                setPropertyType("CONDOMINIUM");
                setAddress("");
                setStatus("ACTIVE");
            }
            setErrors({});
            setTouched({});
        }
    }, [open, property]);

    function validate() {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Property name is required.";
        if (name.trim().length < 2) errs.name = "Property name must be at least 2 characters.";
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

    async function handleSave() {
        setTouched({ name: true, propertyType: true });
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
            const payload = {
                name: name.trim(),
                property_type: propertyType,
                address: address.trim() || null,
                status,
            };

            const url = isEdit
                ? `/api/accountant/maintenance/properties/${property!.id}`
                : "/api/accountant/maintenance/properties";
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
                throw new Error(data.message || "Failed to save property.");
            }

            showToast(
                isEdit ? "Property Updated" : "Property Created",
                isEdit ? "Property details updated successfully." : "New property created successfully.",
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

    if (!open) return null;

    const fieldClass =
        "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1 mt-2";

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel — slides in from right */}
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl transition-all duration-300 ease-in-out"
                style={{
                    maxWidth: isEdit ? "72rem" : "32rem",
                    animation: isClosing ? "propertySlideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "propertySlideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">
                            {isEdit ? "Property Details" : "Add New Property"}
                        </h2>
                        <p className="text-sm text-white/90 mt-0.5">
                            {isEdit ? "Update property details" : "Create a new property record"}
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
                    {/* LEFT COLUMN: Property Form */}
                    <div className={`flex flex-col overflow-y-auto px-6 py-6 space-y-5 bg-white transition-all duration-300 ${isEdit ? "w-[360px] border-r border-gray-200 flex-shrink-0" : "w-full"}`}>
                        {/* Property Name */}
                        <div>
                            <label className={labelClass}>Property Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toUpperCase())}
                                    onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                                    placeholder="e.g. KADENANG GINTO TOWER"
                                    maxLength={100}
                                    className={`${fieldClass} ${touched.name && errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                />
                            </div>
                            {touched.name && errors.name && (
                                <FormTooltipError message={errors.name} />
                            )}
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className={labelClass}>Property Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {propertyType === "CONDOMINIUM" ? <Building2 className="h-4 w-4" /> :
                                        propertyType === "HOUSE" ? <Home className="h-4 w-4" /> :
                                            propertyType === "LOT" ? <Square className="h-4 w-4" /> :
                                                propertyType === "COMMERCIAL" ? <Store className="h-4 w-4" /> :
                                                    <LayoutGrid className="h-4 w-4" />}
                                </div>
                                <select
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                                    className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none"
                                >
                                    {PROPERTY_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {/* Custom Dropdown Arrow */}
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {/* Address */}
                        <div>
                            <label className={labelClass}>Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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

                        {/* Status (edit mode only) */}
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
                                        onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                                        className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Units List (edit mode only, read-only — no Add Unit) */}
                    {isEdit && (
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/30 relative">
                            {/* Units Header */}
                            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-2 bg-white mt-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Associated Units</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Manage units in this property.</p>
                                </div>
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
                            </div>

                            {/* Units Toolbar */}
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

                            {/* Units Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <DataTable<UnitRow>
                                    loading={unitsLoading}
                                    rows={units}
                                    pagination={unitsPagination}
                                    onPageChange={(p) => { setUnitsPage(p); }}
                                    itemName="units"
                                    emptyTitle="No units in this property"
                                    emptyDescription="Add a unit using the Add Unit button above."
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
                                            flex: true,
                                            width: "50%",
                                        },
                                        {
                                            key: "owner",
                                            label: "Owner",
                                            flex: true,
                                            width: "50%",
                                            renderCell: (row) => row.owner?.name ?? <span className="text-gray-300">—</span>,
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
                            disabled={isSaving}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Property"}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes propertySlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes propertySlideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>

            {/* Confirmation Modal */}
            <ConfirmationModal
                open={showConfirmModal}
                icon={Save}
                color={ACCENT}
                title={isEdit ? "Confirm Update" : "Confirm Creation"}
                message={
                    <>
                        Are you sure you want to {isEdit ? "update" : "create"} the property{" "}
                        <strong>{name.trim() || "with the provided details"}</strong>?
                    </>
                }
                confirmLabel={isEdit ? "Update Property" : "Create Property"}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={performSave}
                isConfirming={isSaving}
            />

            {/* Loading Modal */}
            <LoadingModal
                isOpen={isSaving}
                title={isEdit ? "Updating Property" : "Creating Property"}
                message={isEdit ? "Please wait while we update the property details..." : "Please wait while we create the new property..."}
            />

            {/* Unit Create/Edit sub-panel — only visible when opened from property page */}
            <UnitCreateEditPanel
                open={unitPanelOpen}
                unit={selectedUnit}
                defaultPropertyId={property?.id ?? null}
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
