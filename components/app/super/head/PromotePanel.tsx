"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, X, ArrowUp } from "lucide-react"
import LoadingModal from "@/components/app/LoadingModal"
import { useAppToast } from "@/components/app/toast/AppToastProvider"
import EmptyState from "@/components/app/EmptyState"

const BORDER = "rgba(0,0,0,0.12)"

type Employee = {
    id: number
    first_name: string
    last_name: string
    email: string
    position: string
}

export interface PromotePanelProps {
    /** Whether the panel is open. */
    open: boolean
    /** Called to close the panel. */
    onClose: () => void
    /** The role label displayed in the header, e.g. "Admin" or "Accountant". */
    roleLabel: string
    /**
     * The API endpoint to POST the promotion to.
     * e.g. "/api/admin/accounts/promote-from-employee"
     */
    promoteEndpoint: string
    /** Called after a successful promotion so the parent can refresh its list. */
    onPromoted: () => void
}

function PromotePanelEmployeeSkeleton() {
    return (
        <li
            className="flex items-center justify-between gap-4 p-3 rounded-md border animate-pulse"
            style={{ borderColor: BORDER }}
        >
            <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 rounded-md bg-gray-200 w-3/4" />
                <div className="h-3 rounded-md bg-gray-200 w-1/2" />
                <div className="h-3 rounded-md bg-gray-200 w-1/3" />
            </div>
            <div className="h-9 rounded-md bg-gray-200 w-24 flex-shrink-0" />
        </li>
    )
}

export default function PromotePanel({
    open,
    onClose,
    roleLabel,
    promoteEndpoint,
    onPromoted,
}: PromotePanelProps) {
    const { showToast } = useAppToast()
    const [closing, setClosing] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [showPromoteLoading, setShowPromoteLoading] = useState(false)
    const [confirmEmployee, setConfirmEmployee] = useState<Employee | null>(null)

    // Fetch eligible employees when panel opens
    useEffect(() => {
        if (open && !closing) {
            setLoading(true)
            fetch("/api/employees?eligible_for_promotion=1")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && Array.isArray(data.data)) {
                        setEmployees(data.data)
                    } else {
                        setEmployees([])
                    }
                })
                .catch(() => setEmployees([]))
                .finally(() => setLoading(false))
        }
    }, [open, closing])

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return employees
        const q = searchQuery.trim().toLowerCase()
        return employees.filter(
            (emp) =>
                (emp.first_name?.toLowerCase() ?? "").includes(q) ||
                (emp.last_name?.toLowerCase() ?? "").includes(q) ||
                (emp.email?.toLowerCase() ?? "").includes(q) ||
                (emp.position?.toLowerCase() ?? "").includes(q)
        )
    }, [employees, searchQuery])

    const handleClose = () => {
        setClosing(true)
        setTimeout(() => {
            onClose()
            setClosing(false)
            setEmployees([])
            setSearchQuery("")
            setConfirmEmployee(null)
        }, 350)
    }

    const handlePromote = async (employeeId: number) => {
        setConfirmEmployee(null)
        setShowPromoteLoading(true)
        try {
            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (pageUrl) headers["X-Page-URL"] = pageUrl;

            const res = await fetch(promoteEndpoint, {
                method: "POST",
                headers,
                body: JSON.stringify({ employee_id: employeeId }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setEmployees((prev) => prev.filter((e) => e.id !== employeeId))
                onPromoted()
                showToast(
                    `Employee Promoted to ${roleLabel}`,
                    "Login credentials have been sent to their email address.",
                    "success"
                )
            } else {
                showToast(
                    "Failed to Promote",
                    data.message || `Failed to promote employee to ${roleLabel.toLowerCase()}`,
                    "error"
                )
            }
        } catch {
            showToast(
                "Failed to Promote",
                `Failed to promote employee to ${roleLabel.toLowerCase()}`,
                "error"
            )
        } finally {
            setShowPromoteLoading(false)
        }
    }

    if (!open && !closing) return null

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${closing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
                style={{
                    animation: closing
                        ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                        : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                    boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
                    <div>
                        <h2 className="text-lg font-bold">Promote to {roleLabel}</h2>
                        <p className="text-sm text-white/90 mt-0.5">
                            Select an approved employee to promote as {roleLabel.toLowerCase()}.
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

                {/* Search */}
                <div className="flex-shrink-0 px-4 pt-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or position..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-md border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/30"
                            style={{ borderColor: BORDER, color: "#111" }}
                        />
                    </div>
                </div>

                {/* Employee List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
                    {loading ? (
                        <ul className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <PromotePanelEmployeeSkeleton key={i} />
                            ))}
                        </ul>
                    ) : employees.length === 0 ? (
                        <EmptyState
                            title="No employees available"
                            description="No approved employees available for promotion. Approve employees from the Masterfile first."
                        />
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-sm">No employees match your search.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {filtered.map((emp) => (
                                <li
                                    key={emp.id}
                                    className="flex items-center justify-between gap-4 p-3 rounded-md border"
                                    style={{ borderColor: BORDER }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 truncate">
                                            {emp.first_name} {emp.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{emp.email}</p>
                                        <p className="text-xs text-gray-400">{emp.position}</p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmEmployee(emp)}
                                        disabled={showPromoteLoading}
                                        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: "#7a0f1f" }}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                        Promote
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmEmployee && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                >
                    <div className="relative">
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-[#7a0f1f]">
                                <ArrowUp className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div
                            className="w-96 rounded-lg p-6 pt-12 shadow-xl border bg-white"
                            style={{ borderColor: BORDER }}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="text-lg font-bold text-[#5f0c18]">
                                    Confirm Promotion
                                </div>
                                <div className="mt-2 text-sm text-neutral-800">
                                    Are you sure you want to promote{" "}
                                    <strong>
                                        {confirmEmployee.first_name} {confirmEmployee.last_name}
                                    </strong>{" "}
                                    ({confirmEmployee.email}) to {roleLabel.toLowerCase()}? Login
                                    credentials will be sent to their email address.
                                </div>
                                <div className="mt-6 w-full flex gap-3">
                                    <button
                                        onClick={() => setConfirmEmployee(null)}
                                        className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handlePromote(confirmEmployee.id)}
                                        disabled={showPromoteLoading}
                                        className="flex-1 h-10 rounded-lg bg-[#7B0F2B] hover:bg-[#5E0C20] text-white transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Modal */}
            <LoadingModal
                isOpen={showPromoteLoading}
                title={`Promoting to ${roleLabel}`}
                message="Please wait while we promote the employee and send the login credentials..."
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
    )
}
