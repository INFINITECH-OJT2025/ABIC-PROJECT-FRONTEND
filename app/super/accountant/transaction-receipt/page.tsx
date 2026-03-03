"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileText, Search, Receipt } from "lucide-react";
import { ReceiptCardSkeleton } from "@/components/accountant/saved-receipts/ReceiptCardSkeleton";
import { ImagePreviewPanel } from "@/components/accountant/ledger";
import { OwnerSearchableDropdown, type Owner } from "@/components/accountant/transaction";
import {
  MaintenancePageLayout,
  MaintenanceFilterCard,
  MaintenanceSectionCard,
  MaintenanceEmptyState,
  MaintenancePagination,
} from "@/components/accountant/maintenance";

interface TransactionReceipt {
  id: number;
  transaction_id: number | null;
  transaction_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  receipt_data: unknown;
  file_url?: string;
  display_name?: string;
  created_at: string;
  transaction?: {
    id: number;
    voucher_no: string | null;
    amount: string;
  };
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface SearchFilters {
  owner_id: number | null;
  owner_name: string;
  voucher_no: string;
  date_from: string;
  date_to: string;
  transaction_type: "ALL" | "DEPOSIT" | "WITHDRAWAL";
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatAmount = (amount: string) =>
  `₱ ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function SavedReceiptsPage() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SavedReceipt | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [debouncedVoucher, setDebouncedVoucher] = useState("");

  const [filters, setFilters] = useState<SearchFilters>({
    owner_id: null,
    owner_name: "",
    voucher_no: "",
    date_from: "",
    date_to: "",
    transaction_type: "ALL",
  });

  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) {
      return owners.filter((o) => {
        const status = (o.status ?? "ACTIVE").toString().toUpperCase();
        const type = (o.owner_type ?? "").toString().toUpperCase();
        return status === "ACTIVE" && type !== "SYSTEM" && type !== "MAIN";
      });
    }
    const q = ownerSearchQuery.toLowerCase();
    return owners.filter((o) => {
      const status = (o.status ?? "ACTIVE").toString().toUpperCase();
      const type = (o.owner_type ?? "").toString().toUpperCase();
      return (
        status === "ACTIVE" &&
        type !== "SYSTEM" &&
        type !== "MAIN" &&
        (o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q))
      );
    });
  }, [owners, ownerSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, voucher_no: debouncedVoucher }));
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [debouncedVoucher]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const list = data.data?.data ?? data.data ?? [];
        setOwners(
          Array.isArray(list)
            ? list.filter((o: Owner) => {
                const type = (o.owner_type ?? "").toString().toUpperCase();
                return type !== "SYSTEM" && type !== "MAIN";
              })
            : []
        );
      } else setOwners([]);
    } catch {
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const hasFilters = useMemo(
    () =>
      !!(filters.owner_id || filters.owner_name || filters.voucher_no || filters.date_from || filters.date_to || filters.transaction_type !== "ALL"),
    [filters]
  );

  const fetchReceipts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), per_page: String(perPage) });
      if (filters.owner_id) params.append("owner_id", String(filters.owner_id));
      if (filters.owner_name) params.append("owner_name", filters.owner_name);
      if (filters.voucher_no) params.append("voucher_no", filters.voucher_no);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.transaction_type !== "ALL") params.append("transaction_type", filters.transaction_type);

      const res = await fetch(`/api/accountant/saved-receipts?${params}`);
      const data = await res.json();
      if (data.success) {
        setReceipts(data.data ?? []);
        setPagination(data.pagination ?? null);
      } else {
        setReceipts([]);
        setPagination(null);
      }
    } catch {
      setReceipts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    if (hasFilters) fetchReceipts();
    else {
      setReceipts([]);
      setPagination(null);
      setLoading(false);
    }
  }, [hasFilters, fetchReceipts]);


  const handleResetFilters = () => {
    setFilters({
      owner_id: null,
      owner_name: "",
      voucher_no: "",
      date_from: "",
      date_to: "",
      transaction_type: "ALL",
    });
    setOwnerSearchQuery("");
    setDebouncedVoucher("");
    setCurrentPage(1);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

  return (
    <MaintenancePageLayout
      header={{
        icon: Receipt,
        title: "Transaction Receipts",
        subtitle: "Search and view saved transaction receipts",
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <MaintenanceFilterCard
              title="Filters"
              description="Apply filters to search receipts"
              hasFilters={hasFilters}
              onReset={handleResetFilters}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen(!filtersOpen)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <OwnerSearchableDropdown
                    label="Owner"
                    required={false}
                    placeholder="Search owner..."
                    value={filters.owner_id}
                    searchQuery={ownerSearchQuery}
                    owners={owners}
                    filteredOwners={filteredOwners}
                    loading={loadingOwners}
                    onSelect={(id) => {
                      setFilters((prev) => ({ ...prev, owner_id: id }));
                      setCurrentPage(1);
                    }}
                    onClear={() => {
                      setFilters((prev) => ({ ...prev, owner_id: null, owner_name: "" }));
                      setOwnerSearchQuery("");
                      setCurrentPage(1);
                    }}
                    onSearchChange={setOwnerSearchQuery}
                    onShowDropdown={setShowOwnerDropdown}
                    showDropdown={showOwnerDropdown}
                    emptyMessage="No owners found"
                    noResultsMessage="No owners found"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Voucher Number</label>
                  <input
                    type="text"
                    placeholder="Enter voucher..."
                    value={debouncedVoucher}
                    onChange={(e) => setDebouncedVoucher(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Transaction Type</label>
                  <select
                    value={filters.transaction_type}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, transaction_type: e.target.value as SearchFilters["transaction_type"] }));
                      setCurrentPage(1);
                    }}
                    className={inputClass}
                  >
                    <option value="ALL">All</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    min={filters.date_from || undefined}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </MaintenanceFilterCard>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <MaintenanceSectionCard>
            <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ReceiptCardSkeleton count={perPage} />
              </div>
            ) : receipts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() => {
                        setPanelClosing(false);
                        setSelectedReceipt(receipt);
                      }}
                      className="group rounded-2xl border border-[#7B0F2B]/40 bg-white overflow-hidden cursor-pointer 
                                hover:shadow-xl hover:border-[#7B0F2B] hover:-translate-y-0.5 
                                transition-all duration-200"
                    >
                      {/* Image Section */}
                      <div className="relative h-52 bg-gray-50 border-b border-[#7B0F2B]/20 overflow-hidden">
                        {receipt.file_url ? (
                          <img
                            src={receipt.file_url}
                            alt=""
                            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileText className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Bottom Content */}
                      <div className="bg-[#7B0F2B] p-4 text-white">
                        <p className="text-sm font-semibold truncate">
                          {receipt.display_name || "No Name"}
                        </p>

                        {receipt.transaction && (
                          <p className="text-lg font-bold mt-1">
                            {formatAmount(receipt.transaction.amount)}
                          </p>
                        )}

                        <div className="mt-3 text-xs text-white/90 flex items-center justify-between">
                          <span>{formatDate(receipt.created_at)}</span>
                          <span className="font-medium opacity-0 group-hover:opacity-100 transition">
                            Click to view
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pagination && pagination.last_page > 1 && (
                  <MaintenancePagination
                    paginationMeta={{
                      ...pagination,
                      from: pagination.from ?? 0,
                      to: pagination.to ?? 0,
                    }}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemName="receipts"
                    variant="simple"
                  />
                )}
              </>
            ) : hasFilters ? (
              <MaintenanceEmptyState
                icon={Search}
                title="No receipts found"
                description="No receipts match your current filters. Try adjusting your search criteria."
              />
            ) : (
              <MaintenanceEmptyState
                icon={Receipt}
                title="No filters applied"
                description="Apply filters above to search for transaction receipts. Filter by owner, voucher number, date range, or transaction type."
              />
            )}
            </div>
          </MaintenanceSectionCard>
        </div>
      </div>

      <ImagePreviewPanel
        open={selectedReceipt !== null}
        closing={panelClosing}
        onClose={() => {
          setPanelClosing(true);
          setTimeout(() => {
            setSelectedReceipt(null);
            setPanelClosing(false);
          }, 350);
        }}
        imageUrl={null}
        imageName={selectedReceipt?.display_name || ""}
        isVoucher={false}
        loading={false}
        error={null}
        fileType={selectedReceipt?.file_type || null}
        attachmentUrl={selectedReceipt?.file_url || null}
      />
    </MaintenancePageLayout>
  );
}
