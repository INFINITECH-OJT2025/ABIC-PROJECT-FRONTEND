"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import PreviewSection from "./PreviewSection";
import FormSection from "./FormSection";
import { PrintableData } from "./types";
import { toast } from "sonner";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import { Ban } from "lucide-react";

export default function PrintableView() {
  const [formData, setFormData] = useState<PrintableData>({
    voucherNo: "",
    date: "",
    paidTo: "",
    projectDetails: "", // 
    purpose: "",
    note: "",
    amount: "",
    owner: "",
    receivedBy: "",
    approvedBy: "",
    receivedFromSignature: "/images/voucher/signature/ReceivedSignature.png",
    approvedBySignature: "/images/voucher/signature/ApprovedSignature.png",
    receivedFromDate: "",
  });

  const [isPreparing, setIsPreparing] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const prepareVoucher = useCallback(async () => {
    try {
      setIsPreparing(true);

      const res = await fetch("/api/accountant/vouchers/prepare-cash", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          "Failed to generate voucher number.";
        throw new Error(message);
      }

      setFormData((prev) => ({
        ...prev,
        voucherNo: data?.voucher_no ?? "",
        receivedBy:
          localStorage.getItem("voucher_cash_receivedBy") ??
          data?.received_by_name ??
          prev.receivedBy,
        approvedBy:
          localStorage.getItem("voucher_cash_approvedBy") ??
          data?.approved_by_name ??
          prev.approvedBy,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate voucher number.";
      toast.error(message);
    } finally {
      setIsPreparing(false);
    }
  }, []);

  useEffect(() => {
    // Load local overrides for signatures and names on mount
    const savedReceivedBy = localStorage.getItem("voucher_cash_receivedBy");
    const savedApprovedBy = localStorage.getItem("voucher_cash_approvedBy");
    const savedReqSig = localStorage.getItem("voucher_cash_receivedFromSignature");
    const savedAppSig = localStorage.getItem("voucher_cash_approvedBySignature");

    setFormData((prev) => ({
      ...prev,
      receivedBy: savedReceivedBy !== null ? savedReceivedBy : prev.receivedBy,
      approvedBy: savedApprovedBy !== null ? savedApprovedBy : prev.approvedBy,
      receivedFromSignature: savedReqSig !== null ? savedReqSig : prev.receivedFromSignature,
      approvedBySignature: savedAppSig !== null ? savedAppSig : prev.approvedBySignature,
    }));

    prepareVoucher();
  }, [prepareVoucher]);

  const handleInputChange = (field: keyof PrintableData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (typeof window !== "undefined") {
      if (field === "receivedBy") localStorage.setItem("voucher_cash_receivedBy", value);
      if (field === "approvedBy") localStorage.setItem("voucher_cash_approvedBy", value);
      if (field === "receivedFromSignature") localStorage.setItem("voucher_cash_receivedFromSignature", value);
      if (field === "approvedBySignature") localStorage.setItem("voucher_cash_approvedBySignature", value);
    }
  };
  const requestClearForm = useCallback(() => {
    setIsClearModalOpen(true);
  }, []);

  const confirmClearForm = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      date: "",
      paidTo: "",
      projectDetails: "",
      purpose: "",
      note: "",
      amount: "",
      owner: "",
      receivedFromDate: "",
      approvedByDate: "",
    }));
    setIsClearModalOpen(false);
    prepareVoucher();
  }, [prepareVoucher]);

  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-gray-50/80">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Cash Voucher</h1>
                <p className="text-white/80 text-sm mt-0.5">Cash Voucher Creation</p>
              </div>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={prepareVoucher}
                  disabled={isPreparing}
                  className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
                >
                  <RefreshCcw className="w-4 h-4" />
                  {isPreparing ? "Generating..." : "Generate Voucher No"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 space-y-10 py-8">
          {/* FORM SECTION (Row 1) */}
          <FormSection formData={formData} onInputChange={handleInputChange} onSuccessClear={confirmClearForm} />

          {/* PREVIEW SECTION (Row 2) */}
          <PreviewSection formData={formData} />
        </div>
      </div>

      <ConfirmationModal
        open={isClearModalOpen}
        title="Clear Form"
        message="Are you sure you want to clear the voucher form? All unsaved data will be lost."
        confirmLabel="Yes, Clear Form"
        cancelLabel="Cancel"
        icon={Ban}
        color="#dc2626"
        onCancel={() => setIsClearModalOpen(false)}
        onConfirm={confirmClearForm}
      />
    </div>
  );
}