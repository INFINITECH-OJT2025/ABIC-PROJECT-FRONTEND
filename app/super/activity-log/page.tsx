"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn, PaginationMeta } from "@/components/app/DataTable";
import { superAdminNav } from "@/lib/navigation";

type ActivityLog = {
    id: number;
    activity_type: string;
    action: string;
    status: string;
    title: string | null;
    description: string | null;
    user_id: number | null;
    user_name: string | null;
    user_email: string | null;
    target_id: number | null;
    target_type: string | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    page_url: string | null;
    created_at: string;
};

const BORDER = "rgba(0,0,0,0.12)";

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleString();
    } catch {
        return "—";
    }
};

function activityTypeBadge(type: string) {
    const map: Record<string, { bg: string; text: string }> = {
        OWNER: { bg: "bg-blue-100", text: "text-blue-700" },
        UNIT: { bg: "bg-purple-100", text: "text-purple-700" },
        TRANSACTION: { bg: "bg-amber-100", text: "text-amber-700" },
        AUTH: { bg: "bg-green-100", text: "text-green-700" },
    };
    const s = map[type] ?? { bg: "bg-gray-100", text: "text-gray-600" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
            {type}
        </span>
    );
}

function statusBadge(status: string) {
    const s = status === "SUCCESS" ? { bg: "bg-green-100", text: "text-green-700" } : { bg: "bg-red-100", text: "text-red-700" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
            {status}
        </span>
    );
}

const STATUS_OPTIONS = [
    { label: "All Status", value: "all" },
    { label: "Success", value: "SUCCESS" },
    { label: "Failed", value: "FAILED" },
];

export default function ActivityLogPage() {
    const [query, setQuery] = useState("");
    const [activityTypeFilter, setActivityTypeFilter] = useState("all");
    const [actionFilter, setActionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [pageUrlFilter, setPageUrlFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = new URL("/api/accountant/activity-logs", window.location.origin);
            url.searchParams.set("page", currentPage.toString());
            url.searchParams.set("per_page", "20");
            if (activityTypeFilter !== "all") url.searchParams.set("activity_type", activityTypeFilter);
            if (actionFilter !== "all") url.searchParams.set("action", actionFilter);
            if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
            if (dateFrom) url.searchParams.set("date_from", dateFrom);
            if (dateTo) url.searchParams.set("date_to", dateTo);
            if (pageUrlFilter.trim()) url.searchParams.set("page_url", pageUrlFilter.trim());

            const res = await fetch(url.toString(), { method: "GET" });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setLogs(data.data ?? []);
                const p = data.pagination;
                if (p) {
                    setPagination({
                        current_page: p.current_page ?? 1,
                        last_page: p.last_page ?? 1,
                        per_page: p.per_page ?? 20,
                        total: p.total ?? 0,
                        from: p.from ?? 0,
                        to: p.to ?? 0,
                    });
                } else {
                    setPagination(null);
                }
            } else {
                setLogs([]);
                setPagination(null);
            }
        } catch {
            setLogs([]);
            setPagination(null);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activityTypeFilter, actionFilter, statusFilter, dateFrom, dateTo, pageUrlFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const columns: DataTableColumn<ActivityLog>[] = [
        { key: "created_at", label: "Date", width: "160px", renderCell: (row) => formatDate(row.created_at) },
        { key: "activity_type", label: "Type", width: "100px", renderCell: (row) => activityTypeBadge(row.activity_type) },
        { key: "action", label: "Action", width: "90px", renderCell: (row) => row.action },
        { key: "status", label: "Status", width: "90px", renderCell: (row) => statusBadge(row.status) },
        { key: "title", label: "Title", renderCell: (row) => row.title ?? "—" },
        { key: "description", label: "Description", renderCell: (row) => (
            <span className="line-clamp-2" title={row.description ?? ""}>{row.description ?? "—"}</span>
        ) },
        { key: "user_name", label: "User", width: "140px", renderCell: (row) => row.user_name ?? row.user_email ?? "—" },
        { key: "page_url", label: "Page", width: "180px", renderCell: (row) => (
            <span className="line-clamp-1 text-xs" title={row.page_url ?? (row.metadata as Record<string, string> | null)?.page_url ?? ""}>
                {row.page_url ?? (row.metadata as Record<string, string> | null)?.page_url ?? "—"}
            </span>
        ) },
    ];

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                title="Activity Log"
                subtitle="Audit trail of user actions across the system"
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Activity Log</h2>
                            <p className="text-sm text-gray-600 mt-1">View all system activity and audit trail</p>
                        </div>
                    </div>

                    <SharedToolbar
                        searchQuery={query}
                        onSearchChange={setQuery}
                        searchPlaceholder="Search..."
                        statusFilter={statusFilter}
                        onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                        onRefresh={fetchLogs}
                        statusOptions={STATUS_OPTIONS}
                    >
                        <select
                            value={activityTypeFilter}
                            onChange={(e) => { setActivityTypeFilter(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
                        >
                            <option value="all">All Types</option>
                            <option value="OWNER">Owner</option>
                            <option value="UNIT">Unit</option>
                            <option value="TRANSACTION">Transaction</option>
                            <option value="AUTH">Auth</option>
                        </select>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
                        >
                            <option value="all">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="LOGIN">Login</option>
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:outline-none shrink-0"
                            placeholder="From"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:outline-none shrink-0"
                            placeholder="To"
                        />
                        <input
                            type="text"
                            value={pageUrlFilter}
                            onChange={(e) => { setPageUrlFilter(e.target.value); setCurrentPage(1); }}
                            placeholder="Page URL..."
                            className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:outline-none shrink-0 w-40"
                        />
                    </SharedToolbar>

                    <div className="mt-4">
                        <DataTable<ActivityLog>
                            columns={columns}
                            rows={logs}
                            loading={isLoading}
                            skeletonCount={6}
                            emptyTitle="No activity logs found"
                            emptyDescription="Activity will appear here as users perform actions."
                            pagination={pagination}
                            onPageChange={setCurrentPage}
                            itemName="logs"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
