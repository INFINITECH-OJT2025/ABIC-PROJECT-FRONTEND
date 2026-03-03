"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowDown, User, Mail, Calendar, RefreshCw } from "lucide-react";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import ConfirmationModal from "@/components/app/ConfirmationModal";

const BORDER = "rgba(0,0,0,0.12)";

export interface ViewEditPanelProps {
    /** The account currently being viewed/edited. If null, the panel is closed. */
    account: {
        id: string | number;
        name: string;
        email: string;
        status?: string;
        promoted_at?: string | null;
    } | null;
    /** Called when the panel should be closed. */
    onClose: () => void;
    /** Called when the user wants to save changes. Receives name, email, and status. */
    onSave: (newName: string, newEmail: string, newStatus: string) => Promise<void>;
    /** Called when the "Remove Access" button is clicked. */
    onRemoveAccess: () => void;
    /** Whether the primary save action is currently loading. */
    isSaving: boolean;
    /** The label for the "Remove Access" button. e.g., "Remove Admin Access" */
    removeLabel: string;
}

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

export default function ViewEditPanel({
    account,
    onClose,
    onSave,
    onRemoveAccess,
    isSaving,
    removeLabel
}: ViewEditPanelProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", email: "", status: "Active" });
    const [errors, setErrors] = useState({ name: "" });
    const [confirmingRemove, setConfirmingRemove] = useState(false);

    const open = account !== null;

    useEffect(() => {
        if (account) {
            const s = account.status;
            setEditForm({
                name: account.name,
                email: account.email,
                status: s === "Inactive" ? "Inactive" : s === "Suspended" ? "Suspended" : "Active",
            });
            setErrors({ name: "" });
            setIsClosing(false);
        }
    }, [account]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setEditForm({ name: "", email: "", status: "Active" });
            setErrors({ name: "" });
        }, 350);
    };

    const handleSave = () => {
        let hasError = false;
        const newErrors = { name: "" };
        if (!editForm.name.trim()) {
            newErrors.name = "Account Name is required";
            hasError = true;
        }
        setErrors(newErrors);
        if (!hasError) {
            onSave(editForm.name, editForm.email, editForm.status);
        }
    };

    const originalStatus =
        account?.status === "Inactive" ? "Inactive" :
            account?.status === "Suspended" ? "Suspended" : "Active";
    const hasChanges =
        editForm.name !== account?.name ||
        editForm.status !== originalStatus;

    if (!open && !isClosing) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />
            <div
                className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
                style={{
                    animation: isClosing ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards" : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">{account?.name}</h2>
                        <p className="text-sm text-white/90 mt-0.5">{account?.email}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-md hover:bg-white/20 transition-colors" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Promoted on</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div className="w-full h-10 pl-10 pr-3 flex items-center rounded-lg border border-gray-300 bg-gray-50 text-gray-900 text-sm">
                                {account?.promoted_at ? formatDate(account.promoted_at) : "—"}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">Account Name</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="h-4 w-4" />
                            </div>
                            <input
                                value={editForm.name}
                                onChange={(e) => {
                                    setEditForm((p) => ({ ...p, name: e.target.value }));
                                    if (errors.name) setErrors({ name: "" });
                                }}
                                className={`w-full h-10 pl-10 pr-3 rounded-lg border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 text-sm ${errors.name
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#7B0F2B] focus:ring-[#7B0F2B]/20"
                                    }`}
                            />
                        </div>
                        <FormTooltipError message={errors.name} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="w-full h-10 pl-10 pr-3 flex items-center rounded-lg border border-gray-300 bg-gray-50 text-gray-900 text-sm">
                                {editForm.email}
                            </div>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mt-2 mb-3">Account Status</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <RefreshCw className="h-4 w-4" />
                            </div>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-8 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                            {/* Custom Dropdown Arrow */}
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 max-h-10">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        {originalStatus !== editForm.status && (
                            <p className="text-xs text-amber-600 mt-2">
                                Status will change from <strong>{originalStatus}</strong> to <strong>{editForm.status}</strong>.
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 flex flex-wrap items-center gap-3 p-4 border-t bg-gray-50" style={{ borderColor: BORDER }}>
                    <button
                        onClick={handleClose}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-neutral-100 transition-colors"
                        style={{ borderColor: BORDER, color: "#111", height: 40 }}
                    >
                        Close
                    </button>
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 transition-opacity"
                            style={{ background: "#7a0f1f", height: 40 }}
                        >
                            Save Changes
                        </button>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => setConfirmingRemove(true)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white border border-transparent hover:border-orange-300 bg-orange-500 hover:bg-orange-600 inline-flex items-center gap-2 transition-colors active:scale-95"
                        style={{ height: 40 }}
                    >
                        <ArrowDown className="w-4 h-4" />
                        {removeLabel}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                open={confirmingRemove}
                icon={ArrowDown}
                color="#f97316"
                title={removeLabel}
                message={
                    <>
                        Are you sure you want to{" "}
                        <strong>{removeLabel.toLowerCase()}</strong> from{" "}
                        <strong>{account?.name}</strong> ({account?.email})?
                        They will be reverted to employee.
                    </>
                }
                confirmLabel="Remove"
                onCancel={() => setConfirmingRemove(false)}
                onConfirm={() => {
                    setConfirmingRemove(false);
                    onRemoveAccess();
                }}
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
