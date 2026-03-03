"use client";

import React, { useState, useEffect, useCallback } from "react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { Plus, Building2, Home, MapPin } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import { superAdminNav } from "@/lib/navigation";

import PropertyCreateEditPanel, {
    Property,
    PropertyType,
    PropertyStatus,
} from "@/components/app/super/accountant/PropertyCreateEditPanel";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

const PROPERTY_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "CONDOMINIUM", label: "Condominium" },
    { value: "HOUSE", label: "House" },
    { value: "LOT", label: "Lot" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "SUBDIVISION", label: "Subdivision" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" },
];

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleDateString();
    } catch {
        return "—";
    }
};

function propertyTypeBadge(type: PropertyType) {
    const map: Record<PropertyType, { bg: string; text: string; label: string }> = {
        CONDOMINIUM: { bg: "bg-blue-100", text: "text-blue-700", label: "Condominium" },
        HOUSE: { bg: "bg-amber-100", text: "text-amber-700", label: "House" },
        LOT: { bg: "bg-green-100", text: "text-green-700", label: "Lot" },
        COMMERCIAL: { bg: "bg-purple-100", text: "text-purple-700", label: "Commercial" },
        SUBDIVISION: { bg: "bg-teal-100", text: "text-teal-700", label: "Subdivision" },
    };
    const s = map[type] ?? { bg: "bg-gray-100", text: "text-gray-600", label: type };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

function statusBadge(status: PropertyStatus) {
    const map: Record<PropertyStatus, { bg: string; text: string }> = {
        ACTIVE: { bg: "bg-green-100", text: "text-green-700" },
        INACTIVE: { bg: "bg-gray-100", text: "text-gray-600" },
        SUSPENDED: { bg: "bg-red-100", text: "text-red-700" },
    };
    const s = map[status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
            {label}
        </span>
    );
}

const Icons = {
    Eye: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

function PropertyStatsBar() {
    const [stats, setStats] = useState<{
        total: number;
        condominium: number;
        commercial: number;
        active: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/accountant/maintenance/properties?per_page=all&status=all", { method: "GET" });
                const data = await res.json().catch(() => ({}));

                const list: Property[] = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? data?.data ?? []);
                const arr = Array.isArray(list) ? list : [];

                setStats({
                    total: arr.length,
                    condominium: arr.filter((p: Property) => p.property_type === "CONDOMINIUM").length,
                    commercial: arr.filter((p: Property) => p.property_type === "COMMERCIAL").length,
                    active: arr.filter((p: Property) => p.status === "ACTIVE").length,
                });
            } catch (err) {
                console.error("PropertyStatsBar: failed to fetch stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <SummaryBar>
            <StatPill icon={Building2} label="Total Properties" value={stats?.total ?? null} />
            <StatPill icon={Home} label="Condominiums" value={stats?.condominium ?? null} />
            <StatPill icon={MapPin} label="Commercial" value={stats?.commercial ?? null} />
            <StatPill icon={Building2} label="Active" value={stats?.active ?? null} />
        </SummaryBar>
    );
}

export default function PropertiesPage() {
    const { showToast } = useAppToast();

    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    } | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter, typeFilter]);

    const fetchProperties = useCallback(async () => {
        setIsLoading(true);
        const minDelay = new Promise((r) => setTimeout(r, 800));
        try {
            const url = new URL("/api/accountant/maintenance/properties", window.location.origin);
            if (query.trim()) url.searchParams.append("search", query.trim());
            if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
            if (typeFilter !== "all") url.searchParams.append("property_type", typeFilter);
            url.searchParams.append("page", currentPage.toString());
            url.searchParams.append("per_page", "10");

            const [res] = await Promise.all([
                fetch(url.toString(), { method: "GET" }),
                minDelay,
            ]);

            const data = await res.json();
            if (res.ok && data.success) {
                const raw = data.data;
                const list = raw?.data ?? (Array.isArray(raw) ? raw : []);
                setProperties(Array.isArray(list) ? list : []);

                if (raw?.current_page !== undefined) {
                    setPaginationMeta({
                        current_page: raw.current_page ?? 1,
                        last_page: raw.last_page ?? 1,
                        per_page: raw.per_page ?? 10,
                        total: raw.total ?? 0,
                        from: raw.from ?? 0,
                        to: raw.to ?? 0,
                    });
                } else {
                    setPaginationMeta(null);
                }
            }
        } catch (err) {
            console.error("Error fetching properties:", err);
        } finally {
            setIsLoading(false);
        }
    }, [query, statusFilter, typeFilter, currentPage]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    function openCreate() {
        setEditingProperty(null);
        setPanelOpen(true);
    }

    function openEdit(property: Property) {
        setEditingProperty(property);
        setPanelOpen(true);
    }

    const PROPERTY_COLUMNS: DataTableColumn<Property>[] = [
        {
            key: "avatar",
            label: "",
            width: "56px",
            renderCell: (row) => (
                <div
                    className="w-9 h-9 rounded-md flex items-center justify-center"
                    style={{ background: ACCENT }}
                >
                    <span className="text-sm font-bold text-white">
                        {row.name?.charAt(0).toUpperCase()}
                    </span>
                </div>
            ),
        },
        {
            key: "name",
            label: "Property Name",
            flex: true,
            renderCell: (row) => (
                <div>
                    <div className="font-semibold text-base text-neutral-900">{row.name}</div>
                    {row.address && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">{row.address}</div>
                    )}
                </div>
            ),
        },
        {
            key: "property_type",
            label: "Type",
            width: "130px",
            renderCell: (row) => propertyTypeBadge(row.property_type),
        },
        {
            key: "status",
            label: "Status",
            width: "110px",
            renderCell: (row) => statusBadge(row.status),
        },
        {
            key: "created_at",
            label: "Created",
            width: "110px",
            renderCell: (row) => formatDate(row.created_at),
        },
        {
            key: "actions",
            label: "",
            width: "80px",
            align: "right",
            renderCell: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity active:scale-95"
                    style={{ background: ACCENT, height: 30 }}
                >
                    <Icons.Eye />
                    View
                </button>
            ),
        },
    ];

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                subtitle="Create and manage property records"
            />
            <PropertyStatsBar />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Properties List</h2>
                            <p className="text-sm text-gray-600 mt-1">Create and manage property records</p>
                        </div>
                        <button
                            id="add-property-btn"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Property
                        </button>
                    </div>

                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                        searchPlaceholder="Search properties..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchProperties}
                        statusOptions={STATUS_OPTIONS}
                    >
                        <select
                            id="property-type-filter"
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
                        >
                            {PROPERTY_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </SharedToolbar>

                    <div className="mt-4">
                        <DataTable<Property>
                            columns={PROPERTY_COLUMNS}
                            rows={properties}
                            loading={isLoading}
                            skeletonCount={6}
                            emptyTitle="No properties found"
                            emptyDescription="Add a new property or adjust your search filters."
                            onRowClick={(row) => openEdit(row)}
                            pagination={paginationMeta}
                            onPageChange={(page) => setCurrentPage(page)}
                            itemName="properties"
                        />
                    </div>
                </section>
            </div>

            <PropertyCreateEditPanel
                open={panelOpen}
                property={editingProperty}
                onClose={() => setPanelOpen(false)}
                onSaved={() => fetchProperties()}
            />
        </div>
    );
}
