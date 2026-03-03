"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Phone, Mail, MessageSquare, Plus, Trash2, Save, Building2, User, Briefcase, AlignLeft } from "lucide-react";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import LoadingModal from "@/components/app/LoadingModal";
import ConfirmationModal from "@/components/app/ConfirmationModal";

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

export type ChannelType = "PHONE" | "MOBILE" | "EMAIL" | "VIBER";

export interface BankContactChannel {
    id?: number;
    channel_type: ChannelType;
    value: string;
    label: string | null;
}

export interface BankContact {
    id: number;
    bank_id: number;
    branch_name: string | null;
    contact_person: string | null;
    position: string | null;
    notes: string | null;
    channels?: BankContactChannel[];
    created_at?: string | null;
    updated_at?: string | null;
}

export interface BankBranchCreateEditPanelProps {
    open: boolean;
    /** The bank contact currently being edited. If null, panel is in create mode. */
    contact: BankContact | null;
    /** The bank ID this contact belongs to (required for create mode) */
    defaultBankId: number | null;
    /** Called when the panel should be closed. */
    onClose: () => void;
    /** Called when the contact has been successfully saved to the backend. */
    onSaved: () => void;
}

interface ChannelForm {
    id?: number;
    channel_type: ChannelType;
    value: string;
    label: string;
    countryCode: string;
    phoneNumber: string;
}

