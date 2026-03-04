"use client";

import React, { useState, useEffect, useCallback } from "react";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { Receipt, ArrowDownCircle, ArrowUpCircle, FileText, Eye, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import LoadingModal from "@/components/app/LoadingModal";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import ViewImagePanel, { ViewImagePanelFile } from "@/components/app/ViewImagePanel";
import { superAdminNav } from "@/lib/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedReceipt {
  id: number;
  transaction_id: number | null;
  transaction_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  receipt_data: Record<string, unknown> | null;
  display_name?: string;
  file_url?: string;
  created_at: string;
  transaction?: {
    voucher_no: string | null;
    voucher_date: string | null;
    amount: string;
    particulars: string | null;
    from_owner?: { name: string };
    to_owner?: { name: string };
  };
}

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

const TRANSACTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

const formatCurrency = (val: string | number | null | undefined): string => {
  if (val == null || val === "") return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n);
};

function transactionTypeBadge(type: string) {
  const isDeposit = type === "DEPOSIT";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
        isDeposit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isDeposit ? (
        <ArrowDownCircle className="w-3.5 h-3.5" />
      ) : (
        <ArrowUpCircle className="w-3.5 h-3.5" />
      )}
      {type}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function ReceiptStatsBar() {
  const [stats, setStats] = useState<{
    total: number;
    depositCount: number;
    withdrawalCount: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/accountant/saved-receipts?per_page=1000", {
          method: "GET",
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success && Array.isArray(data.data)) {
          const list = data.data as SavedReceipt[];
          setStats({
            total: list.length,
            depositCount: list.filter((r) => r.transaction_type === "DEPOSIT").length,
            withdrawalCount: list.filter((r) => r.transaction_type === "WITHDRAWAL").length,
          });
        }
      } catch (err) {
        console.error("ReceiptStatsBar: failed to fetch stats", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <SummaryBar>
      <StatPill icon={Receipt} label="Total" value={stats?.total ?? null} />
      <StatPill icon={ArrowDownCircle} label="Deposits" value={stats?.depositCount ?? null} />
      <StatPill icon={ArrowUpCircle} label="Withdrawals" value={stats?.withdrawalCount ?? null} />
    </SummaryBar>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function TransactionReceiptPage() {
  const { showToast } = useAppToast();

  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  const [previewReceipt, setPreviewReceipt] = useState<SavedReceipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedReceipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, voucherNo, typeFilter, dateFrom, dateTo]);

  const fetchReceipts = useCallback(async () => {
    setIsLoading(true);
    const minDelay = new Promise((r) => setTimeout(r, 300));
    try {
      const url = new URL("/api/accountant/saved-receipts", window.location.origin);
      if (query.trim()) url.searchParams.append("owner_name", query.trim());
      if (voucherNo.trim()) url.searchParams.append("voucher_no", voucherNo.trim());
      if (typeFilter !== "ALL") url.searchParams.append("transaction_type", typeFilter);
      if (dateFrom) url.searchParams.append("date_from", dateFrom);
      if (dateTo) url.searchParams.append("date_to", dateTo);
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", "10");

      const [res] = await Promise.all([fetch(url.toString(), { method: "GET" }), minDelay]);

      const data = await res.json();
      if (res.ok && data.success) {
        const list = data.data ?? [];
        setReceipts(Array.isArray(list) ? list : []);

        const pag = data.pagination;
        if (pag) {
          setPaginationMeta({
            current_page: pag.current_page ?? 1,
            last_page: pag.last_page ?? 1,
            per_page: pag.per_page ?? 10,
            total: pag.total ?? 0,
            from: pag.from ?? 0,
            to: pag.to ?? 0,
          });
        } else {
          setPaginationMeta(null);
        }
      }
    } catch (err) {
      console.error("Error fetching receipts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [query, voucherNo, typeFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setIsDeleting(true);
    setShowDeleteLoading(true);
    try {
      const res = await fetch(`/api/accountant/saved-receipts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchReceipts();
        showToast("Receipt Deleted", "The receipt has been deleted.", "success");
      } else {
        showToast("Failed", data.message || "Could not delete receipt.", "error");
      }
    } catch {
      showToast("Failed", "Please try again later.", "error");
    } finally {
      setIsDeleting(false);
      setShowDeleteLoading(false);
    }
  }

  function getFileSrc(receipt: SavedReceipt): string {
    const fileUrl = receipt.file_url;
    if (fileUrl && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
      return fileUrl;
    }
    return `/api/accountant/saved-receipts/${receipt.id}/file`;
  }

  const [previewFile, setPreviewFile] = useState<ViewImagePanelFile | null>(null);

  function openPreview(receipt: SavedReceipt) {
    setPreviewReceipt(receipt);
    setPreviewFile({
      name: receipt.display_name ?? receipt.file_name,
      src: getFileSrc(receipt),
      type: receipt.file_type,
      size: receipt.file_size ?? undefined,
    });
  }

  useEffect(() => {
    if (!previewReceipt) setPreviewFile(null);
  }, [previewReceipt]);

  const RECEIPT_COLUMNS: DataTableColumn<SavedReceipt>[] = [
    {
      key: "avatar",
      label: "",
      width: "56px",
      renderCell: (row) => (
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ background: ACCENT }}
        >
          <FileText className="w-4 h-4 text-white" />
        </div>
      ),
    },
    {
      key: "display_name",
      label: "Receipt",
      flex: true,
      renderCell: (row) => (
        <div>
          <div className="font-semibold text-base text-neutral-900">
            {row.display_name ?? row.file_name}
          </div>
          {row.transaction?.from_owner || row.transaction?.to_owner ? (
            <div className="text-xs text-neutral-400 mt-0.5 truncate">
              {row.transaction.from_owner?.name ?? "—"} → {row.transaction.to_owner?.name ?? "—"}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "transaction_type",
      label: "Type",
      width: "120px",
      renderCell: (row) => transactionTypeBadge(row.transaction_type),
    },
    {
      key: "amount",
      label: "Amount",
      width: "120px",
      renderCell: (row) =>
        row.transaction?.amount ? formatCurrency(row.transaction.amount) : "—",
    },
    {
      key: "created_at",
      label: "Date",
      width: "110px",
      renderCell: (row) => formatDate(row.created_at),
    },
    {
      key: "actions",
      label: "",
      width: "140px",
      align: "right",
      renderCell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openPreview(row);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity active:scale-95"
            style={{ background: ACCENT, height: 30 }}
          >
            <Icons.Eye />
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors active:scale-95"
            style={{ height: 30 }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader
        navigation={superAdminNav}
        subtitle="View and manage saved transaction receipts"
      />
      <ReceiptStatsBar />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section
          className="rounded-md bg-white p-5 shadow-sm border"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Transaction Receipts</h2>
              <p className="text-sm text-gray-600 mt-1">
                View and manage saved transaction receipts
              </p>
            </div>
          </div>

          <SharedToolbar
            searchQuery={query}
            onSearchChange={(val) => setQuery(val)}
            searchPlaceholder="Search by owner name..."
            statusFilter={typeFilter}
            onStatusChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            onRefresh={fetchReceipts}
            statusOptions={TRANSACTION_TYPE_OPTIONS}
          >
            <input
              type="text"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              placeholder="Voucher #"
              className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0 w-32"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
              placeholder="To"
            />
          </SharedToolbar>

          <div className="mt-4">
            <DataTable<SavedReceipt>
              columns={RECEIPT_COLUMNS}
              rows={receipts}
              loading={isLoading}
              skeletonCount={6}
              emptyTitle="No receipts found"
              emptyDescription="Adjust your search or date filters."
              onRowClick={(row) => openPreview(row)}
              pagination={paginationMeta}
              onPageChange={(page) => setCurrentPage(page)}
              itemName="receipts"
            />
          </div>
        </section>
      </div>

      <ViewImagePanel
        open={!!previewReceipt}
        file={previewFile}
        onClose={() => setPreviewReceipt(null)}
        zIndex={70}
      />

      <ConfirmationModal
        open={!!deleteTarget}
        icon={Trash2}
        color="#dc2626"
        title="Delete Receipt"
        message={
          <>
            Are you sure you want to delete this receipt?{" "}
            <strong>{deleteTarget?.display_name ?? deleteTarget?.file_name}</strong> will be
            permanently removed.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isConfirming={isDeleting}
      />

      <LoadingModal
        isOpen={showDeleteLoading}
        title="Deleting Receipt"
        message="Please wait..."
      />
    </div>
  );
}
