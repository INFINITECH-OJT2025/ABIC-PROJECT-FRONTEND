"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Plus,
  Eye,
  Edit2,
  ArrowUpDown,
  Save,
  RotateCcw,
  Wallet,
  LayoutGrid,
  List,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

import CashVoucherPreviewSection from "@/components/app/super/voucher/CashVoucher/PreviewSection";
import type { PrintableData } from "@/components/app/super/voucher/CashVoucher/types";

import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import EmptyState from "@/components/app/EmptyState";
import DownloadButton from "@/components/ui/voucher-download-button";
import ConfirmationModal from "@/components/app/ConfirmationModal";

// =========================
// Edit Form (kept same logic)
// =========================
interface CashEditFormProps {
  initialData: PrintableData;
  onSave: (data: PrintableData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function CashEditForm({ initialData, onSave, onCancel, isSaving }: CashEditFormProps) {
  const [formData, setFormData] = useState<PrintableData>(initialData);
  const [formError, setFormError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const [recentVouchers, setRecentVouchers] = useState<PrintableData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/accountant/vouchers");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data ?? []);
          const cashOnly = list.filter((v: any) => v.voucher_no?.toUpperCase().startsWith("CSH-"));
          const formattedList: PrintableData[] = cashOnly.map((v: any) => ({
            paidTo: v.paid_to,
            projectDetails: v.project_details,
            owner: v.owner_client,
            purpose: v.purpose,
            amount: v.total_amount?.toString(),
            note: v.note,
          }));
          const uniquePayees = new Map<string, PrintableData>();
          formattedList.forEach((item) => {
            if (item.paidTo && !uniquePayees.has(item.paidTo.toLowerCase())) {
              uniquePayees.set(item.paidTo.toLowerCase(), item);
            }
          });
          setRecentVouchers(Array.from(uniquePayees.values()).slice(0, 10));
        }
      } catch (e) { }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
        if (res.ok) {
          const data = await res.json();
          const ownersList = data.data?.data || data.data || [];
          setOwners(Array.isArray(ownersList) ? ownersList.filter((o: any) => o.owner_type !== "SYSTEM") : []);
        }
      } catch (e) { }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    if (initialData.voucherNo !== formData.voucherNo) {
      setFormData(initialData);
    }
  }, [initialData.voucherNo, formData.voucherNo]);

  const handleChange = (field: keyof PrintableData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  const validate = (): boolean => {
    const requiredFields: { key: keyof PrintableData; label: string }[] = [
      { key: "paidTo", label: "Paid To" },
      { key: "voucherNo", label: "Voucher No" },
      { key: "date", label: "Date" },
      { key: "projectDetails", label: "Project Details" },
      { key: "owner", label: "Owner / Client" },
      { key: "purpose", label: "Purpose" },
      { key: "amount", label: "Amount" },
      { key: "note", label: "Note" },
      { key: "receivedBy", label: "Received By Printed Name" },
      { key: "receivedFromDate", label: "Received Date" },
      { key: "approvedBy", label: "Approved By Printed Name" },
      { key: "approvedByDate", label: "Approved Date" }
    ];

    for (const field of requiredFields) {
      const value = formData[field.key];
      if (typeof value !== "string" || value.trim() === "") {
        setFormError(`${field.label} is required.`);
        return false;
      }
    }

    const hasReceivedSig = formData.receivedFromSignature && formData.receivedFromSignature !== "/images/voucher/signature/ReceivedSignature.png";
    if (!hasReceivedSig) {
      setFormError("Received By Signature is required.");
      return false;
    }

    const hasApprovedSig = formData.approvedBySignature && formData.approvedBySignature !== "/images/voucher/signature/ApprovedSignature.png";
    if (!hasApprovedSig) {
      setFormError("Approved By Signature is required.");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-[#7a0f1f]" />
          Edit Voucher Details
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-600 hover:text-[#7a0f1f]"
        >
          Cancel
        </button>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 mb-4">
          {formError}
        </div>
      )}

      <div className="space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <label className="block text-xs font-medium mb-1 text-gray-600">Paid To</label>
            <input
              type="text"
              value={formData.paidTo ?? ""}
              onChange={(e) => {
                handleChange("paidTo", e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
            />
            {showSuggestions && recentVouchers.filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase())).length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {recentVouchers
                  .filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase()))
                  .map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs flex flex-col"
                      onClick={() => {
                        handleChange("paidTo", s.paidTo || "");
                        if (s.projectDetails) handleChange("projectDetails", s.projectDetails);
                        if (s.owner) handleChange("owner", s.owner);
                        if (s.purpose) handleChange("purpose", s.purpose);
                        if (s.amount) handleChange("amount", s.amount);
                        if (s.note) handleChange("note", s.note);
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="font-semibold text-gray-900">{s.paidTo}</span>
                      <span className="text-[10px] text-gray-500 line-clamp-1">
                        {s.purpose} {s.amount ? `- ₱${s.amount}` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Voucher No</label>
            <input
              type="text"
              value={formData.voucherNo ?? ""}
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 h-10 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Date</label>
            <input
              type="date"
              value={formData.date ?? ""}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Amount (₱)</label>
            <input
              type="number"
              value={formData.amount ?? ""}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Project Details</label>
            <input
              type="text"
              value={formData.projectDetails ?? ""}
              onChange={(e) => handleChange("projectDetails", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium mb-1 text-gray-600">Owner / Client</label>
            <input
              type="text"
              value={formData.owner ?? ""}
              onChange={(e) => {
                handleChange("owner", e.target.value);
                setShowOwnerSuggestions(true);
              }}
              onFocus={() => setShowOwnerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
            />
            {showOwnerSuggestions && owners.filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase())).length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {owners
                  .filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase()))
                  .map((o, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs flex flex-col"
                      onClick={() => {
                        handleChange("owner", o.name);
                        setShowOwnerSuggestions(false);
                      }}
                    >
                      <span className="font-semibold text-gray-900">{o.name}</span>
                      <span className="text-[10px] text-gray-500 line-clamp-1">{o.email || o.phone || "No contact info"}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Purpose</label>
            <textarea
              value={formData.purpose ?? ""}
              onChange={(e) => handleChange("purpose", e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f] resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Note</label>
            <textarea
              value={formData.note ?? ""}
              onChange={(e) => handleChange("note", e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f] resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Row 4 - Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-600">Received By</label>
              <input
                type="text"
                value={formData.receivedBy || ""}
                onChange={(e) => handleChange("receivedBy", e.target.value)}
                placeholder="Printed Name"
                className="w-1/2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
              />
            </div>
            <div className="w-full border border-gray-200 rounded-md bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden h-[80px]">
              {formData.receivedFromSignature && formData.receivedFromSignature !== "/images/voucher/signature/ReceivedSignature.png" ? (
                <img
                  src={formData.receivedFromSignature}
                  alt="Received Signature"
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400">No signature</span>
              )}

              <div className="absolute bottom-1 right-1 flex gap-1">
                <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded shadow-sm hover:bg-gray-50 uppercase tracking-wide">
                  {formData.receivedFromSignature && formData.receivedFromSignature !== "/images/voucher/signature/ReceivedSignature.png" ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleChange("receivedFromSignature", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {formData.receivedFromSignature && formData.receivedFromSignature !== "/images/voucher/signature/ReceivedSignature.png" && (
                  <button
                    type="button"
                    onClick={() => handleChange("receivedFromSignature", "")}
                    className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded shadow-sm hover:bg-red-50 uppercase tracking-wide"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">Date</label>
              <input
                type="date"
                value={formData.receivedFromDate ?? ""}
                onChange={(e) => handleChange("receivedFromDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-600">Approved By</label>
              <input
                type="text"
                value={formData.approvedBy || ""}
                onChange={(e) => handleChange("approvedBy", e.target.value)}
                placeholder="Printed Name"
                className="w-1/2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
              />
            </div>
            <div className="w-full border border-gray-200 rounded-md bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden h-[80px]">
              {formData.approvedBySignature && formData.approvedBySignature !== "/images/voucher/signature/ApprovedSignature.png" ? (
                <img
                  src={formData.approvedBySignature}
                  alt="Approved Signature"
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400">No signature</span>
              )}

              <div className="absolute bottom-1 right-1 flex gap-1">
                <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded shadow-sm hover:bg-gray-50 uppercase tracking-wide">
                  {formData.approvedBySignature && formData.approvedBySignature !== "/images/voucher/signature/ApprovedSignature.png" ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleChange("approvedBySignature", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {formData.approvedBySignature && formData.approvedBySignature !== "/images/voucher/signature/ApprovedSignature.png" && (
                  <button
                    type="button"
                    onClick={() => handleChange("approvedBySignature", "")}
                    className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded shadow-sm hover:bg-red-50 uppercase tracking-wide"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">Date</label>
              <input
                type="date"
                value={formData.approvedByDate ?? ""}
                onChange={(e) => handleChange("approvedByDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/15 focus:border-[#7a0f1f]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#7a0f1f] rounded-xl hover:bg-[#8b1535] transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Update Voucher"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================
// Types
// =========================
interface CashVoucher {
  id: number;
  voucher_no: string;
  date: string;
  paid_to: string;
  total_amount: number;
  status: string;
  created_at: string;
  purpose?: string;
  note?: string;
  project_details?: string;
  owner_client?: string;
  received_by_name?: string;
  approved_by_name?: string;
  received_by_date?: string;
  approved_by_date?: string;
  received_by_signature_url?: string;
  approved_by_signature_url?: string;
}

type SortField = "date" | "voucher_no" | "paid_to" | "total_amount";
type SortOrder = "asc" | "desc";
type StatusFilter = "ALL" | "SAVED" | "CANCELLED";

type ViewMode = "cards" | "table";

// =========================
// Helpers
// =========================
const formatDateLong = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatAmount = (amount: number) =>
  `₱ ${Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusPill = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "done":
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// ✅ Mini-preview thumbnail (card top)
function CashVoucherCardPreview({ data, scale = 0.55 }: { data: PrintableData; scale?: number }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50" />
      <div className="absolute inset-0 flex items-start justify-center pt-3">
        <div
          className="origin-top"
          style={{
            transform: `scale(${scale})`,
            width: "fit-content",
            pointerEvents: "none",
          }}
        >
          <CashVoucherPreviewSection formData={data} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
}

// =========================
// Page
// =========================
export default function CashVoucherListPage() {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  // UI Filters (Receipts-style)
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // ✅ View mode toggle (Cards / Table)
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Side Panel
  const [selectedVoucher, setSelectedVoucher] = useState<CashVoucher | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");
  const [editFormData, setEditFormData] = useState<PrintableData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Cancel State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [voucherToCancel, setVoucherToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchDraft), 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accountant/vouchers");
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        const cashOnly = list.filter((v: CashVoucher) => v.voucher_no?.toUpperCase().startsWith("CSH-"));
        setVouchers(cashOnly);
      } else {
        setVouchers([]);
        toast.error(data.message || "Failed to load vouchers");
      }
    } catch {
      setVouchers([]);
      toast.error("Error loading vouchers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const resetFilters = () => {
    setSearchDraft("");
    setSearchQuery("");
    setSortField("date");
    setSortOrder("desc");
    setStatusFilter("ALL");
  };

  const hasFilters = useMemo(() => {
    return !!(searchQuery.trim() || statusFilter !== "ALL" || sortField !== "date" || sortOrder !== "desc");
  }, [searchQuery, statusFilter, sortField, sortOrder]);

  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const getPreviewData = useCallback(
    (voucher: CashVoucher): PrintableData => ({
      voucherNo: voucher.voucher_no || "",
      date: formatDateForInput(voucher.date),
      paidTo: voucher.paid_to || "",
      projectDetails: voucher.project_details || "",
      purpose: voucher.purpose || "",
      note: voucher.note || "",
      amount: voucher.total_amount?.toString() || "0",
      owner: voucher.owner_client || "",
      receivedBy: voucher.received_by_name || "",
      approvedBy: voucher.approved_by_name || "",
      receivedFromDate: formatDateForInput(voucher.received_by_date),
      approvedByDate: formatDateForInput(voucher.approved_by_date),
      receivedFromSignature: voucher.received_by_signature_url || undefined,
      approvedBySignature: voucher.approved_by_signature_url || undefined,
    }),
    []
  );

  // ✅ Cache preview data for cards (avoid recompute every render)
  const previewMap = useMemo(() => {
    const m = new Map<number, PrintableData>();
    for (const v of vouchers) m.set(v.id, getPreviewData(v));
    return m;
  }, [vouchers, getPreviewData]);

  const computed = useMemo(() => {
    let filtered = [...vouchers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.voucher_no?.toLowerCase().includes(q) ||
          v.paid_to?.toLowerCase().includes(q) ||
          v.status?.toLowerCase().includes(q) ||
          String(v.total_amount ?? "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      const map: Record<StatusFilter, string> = {
        ALL: "",
        SAVED: "approved",
        CANCELLED: "cancelled",
      };
      const target = map[statusFilter];
      filtered = filtered.filter(
        (v) =>
          (v.status || "").toLowerCase() === target ||
          (target === "approved" && ["saved", "completed", "done"].includes((v.status || "").toLowerCase()))
      );
    }

    filtered.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "voucher_no":
          aVal = a.voucher_no || "";
          bVal = b.voucher_no || "";
          break;
        case "date":
          aVal = a.date ? new Date(a.date).getTime() : 0;
          bVal = b.date ? new Date(b.date).getTime() : 0;
          break;
        case "paid_to":
          aVal = a.paid_to || "";
          bVal = b.paid_to || "";
          break;
        case "total_amount":
          aVal = a.total_amount || 0;
          bVal = b.total_amount || 0;
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [vouchers, searchQuery, statusFilter, sortField, sortOrder]);

  const openPanelView = (voucher: CashVoucher) => {
    setSelectedVoucher(voucher);
    setEditFormData(getPreviewData(voucher));
    setIsPanelOpen(true);
  };

  const openPanelEdit = (voucher: CashVoucher) => {
    setSelectedVoucher(voucher);
    setPanelMode("edit");
    setEditFormData(getPreviewData(voucher));
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setSelectedVoucher(null);
      setEditFormData(null);
    }, 300);
  };

  const handleSaveVoucher = useCallback(
    async (formData: PrintableData) => {
      if (!selectedVoucher) return;

      try {
        setIsSaving(true);

        const payload = {
          voucher_no: formData.voucherNo,
          paid_to: formData.paidTo,
          date: formData.date || null,
          project_details: formData.projectDetails,
          owner_client: formData.owner,
          purpose: formData.purpose,
          note: formData.note,
          total_amount: Number(formData.amount),
          received_by_signature_url:
            formData.receivedFromSignature === "/images/voucher/signature/ReceivedSignature.png" || !formData.receivedFromSignature
              ? null
              : formData.receivedFromSignature,
          received_by_date: formData.receivedFromDate || null,
          approved_by_name: formData.approvedBy || "",
          approved_by_signature_url:
            formData.approvedBySignature === "/images/voucher/signature/ApprovedSignature.png" || !formData.approvedBySignature
              ? null
              : formData.approvedBySignature,
          approved_by_date: formData.approvedByDate || null,
        };

        const res = await fetch(`/api/accountant/vouchers/${selectedVoucher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = (typeof data?.message === "string" && data.message) || "Failed to update voucher.";
          throw new Error(message);
        }

        toast.success("Voucher updated successfully.");
        setEditFormData(formData);
        setPanelMode("view");
        fetchVouchers();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update voucher.";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [selectedVoucher, fetchVouchers]
  );

  const handleCancelVoucher = useCallback(
    async (voucherId: number) => {
      setVoucherToCancel(voucherId);
      setIsCancelModalOpen(true);
    },
    []
  );

  const confirmCancelVoucher = useCallback(async () => {
    if (!voucherToCancel) return;

    try {
      setIsCancelling(true);
      const res = await fetch(`/api/accountant/vouchers/${voucherToCancel}/cancel`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (typeof data?.message === "string" && data.message) || "Failed to cancel voucher.";
        throw new Error(message);
      }

      toast.success("Voucher cancelled successfully.");
      setIsCancelModalOpen(false);
      setVoucherToCancel(null);
      fetchVouchers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel voucher.";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  }, [voucherToCancel, fetchVouchers]);

  const tableColumns: DataTableColumn<CashVoucher>[] = useMemo(() => [
    {
      key: "voucher_no",
      label: "Voucher No",
      sortable: true,
      renderCell: (v) => <span className="font-semibold text-gray-900">{v.voucher_no}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      renderCell: (v) => formatDateShort(v.date),
    },
    {
      key: "paid_to",
      label: "Paid To",
      sortable: true,
      renderCell: (v) => <span className="max-w-[320px] truncate block">{v.paid_to || "-"}</span>,
    },
    {
      key: "total_amount",
      label: "Amount",
      sortable: true,
      renderCell: (v) => <span className="font-semibold text-gray-900">{formatAmount(v.total_amount)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      renderCell: (v) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
            v.status
          )}`}
        >
          {v.status || "Pending"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      renderCell: (v) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#7B0F2B]/30 hover:bg-[#7B0F2B]/5 transition text-xs font-semibold"
            onClick={() => openPanelView(v)}
            title="View"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#7B0F2B]/30 hover:bg-[#7B0F2B]/5 transition text-xs font-semibold"
            onClick={() => openPanelEdit(v)}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          {(v.status || "").toLowerCase() !== "cancelled" && (
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 transition text-xs font-semibold"
              onClick={() => handleCancelVoucher(v.id)}
              title="Cancel Voucher"
            >
              <Ban className="w-4 h-4 text-red-600" />
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ], [handleCancelVoucher]);

  // =========================
  // Side Panel
  // =========================
  const VoucherSidePanel = () => {
    if (!selectedVoucher || !editFormData) return null;

    return (
      <>
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          onClick={closePanel}
        />
        <div
          className={`fixed top-0 right-0 h-full max-w-screen-xl max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {panelMode === "view" ? "Voucher Preview" : "Edit Voucher"}
                </h2>
                <p className="text-sm text-gray-500">{selectedVoucher.voucher_no}</p>
              </div>
              <div className="flex items-center gap-2">
                {panelMode === "view" &&
                  (selectedVoucher.status || "").toLowerCase() !== "cancelled" && (
                    <button
                      onClick={() => handleCancelVoucher(selectedVoucher.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                      title="Cancel Voucher"
                    >
                      <Ban className="w-4 h-4" /> Cancel
                    </button>
                  )}
                <button
                  onClick={() => setPanelMode(panelMode === "view" ? "edit" : "view")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {panelMode === "view" ? (
                    <>
                      <Edit2 className="w-4 h-4" /> Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" /> View
                    </>
                  )}
                </button>
                <button
                  onClick={closePanel}
                  className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-100">
              {panelMode === "view" ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Voucher View</h3>
                    </div>
                    <div className="w-1/3">
                      <DownloadButton formData={editFormData} disabled={!editFormData} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusPill(
                            selectedVoucher.status
                          )}`}
                        >
                          {selectedVoucher.status || "Pending"}
                        </span>

                        <span className="text-xs text-gray-500">
                          Date: {formatDateLong(selectedVoucher.date)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 overflow-auto max-h-[calc(100vh-210px)]">
                      <div className="mx-auto w-fit">
                        <div className="origin-top-left" style={{ transform: `scale(1)` }}>
                          <CashVoucherPreviewSection formData={editFormData} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <CashEditForm
                    initialData={editFormData}
                    onSave={handleSaveVoucher}
                    onCancel={() => setPanelMode("view")}
                    isSaving={isSaving}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

  const ViewToggle = () => {
    return (
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setViewMode("cards")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "cards"
            ? "bg-[#7B0F2B] text-white"
            : "text-gray-700 hover:bg-gray-50"
            }`}
          aria-pressed={viewMode === "cards"}
        >
          <LayoutGrid className="w-4 h-4" />
          Cards
        </button>
        <button
          type="button"
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "table"
            ? "bg-[#7B0F2B] text-white"
            : "text-gray-700 hover:bg-gray-50"
            }`}
          aria-pressed={viewMode === "table"}
        >
          <List className="w-4 h-4" />
          Table
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Cash Vouchers</h1>
                  <p className="text-white/80 text-sm mt-0.5">
                    Search, view, and edit cash voucher transactions
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/super/accountant/voucher/cash-voucher")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors backdrop-blur"
              >
                <Plus className="w-4 h-4" />
                Create Cash Voucher
              </button>
            </div>
          </div>

          {/* Filter card */}
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-visible">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                    <p className="text-xs text-gray-500">
                      Use search, status, and sorting to find vouchers quickly
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <ViewToggle />

                    {hasFilters && (
                      <span className="text-xs font-semibold text-[#7B0F2B] bg-[#7B0F2B]/10 px-3 py-1 rounded-full">
                        Filters Active
                      </span>
                    )}

                    {hasFilters && (
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                    )}

                    <button
                      onClick={() => setFiltersOpen((v) => !v)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#7B0F2B] rounded-xl hover:bg-[#8B1535] transition-colors"
                    >
                      {filtersOpen ? "Hide Filters" : "Show Filters"}
                    </button>
                  </div>
                </div>

                {filtersOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Voucher no., payee, status, amount..."
                          value={searchDraft}
                          onChange={(e) => setSearchDraft(e.target.value)}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        {searchDraft && (
                          <button
                            onClick={() => setSearchDraft("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7B0F2B] transition-colors p-1 rounded hover:bg-[#7B0F2B]/10"
                            aria-label="Clear"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className={inputClass}
                      >
                        <option value="ALL">All</option>
                        <option value="SAVED">Saved</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    {/* Sort Field */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">Sort by</label>
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className={inputClass}
                      >
                        <option value="date">Date</option>
                        <option value="voucher_no">Voucher No</option>
                        <option value="paid_to">Paid To</option>
                        <option value="total_amount">Amount</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">Order</label>
                      <button
                        type="button"
                        onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
                        className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-[#7B0F2B]/30 hover:bg-[#7B0F2B]/5 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        {sortOrder === "asc" ? "Ascending" : "Descending"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              {loading ? (
                viewMode === "cards" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
                        <div className="h-44 bg-gray-100 animate-pulse" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-100 animate-pulse rounded" />
                          <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                          <div className="h-8 bg-gray-100 animate-pulse rounded mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                )
              ) : computed.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{computed.length}</span>{" "}
                      cash voucher(s)
                    </p>
                  </div>

                  {/* ✅ Cards View */}
                  {viewMode === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {computed.map((voucher) => {
                        const previewData = previewMap.get(voucher.id);

                        return (
                          <div
                            key={voucher.id}
                            onClick={() => openPanelView(voucher)}
                            className="group rounded-2xl border border-gray-100 overflow-hidden bg-white cursor-pointer hover:shadow-lg hover:border-[#7B0F2B]/30 hover:-translate-y-0.5 transition-all duration-200"
                          >
                            {/* Top preview */}
                            <div className="relative h-44">
                              {previewData ? (
                                <CashVoucherCardPreview data={previewData} scale={0.55} />
                              ) : (
                                <div className="h-full bg-gray-50 flex items-center justify-center">
                                  <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center">
                                    <Wallet className="w-8 h-8 text-[#7B0F2B]" />
                                  </div>
                                </div>
                              )}

                              {/* Status pill */}
                              <div className="absolute top-3 left-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
                                    voucher.status
                                  )}`}
                                >
                                  {voucher.status || "Pending"}
                                </span>
                              </div>

                              {/* Action buttons overlay */}
                              <div
                                className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="p-2 rounded-xl bg-white/90 border border-gray-200 hover:border-[#7B0F2B]/30 hover:bg-white transition"
                                  title="View"
                                  onClick={() => openPanelView(voucher)}
                                >
                                  <Eye className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  className="p-2 rounded-xl bg-white/90 border border-gray-200 hover:border-[#7B0F2B]/30 hover:bg-white transition"
                                  title="Edit"
                                  onClick={() => openPanelEdit(voucher)}
                                >
                                  <Edit2 className="w-4 h-4 text-gray-700" />
                                </button>
                                {(voucher.status || "").toLowerCase() !== "cancelled" && (
                                  <button
                                    className="p-2 rounded-xl bg-white/90 border border-red-200 hover:border-red-300 hover:bg-red-50 transition"
                                    title="Cancel Voucher"
                                    onClick={() => handleCancelVoucher(voucher.id)}
                                  >
                                    <Ban className="w-4 h-4 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Bottom colored block */}
                            <div className="bg-[#7B0F2B] p-4 text-white">
                              <p className="text-sm font-semibold truncate">{voucher.paid_to || "No Payee"}</p>
                              <p className="text-xs text-white/80 mt-0.5 truncate">{voucher.voucher_no}</p>

                              <p className="text-lg font-bold mt-2">{formatAmount(voucher.total_amount)}</p>

                              <div className="mt-3 text-xs text-white/90 flex items-center justify-between">
                                <span>{formatDateShort(voucher.date)}</span>
                                <span className="font-medium opacity-0 group-hover:opacity-100 transition">
                                  Click to preview
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ✅ Table View */
                    <DataTable
                      columns={tableColumns}
                      rows={computed}
                      onRowClick={(row) => openPanelView(row)}
                      sortKey={sortField}
                      sortDirection={sortOrder}
                      onSort={(key, dir) => {
                        if (dir === null) return;
                        setSortField(key as SortField);
                        setSortOrder(dir);
                      }}
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  title={hasFilters ? "No vouchers found" : "No vouchers yet"}
                  description={
                    hasFilters
                      ? "No cash vouchers match your current filters. Try adjusting your search criteria."
                      : "Cash vouchers will appear here once created."
                  }
                />
              )}
            </div>
          </section>
        </div>
      </div>

      <VoucherSidePanel />

      {/* Confirmation Modal for Canceling Voucher */}
      <ConfirmationModal
        open={isCancelModalOpen}
        title="Cancel Voucher"
        message="Are you sure you want to cancel this voucher? This action cannot be undone."
        confirmLabel="Cancel Voucher"
        cancelLabel="Keep Voucher"
        icon={Ban}
        color="#dc2626"
        onCancel={() => {
          setIsCancelModalOpen(false);
          setVoucherToCancel(null);
        }}
        onConfirm={confirmCancelVoucher}
        isConfirming={isCancelling}
      />
    </div>
  );
}