export default function BankBranchCreateEditPanel({
    open,
    contact,
    defaultBankId,
    onClose,
    onSaved,
}: BankBranchCreateEditPanelProps) {
    const { showToast } = useAppToast();
    const isEdit = !!contact;

    const [isClosing, setIsClosing] = useState(false);

    // Form fields
    const [bankId, setBankId] = useState<number | null>(defaultBankId);
    const [branchName, setBranchName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [position, setPosition] = useState("");
    const [notes, setNotes] = useState("");
    const [channels, setChannels] = useState<ChannelForm[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [channelErrors, setChannelErrors] = useState<Record<number, Record<string, string>>>({});

    // Reset fields when panel opens or contact changes
    useEffect(() => {
        if (open) {
            setIsClosing(false);
            if (contact) {
                setBankId(contact.bank_id);
                setBranchName(contact.branch_name ?? "");
                setContactPerson(contact.contact_person ?? "");
                setPosition(contact.position ?? "");
                setNotes(contact.notes ?? "");

                // Convert channels to form format
                const formChannels: ChannelForm[] = (contact.channels || []).map((ch) => {
                    const isPhone = ch.channel_type === "PHONE" || ch.channel_type === "MOBILE";
                    if (isPhone) {
                        // Handle phone numbers that start with +63
                        if (ch.value.startsWith("+63")) {
                            const phoneNum = ch.value.substring(3);
                            return {
                                id: ch.id,
                                channel_type: ch.channel_type,
                                value: ch.value,
                                label: ch.label ?? "",
                                countryCode: "+63",
                                phoneNumber: phoneNum,
                            };
                        }
                        // Handle phone numbers that start with 63 (without +)
                        if (ch.value.startsWith("63") && ch.value.length > 2) {
                            const phoneNum = ch.value.substring(2);
                            return {
                                id: ch.id,
                                channel_type: ch.channel_type,
                                value: ch.value,
                                label: ch.label ?? "",
                                countryCode: "+63",
                                phoneNumber: phoneNum,
                            };
                        }
                        // Otherwise, treat the whole value as the phone number
                        return {
                            id: ch.id,
                            channel_type: ch.channel_type,
                            value: ch.value,
                            label: ch.label ?? "",
                            countryCode: "+63",
                            phoneNumber: ch.value.replace(/\D/g, '').substring(0, 10),
                        };
                    }
                    return {
                        id: ch.id,
                        channel_type: ch.channel_type,
                        value: ch.value,
                        label: ch.label ?? "",
                        countryCode: "+63",
                        phoneNumber: "",
                    };
                });
                setChannels(formChannels);
            } else {
                setBankId(defaultBankId);
                setBranchName("");
                setContactPerson("");
                setPosition("");
                setNotes("");
                setChannels([]);
            }
            setErrors({});
            setTouched({});
            setChannelErrors({});
        }
    }, [open, contact, defaultBankId]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setErrors({});
            setTouched({});
            setChannelErrors({});
        }, 350);
    };

    function validateChannel(channel: ChannelForm, index: number): Record<string, string> {
        const errs: Record<string, string> = {};
        if (!channel.value.trim()) {
            errs.value = "Value is required.";
        }
        if (channel.channel_type === "EMAIL" && channel.value.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.value)) {
                errs.value = "Invalid email address.";
            }
        }
        if (channel.channel_type === "PHONE" || channel.channel_type === "MOBILE") {
            if (!channel.phoneNumber.trim()) {
                errs.phoneNumber = "Phone number is required.";
            } else if (channel.phoneNumber.length < 10) {
                errs.phoneNumber = "Phone number must be at least 10 digits.";
            }
        }
        if (channel.value.length > 255) {
            errs.value = "Value must not exceed 255 characters.";
        }
        if (channel.label && channel.label.length > 100) {
            errs.label = "Label must not exceed 100 characters.";
        }
        return errs;
    }

    function validate(): Record<string, string> {
        const errs: Record<string, string> = {};
        if (!branchName.trim()) errs.branchName = "Branch name is required.";
        if (branchName.length > 150) errs.branchName = "Branch name must not exceed 150 characters.";
        if (contactPerson && contactPerson.length > 255) errs.contactPerson = "Contact person must not exceed 255 characters.";
        if (position && position.length > 150) errs.position = "Position must not exceed 150 characters.";
        if (!bankId) errs.bankId = "Bank is required.";

        // Validate channels
        const chErrs: Record<number, Record<string, string>> = {};
        channels.forEach((ch, idx) => {
            const chErr = validateChannel(ch, idx);
            if (Object.keys(chErr).length > 0) {
                chErrs[idx] = chErr;
            }
        });
        setChannelErrors(chErrs);

        return errs;
    }

    function handleSave() {
        setTouched({ branchName: true, contactPerson: true, position: true });

        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0 || Object.keys(channelErrors).length > 0) return;

        // Show confirmation modal
        setShowConfirmModal(true);
    }

    function addChannel() {
        setChannels([
            ...channels,
            {
                channel_type: "PHONE",
                value: "",
                label: "",
                countryCode: "+63",
                phoneNumber: "",
            },
        ]);
    }

    function removeChannel(index: number) {
        setChannels(channels.filter((_, i) => i !== index));
        // Remove errors for this channel
        setChannelErrors((prev) => {
            const updated = { ...prev };
            delete updated[index];
            // Reindex remaining errors
            const reindexed: Record<number, Record<string, string>> = {};
            Object.keys(updated).forEach((key) => {
                const oldIdx = Number(key);
                if (oldIdx > index) {
                    reindexed[oldIdx - 1] = updated[oldIdx];
                } else {
                    reindexed[oldIdx] = updated[oldIdx];
                }
            });
            return reindexed;
        });
    }

    function updateChannel(index: number, updates: Partial<ChannelForm>) {
        const updated = [...channels];
        const channel = { ...updated[index], ...updates };

        // Update value based on channel type
        if (channel.channel_type === "PHONE" || channel.channel_type === "MOBILE") {
            channel.value = channel.countryCode + channel.phoneNumber;
        } else {
            channel.value = updates.value ?? channel.value;
        }

        updated[index] = channel;
        setChannels(updated);

        // Clear errors for this channel when user types
        if (channelErrors[index]) {
            setChannelErrors((prev) => {
                const updated = { ...prev };
                delete updated[index];
                return updated;
            });
        }
    }

    async function performSave() {
        setShowConfirmModal(false);
        setIsSaving(true);
        try {
            // Prepare channels payload - filter out any channels with empty values
            const channelsPayload = channels
                .map((ch) => {
                    let value = ch.value;
                    if (ch.channel_type === "PHONE" || ch.channel_type === "MOBILE") {
                        value = ch.countryCode + ch.phoneNumber;
                    }
                    const trimmedValue = value.trim();
                    // Skip channels with empty values
                    if (!trimmedValue) return null;

                    return {
                        ...(ch.id && { id: ch.id }),
                        channel_type: ch.channel_type,
                        value: trimmedValue,
                        label: ch.label?.trim() || null,
                    };
                })
                .filter((ch): ch is NonNullable<typeof ch> => ch !== null);

            const payload: Record<string, unknown> = {
                branch_name: branchName.trim(),
                contact_person: contactPerson.trim() || null,
                position: position.trim() || null,
                notes: notes.trim() || null,
                channels: channelsPayload,
            };

            // Include bank_id (required for create, optional but recommended for update)
            if (bankId) {
                payload.bank_id = bankId;
            }

            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            let res: Response;
            if (isEdit) {
                res = await fetch(`/api/accountant/maintenance/bank-contacts/${contact!.id}`, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/accountant/maintenance/bank-contacts", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (!res.ok || !data.success) {
                // Try to parse validation errors
                if (data.errors) {
                    const fe: Record<string, string> = {};
                    for (const [key, msgs] of Object.entries(data.errors)) {
                        fe[key] = Array.isArray(msgs) ? (msgs as string[])[0] : String(msgs);
                    }
                    setErrors(fe);
                    // Mark fields as touched to show errors
                    setTouched((prev) => ({
                        ...prev,
                        branchName: true,
                        contactPerson: true,
                        position: true,
                    }));
                }
                const errorMessage = data.message || "Failed to save bank contact.";
                showToast("Save Failed", errorMessage, "error");
                return; // Don't close panel on error
            }

            showToast(
                isEdit ? "Branch Updated" : "Branch Created",
                isEdit
                    ? "Branch details have been updated successfully."
                    : "New branch has been created successfully.",
                "success"
            );
            onSaved();
            handleClose();
        } catch (err: unknown) {
            console.error("Error saving bank contact:", err);
            showToast("Save Failed", err instanceof Error ? err.message : "An error occurred while saving.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    if (!open && !isClosing) return null;

    const fieldClass =
        "w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none transition-all";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-1 mt-2";

    const animationStyle = isClosing
        ? "branchPanelSlideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
        : "branchPanelSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)";

    return (
        <>
            {createPortal(
                <>
                    {/* Global keyframes — injected once, portal-safe */}
                    <style>{`
                        @keyframes branchPanelSlideIn {
                            from { transform: translateX(100%); }
                            to   { transform: translateX(0); }
                        }
                        @keyframes branchPanelSlideOut {
                            from { transform: translateX(0); }
                            to   { transform: translateX(100%); }
                        }
                    `}</style>

                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black/50 transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                        style={{ zIndex: 200 }}
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        className="fixed top-0 right-0 bottom-0 h-screen w-full bg-white flex flex-col rounded-md overflow-hidden shadow-xl"
                        style={{
                            zIndex: 210,
                            maxWidth: "40rem",
                            animation: animationStyle,
                            boxShadow: "-8px 0 24px rgba(0,0,0,0.18)",
                        }}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                            <div>
                                <h2 className="text-lg font-bold">
                                    {isEdit ? "Branch Details" : "Add New Branch"}
                                </h2>
                                <p className="text-sm text-white/90 mt-0.5">
                                    {isEdit ? "Update branch details" : "Create a new branch record"}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body container */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-white">
                            {/* Branch Name */}
                            <div>
                                <label className={labelClass}>Branch Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={branchName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setBranchName(val);
                                            if (errors.branchName && val.trim() && val.length <= 150) {
                                                setErrors((prev) => { const nv = { ...prev }; delete nv.branchName; return nv; });
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched((prev) => ({ ...prev, branchName: true }));
                                            if (!branchName.trim()) {
                                                setErrors((prev) => ({ ...prev, branchName: "Branch name is required." }));
                                            } else if (branchName.length > 150) {
                                                setErrors((prev) => ({ ...prev, branchName: "Branch name must not exceed 150 characters." }));
                                            }
                                        }}
                                        placeholder="Enter branch name"
                                        maxLength={150}
                                        className={`${fieldClass} ${touched.branchName && errors.branchName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                    />
                                </div>
                                {touched.branchName && (
                                    <FormTooltipError
                                        message={errors.branchName}
                                        onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.branchName; return nv; })}
                                    />
                                )}
                            </div>

                            {/* Contact Person */}
                            <div>
                                <label className={labelClass}>Contact Person</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={contactPerson}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setContactPerson(val);
                                            if (errors.contactPerson && val.length <= 255) {
                                                setErrors((prev) => { const nv = { ...prev }; delete nv.contactPerson; return nv; });
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched((prev) => ({ ...prev, contactPerson: true }));
                                            if (contactPerson && contactPerson.length > 255) {
                                                setErrors((prev) => ({ ...prev, contactPerson: "Contact person must not exceed 255 characters." }));
                                            }
                                        }}
                                        placeholder="Enter contact person name"
                                        maxLength={255}
                                        className={`${fieldClass} ${touched.contactPerson && errors.contactPerson ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                    />
                                </div>
                                {touched.contactPerson && (
                                    <FormTooltipError
                                        message={errors.contactPerson}
                                        onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.contactPerson; return nv; })}
                                    />
                                )}
                            </div>

                            {/* Position */}
                            <div>
                                <label className={labelClass}>Position</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={position}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPosition(val);
                                            if (errors.position && val.length <= 150) {
                                                setErrors((prev) => { const nv = { ...prev }; delete nv.position; return nv; });
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched((prev) => ({ ...prev, position: true }));
                                            if (position && position.length > 150) {
                                                setErrors((prev) => ({ ...prev, position: "Position must not exceed 150 characters." }));
                                            }
                                        }}
                                        placeholder="Enter position"
                                        maxLength={150}
                                        className={`${fieldClass} ${touched.position && errors.position ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                    />
                                </div>
                                {touched.position && (
                                    <FormTooltipError
                                        message={errors.position}
                                        onClose={() => setErrors((prev) => { const nv = { ...prev }; delete nv.position; return nv; })}
                                    />
                                )}
                            </div>

                            {/* Notes */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className={labelClass}>Notes</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <AlignLeft className="h-4 w-4" />
                                    </div>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Optional notes"
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Contact Channels Section */}
                            <div className="pt-5 mt-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">Contact Channels</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">Add phone, email, or other contact methods</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addChannel}
                                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 transition active:scale-95"
                                        style={{ background: ACCENT }}
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Channel
                                    </button>
                                </div>

                                {channels.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                                        No contact channels added. Click "Add Channel" to add one.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {channels.map((channel, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {channel.channel_type === "PHONE" && <Phone className="w-4 h-4 text-gray-500" />}
                                                            {channel.channel_type === "MOBILE" && <Phone className="w-4 h-4 text-gray-500" />}
                                                            {channel.channel_type === "EMAIL" && <Mail className="w-4 h-4 text-gray-500" />}
                                                            {channel.channel_type === "VIBER" && <MessageSquare className="w-4 h-4 text-gray-500" />}
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                {channel.channel_type === "PHONE" ? "Phone" :
                                                                    channel.channel_type === "MOBILE" ? "Mobile" :
                                                                        channel.channel_type === "EMAIL" ? "Email" : "Viber"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChannel(index)}
                                                        className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {/* Channel Type */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                                        <select
                                                            value={channel.channel_type}
                                                            onChange={(e) => {
                                                                const newType = e.target.value as ChannelType;
                                                                updateChannel(index, {
                                                                    channel_type: newType,
                                                                    value: "",
                                                                    phoneNumber: "",
                                                                });
                                                            }}
                                                            className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none"
                                                        >
                                                            <option value="PHONE">Phone</option>
                                                            <option value="MOBILE">Mobile</option>
                                                            <option value="EMAIL">Email</option>
                                                            <option value="VIBER">Viber</option>
                                                        </select>
                                                    </div>

                                                    {/* Phone/Mobile Input */}
                                                    {(channel.channel_type === "PHONE" || channel.channel_type === "MOBILE") && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Phone Number <span className="text-red-500">*</span>
                                                                </label>
                                                                <div className="relative flex items-center h-9 rounded-lg border border-gray-300 bg-white focus-within:border-[#7B0F2B] focus-within:ring-2 focus-within:ring-[#7B0F2B]/20 transition-all overflow-hidden text-sm">
                                                                    <div className="flex h-full items-center px-3 bg-gray-50 border-r border-gray-300 text-[#800020] font-bold select-none whitespace-nowrap text-xs">
                                                                        +63
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={channel.phoneNumber}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value.replace(/\D/g, '');
                                                                            if (val.length <= 10) {
                                                                                updateChannel(index, { phoneNumber: val });
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            const chErr = validateChannel(channel, index);
                                                                            if (Object.keys(chErr).length > 0) {
                                                                                setChannelErrors((prev) => ({ ...prev, [index]: chErr }));
                                                                            }
                                                                        }}
                                                                        placeholder="9XX XXX XXXX"
                                                                        className="flex-1 h-full px-3 outline-none min-w-0"
                                                                    />
                                                                </div>
                                                                {channelErrors[index]?.phoneNumber && (
                                                                    <FormTooltipError
                                                                        message={channelErrors[index].phoneNumber}
                                                                        onClose={() => {
                                                                            setChannelErrors((prev) => {
                                                                                const updated = { ...prev };
                                                                                if (updated[index]) {
                                                                                    const chErr = { ...updated[index] };
                                                                                    delete chErr.phoneNumber;
                                                                                    if (Object.keys(chErr).length === 0) {
                                                                                        delete updated[index];
                                                                                    } else {
                                                                                        updated[index] = chErr;
                                                                                    }
                                                                                }
                                                                                return updated;
                                                                            });
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Email Input */}
                                                    {channel.channel_type === "EMAIL" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Email Address <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                    <Mail className="h-4 w-4" />
                                                                </div>
                                                                <input
                                                                    type="email"
                                                                    value={channel.value}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        updateChannel(index, { value: val });
                                                                    }}
                                                                    onBlur={() => {
                                                                        const chErr = validateChannel(channel, index);
                                                                        if (Object.keys(chErr).length > 0) {
                                                                            setChannelErrors((prev) => ({ ...prev, [index]: chErr }));
                                                                        }
                                                                    }}
                                                                    placeholder="contact@example.com"
                                                                    maxLength={255}
                                                                    className={`w-full h-9 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none ${channelErrors[index]?.value ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                                                />
                                                            </div>
                                                            {channelErrors[index]?.value && (
                                                                <FormTooltipError
                                                                    message={channelErrors[index].value}
                                                                    onClose={() => {
                                                                        setChannelErrors((prev) => {
                                                                            const updated = { ...prev };
                                                                            if (updated[index]) {
                                                                                const chErr = { ...updated[index] };
                                                                                delete chErr.value;
                                                                                if (Object.keys(chErr).length === 0) {
                                                                                    delete updated[index];
                                                                                } else {
                                                                                    updated[index] = chErr;
                                                                                }
                                                                            }
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Viber Input */}
                                                    {channel.channel_type === "VIBER" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Viber Number <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                    <MessageSquare className="h-4 w-4" />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={channel.value}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        updateChannel(index, { value: val });
                                                                    }}
                                                                    onBlur={() => {
                                                                        const chErr = validateChannel(channel, index);
                                                                        if (Object.keys(chErr).length > 0) {
                                                                            setChannelErrors((prev) => ({ ...prev, [index]: chErr }));
                                                                        }
                                                                    }}
                                                                    placeholder="Enter Viber number"
                                                                    maxLength={255}
                                                                    className={`w-full h-9 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none ${channelErrors[index]?.value ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                                                />
                                                            </div>
                                                            {channelErrors[index]?.value && (
                                                                <FormTooltipError
                                                                    message={channelErrors[index].value}
                                                                    onClose={() => {
                                                                        setChannelErrors((prev) => {
                                                                            const updated = { ...prev };
                                                                            if (updated[index]) {
                                                                                const chErr = { ...updated[index] };
                                                                                delete chErr.value;
                                                                                if (Object.keys(chErr).length === 0) {
                                                                                    delete updated[index];
                                                                                } else {
                                                                                    updated[index] = chErr;
                                                                                }
                                                                            }
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Label */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Label (Optional)</label>
                                                        <input
                                                            type="text"
                                                            value={channel.label}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                updateChannel(index, { label: val });
                                                            }}
                                                            placeholder="e.g., Main Office, Direct Line"
                                                            maxLength={100}
                                                            className={`w-full h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none ${channelErrors[index]?.label ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                                        />
                                                        {channelErrors[index]?.label && (
                                                            <FormTooltipError
                                                                message={channelErrors[index].label}
                                                                onClose={() => {
                                                                    setChannelErrors((prev) => {
                                                                        const updated = { ...prev };
                                                                        if (updated[index]) {
                                                                            const chErr = { ...updated[index] };
                                                                            delete chErr.label;
                                                                            if (Object.keys(chErr).length === 0) {
                                                                                delete updated[index];
                                                                            } else {
                                                                                updated[index] = chErr;
                                                                            }
                                                                        }
                                                                        return updated;
                                                                    });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex-shrink-0 flex items-center justify-between gap-3 p-4 border-t bg-gray-50" style={{ borderColor: BORDER }}>
                            <div className="flex items-center gap-3 ml-auto">
                                <button
                                    onClick={handleClose}
                                    disabled={isSaving}
                                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-neutral-100 transition-colors"
                                    style={{ borderColor: BORDER, color: "#111", height: 40 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition active:scale-95"
                                    style={{ background: ACCENT, height: 40 }}
                                >
                                    {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Branch"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Confirmation Modal - rendered separately with higher z-index to overlay panel */}
            {showConfirmModal && createPortal(
                <ConfirmationModal
                    open={showConfirmModal}
                    icon={Save}
                    color={ACCENT}
                    title={isEdit ? "Confirm Update" : "Confirm Creation"}
                    message={
                        <>
                            Are you sure you want to {isEdit ? "update" : "create"} the branch{" "}
                            <strong>{branchName.trim() || "with the provided details"}</strong>?
                            {channels.length > 0 && (
                                <> This branch will have {channels.length} contact channel{channels.length !== 1 ? "s" : ""}.</>
                            )}
                        </>
                    }
                    confirmLabel={isEdit ? "Update Branch" : "Create Branch"}
                    onCancel={() => setShowConfirmModal(false)}
                    onConfirm={performSave}
                    isConfirming={isSaving}
                    zIndex={300}
                />,
                document.body
            )}

            {/* Loading Modal - rendered outside portal with higher z-index */}
            {isSaving && createPortal(
                <LoadingModal
                    isOpen={isSaving}
                    title={isEdit ? "Updating Branch" : "Creating Branch"}
                    message={isEdit ? "Please wait while we update the branch details..." : "Please wait while we create the new branch..."}
                    zIndex={300}
                />,
                document.body
            )}
        </>
    );
}
