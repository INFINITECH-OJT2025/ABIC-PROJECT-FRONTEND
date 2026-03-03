"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "lucide-react"
import type { NavEntry } from "@/components/app/AppSidebar"

// ─── Decorative SVG pattern for header background ────────────────────────────

const HERO_PATTERN = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`

// ─── Helper: find nav metadata for current path ─────────────────────────────

export interface NavMeta {
    label: string
    icon: React.ElementType
}

/**
 * Walk a NavEntry[] config and return the icon + label for the entry
 * whose `href` best matches the given pathname.
 *
 * Match priority:
 *   1. Exact match on a "link" entry
 *   2. Exact match on an item inside a "group"
 *   3. Prefix match (startsWith) on a "link" entry
 *   4. Prefix match on a group item
 */
export function findNavMeta(
    navigation: NavEntry[],
    pathname: string
): NavMeta | null {
    const path = pathname.split("?")[0]

    let exactLink: NavMeta | null = null
    let exactGroupItem: NavMeta | null = null
    let prefixLink: NavMeta | null = null
    let prefixGroupItem: NavMeta | null = null

    for (const entry of navigation) {
        if (entry.type === "link") {
            const base = entry.href.split("?")[0]
            if (path === base) {
                exactLink = { label: entry.label, icon: entry.icon }
            } else if (!prefixLink && path.startsWith(base + "/")) {
                prefixLink = { label: entry.label, icon: entry.icon }
            }
        } else if (entry.type === "group") {
            for (const item of entry.items) {
                const base = item.href.split("?")[0]
                if (path === base) {
                    exactGroupItem = { label: item.label, icon: item.icon }
                } else if (!prefixGroupItem && path.startsWith(base + "/")) {
                    prefixGroupItem = { label: item.label, icon: item.icon }
                }
            }
        }
    }

    return exactLink ?? exactGroupItem ?? prefixLink ?? prefixGroupItem ?? null
}

// ─── Component props ─────────────────────────────────────────────────────────

export interface AppHeaderProps {
    /** Navigation config — same array passed to AppSidebar.
     *  Used to auto-resolve icon & title from the current route. */
    navigation: NavEntry[]
    /** Override the auto-resolved title */
    title?: string
    /** Subtitle shown under the title */
    subtitle?: string
    /** Override the auto-resolved icon */
    icon?: React.ElementType
    /** Optional action element rendered on the right (e.g. a button) */
    primaryAction?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppHeader({
    navigation,
    title: titleOverride,
    subtitle,
    icon: iconOverride,
    primaryAction,
}: AppHeaderProps) {
    const pathname = usePathname()
    const meta = findNavMeta(navigation, pathname)

    const Icon = iconOverride ?? meta?.icon ?? LayoutDashboard
    const title = titleOverride ?? meta?.label ?? "Page"

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-8">

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Icon pill */}
                    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-white/80 text-sm mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>
                {primaryAction && <div>{primaryAction}</div>}
            </div>
        </div>
    )
}
