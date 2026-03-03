"use client"

import React from "react"
import { FileText } from "lucide-react"
import EmptyState from "@/components/app/EmptyState"

// ─── Column Definition ───────────────────────────────────────────────────────

export interface LedgerColumn {
    /** Unique key for the column — used as the `key` prop and passed to `renderCell`. */
    key: string
    /** Display label shown in the header. */
    label: string
    /** CSS min-width (e.g. "110px"). Applied to both header and cell. */
    minWidth?: string
    /** Text alignment. Defaults to "left". */
    align?: "left" | "right"
    /** If true, the column fills remaining space (flex-1). */
    flex?: boolean
    /** If true, the column is hidden. Useful for toggling columns. */
    hidden?: boolean
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface LedgerTableProps<T> {
    /** Column definitions for the header and cell layout. */
    columns: LedgerColumn[]
    /** The data rows to render. */
    rows: T[]
    /**
     * Render the content for a single cell.
     * Receives the row data, the column definition, and the row index.
     */
    renderCell: (row: T, column: LedgerColumn, rowIndex: number) => React.ReactNode

    // ── Header ──
    /** Main title shown in the header card (e.g. "ABIC REALTY & CONSULTANCY CORPORATION 2025"). */
    headerTitle?: string
    /** Subtitle shown below the title (e.g. the selected account name). */
    headerSubtitle?: string

    // ── Loading ──
    /** Whether the table is in a loading state (shows shimmer skeletons). */
    loading?: boolean
    /** Number of skeleton rows to show while loading. Defaults to 5. */
    skeletonCount?: number

    // ── Empty state ──
    /** Icon for the empty state. Defaults to FileText. */
    emptyIcon?: React.ElementType
    /** Title for the empty state. */
    emptyTitle?: string
    /** Description for the empty state. */
    emptyDescription?: string

    // ── Row interactions ──
    /** Called when a row card is clicked. */
    onRowClick?: (row: T, index: number) => void
    /** Return true if a given row should be clickable (shows pointer cursor and hover effect). */
    isRowClickable?: (row: T) => boolean
    /** Return true if a given row should be visually highlighted (ring + tinted bg). */
    isRowHighlighted?: (row: T) => boolean
    /** Ref callback for the first highlighted row — use to scroll it into view. */
    highlightedRowRef?: (el: HTMLDivElement | null) => void

    // ── Info row ──
    /** Info text shown between the header and the rows (e.g. "Showing 1 to 50 of 120 entries"). */
    infoText?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)"

function columnStyle(col: LedgerColumn, isFirst: boolean): React.CSSProperties {
    return {
        minWidth: col.minWidth,
        textAlign: col.align ?? "left",
        ...(isFirst ? {} : { borderLeft: `1px solid ${BORDER}`, paddingLeft: "0.75rem" }),
    }
}

function columnClassName(col: LedgerColumn, isFirst: boolean): string {
    const parts: string[] = []
    if (col.minWidth) parts.push(`min-w-[${col.minWidth}]`)
    if (col.flex) parts.push("flex-1 min-w-0")
    if (col.align === "right") parts.push("text-right")
    if (!isFirst) parts.push("border-l pl-3 border-gray-200")
    return parts.join(" ")
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LedgerTable<T>({
    columns,
    rows,
    renderCell,
    headerTitle,
    headerSubtitle,
    loading = false,
    skeletonCount = 5,
    emptyIcon = FileText,
    emptyTitle = "No transactions found",
    emptyDescription = "Transactions will appear here once recorded",
    onRowClick,
    isRowClickable,
    isRowHighlighted,
    highlightedRowRef,
    infoText,
}: LedgerTableProps<T>) {
    const visibleColumns = columns.filter((c) => !c.hidden)

    return (
        <>
            {/* Info text */}
            {infoText && (
                <div className="mt-3 text-sm text-neutral-600">{infoText}</div>
            )}

            {/* ── Sticky Column Header ── */}
            <div className="mt-6 rounded-md border border-gray-200 overflow-hidden bg-white sticky top-0 z-10 shadow-sm">
                <div className="px-4 py-3">
                    {/* Title / Subtitle */}
                    {(headerTitle || headerSubtitle) && (
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 border-l-4 border-[#7a0f1f] pl-4">
                                {headerTitle && (
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                                        {headerTitle}
                                    </div>
                                )}
                                {headerSubtitle && (
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-0.5">
                                        {headerSubtitle}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Column Labels */}
                    <div
                        className={`flex items-center gap-4 text-xs font-bold text-gray-700 ${headerTitle || headerSubtitle ? "pt-3 border-t border-gray-200" : ""
                            }`}
                    >
                        {visibleColumns.map((col, i) => (
                            <div
                                key={col.key}
                                className={columnClassName(col, i === 0)}
                                style={{ minWidth: col.minWidth }}
                            >
                                {col.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Rows ── */}
            <div className="mt-2 space-y-2">
                {loading ? (
                    /* Skeleton rows */
                    [...Array(skeletonCount)].map((_, idx) => (
                        <div
                            key={idx}
                            className="rounded-md bg-white border border-gray-200 shadow-sm animate-pulse p-3"
                        >
                            <div className="flex items-center gap-4">
                                {visibleColumns.map((col) => (
                                    <div
                                        key={col.key}
                                        className={col.flex ? "flex-1" : ""}
                                        style={{ minWidth: col.minWidth }}
                                    >
                                        <div className="h-4 bg-gray-200 rounded w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : rows.length === 0 ? (
                    /* Empty state */
                    <div className="rounded-md bg-white border border-gray-200 p-4">
                        <EmptyState
                            title={emptyTitle}
                            description={emptyDescription}
                        />
                    </div>
                ) : (
                    /* Data rows */
                    rows.map((row, idx) => {
                        const clickable = isRowClickable?.(row) ?? false
                        const highlighted = isRowHighlighted?.(row) ?? false
                        let foundHighlightRef = false

                        return (
                            <div
                                key={idx}
                                className={`rounded-md bg-white border border-gray-200 shadow-none hover:bg-gray-50 transition-all p-3 ${highlighted
                                        ? "ring-2 ring-[#7a0f1f] ring-offset-2 bg-[#7a0f1f]/5"
                                        : ""
                                    } ${clickable ? "cursor-pointer hover:bg-[#7a0f1f]/5" : ""}`}
                                onClick={() => {
                                    if (clickable) onRowClick?.(row, idx)
                                }}
                                ref={(el) => {
                                    if (highlighted && !foundHighlightRef) {
                                        foundHighlightRef = true
                                        highlightedRowRef?.(el)
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4 text-xs">
                                    {visibleColumns.map((col, colIdx) => (
                                        <div
                                            key={col.key}
                                            className={columnClassName(col, colIdx === 0)}
                                            style={{ minWidth: col.minWidth }}
                                        >
                                            {renderCell(row, col, idx)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </>
    )
}
