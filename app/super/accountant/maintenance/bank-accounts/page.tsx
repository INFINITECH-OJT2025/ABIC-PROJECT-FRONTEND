"use client";

import React, { useState, useEffect, useCallback } from "react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { Plus, Banknote } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import { superAdminNav } from "@/lib/navigation";
import BankAccountCreateEditPanel, { BankAccount as BankAccountRecord } from "@/components/app/super/accountant/BankAccountCreateEditPanel";

// ─── Types ───────────────────────────────────────────────────────────────────────

export type BankAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface BankAccount {
    id: number;
    owner_id: number;
    bank_id: number;
    account_name: string;
    account_number: string | null;
    account_holder: string | null;
    account_type: string | null;
    opening_balance: string | number;
    opening_date: string | null;
    currency: string;
    status: BankAccountStatus;
    notes: string | null;
    owner?: { id: number; name: string };
    bank?: { id: number; name: string };
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

const formatCurrency = (val: string | number | null | undefined, currency = "PHP"): string => {
    if (val == null || val === "") return "—";
    const n = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(n)) return "—";
    
    // Validate currency code - must be 3 uppercase letters (ISO 4217)
    const validCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "PHP";
    
    try {
        return new Intl.NumberFormat("en-PH", { style: "currency", currency: validCurrency }).format(n);
    } catch (err) {
        // Fallback to PHP if currency formatting fails
        return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);
    }
};

function statusBadge(status: BankAccountStatus) {
    const map: Record<BankAccountStatus, { bg: string; text: string }> = {
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

function BankAccountStatsBar() {
    const [stats, setStats] = useState<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/accountant/maintenance/bank-accounts?per_page=all", { method: "GET" });
                const data = await res.json().catch(() => ({}));

                const list: BankAccount[] = Array.isArray(data?.data) ? data.data : (data?.data?.data ?? data?.data ?? []);
                const arr = Array.isArray(list) ? list : [];

                setStats({
                    total: arr.length,
                    active: arr.filter((b: BankAccount) => b.status === "ACTIVE").length,
                    inactive: arr.filter((b: BankAccount) => b.status === "INACTIVE").length,
                    suspended: arr.filter((b: BankAccount) => b.status === "SUSPENDED").length,
                });
            } catch (err) {
                console.error("BankAccountStatsBar: failed to fetch stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <SummaryBar>
            <StatPill icon={Banknote} label="Total Accounts" value={stats?.total ?? null} />
            <StatPill icon={Banknote} label="Active" value={stats?.active ?? null} />
            <StatPill icon={Banknote} label="Inactive" value={stats?.inactive ?? null} />
            <StatPill icon={Banknote} label="Suspended" value={stats?.suspended ?? null} />
        </SummaryBar>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BankAccountsPage() {
    const { showToast } = useAppToast();

    const [accounts, setAccounts] = useState<BankAccount[]>([]);
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

    const [panelOpen, setPanelOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccountRecord | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hl = params.get("highlight");
        if (hl) setHighlightId(Number(hl));
    }, []);

    const fetchAccounts = useCallback(async () => {
        setIsLoading(true);
        const minDelay = new Promise((r) => setTimeout(r, 800));
        try {
            const url = new URL("/api/accountant/maintenance/bank-accounts", window.location.origin);
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
                setAccounts(Array.isArray(list) ? list : []);

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
            console.error("Error fetching bank accounts:", err);
        } finally {
            setIsLoading(false);
        }
    }, [query, statusFilter, currentPage]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    function openCreate() {
        setEditingAccount(null);
        setPanelOpen(true);
    }

    function openEdit(account: BankAccount) {
        setEditingAccount(account as BankAccountRecord);
        setPanelOpen(true);
    }

    const COLUMNS: DataTableColumn<BankAccount>[] = [
        {
            key: "avatar",
            label: "",
            width: "56px",
            renderCell: (row) => (
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: ACCENT }}>
                    <span className="text-sm font-bold text-white">{row.account_name?.charAt(0).toUpperCase() ?? "?"}</span>
                </div>
            ),
        },
        {
            key: "account",
            label: "Account",
            flex: true,
            sortable: true,
            renderCell: (row) => (
                <div>
                    <div className="font-semibold text-base text-neutral-900">{row.account_name}</div>
                    {row.account_number && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">{row.account_number}</div>
                    )}
                    {row.owner && (
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">Owner: {row.owner.name}</div>
                    )}
                </div>
            ),
        },
        {
            key: "bank",
            label: "Bank",
            width: "140px",
            renderCell: (row) => (
                <div className="text-sm truncate">{row.bank?.name ?? "—"}</div>
            ),
        },
        {
            key: "opening_balance",
            label: "Opening Balance",
            width: "120px",
            renderCell: (row) => (
                <div className="text-sm font-medium">{formatCurrency(row.opening_balance, row.currency)}</div>
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

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                subtitle="Create and manage bank accounts"
            />
            <BankAccountStatsBar />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Bank Accounts List</h2>
                            <p className="text-sm text-gray-600 mt-1">Create and manage bank accounts for owners</p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: ACCENT, height: 40 }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Bank Account
                        </button>
                    </div>

                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                        searchPlaceholder="Search bank accounts..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchAccounts}
                        statusOptions={STATUS_OPTIONS}
                    />

                    <div className="mt-4">
                        <DataTable<BankAccount>
                            columns={COLUMNS}
                            rows={accounts}
                            loading={isLoading}
                            skeletonCount={6}
                            emptyTitle="No bank accounts found"
                            emptyDescription="Add a new bank account or adjust your search filters."
                            onRowClick={(row) => openEdit(row)}
                            isRowSelected={(row) => row.id === highlightId}
                            pagination={paginationMeta}
                            onPageChange={(page) => setCurrentPage(page)}
                            itemName="bank accounts"
                        />
                    </div>
                </section>
            </div>

            <BankAccountCreateEditPanel
                open={panelOpen}
                account={editingAccount}
                onClose={() => setPanelOpen(false)}
                onSaved={() => fetchAccounts()}
            />
        </div>
    );
}
