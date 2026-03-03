"use client"

import React, { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ChevronDown, X, PanelLeft, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import LogoutConfirmModal from "@/components/app/LogoutConfirmationModal"
import LoadingModal from "@/components/app/LoadingModal"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavItem {
    label: string
    href: string
    icon: React.ElementType
}

export interface NavGroup {
    label: string
    icon: React.ElementType
    items: NavItem[]
}

/** A single link, a dropdown group, a visual divider, or a section label */
export type NavEntry =
    | { type: "link"; label: string; href: string; icon: React.ElementType; exact?: boolean }
    | { type: "group"; label: string; icon: React.ElementType; items: NavItem[] }
    | { type: "divider" }
    | { type: "section"; label: string }

export interface AppSidebarProps {
    /** Role label shown under the avatar (e.g. "Super Admin", "Accountant") */
    roleLabel: string
    /** Base path for this role (e.g. "/super", "/admin") */
    basePath: string
    /** Current user info */
    user: { name?: string; email?: string } | null
    /** Logout handler */
    onLogout: () => void
    /** Navigation entries */
    navigation: NavEntry[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isActivePath = (pathname: string, href: string, exact?: boolean) => {
    const path = pathname.split("?")[0]
    const base = href.split("?")[0]
    if (exact) return path === base
    return path === base || path.startsWith(base + "/")
}

// ─── Tooltip state type ──────────────────────────────────────────────────────

type TooltipData =
    | { kind: "link"; label: string; href: string; icon: React.ElementType; top: number; left: number }
    | { kind: "group"; label: string; items: NavItem[]; top: number; left: number }

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppSidebar({
    roleLabel,
    basePath,
    user,
    onLogout,
    navigation,
}: AppSidebarProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    // ─── Tooltip state (fixed positioning to escape overflow) ────────────
    const [tooltip, setTooltip] = useState<TooltipData | null>(null)
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showTooltip = useCallback((data: TooltipData) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
        }
        setTooltip(data)
    }, [])

    const scheduleHideTooltip = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setTooltip(null)
            hideTimeoutRef.current = null
        }, 200)
    }, [])

    const cancelHideTooltip = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
        }
    }, [])

    // Track which groups are open — auto-open groups whose items match current path
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        navigation.forEach((entry) => {
            if (entry.type === "group") {
                initial[entry.label] = entry.items.some((item) =>
                    isActivePath(pathname, item.href)
                )
            }
        })
        return initial
    })

    const toggleGroup = (label: string) =>
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

    const handleLogout = () => {
        setShowLogoutConfirm(false)
        setLoggingOut(true)
        onLogout()
    }

    // ─── Sub-components ──────────────────────────────────────────────────────

    const SubNavLink = ({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) => (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 text-[13px] font-medium",
                isActivePath(pathname, href)
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
        >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">{children}</span>
        </Link>
    )

    // ─── Mouse handlers for collapsed tooltips ───────────────────────────

    const handleLinkMouseEnter = (e: React.MouseEvent, entry: Extract<NavEntry, { type: "link" }>) => {
        if (!isCollapsed) return
        const rect = e.currentTarget.getBoundingClientRect()
        showTooltip({
            kind: "link",
            label: entry.label,
            href: entry.href,
            icon: entry.icon,
            top: rect.top + rect.height / 2,
            left: rect.right,
        })
    }

    const handleGroupMouseEnter = (e: React.MouseEvent, entry: Extract<NavEntry, { type: "group" }>) => {
        if (!isCollapsed) return
        const rect = e.currentTarget.getBoundingClientRect()
        showTooltip({
            kind: "group",
            label: entry.label,
            items: entry.items,
            top: rect.top + rect.height / 2,
            left: rect.right,
        })
    }

    // ─── Nav item renderers ──────────────────────────────────────────────

    const renderLink = (entry: Extract<NavEntry, { type: "link" }>) => (
        <div
            key={entry.label}
            onMouseEnter={(e) => handleLinkMouseEnter(e, entry)}
            onMouseLeave={scheduleHideTooltip}
        >
            <Link
                href={entry.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                    isCollapsed ? "justify-center" : "",
                    isActivePath(pathname, entry.href, entry.exact)
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
            >
                <entry.icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{entry.label}</span>}
            </Link>
        </div>
    )

    const renderGroup = (entry: Extract<NavEntry, { type: "group" }>) => {
        const isOpen = openGroups[entry.label] ?? false

        return (
            <div
                key={entry.label}
                onMouseEnter={(e) => handleGroupMouseEnter(e, entry)}
                onMouseLeave={scheduleHideTooltip}
            >
                <button
                    onClick={() => toggleGroup(entry.label)}
                    className={cn(
                        "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                        isCollapsed ? "justify-center" : "justify-between",
                        entry.items.some((i) => isActivePath(pathname, i.href))
                            ? "text-white bg-white/[0.06]"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <entry.icon size={18} className="shrink-0" />
                        {!isCollapsed && <span className="whitespace-nowrap">{entry.label}</span>}
                    </div>
                    {!isCollapsed && (
                        <ChevronDown
                            size={14}
                            className={cn("transition-transform duration-200 shrink-0 text-white/40", isOpen && "rotate-180")}
                        />
                    )}
                </button>

                {/* Expanded sub-menu (only when NOT collapsed) */}
                {!isCollapsed && (
                    <div
                        className={cn(
                            "ml-7 mt-0.5 border-l border-white/10 pl-2",
                            "space-y-0.5 transition-all duration-200",
                            isOpen ? "block" : "hidden"
                        )}
                    >
                        {entry.items.map((item) => (
                            <SubNavLink key={item.href} href={item.href} icon={item.icon}>
                                {item.label}
                            </SubNavLink>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div
            className={cn(
                isCollapsed ? "w-[72px]" : "w-60",
                "bg-gradient-to-b from-[#7B0F2B] to-[#5E0C20] text-white h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-50"
            )}
        >
            {/* Collapse toggle */}
            <div className={cn("flex items-center px-3 pt-3", isCollapsed ? "justify-center" : "justify-end")}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? <PanelLeft size={18} /> : <X size={18} />}
                </button>
            </div>

            {/* Logo */}
            <Link href={basePath} className="flex justify-center py-3">
                <img
                    src="/images/logo/abic-logo.png"
                    alt="ABIC Logo"
                    className={cn(
                        "object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 ease-in-out",
                        isCollapsed
                            ? "w-9 h-9"
                            : "max-w-[240px] h-16"
                    )}
                />
            </Link>

            {/* Profile */}
            <div className={cn("px-4 mb-3", isCollapsed ? "flex justify-center" : "")}>
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.06]">
                        <div className="w-9 h-9 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0">
                            <User size={16} className="text-white/70" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-none mb-0.5">
                                {roleLabel}
                            </span>
                            <span className="text-sm font-semibold text-white/90 line-clamp-2 break-words leading-tight">
                                {user?.name || "User"}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
                        <User size={16} className="text-white/70" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-1 space-y-1">
                {navigation.map((entry, idx) => {
                    if (entry.type === "divider") {
                        return (
                            <div key={`divider-${idx}`} className="px-2 py-1.5">
                                <div className="border-t border-white/10" />
                            </div>
                        )
                    }
                    if (entry.type === "section") {
                        return (
                            <div key={`section-${idx}`} className={cn("px-3 pt-1 pb-0.5", isCollapsed && "px-1")}>
                                {!isCollapsed ? (
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">
                                        {entry.label}
                                    </span>
                                ) : (
                                    <div className="w-full flex justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    </div>
                                )}
                            </div>
                        )
                    }
                    if (entry.type === "link") return renderLink(entry)
                    return renderGroup(entry)
                })}
            </nav>

            {/* ── Fixed tooltip (rendered outside the scrollable nav) ── */}
            {isCollapsed && tooltip && (
                <div
                    className="fixed z-[9999]"
                    style={{ top: tooltip.top, left: tooltip.left, transform: "translateY(-50%)" }}
                    onMouseEnter={cancelHideTooltip}
                    onMouseLeave={scheduleHideTooltip}
                >
                    {/* Invisible bridge so mouse can travel from sidebar to tooltip */}
                    <div className="absolute right-full top-0 w-3 h-full" />

                    <div className="ml-4 bg-white rounded-lg p-2 border border-gray-200 shadow-xl min-w-[11rem]">
                        {/* Header label */}
                        <div className="px-2 py-1 text-[10px] font-bold text-[#5E0C20] uppercase tracking-widest border-b border-gray-100 mb-1">
                            {tooltip.label}
                        </div>

                        {tooltip.kind === "link" ? (
                            <Link
                                href={tooltip.href}
                                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[#7B0F2B]/5 text-[13px] font-medium text-[#7B0F2B] transition-colors"
                            >
                                <tooltip.icon size={15} />
                                <span>{tooltip.label}</span>
                            </Link>
                        ) : (
                            tooltip.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
                                        isActivePath(pathname, item.href)
                                            ? "bg-[#7B0F2B]/10 text-[#7B0F2B] font-semibold"
                                            : "text-[#7B0F2B]/80 hover:bg-[#7B0F2B]/5 hover:text-[#7B0F2B]"
                                    )}
                                >
                                    <item.icon size={15} className="shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Divider + Logout */}
            <div className="px-4 pt-2">
                <div className="border-t border-white/10" />
            </div>

            <div className="p-3">
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={cn(
                        "flex items-center gap-2.5 rounded-lg transition-all duration-200 text-sm font-medium w-full",
                        "bg-white/[0.08] hover:bg-white/15 text-white/80 hover:text-white border border-white/10 hover:border-white/20",
                        "active:scale-[0.97]",
                        isCollapsed
                            ? "justify-center p-2.5"
                            : "px-3 py-2.5 justify-center"
                    )}
                    title="Log Out"
                >
                    <LogOut size={16} className="shrink-0" />
                    {!isCollapsed && <span className="text-xs font-semibold uppercase tracking-wider">Logout</span>}
                </button>
            </div>

            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />

            <LoadingModal
                isOpen={loggingOut}
                title="Logging Out"
                message="Please wait while we sign you out..."
            />
        </div>
    )
}
