
import { PrintableData } from "./types";
import DownloadButton from "@/components/ui/voucher-download-button";
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/app/ConfirmationModal";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import { User, Receipt, Ban, Calendar, Briefcase, Building2, Target, Banknote, AlignLeft, CreditCard, Hash, FileText, CheckSquare, DollarSign } from "lucide-react";

const ACCENT = "#7a0f1f";
const BORDER = "rgba(0,0,0,0.12)";

function SectionCard({ title, children, icon, className = "" }: { title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border bg-white shadow-sm relative ${className}`} style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50/60 rounded-t-xl" style={{ borderColor: BORDER }}>
        {icon && <span className="text-[#7a0f1f]">{icon}</span>}
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

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
  const [signatureToRemove, setSignatureToRemove] = useState<"receivedFromSignature" | "approvedBySignature" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fieldClass =
    "w-full h-10 rounded-md border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed";
  const amountFieldClass =
    "w-full h-10 rounded-md border border-gray-300 pl-10 pr-3 text-sm font-semibold text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed";
  const textareaClass =
    "w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all resize-none disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1 mt-2";

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
          const chequeOnly = list.filter((v: any) => v.voucher_no?.toUpperCase().startsWith("CHK-"));
          const formattedList: PrintableData[] = chequeOnly.map((v: any) => ({
            paidTo: v.paid_to,
            projectDetails: v.project_details,
            owner: v.owner_client,
            purpose: v.purpose,
            amount: v.total_amount?.toString(),
            note: v.note,
            accountName: v.account_name,
            accountNumber: v.account_number,
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
        { key: "amount", id: "amount", label: "Amount" },
        { key: "purpose", id: "purpose", label: "Purpose" },
      ] as const,
    [],
  );

  const validateRequired = useCallback(() => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const field of requiredFields) {
      const value = formData[field.key as keyof PrintableData] as string | undefined | null;
      if (typeof value !== "string" || value.trim() === "") {
        newErrors[field.key] = `${field.label} is required.`;
        isValid = false;
      }
    }

    setErrors(newErrors);

    // Mark everything touched when trying to save
    const allTouched: Record<string, boolean> = {};
    for (const field of requiredFields) allTouched[field.key] = true;
    setTouched(allTouched);

    if (!isValid) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el && "focus" in el) {
        (el as HTMLElement).focus();
      }
    } else {
      setFormError(null);
    }

    return isValid;
  }, [formData, requiredFields]);

  const saveVoucherToDatabase = useCallback(async (base64Image: string) => {
    const payload = {
      voucher_no: formData.voucherNo,
      paid_to: formData.paidTo,
      date: formData.date || null,
      project_details: formData.projectDetails,
      owner_client: formData.owner,
      purpose: formData.purpose,
      note: formData.note,
      total_amount: Number(formData.amount),
      check_date: formData.checkDate || null,
      check_no: formData.checkNo || null,
      account_name: formData.accountName || null,
      account_number: formData.accountNumber || null,
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
      voucher_image: base64Image,
    };

    const res = await fetch("/api/accountant/vouchers/cheque", {
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
    <div className="w-full">
      <form className="space-y-1">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-6 w-full">

          {/* BASIC DETAILS */}
          <SectionCard title="Basic Details" icon={<FileText className="w-4 h-4" />}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Paid To */}
                <div className="relative">
                  <label className={labelClass}>Paid To <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.paidTo ?? ""}
                      onChange={(e) => {
                        if (errors.paidTo && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.paidTo; return nv; });
                        onInputChange("paidTo", e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                      id="paidTo"
                      autoComplete="off"
                      className={`${fieldClass} ${touched.paidTo && errors.paidTo ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      placeholder="Enter payee name"
                    />
                  </div>
                  {touched.paidTo && errors.paidTo && (
                    <FormTooltipError message={errors.paidTo} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.paidTo; return nv; })} />
                  )}
                  {showSuggestions && recentVouchers.filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase())).length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {recentVouchers
                        .filter((v) => v.paidTo?.toLowerCase().includes((formData.paidTo || "").toLowerCase()))
                        .map((s, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex flex-col"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onInputChange("paidTo", s.paidTo || "");
                              if (s.projectDetails) onInputChange("projectDetails", s.projectDetails);
                              if (s.owner) onInputChange("owner", s.owner);
                              if (s.purpose) onInputChange("purpose", s.purpose);
                              if (s.amount) onInputChange("amount", s.amount);
                              if (s.note) onInputChange("note", s.note);
                              if (s.accountName) onInputChange("accountName", s.accountName);
                              if (s.accountNumber) onInputChange("accountNumber", s.accountNumber);
                              setShowSuggestions(false);
                              setErrors(prev => {
                                const nv = { ...prev };
                                delete nv.paidTo;
                                if (s.projectDetails) delete nv.projectDetails;
                                if (s.owner) delete nv.owner;
                                if (s.purpose) delete nv.purpose;
                                if (s.amount) delete nv.amount;
                                if (s.note) delete nv.note;
                                if (s.accountName) delete nv.accountName;
                                if (s.accountNumber) delete nv.accountNumber;
                                return nv;
                              });
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

                {/* Voucher No */}
                <div>
                  <label className={labelClass}>Voucher No <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.voucherNo ?? ""}
                      disabled
                      onChange={(e) => onInputChange("voucherNo", e.target.value)}
                      id="voucherNo"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="relative">
                  <label className={labelClass}>Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      value={formData.date || ""}
                      onChange={(e) => { onInputChange("date", e.target.value); if (errors.date && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.date; return nv; }); }}
                      id="date"
                      className={`${fieldClass} ${touched.date && errors.date ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                    />
                  </div>
                  {touched.date && errors.date && (
                    <FormTooltipError message={errors.date} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.date; return nv; })} />
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* PARTICULAR DETAILS & AMOUNT & CHEQUE DETAILS */}
          <SectionCard title="Particular Details" icon={<Target className="w-4 h-4" />}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Purpose & Note (Left Column, span 2) */}
              <div className="lg:col-span-2 flex flex-col gap-1">
                <div>
                  <label className={labelClass}>Purpose <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <textarea
                      value={formData.purpose ?? ""}
                      onChange={(e) => { onInputChange("purpose", e.target.value.slice(0, 350)); if (errors.purpose && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.purpose; return nv; }); }}
                      id="purpose"
                      maxLength={350}
                      className={`${textareaClass} ${touched.purpose && errors.purpose ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      placeholder="Transaction purpose"
                      rows={4}
                    />
                  </div>
                  {touched.purpose && errors.purpose && (
                    <FormTooltipError message={errors.purpose} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.purpose; return nv; })} />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Note</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <AlignLeft className="h-4 w-4" />
                    </div>
                    <textarea
                      value={formData.note ?? ""}
                      onChange={(e) => { onInputChange("note", e.target.value.slice(0, 150)); }}
                      id="note"
                      maxLength={150}
                      className={textareaClass}
                      placeholder="Additional notes"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Account Name & Account Number (Right Column, span 1) */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {/* Account Name */}
                <div>
                  <label className={labelClass}>Account Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.accountName ?? ""}
                      onChange={(e) => { onInputChange("accountName", e.target.value); }}
                      id="accountName"
                      className={fieldClass}
                    />
                  </div>
                </div>

                {/* Cheque Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Check Date</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        type="date"
                        value={formData.checkDate || ""}
                        onChange={(e) => { onInputChange("checkDate", e.target.value); }}
                        id="checkDate"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Check No</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Hash className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.checkNo ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          onInputChange("checkNo", val);
                        }}
                        id="checkNo"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount & Account Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Amount (₱) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.amount ?? ""}
                        onChange={(e) => {
                          if (errors.amount && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.amount; return nv; });
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          onInputChange("amount", val);
                        }}
                        id="amount"
                        className={`${amountFieldClass} ${touched.amount && errors.amount ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        placeholder="0.00"
                      />
                    </div>
                    {touched.amount && errors.amount && (
                      <FormTooltipError message={errors.amount} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.amount; return nv; })} />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Account Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.accountNumber ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          onInputChange("accountNumber", val);
                        }}
                        id="accountNumber"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </SectionCard>

          {/* PROJECT & CLIENT */}
          <SectionCard title="Project & Client" icon={<Briefcase className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project Details</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.projectDetails ?? ""}
                    onChange={(e) => { onInputChange("projectDetails", e.target.value); }}
                    id="projectDetails"
                    className={fieldClass}
                    placeholder="Project title or details"
                  />
                </div>
              </div>

              <div className="relative">
                <label className={labelClass}>Owner / Client</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.owner ?? ""}
                    onChange={(e) => {
                      onInputChange("owner", e.target.value);
                      setShowOwnerSuggestions(true);
                    }}
                    onFocus={() => setShowOwnerSuggestions(true)}
                    onBlur={() => { setTimeout(() => setShowOwnerSuggestions(false), 200); }}
                    id="owner"
                    autoComplete="off"
                    className={fieldClass}
                    placeholder="Search or enter owner/client"
                  />
                </div>
                {showOwnerSuggestions && owners.filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase())).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {owners
                      .filter((o) => o.name?.toLowerCase().includes((formData.owner || "").toLowerCase()))
                      .map((o, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex flex-col"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onInputChange("owner", o.name);
                            setShowOwnerSuggestions(false);
                            setErrors(prev => {
                              const nv = { ...prev };
                              delete nv.owner;
                              return nv;
                            });
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
          </SectionCard>

          {/* SIGNATURES */}
          <SectionCard title="Signatures" icon={<CheckSquare className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-bold text-[#800020] mb-3 pb-2 border-b border-gray-200">Received By</h3>
                <label className={labelClass}>Printed Name</label>
                <div className="relative mb-4">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.receivedBy || ""}
                    onChange={(e) => onInputChange("receivedBy", e.target.value)}
                    placeholder="MARIA KRISSA CHAREZ R. BONGON"
                    className={fieldClass}
                  />
                </div>

                <label className={labelClass}>Signature <span className="text-red-500">*</span></label>
                <div className="w-full border border-gray-200 rounded-md bg-white flex flex-col items-center justify-center relative overflow-hidden h-[80px] mb-4">
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
                    <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded-md shadow-sm hover:bg-gray-50 uppercase tracking-wide">
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
                              onInputChange("receivedFromSignature", reader.result as string); setErrors(prev => { const nv = { ...prev }; delete nv.receivedFromSignature; return nv; });
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
                        onClick={() => setSignatureToRemove("receivedFromSignature")}
                        className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded-md shadow-sm hover:bg-red-50 uppercase tracking-wide"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <label className={labelClass}>Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    value={formData.receivedFromDate || ""}
                    onChange={(e) => { onInputChange("receivedFromDate", e.target.value); if (errors.receivedFromDate && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.receivedFromDate; return nv; }); }}
                    id="receivedFromDate"
                    className={`${fieldClass} ${touched.receivedFromDate && errors.receivedFromDate ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                </div>
                {touched.receivedFromDate && errors.receivedFromDate && (
                  <FormTooltipError message={errors.receivedFromDate} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.receivedFromDate; return nv; })} />
                )}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-sm font-bold text-[#800020] mb-3 pb-2 border-b border-gray-200">Approved By</h3>
                <label className={labelClass}>Printed Name</label>
                <div className="relative mb-4">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.approvedBy || ""}
                    onChange={(e) => onInputChange("approvedBy", e.target.value)}
                    placeholder="ANGELLE S. SARMIENTO"
                    className={fieldClass}
                  />
                </div>

                <label className={labelClass}>Signature <span className="text-red-500">*</span></label>
                <div className="w-full border border-gray-200 rounded-md bg-white flex flex-col items-center justify-center relative overflow-hidden h-[80px] mb-4">
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
                    <label className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 rounded-md shadow-sm hover:bg-gray-50 uppercase tracking-wide">
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
                              onInputChange("approvedBySignature", reader.result as string); setErrors(prev => { const nv = { ...prev }; delete nv.approvedBySignature; return nv; });
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
                        onClick={() => setSignatureToRemove("approvedBySignature")}
                        className="bg-white border border-red-200 px-2 py-1 text-[10px] font-medium text-red-600 rounded-md shadow-sm hover:bg-red-50 uppercase tracking-wide"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <label className={labelClass}>Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    value={formData.approvedByDate || ""}
                    onChange={(e) => { onInputChange("approvedByDate", e.target.value); if (errors.approvedByDate && e.target.value.trim()) setErrors(prev => { const nv = { ...prev }; delete nv.approvedByDate; return nv; }); }}
                    id="approvedByDate"
                    className={`${fieldClass} ${touched.approvedByDate && errors.approvedByDate ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                  />
                </div>
                {touched.approvedByDate && errors.approvedByDate && (
                  <FormTooltipError message={errors.approvedByDate} onClose={() => setErrors(prev => { const nv = { ...prev }; delete nv.approvedByDate; return nv; })} />
                )}
              </div>

            </div>
          </SectionCard>

        </div>

        <div className="pt-4 w-full">
          <DownloadButton formData={formData} onValidate={validateRequired} onSave={saveVoucherToDatabase} onSuccess={onSuccessClear} />
        </div>

        <ConfirmationModal
          open={signatureToRemove !== null}
          title="Remove Signature"
          message="Are you sure you want to remove this signature?"
          confirmLabel="Yes, Remove"
          cancelLabel="Cancel"
          icon={Ban}
          color="#dc2626"
          onCancel={() => setSignatureToRemove(null)}
          onConfirm={() => {
            if (signatureToRemove) {
              onInputChange(signatureToRemove, "");
            }
            setSignatureToRemove(null);
          }}
          zIndex={50}
        />
      </form>
    </div>
  );
}
