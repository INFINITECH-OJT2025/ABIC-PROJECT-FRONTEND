import { PrintableData } from "./types";
import DownloadButton from "@/components/ui/voucher-download-button";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/app/ConfirmationModal";

interface FormSectionProps {
  formData: PrintableData;
  onInputChange: (field: keyof PrintableData, value: string) => void;
  onSuccessClear?: () => void;
}

export default function FormSection({
  formData,
  onInputChange,
  onSuccessClear,
}: FormSectionProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [recentVouchers, setRecentVouchers] = useState<PrintableData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false);

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

  const requiredFields = useMemo(
    () =>
      [
        { key: "paidTo", id: "paidTo", label: "Paid To" },
        { key: "voucherNo", id: "voucherNo", label: "Voucher No" },
        { key: "date", id: "date", label: "Date" },
        { key: "projectDetails", id: "projectDetails", label: "Project Details" },
        { key: "owner", id: "owner", label: "Owner / Client" },
        { key: "purpose", id: "purpose", label: "Purpose" },
        { key: "amount", id: "amount", label: "Amount" },
        { key: "note", id: "note", label: "Note" },
        { key: "receivedFromDate", id: "receivedFromDate", label: "Received Date" },
        { key: "approvedByDate", id: "approvedByDate", label: "Approved Date" },
      ] as const,
    []
  );

  const validateRequired = useCallback(() => {
    for (const field of requiredFields) {
      const value = formData[field.key as keyof PrintableData];
      if (typeof value !== "string" || value.trim() === "") {
        setFormError(`${field.label} is required.`);

        const el = document.getElementById(field.id);
        if (el && "focus" in el) {
          (el as HTMLElement).focus();
        }
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
  }, [formData, requiredFields]);

  const saveVoucherToDatabase = useCallback(async () => {
    const payload = {
      voucher_no: formData.voucherNo,
      paid_to: formData.paidTo,
      date: formData.date || null,
      project_details: formData.projectDetails,
      owner_client: formData.owner,
      purpose: formData.purpose,
      note: formData.note,
      total_amount: Number(formData.amount),
      check_date: null,
      check_no: null,
      account_name: null,
      account_number: null,
      received_by_name: formData.receivedBy || "",
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

    const res = await fetch("/api/accountant/vouchers/cash", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        (typeof data?.message === "string" && data.message) ||
        "Failed to save voucher.";
      setFormError(message);
      throw new Error(message);
    }

    setFormError(null);
    setRecentVouchers((prev) =>
      [formData, ...prev.filter((r) => r.paidTo?.toLowerCase() !== formData.paidTo?.toLowerCase())].slice(0, 10)
    );
  }, [formData]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-6">
        Cash Voucher Details
      </h2>

      <form className="space-y-6">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-900">Paid To</label>
            <input
              type="text"
              value={formData.paidTo ?? ""}
              onChange={(e) => {
                onInputChange("paidTo", e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              id="paidTo"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
            {showSuggestions && recentVouchers.filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase())).length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {recentVouchers
                  .filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase()))
                  .map((s, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex flex-col"
                      onClick={() => {
                        onInputChange("paidTo", s.paidTo || "");
                        if (s.projectDetails) onInputChange("projectDetails", s.projectDetails);
                        if (s.owner) onInputChange("owner", s.owner);
                        if (s.purpose) onInputChange("purpose", s.purpose);
                        if (s.amount) onInputChange("amount", s.amount);
                        if (s.note) onInputChange("note", s.note);
                        setShowSuggestions(false);
                      }}
                    >
                      <span className="font-semibold text-gray-900">{s.paidTo}</span>
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {s.purpose} {s.amount ? `- ₱${s.amount}` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Voucher No</label>
            <input
              type="text"
              value={formData.voucherNo ?? ""}
              disabled
              onChange={(e) => onInputChange("voucherNo", e.target.value)}
              id="voucherNo"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
            <input
              type="date"
              value={formData.date ?? ""}
              onChange={(e) => onInputChange("date", e.target.value)}
              id="date"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Project Details
            </label>
            <input
              type="text"
              value={formData.projectDetails ?? ""}
              onChange={(e) => onInputChange("projectDetails", e.target.value)}
              id="projectDetails"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div className="md:col-span-4 relative">
            <label className="block text-sm font-medium mb-2">
              Owner / Client
            </label>
            <input
              type="text"
              value={formData.owner ?? ""}
              onChange={(e) => {
                onInputChange("owner", e.target.value);
                setShowOwnerSuggestions(true);
              }}
              onFocus={() => setShowOwnerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
              id="owner"
              autoComplete="off"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
            {showOwnerSuggestions && owners.filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase())).length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {owners
                  .filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase()))
                  .map((o, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex flex-col"
                      onClick={() => {
                        onInputChange("owner", o.name);
                        setShowOwnerSuggestions(false);
                      }}
                    >
                      <span className="font-semibold text-gray-900">{o.name}</span>
                      <span className="text-xs text-gray-500 line-clamp-1">{o.email || o.phone || "No contact info"}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2 text-gray-900">Purpose</label>
            <textarea
              value={formData.purpose ?? ""}
              onChange={(e) => onInputChange("purpose", e.target.value.slice(0, 100))}
              id="purpose"
              maxLength={100}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              rows={3}
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2 text-gray-900">Amount (₱)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.amount ?? ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                onInputChange("amount", val);
              }}
              id="amount"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">Note</label>
            <textarea
              value={formData.note ?? ""}
              onChange={(e) => onInputChange("note", e.target.value.slice(0, 300))}
              id="note"
              maxLength={300}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Received By
            </label>

            <label className="block text-sm font-medium mb-2 text-gray-900">Printed Name</label>
            <input
              type="text"
              value={formData.receivedBy || ""}
              onChange={(e) => onInputChange("receivedBy", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Approved By
            </label>
            <label className="block text-sm font-medium mb-2 text-gray-900">Printed Name</label>
            <input
              type="text"
              value={formData.approvedBy || ""}
              onChange={(e) => onInputChange("approvedBy", e.target.value)}
              placeholder="ANGELLE S. SARMIENTO"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="w-full border border-gray-200 rounded-md bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden h-[80px]">
              {formData.receivedFromSignature ? (
                <img
                  src={formData.receivedFromSignature}
                  alt="Received Signature"
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">No signature</span>
              )}

              <div className="absolute bottom-1 right-1 flex gap-1">
                <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded shadow-sm hover:bg-gray-50 uppercase tracking-wide">
                  {formData.receivedFromSignature ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onInputChange("receivedFromSignature", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {formData.receivedFromSignature && (
                  <button
                    type="button"
                    onClick={() => onInputChange("receivedFromSignature", "")}
                    className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded shadow-sm hover:bg-red-50 uppercase tracking-wide"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
              <input
                type="date"
                value={formData.receivedFromDate ?? ""}
                onChange={(e) => onInputChange("receivedFromDate", e.target.value)}
                id="receivedFromDate"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full border border-gray-200 rounded-md bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden h-[80px]">
              {formData.approvedBySignature ? (
                <img
                  src={formData.approvedBySignature}
                  alt="Approved Signature"
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">No signature</span>
              )}

              <div className="absolute bottom-1 right-1 flex gap-1">
                <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded shadow-sm hover:bg-gray-50 uppercase tracking-wide">
                  {formData.approvedBySignature ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          onInputChange("approvedBySignature", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {formData.approvedBySignature && (
                  <button
                    type="button"
                    onClick={() => onInputChange("approvedBySignature", "")}
                    className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded shadow-sm hover:bg-red-50 uppercase tracking-wide"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
              <input
                type="date"
                value={formData.approvedByDate ?? ""}
                onChange={(e) => onInputChange("approvedByDate", e.target.value)}
                id="approvedByDate"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 w-full">
          <DownloadButton formData={formData} onValidate={validateRequired} onSave={saveVoucherToDatabase} onSuccess={onSuccessClear} />
        </div>
      </form>
    </div>
  );
}