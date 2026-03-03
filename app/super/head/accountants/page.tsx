"use client";

import React, { useState, useEffect } from "react";

import { X, ArrowUp, ArrowDown, ChevronDown, Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import LoadingModal from "@/components/app/LoadingModal";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import PromotePanel from "@/components/app/super/head/PromotePanel";
import ViewEditPanel from "@/components/app/super/head/ViewEditPanel";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";
import { superAdminNav } from "@/lib/navigation";

type Status = "Active" | "Inactive" | "Suspended" | "Pending" | "Expired";

type AccountantAccount = {
    id: number;
    name: string;
    email: string;
    status: Status;
    promoted_at?: string | null;
    updated_at?: string;
};

const BORDER = "rgba(0,0,0,0.12)";

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Not available";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid date";
        return date.toLocaleDateString();
    } catch {
        return "Invalid date";
    }
};

const Icons = {
    Plus: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Refresh: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    Eye: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};


// ─── Internal Stats Component ─────────────────────────────────────────────────

function AccountantStatsBar() {
    const [stats, setStats] = useState<{
        total: number;
        active: number;
        inactive: number;
        suspended: number;
    } | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/head/accountant?per_page=all", { method: "GET" });
                const data = await res.json();

                const list: AccountantAccount[] = Array.isArray(data?.data) ? data.data : Array.isArray(data?.data?.data) ? data.data.data : [];

                setStats({
                    total: list.length,
                    active: list.filter(a => a.status === "Active").length,
                    inactive: list.filter(a => a.status === "Inactive").length,
                    suspended: list.filter(a => a.status === "Suspended").length,
                });
            } catch (err) {
                console.error("AccountantStatsBar: failed to fetch stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <SummaryBar>
            <StatPill icon={Users} label="Total Accountants" value={stats?.total ?? null} />
            <StatPill icon={CheckCircle} label="Active" value={stats?.active ?? null} />
            <StatPill icon={XCircle} label="Inactive" value={stats?.inactive ?? null} />
            <StatPill icon={AlertTriangle} label="Suspended" value={stats?.suspended ?? null} />
        </SummaryBar>
    );
}

