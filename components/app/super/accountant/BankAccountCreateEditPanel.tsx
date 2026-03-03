"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Banknote, User, Hash, Save, Building2, Wallet, AlignLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

export type BankAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type BankAccountType = "SAVINGS" | "CURRENT" | "TIME_DEPOSIT";

export interface BankAccount {
    id: number;
    owner_id: number;
    bank_id: number;
    account_name: string;
    account_number: string | null;
    account_holder: string | null;
    account_type: BankAccountType | null;
    opening_balance: string | number;
    opening_date: string | null;
    currency: string;
    status: BankAccountStatus;
    notes: string | null;
    owner?: { id: number; name: string };
    bank?: { id: number; name: string };
    created_at?: string;
    updated_at?: string;
}

export interface BankAccountCreateEditPanelProps {
    open: boolean;
    account: BankAccount | null;
    onClose: () => void;
    onSaved: () => void;
}

const fieldClass =
    "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1 mt-2";

export default function BankAccountCreateEditPanel({
    open,
    account,
    onClose,
    onSaved,
}: BankAccountCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!account;

    const [isClosing, setIsClosing] = useState(false);
    const [ownerId, setOwnerId] = useState<number | null>(null);
    const [bankId, setBankId] = useState<number | null>(null);
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [accountType, setAccountType] = useState<BankAccountType | "">("");
    const [currency, setCurrency] = useState("PHP");
    const [status, setStatus] = useState<BankAccountStatus>("ACTIVE");
    const [notes, setNotes] = useState("");

    const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
    const [banks, setBanks] = useState<{ id: number; name: string }[]>([]);
    const [ownerSearch, setOwnerSearch] = useState("");
    const [bankSearch, setBankSearch] = useState("");
    const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
    const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const fetchOwners = useCallback(async () => {
        try {
            const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
            url.searchParams.set("per_page", "all");
            if (ownerSearch.trim()) url.searchParams.set("search", ownerSearch.trim());
            const res = await fetch(url.toString());
            const data = await res.json();
            if (res.ok && data.success) {
                const list = data.data?.data ?? data.data ?? [];
                setOwners(Array.isArray(list) ? list : []);
            }
        } catch {
            setOwners([]);
        }
    }, [ownerSearch]);

    const fetchBanks = useCallback(async () => {
        try {
            const url = new URL("/api/accountant/maintenance/banks", window.location.origin);
            url.searchParams.set("per_page", "all");
            url.searchParams.set("status", "ACTIVE");
            if (bankSearch.trim()) url.searchParams.set("search", bankSearch.trim());
            const res = await fetch(url.toString());
            const data = await res.json();
            if (res.ok && data.success) {
                const list = data.data?.data ?? data.data ?? [];
                setBanks(Array.isArray(list) ? list : []);
            }
        } catch {
            setBanks([]);
        }
    }, [bankSearch]);

    useEffect(() => {
        if (open) {
            fetchOwners();
            fetchBanks();
        }
    }, [open, fetchOwners, fetchBanks]);

    useEffect(() => {
        if (open) {
            setIsClosing(false);
            if (account) {
                setOwnerId(account.owner_id);
                setBankId(account.bank_id);
                setAccountName(account.account_name ?? "");
                setAccountNumber(account.account_number ?? "");
                setAccountHolder(account.account_holder ?? "");
                setAccountType((account.account_type as BankAccountType) ?? "");
                // Ensure currency is uppercase and valid (fallback to PHP if invalid)
                const curr = account.currency?.toUpperCase() ?? "PHP";
                setCurrency(/^[A-Z]{3}$/.test(curr) ? curr : "PHP");
                setStatus(account.status);
                setNotes(account.notes ?? "");
                setOwnerSearch(account.owner?.name ?? "");
                setBankSearch(account.bank?.name ?? "");
            } else {
                setOwnerId(null);
                setBankId(null);
                setAccountName("");
                setAccountNumber("");
                setAccountHolder("");
                setAccountType("");
                setCurrency("PHP");
                setStatus("ACTIVE");
                setNotes("");
                setOwnerSearch("");
                setBankSearch("");
            }
            setErrors({});
            setTouched({});
        }
    }, [open, account]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setErrors({});
            setTouched({});
        }, 350);
    };

    function validate(): Record<string, string> {
        const errs: Record<string, string> = {};
        if (!ownerId) errs.owner_id = "Owner is required.";
        if (!bankId) errs.bank_id = "Bank is required.";
        if (!accountName.trim()) errs.account_name = "Account name is required.";
        if (accountName.length > 255) errs.account_name = "Account name must not exceed 255 characters.";
        return errs;
    }

    function handleSave() {
        setTouched({ account_name: true, owner_id: true, bank_id: true });
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setShowConfirmModal(true);
    }

    async function performSave() {
        setShowConfirmModal(false);
        setIsSaving(true);
        try {
            const payload: Record<string, unknown> = {
                owner_id: ownerId,
                bank_id: bankId,
                account_name: accountName.trim(),
                account_number: accountNumber.trim() || null,
                account_holder: accountHolder.trim() || null,
                account_type: accountType || null,
                currency: currency,
                status: status,
                notes: notes.trim() || null,
            };

            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            let res: Response;
            if (isEdit) {
                res = await fetch(`/api/accountant/maintenance/bank-accounts/${account!.id}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/accountant/maintenance/bank-accounts", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
                if (data.errors) {
                    const fe: Record<string, string> = {};
                    for (const [key, msgs] of Object.entries(data.errors)) {
                        fe[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
                    }
                    setErrors(fe);
                }
                throw new Error(data.message || "Failed to save bank account.");
            }

            showToast(
                isEdit ? "Bank Account Updated" : "Bank Account Created",
                isEdit ? "Bank account has been updated successfully." : "Bank account has been created successfully.",
                "success"
            );
            onSaved();
            handleClose();
        } catch (err: unknown) {
            showToast("Save Failed", err instanceof Error ? err.message : "An error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    if (!open && !isClosing) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />
            <LoadingModal
                isOpen={isSaving}
                title={isEdit ? "Updating Bank Account" : "Creating Bank Account"}
                message={isEdit ? "Please wait..." : "Please wait..."}
                zIndex={400}
            />
            <div
                className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
                style={{
                    maxWidth: "32rem",
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards" : "slideIn 0.4s cubic-bezier(0.32,0.72,0,1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">{isEdit ? "Edit Bank Account" : "Add Bank Account"}</h2>
                        <p className="text-sm text-white/90 mt-0.5">{isEdit ? "Update account details" : "Create a new bank account"}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {/* Owner */}
                    <div>
                        <label className={labelClass}>Owner <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={ownerSearch}
                                onChange={(e) => {
                                    setOwnerSearch(e.target.value);
                                    setOwnerDropdownOpen(true);
                                }}
                                onFocus={() => setOwnerDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setOwnerDropdownOpen(false), 200)}
                                placeholder="Search owner..."
                                className={`${fieldClass} ${touched.owner_id && errors.owner_id ? "border-red-500" : ""}`}
                            />
                            {ownerDropdownOpen && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                    {owners.map((o) => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setOwnerId(o.id);
                                                setOwnerSearch(o.name);
                                                setOwnerDropdownOpen(false);
                                                setErrors((p) => { const n = { ...p }; delete n.owner_id; return n; });
                                            }}
                                        >
                                            {o.name}
                                        </button>
                                    ))}
                                    {owners.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">No owners found</div>}
                                </div>
                            )}
                        </div>
                        {touched.owner_id && <FormTooltipError message={errors.owner_id} onClose={() => setErrors((p) => { const n = { ...p }; delete n.owner_id; return n; })} />}
                    </div>

                    {/* Bank */}
                    <div>
                        <label className={labelClass}>Bank <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Banknote className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={bankSearch}
                                onChange={(e) => {
                                    setBankSearch(e.target.value);
                                    setBankDropdownOpen(true);
                                }}
                                onFocus={() => setBankDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setBankDropdownOpen(false), 200)}
                                placeholder="Search bank..."
                                className={`${fieldClass} ${touched.bank_id && errors.bank_id ? "border-red-500" : ""}`}
                            />
                            {bankDropdownOpen && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                                    {banks.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            onClick={() => {
                                                setBankId(b.id);
                                                setBankSearch(b.name);
                                                setBankDropdownOpen(false);
                                                setErrors((p) => { const n = { ...p }; delete n.bank_id; return n; });
                                            }}
                                        >
                                            {b.name}
                                        </button>
                                    ))}
                                    {banks.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">No banks found</div>}
                                </div>
                            )}
                        </div>
                        {touched.bank_id && <FormTooltipError message={errors.bank_id} onClose={() => setErrors((p) => { const n = { ...p }; delete n.bank_id; return n; })} />}
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className={labelClass}>Account Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                onBlur={() => setTouched((p) => ({ ...p, account_name: true }))}
                                placeholder="e.g., BDO Main Account"
                                maxLength={255}
                                className={`${fieldClass} ${touched.account_name && errors.account_name ? "border-red-500" : ""}`}
                            />
                        </div>
                        {touched.account_name && <FormTooltipError message={errors.account_name} onClose={() => setErrors((p) => { const n = { ...p }; delete n.account_name; return n; })} />}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className={labelClass}>Account Number</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Hash className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Optional"
                                maxLength={100}
                                className={fieldClass}
                            />
                        </div>
                    </div>

                    {/* Account Holder */}
                    <div>
                        <label className={labelClass}>Account Holder</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={accountHolder}
                                onChange={(e) => setAccountHolder(e.target.value)}
                                placeholder="Optional"
                                maxLength={255}
                                className={fieldClass}
                            />
                        </div>
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className={labelClass}>Account Type</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <select
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value as BankAccountType | "")}
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none appearance-none"
                            >
                                <option value="">Select type</option>
                                <option value="SAVINGS">Savings</option>
                                <option value="CURRENT">Current</option>
                                <option value="TIME_DEPOSIT">Time Deposit</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Currency */}
                    <div>
                        <label className={labelClass}>Currency</label>
                        <div className="relative">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-8 text-sm bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none appearance-none"
                            >
                                <option value="PHP">PHP - Philippine Peso</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                                <option value="CNY">CNY - Chinese Yuan</option>
                                <option value="SGD">SGD - Singapore Dollar</option>
                                <option value="HKD">HKD - Hong Kong Dollar</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className={labelClass}>Status</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {status === "ACTIVE" ? <CheckCircle className="h-4 w-4" /> : status === "INACTIVE" ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as BankAccountStatus)}
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none appearance-none"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass}>Notes</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <AlignLeft className="h-4 w-4" />
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional notes"
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t bg-gray-50" style={{ borderColor: BORDER }}>
                    <button onClick={handleClose} disabled={isSaving} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-neutral-100" style={{ borderColor: BORDER, height: 40 }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: ACCENT, height: 40 }}
                    >
                        {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Account"}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                open={showConfirmModal}
                icon={Save}
                color={ACCENT}
                title={isEdit ? "Confirm Update" : "Confirm Creation"}
                message={
                    <>
                        Are you sure you want to {isEdit ? "update" : "create"} the bank account{" "}
                        <strong>{accountName.trim() || "with the provided details"}</strong>?
                    </>
                }
                confirmLabel={isEdit ? "Update" : "Create"}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={performSave}
                isConfirming={isSaving}
                zIndex={400}
            />

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>
        </>
    );
}
