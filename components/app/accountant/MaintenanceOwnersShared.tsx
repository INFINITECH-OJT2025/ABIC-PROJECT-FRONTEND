"use client";

import React, { useState, useEffect, useCallback } from "react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { Plus, X, UserX, RefreshCw, Building2, User, Users, Briefcase, Settings } from "lucide-react";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import LoadingModal from "@/components/app/LoadingModal";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import { superAdminNav, accountantNav } from "@/lib/navigation";

import { OwnerCreateEditPanelProps, Owner, OwnerType, OwnerStatus } from "@/components/app/super/accountant/OwnerCreateEditPanel";
import OwnerCreateEditPanel from "@/components/app/super/accountant/OwnerCreateEditPanel";

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

const OWNER_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "COMPANY", label: "Company" },
    { value: "CLIENT", label: "Client" },
    { value: "MAIN", label: "Main" },
    { value: "SYSTEM", label: "System" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function ownerTypeIcon(type: OwnerType) {
    if (type === "COMPANY") return <Building2 className="w-4 h-4" />;
    if (type === "MAIN") return <Briefcase className="w-4 h-4" />;
    if (type === "SYSTEM") return <Settings className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
}

function ownerTypeBadge(type: OwnerType) {
    const map: Record<OwnerType, { bg: string; text: string; label: string }> = {
        COMPANY: { bg: "bg-blue-100", text: "text-blue-700", label: "Company" },
        CLIENT: { bg: "bg-purple-100", text: "text-purple-700", label: "Client" },
        MAIN: { bg: "bg-amber-100", text: "text-amber-700", label: "Main" },
        SYSTEM: { bg: "bg-gray-100", text: "text-gray-500", label: "System" },
    };
    const s = map[type] ?? { bg: "bg-gray-100", text: "text-gray-600", label: type };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${s.bg} ${s.text}`}>
            {ownerTypeIcon(type)}
            {s.label}
        </span>
    );
}

function statusBadge(status: OwnerStatus) {
    const map: Record<OwnerStatus, { bg: string; text: string }> = {
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
    Eye: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Refresh: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
};

// ─── Internal Stats Component ─────────────────────────────────────────────────

function OwnerStatsBar() {
    const [stats, setStats] = useState<{
        totalOwners: number;
        clientCount: number;
        companyCount: number;
        mainCount: number;
        systemCount: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const ownersRes = await fetch("/api/accountant/maintenance/owners?per_page=all", { method: "GET" });
                const ownersData = await ownersRes.json().catch(() => ({}));

                const ownersList: { owner_type: string }[] = Array.isArray(ownersData?.data) ? ownersData.data : [];
                const visibleOwners = ownersList.filter((o) => o.owner_type !== "SYSTEM");

                setStats({
                    totalOwners: visibleOwners.length,
                    clientCount: visibleOwners.filter(o => o.owner_type === "CLIENT").length,
                    companyCount: visibleOwners.filter(o => o.owner_type === "COMPANY").length,
                    mainCount: visibleOwners.filter(o => o.owner_type === "MAIN").length,
                    systemCount: ownersList.filter(o => o.owner_type === "SYSTEM").length,
                });
            } catch (err) {
                console.error("OwnerStatsBar: failed to fetch stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <SummaryBar>
            <StatPill icon={Users} label="Total" value={stats?.totalOwners ?? null} />
            <StatPill icon={Users} label="Clients" value={stats?.clientCount ?? null} />
            <StatPill icon={Briefcase} label="Companies" value={stats?.companyCount ?? null} />
            <StatPill icon={Building2} label="Main" value={stats?.mainCount ?? null} />
            <StatPill icon={Settings} label="System" value={stats?.systemCount ?? null} />
        </SummaryBar>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaintenanceOwnersShared({ role }: { role: "superadmin" | "accountant" }) {
    const navigation = role === "superadmin" ? superAdminNav : accountantNav;
    const { showToast } = useAppToast();

    // List state
    const [owners, setOwners] = useState<Owner[]>([]);
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
    const [highlightId, setHighlightId] = useState<number | null>(null);

    // Panel state
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

    // Deactivate (inactive) confirmation
    const [deactivateTarget, setDeactivateTarget] = useState<Owner | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [showDeactivateLoading, setShowDeactivateLoading] = useState(false);

    // Restore (active) confirmation
    const [restoreTarget, setRestoreTarget] = useState<Owner | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestoreLoading, setShowRestoreLoading] = useState(false);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter, typeFilter]);

    // Parse highlight from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hl = params.get("highlight");
        if (hl) setHighlightId(Number(hl));
    }, []);

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchOwners = useCallback(async () => {
        setIsLoading(true);
        const minDelay = new Promise((r) => setTimeout(r, 800));
        try {
            const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
            if (query.trim()) url.searchParams.append("search", query.trim());
            if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
            if (typeFilter !== "all") url.searchParams.append("owner_type", typeFilter);
            url.searchParams.append("page", currentPage.toString());
            url.searchParams.append("per_page", "10");

            const [res] = await Promise.all([
                fetch(url.toString(), { method: "GET" }),
                minDelay,
            ]);

            const data = await res.json();
            if (res.ok && data.success) {
                const list = data.data?.data || data.data || [];
                setOwners(Array.isArray(list) ? list : []);

                if (data.data?.current_page !== undefined) {
                    setPaginationMeta({
                        current_page: data.data.current_page ?? 1,
                        last_page: data.data.last_page ?? 1,
                        per_page: data.data.per_page ?? 10,
                        total: data.data.total ?? 0,
                        from: data.data.from ?? 0,
                        to: data.data.to ?? 0,
                    });
                } else {
                    setPaginationMeta(null);
                }
            }
        } catch (err) {
            console.error("Error fetching owners:", err);
        } finally {
            setIsLoading(false);
        }
    }, [query, statusFilter, typeFilter, currentPage]);

    useEffect(() => {
        fetchOwners();
    }, [fetchOwners]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    function openCreate() {
        setEditingOwner(null);
        setPanelOpen(true);
    }

    function openEdit(owner: Owner) {
        setEditingOwner(owner);
        setPanelOpen(true);
    }

    async function handleDeactivate() {
        if (!deactivateTarget) return;
        const id = deactivateTarget.id;
        setDeactivateTarget(null);
        setIsDeactivating(true);
        setShowDeactivateLoading(true);
        try {
            const res = await fetch(`/api/accountant/maintenance/owners/${id}/inactive`, {
                method: "POST",
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await fetchOwners();
                showToast("Owner Deactivated", "The owner has been set to inactive.", "success");
            } else {
                showToast("Failed", data.message || "Could not deactivate owner.", "error");
            }
        } catch {
            showToast("Failed", "Please try again later.", "error");
        } finally {
            setIsDeactivating(false);
            setShowDeactivateLoading(false);
        }
    }

    async function handleRestore() {
        if (!restoreTarget) return;
        const id = restoreTarget.id;
        setRestoreTarget(null);
        setIsRestoring(true);
        setShowRestoreLoading(true);
        try {
            const res = await fetch(`/api/accountant/maintenance/owners/${id}/restore`, {
                method: "POST",
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await fetchOwners();
                showToast("Owner Restored", "The owner has been restored to active.", "success");
            } else {
                showToast("Failed", data.message || "Could not restore owner.", "error");
            }
        } catch {
            showToast("Failed", "Please try again later.", "error");
        } finally {
            setIsRestoring(false);
            setShowRestoreLoading(false);
        }
    }

    // ─── Table columns ────────────────────────────────────────────────────────

    const OWNER_COLUMNS: DataTableColumn<Owner>[] = [
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
            label: "Owner Name",
            flex: true,
            sortable: true,
            renderCell: (row) => (
                <div>
                    <div className="font-semibold text-base text-neutral-900 uppercase">{row.name}</div>
                    {row.email && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">{row.email}</div>
                    )}
                </div>
            ),
        },
        {
            key: "owner_type",
            label: "Type",
            width: "120px",
            renderCell: (row) => ownerTypeBadge(row.owner_type),
        },
        {
            key: "status",
            label: "Status",
            width: "110px",
            renderCell: (row) => statusBadge(row.status),
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

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={navigation}
                subtitle="Create and manage owner records"
            />
            <OwnerStatsBar />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                        style={{ borderColor: BORDER }}
                >
                    {/* ── Section header ── */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Owners List</h2>
                            <p className="text-sm text-gray-600 mt-1">Create and manage owner records</p>
                        </div>
                        <button
                            id="add-owner-btn"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Owner
                        </button>
                    </div>

                    {/* ── Filters ── */}
                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                        searchPlaceholder="Search owners..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchOwners}
                        statusOptions={STATUS_OPTIONS}
                    >
                        {/* Owner Type Filter */}
                        <select
                            id="owner-type-filter"
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
                        >
                            {OWNER_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </SharedToolbar>

                    {/* ── Table ── */}
                    <div className="mt-4">
                        <DataTable<Owner>
                            columns={OWNER_COLUMNS}
                            rows={owners}
                            loading={isLoading}
                            skeletonCount={6}
                            emptyTitle="No owners found"
                            emptyDescription="Add a new owner or adjust your search filters."
                            onRowClick={(row) => openEdit(row)}
                            isRowSelected={(row) => row.id === highlightId}
                            pagination={paginationMeta}
                            onPageChange={(page) => setCurrentPage(page)}
                            itemName="owners"
                        />
                    </div>
                </section>
            </div>

            {/* ── Create / Edit Panel ── */}
            <OwnerCreateEditPanel
                open={panelOpen}
                owner={editingOwner}
                onClose={() => setPanelOpen(false)}
                onSaved={() => fetchOwners()}
                onDeactivate={(o: Owner) => setDeactivateTarget(o)}
                onRestore={(o: Owner) => setRestoreTarget(o)}
            />

            {/* ── Deactivate Confirmation ── */}
            <ConfirmationModal
                open={!!deactivateTarget}
                icon={UserX}
                color="#f97316"
                title="Deactivate Owner"
                message={
                    <>
                        Are you sure you want to deactivate{" "}
                        <strong>{deactivateTarget?.name}</strong>? They will be set to inactive.
                    </>
                }
                confirmLabel="Deactivate"
                onCancel={() => setDeactivateTarget(null)}
                onConfirm={handleDeactivate}
                isConfirming={isDeactivating}
            />

            {/* ── Restore Confirmation ── */}
            <ConfirmationModal
                open={!!restoreTarget}
                icon={RefreshCw}
                color="#16a34a"
                title="Restore Owner"
                message={
                    <>
                        Are you sure you want to restore{" "}
                        <strong>{restoreTarget?.name}</strong> to active status?
                    </>
                }
                confirmLabel="Restore"
                onCancel={() => setRestoreTarget(null)}
                onConfirm={handleRestore}
                isConfirming={isRestoring}
            />

            {/* ── Loading Modals ── */}
            <LoadingModal
                isOpen={showDeactivateLoading}
                title="Deactivating Owner"
                message="Please wait..."
            />
            <LoadingModal
                isOpen={showRestoreLoading}
                title="Restoring Owner"
                message="Please wait..."
            />
        </div>
    );
}