export default function HeadAccountantsPage() {
    const { showToast } = useAppToast();
    const [query, setQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
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
    const [editing, setEditing] = useState<AccountantAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingActionType, setLoadingActionType] = useState<"edit" | "revert">("edit");

    const [accounts, setAccounts] = useState<AccountantAccount[]>([]);

    const [revertConfirmAccountant, setRevertConfirmAccountant] = useState<AccountantAccount | null>(null);
    const [isReverting, setIsReverting] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [query, statusFilter]);

    async function fetchAccountantAccounts() {
        setIsLoading(true);
        const minDelay = new Promise((r) => setTimeout(r, 1000));
        try {
            const url = new URL("/api/head/accountant", window.location.origin);
            if (query.trim()) {
                url.searchParams.append("search", query.trim());
            }
            if (statusFilter !== "all") {
                url.searchParams.append("status", statusFilter);
            }
            url.searchParams.append("page", currentPage.toString());
            url.searchParams.append("per_page", "10");

            const [res] = await Promise.all([
                fetch(url.toString(), { method: "GET" }),
                minDelay,
            ]);
            const data = await res.json();
            if (res.ok && data.success) {
                const accountsList = data.data?.data || data.data || [];
                setAccounts(Array.isArray(accountsList) ? accountsList : []);

                if (data.data?.current_page !== undefined) {
                    setPaginationMeta({
                        current_page: data.data.current_page || 1,
                        last_page: data.data.last_page || 1,
                        per_page: data.data.per_page || 10,
                        total: data.data.total || 0,
                        from: data.data.from || 0,
                        to: data.data.to || 0,
                    });
                } else {
                    setPaginationMeta(null);
                }
            }
        } catch (err) {
            console.error("Error fetching accountant accounts:", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchAccountantAccounts();
    }, [query, currentPage, statusFilter]);

    function openEditPanel(item: AccountantAccount) {
        setEditing(item);
    }

    async function handleSaveEdit(newName: string, newEmail: string, newStatus: string) {
        if (!editing) return;
        if (!newName.trim()) return;

        setIsEditing(true);
        setShowLoadingModal(true);
        setLoadingActionType("edit");
        try {
            const res = await fetch(`/api/head/accountant/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to update accountant");
            }
            setAccounts((prev) =>
                prev.map((a) => (a.id === editing.id ? { ...a, name: newName.trim(), status: newStatus as Status } : a))
            );
            showToast("Accountant Account Updated", "Accountant account details have been updated successfully.", "success");
            setEditing(null);
        } catch (err: unknown) {
            showToast("Update Failed", err instanceof Error ? err.message : "Failed to update accountant", "error");
        } finally {
            setIsEditing(false);
            setShowLoadingModal(false);
        }
    }

    async function handleRevertToEmployee() {
        if (!revertConfirmAccountant) return;
        const id = revertConfirmAccountant.id;
        setIsReverting(true);
        try {
            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = {};
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            const res = await fetch(`/api/head/accountant/${id}/revert-to-employee`, {
                method: "POST",
                headers,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRevertConfirmAccountant(null);
                setEditing(null);
                await fetchAccountantAccounts();
                setAccounts((prev) => prev.filter((a) => a.id !== id));
                showToast("Accountant Access Removed", "They will no longer have accountant privileges.", "success");
            } else {
                showToast("Failed to Remove Accountant Access", data.message || "Failed to remove accountant access", "error");
            }
        } catch {
            showToast("Failed to Remove Accountant Access", "Please try again later.", "error");
        } finally {
            setIsReverting(false);
        }
    }

    const tableCols = "minmax(140px, 1.15fr) minmax(180px, 1.2fr) 120px";

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                subtitle="Promote and manage accountant accounts"
            />
            <AccountantStatsBar />
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section className="rounded-md bg-white p-5 shadow-sm border" style={{ borderColor: BORDER }}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Accountant List</h2>
                            <p className="text-sm text-gray-600 mt-1">Promote and manage accountant accounts</p>
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                            style={{ background: "#7a0f1f", height: 40 }}
                        >
                            <ArrowUp className="w-4 h-4" />
                            Give Accountant Access
                        </button>
                    </div>
                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={(val) => setQuery(val)}
                        searchPlaceholder="Search accounts..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchAccountantAccounts}
                    />
                    <div className="mt-4">
                        {(() => {
                            const ACCOUNTANT_COLUMNS: DataTableColumn<AccountantAccount>[] = [
                                {
                                    key: "avatar",
                                    label: "",
                                    width: "56px",
                                    renderCell: (row) => (
                                        <div className="w-9 h-9 rounded-md bg-[#7a0f1f] flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">{row.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                    ),
                                },
                                {
                                    key: "name",
                                    label: "Account Name",
                                    flex: true,
                                    sortable: true,
                                    renderCell: (row) => (
                                        <div className="font-semibold text-base text-neutral-900 uppercase">{row.name}</div>
                                    ),
                                },
                                {
                                    key: "email",
                                    label: "Email",
                                    flex: true,
                                    sortable: true,
                                    renderCell: (row) => (
                                        <span className="text-neutral-600 truncate block">{row.email}</span>
                                    ),
                                },
                                {
                                    key: "promoted_at",
                                    label: "Promoted",
                                    width: "120px",
                                    sortable: true,
                                    renderCell: (row) => (
                                        <span className="text-neutral-500 text-xs">
                                            {row.promoted_at ? formatDate(row.promoted_at) : "—"}
                                        </span>
                                    ),
                                },
                                {
                                    key: "status",
                                    label: "Status",
                                    width: "100px",
                                    renderCell: (row) => (
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${row.status === "Active" ? "bg-green-100 text-green-700" :
                                            row.status === "Suspended" ? "bg-red-100 text-red-700" :
                                                "bg-gray-100 text-gray-600"
                                            }`}>
                                            {row.status}
                                        </span>
                                    ),
                                },
                                {
                                    key: "actions",
                                    label: "",
                                    width: "80px",
                                    align: "right",
                                    renderCell: (row) => (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditPanel(row); }}
                                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity active:scale-95"
                                            style={{ background: "#7a0f1f", height: 30 }}
                                        >
                                            <Icons.Eye />
                                            View
                                        </button>
                                    ),
                                },
                            ];

                            return (
                                <DataTable<AccountantAccount>
                                    columns={ACCOUNTANT_COLUMNS}
                                    rows={accounts}
                                    loading={isLoading}
                                    skeletonCount={6}
                                    emptyTitle="No accountants found"
                                    emptyDescription="Promote an employee or adjust your search."
                                    onRowClick={(row) => openEditPanel(row)}
                                    pagination={paginationMeta}
                                    onPageChange={(page) => setCurrentPage(page)}
                                    itemName="accountants"
                                />
                            );
                        })()}
                    </div>
                </section>
            </div >

            {/* Promote to Accountant Panel */}
            < PromotePanel
                open={showCreate}
                onClose={() => setShowCreate(false)
                }
                roleLabel="Accountant"
                promoteEndpoint="/api/head/accountant/promote-from-employee"
                onPromoted={fetchAccountantAccounts}
            />

            {/* Remove Accountant Access Confirmation Modal */}
            <ConfirmationModal
                open={!!revertConfirmAccountant}
                icon={ArrowDown}
                color="#f97316"
                title="Remove Accountant Access"
                message={
                    <>
                        Are you sure you want to remove accountant access from{" "}
                        <strong>{revertConfirmAccountant?.name}</strong> ({revertConfirmAccountant?.email})? They will be reverted to employee.
                    </>
                }
                confirmLabel="Remove"
                onCancel={() => setRevertConfirmAccountant(null)}
                onConfirm={() => handleRevertToEmployee()}
                isConfirming={isReverting}
            />

            <ViewEditPanel
                account={editing ? { ...editing, status: editing.status } : null}
                onClose={() => setEditing(null)}
                onSave={handleSaveEdit}
                isSaving={isEditing}
                onRemoveAccess={() => setRevertConfirmAccountant(editing ?? null)}
                removeLabel="Remove"
            />

            {
                showLoadingModal && (
                    <LoadingModal
                        isOpen={showLoadingModal}
                        title={loadingActionType === "edit" ? "Updating Accountant Account" : "Removing Accountant Access"}
                        message={loadingActionType === "edit" ? "Please wait while we update the accountant account details..." : "Please wait..."}
                    />
                )
            }
        </div >
    );
}
