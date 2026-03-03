"use client";

import React, { useState, useEffect, useCallback } from "react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { Plus, Banknote } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import { superAdminNav } from "@/lib/navigation";
import BankCreateEditPanel, { Bank as BankRecord } from "@/components/app/super/accountant/BankCreateEditPanel";

// ─── Types ───────────────────────────────────────────────────────────────────────

export type BankStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Bank {
    id: number;
    name: string;
    short_name: string | null;
    country: string | null;
    status: BankStatus;
    created_at: string | null;
    updated_at: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

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

function statusBadge(status: BankStatus) {
    const map: Record<BankStatus, { bg: string; text: string }> = {
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
};

// ─── Internal Stats Component ─────────────────────────────────────────────────

function BankStatsBar() {
    const [stats, setStats] = useState<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/accountant/maintenance/banks?per_page=all", { method: "GET" });
                const data = await res.json().catch(() => ({}));

                const banksList: Bank[] = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? data?.data ?? []);
                const arr = Array.isArray(banksList) ? banksList : [];

                setStats({
                    total: arr.length,
                    active: arr.filter((b: Bank) => b.status === "ACTIVE").length,
                    inactive: arr.filter((b: Bank) => b.status === "INACTIVE").length,
                    suspended: arr.filter((b: Bank) => b.status === "SUSPENDED").length,
                });
            } catch (err) {
                console.error("BankStatsBar: failed to fetch stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <SummaryBar>
            <StatPill icon={Banknote} label="Total Banks" value={stats?.total ?? null} />
            <StatPill icon={Banknote} label="Active" value={stats?.active ?? null} />
            <StatPill icon={Banknote} label="Inactive" value={stats?.inactive ?? null} />
            <StatPill icon={Banknote} label="Suspended" value={stats?.suspended ?? null} />
        </SummaryBar>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BanksPage() {
    const { showToast } = useAppToast();

    // List state
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
    const [editingBank, setEditingBank] = useState<BankRecord | null>(null);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter]);

    // Parse highlight from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hl = params.get("highlight");
        if (hl) setHighlightId(Number(hl));
    }, []);

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchBanks = useCallback(async () => {
        setIsLoading(true);
        const minDelay = new Promise((r) => setTimeout(r, 800));
        try {
            const url = new URL("/api/accountant/maintenance/banks", window.location.origin);
            if (query.trim()) url.searchParams.append("search", query.trim());
            if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
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
                setBanks(Array.isArray(list) ? list : []);

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
            console.error("Error fetching banks:", err);
        } finally {
            setIsLoading(false);
        }
    }, [query, statusFilter, currentPage]);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    function openCreate() {
        setEditingBank(null);
        setPanelOpen(true);
    }

    function openEdit(bank: Bank) {
        setEditingBank(bank);
        setPanelOpen(true);
    }

    // ─── Table columns ────────────────────────────────────────────────────────

    const BANK_COLUMNS: DataTableColumn<Bank>[] = [
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
            label: "Bank Name",
            flex: true,
            sortable: true,
            renderCell: (row) => (
                <div>
                    <div className="font-semibold text-base text-neutral-900 uppercase">{row.name}</div>
                    {row.short_name && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">{row.short_name}</div>
                    )}
                    {row.country && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">{row.country}</div>
                    )}
                </div>
            ),
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

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                subtitle="Create and manage bank records"
            />
            <BankStatsBar />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    {/* ── Section header ── */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Banks List</h2>
                            <p className="text-sm text-gray-600 mt-1">Create and manage bank records</p>
                        </div>
                        <button
                            id="add-bank-btn"
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Bank
                        </button>
                    </div>

                    {/* ── Filters ── */}
                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                        searchPlaceholder="Search banks..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchBanks}
                        statusOptions={STATUS_OPTIONS}
                    />

                    {/* ── Table ── */}
                    <div className="mt-4">
                        <DataTable<Bank>
                            columns={BANK_COLUMNS}
                            rows={banks}
                            loading={isLoading}
                            skeletonCount={6}
                            emptyTitle="No banks found"
                            emptyDescription="Add a new bank or adjust your search filters."
                            onRowClick={(row) => openEdit(row)}
                            isRowSelected={(row) => row.id === highlightId}
                            pagination={paginationMeta}
                            onPageChange={(page) => setCurrentPage(page)}
                            itemName="banks"
                        />
                    </div>
                </section>
            </div>

            {/* ── Create / Edit Panel ── */}
            <BankCreateEditPanel
                open={panelOpen}
                bank={editingBank}
                onClose={() => setPanelOpen(false)}
                onSaved={() => fetchBanks()}
            />
        </div>
    );
}
