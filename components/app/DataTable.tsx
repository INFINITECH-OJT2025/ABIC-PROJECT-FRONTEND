"use client"

import React, { useState, useRef, useEffect, ReactNode } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import EmptyState from "@/components/app/EmptyState"
import InfoTooltip from "@/components/app/InfoTooltip"

// ─── Truncated Cell Wrapper ───────────────────────────────────────────────────

function TruncatedCell({ content, maxWidth }: { content: ReactNode, maxWidth: string }) {
    const textRef = useRef<HTMLDivElement>(null)
    const [isTruncated, setIsTruncated] = useState(false)

    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                // Determine if actual text width exceeds visible container width
                setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth)
            }
        }

        checkTruncation()

        const el = textRef.current;
        if (!el) return;

        const observer = new ResizeObserver(() => {
            checkTruncation()
        });

        // Observe the parent container (td) to react to table column size changes
        if (el.parentElement) {
            observer.observe(el.parentElement);
        } else {
            observer.observe(el);
        }

        return () => observer.disconnect()
    }, [content]) // Re-run if content changes

    const StringContent = typeof content === "string" || typeof content === "number" ? String(content) : undefined

    const InnerCell = (
        <div ref={textRef} className="truncate w-full inline-block align-bottom cursor-default">
            {content ?? <span className="text-gray-300">—</span>}
        </div>
    )

    if (isTruncated && StringContent) {
        return (
            <InfoTooltip text={StringContent}>
                {InnerCell}
            </InfoTooltip>
        )
    }

    return InnerCell
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null

export interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export interface DataTableColumn<T = any> {
    /** Unique key — used as React key and passed to renderCell */
    key: string
    /** Header label */
    label: React.ReactNode
    /** If true, column fills remaining space */
    flex?: boolean
    /** Fixed width (e.g. "120px") */
    width?: string
    /** Minimum width (e.g. "150px") */
    minWidth?: string
    /** Maximum width (e.g. "200px") - automatically applies truncation and tooltip */
    maxWidth?: string
    /** Text alignment. Default "left" */
    align?: "left" | "center" | "right"
    /** Whether this column is sortable */
    sortable?: boolean
    /** Hide column */
    hidden?: boolean
    /** Custom class for the th cell */
    headerClassName?: string
    /** Custom render for cell content */
    renderCell?: (row: T, rowIndex: number) => React.ReactNode
}

export interface DataTableProps<T = any> {
    columns: DataTableColumn<T>[]
    rows: T[]
    /** Custom render fallback if column has no renderCell */
    renderCell?: (row: T, col: DataTableColumn<T>, rowIndex: number) => React.ReactNode
    /** Loading state — shows skeleton */
    loading?: boolean
    skeletonCount?: number
    /** Empty state overrides */
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: React.ElementType
    /** Row click */
    onRowClick?: (row: T, index: number) => void
    isRowClickable?: (row: T) => boolean
    /** Highlight a row (e.g. selected) */
    isRowSelected?: (row: T) => boolean
    /** If sortable columns exist, this fires when the user clicks a header */
    onSort?: (key: string, direction: SortDirection) => void
    /** Controlled sort state from outside */
    sortKey?: string | null
    sortDirection?: SortDirection
    /** Optional caption above the table */
    caption?: string
    /** Optional slot rendered in the top-right of the header area */
    headerAction?: React.ReactNode
    /**
     * Pagination — pass the meta object from your API response.
     * The table will render "Showing X to Y of Z items" + page buttons.
     */
    pagination?: PaginationMeta | null
    /** Called when the user clicks a page button */
    onPageChange?: (page: number) => void
    /** Plural label for the record type, e.g. "admins", "accountants" */
    itemName?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT = "#7a0f1f"

function alignClass(align?: "left" | "center" | "right") {
    if (align === "right") return "text-right justify-end"
    if (align === "center") return "text-center justify-center"
    return "text-left justify-start"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ colKey, sortKey, sortDirection }: { colKey: string; sortKey?: string | null; sortDirection?: SortDirection }) {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />
    if (sortDirection === "asc") return <ChevronUp className="w-3.5 h-3.5 text-white" />
    if (sortDirection === "desc") return <ChevronDown className="w-3.5 h-3.5 text-white" />
    return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
}

function SkeletonRow({ columns, rowIndex }: { columns: DataTableColumn[], rowIndex: number }) {
    const isOdd = rowIndex % 2 === 1
    const rowBg = isOdd ? "rgba(255, 241, 242, 0.4)" : "#ffffff"
    return (
        <tr style={{ background: rowBg }} className="border-b border-gray-100 last:border-0">
            {columns.map((col) => (
                <td
                    key={col.key}
                    className="px-4 py-3"
                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                >
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-full" />
                </td>
            ))}
        </tr>
    )
}

function TablePaginationSkeleton() {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-[#7a0f1f] border-b border-white/20">
            <div className="h-5 w-40 bg-white/20 rounded animate-pulse" />

            <div className="flex items-center gap-1">
                {/* Left arrow */}
                <div className="w-9 h-9 rounded-md bg-white/20 animate-pulse" />

                {/* 4 page buttons */}
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="w-9 h-9 rounded-md bg-white/20 animate-pulse"
                    />
                ))}

                {/* Right arrow */}
                <div className="w-9 h-9 rounded-md bg-white/20 animate-pulse" />
            </div>
        </div>
    )
}

function TablePagination({
    meta,
    onPageChange,
    itemName = "items",
}: {
    meta: PaginationMeta
    onPageChange?: (page: number) => void
    itemName?: string
}) {
    const pages: number[] = []
    const { current_page, last_page } = meta

    let start = Math.max(1, current_page - 1)
    let end = start + 3

    if (end > last_page) {
        end = last_page
        start = Math.max(1, end - 3)
    }

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    const btnBase =
        "inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium transition-colors"

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-[#7a0f1f] text-white border-b border-white/20">
            <span className="text-sm text-white/90">
                Showing <span className="font-semibold text-white/90">{meta.from}</span> to{" "}
                <span className="font-semibold text-white/90">{meta.to}</span> of{" "}
                <span className="font-semibold text-white/90">{meta.total}</span> {itemName}
            </span>

            {last_page > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange?.(current_page - 1)}
                        disabled={current_page === 1}
                        className={`${btnBase} border border-white/30 text-white hover:bg-[#65101a] disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            onClick={() => onPageChange?.(p)}
                            className={`${btnBase} ${current_page === p
                                ? "bg-white text-[#7a0f1f] border border-white"
                                : "border border-white/30 text-white hover:bg-[#65101a]"
                                }`}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        onClick={() => onPageChange?.(current_page + 1)}
                        disabled={current_page === last_page}
                        className={`${btnBase} border border-white/30 text-white hover:bg-[#65101a] disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, any>>({
    columns,
    rows,
    renderCell,
    loading = false,
    skeletonCount = 6,
    emptyTitle = "No records found",
    emptyDescription = "Records will appear here once available.",
    onRowClick,
    isRowClickable,
    isRowSelected,
    onSort,
    sortKey: controlledSortKey,
    sortDirection: controlledSortDir,
    caption,
    headerAction,
    pagination,
    onPageChange,
    itemName = "items",
}: DataTableProps<T>) {
    const [internalSortKey, setInternalSortKey] = useState<string | null>(null)
    const [internalSortDir, setInternalSortDir] = useState<SortDirection>(null)

    const sortKey = controlledSortKey !== undefined ? controlledSortKey : internalSortKey
    const sortDirection = controlledSortDir !== undefined ? controlledSortDir : internalSortDir

    const visibleColumns = columns.filter((c) => !c.hidden)

    function handleHeaderClick(col: DataTableColumn<T>) {
        if (!col.sortable) return
        let nextDir: SortDirection
        if (sortKey !== col.key) nextDir = "asc"
        else if (sortDirection === "asc") nextDir = "desc"
        else nextDir = null

        if (onSort) {
            onSort(col.key, nextDir)
        } else {
            setInternalSortKey(nextDir === null ? null : col.key)
            setInternalSortDir(nextDir)
        }
    }

    const displayRows = React.useMemo(() => {
        if (onSort || !sortKey || !sortDirection) return rows
        return [...rows].sort((a, b) => {
            const aVal = a[sortKey] ?? ""
            const bVal = b[sortKey] ?? ""
            const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" })
            return sortDirection === "asc" ? cmp : -cmp
        })
    }, [rows, sortKey, sortDirection, onSort])

    return (
        <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">

            {/* ── Pagination header ── */}
            {loading ? (
                <TablePaginationSkeleton />
            ) : pagination && pagination.total > 0 ? (
                <TablePagination meta={pagination} onPageChange={onPageChange} itemName={itemName} />
            ) : null}

            {/* ── Table ── */}
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="sticky top-0 z-10 border-b border-gray-200">
                            {visibleColumns.map((col, colIndex) => {
                                const isActive = sortKey === col.key
                                const isAlt = colIndex % 2 === 1
                                return (
                                    <th
                                        key={col.key}
                                        className={`
                                            px-4 py-3 font-bold text-[11px] uppercase tracking-wider whitespace-pre-wrap
                                            select-none
                                            ${col.sortable ? "cursor-pointer transition-colors" : ""}
                                            ${col.headerClassName ? col.headerClassName : "text-white bg-[#7a0f1f] hover:bg-[#65101a]"}
                                        `}
                                        style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                                        onClick={() => handleHeaderClick(col)}
                                    >

                                        <div className={`flex items-center gap-1.5 ${alignClass(col.align)}`}>
                                            {col.label}
                                            {col.sortable && (
                                                <SortIcon colKey={col.key} sortKey={sortKey} sortDirection={sortDirection} />
                                            )}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [...Array(skeletonCount)].map((_, i) => (
                                <SkeletonRow key={i} columns={visibleColumns} rowIndex={i} />
                            ))
                        ) : displayRows.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} className="p-0">
                                    <EmptyState title={emptyTitle} description={emptyDescription} />
                                </td>
                            </tr>
                        ) : (
                            displayRows.map((row, rowIndex) => {
                                const clickable = isRowClickable?.(row) ?? !!onRowClick
                                const selected = isRowSelected?.(row) ?? false
                                const isOdd = rowIndex % 2 === 1
                                const rowBg = selected ? "#fecdd3" : isOdd ? "rgba(255, 241, 242, 0.4)" : "#ffffff"
                                return (
                                    <tr
                                        key={row.id ?? rowIndex}
                                        className={`group transition-colors ${selected ? "border-l-2 border-l-[#7a0f1f]" : ""} ${clickable ? "cursor-pointer" : ""}`}
                                        style={{ background: rowBg }}
                                        onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = isOdd ? "rgba(254, 205, 211, 0.4)" : "rgba(255, 241, 242, 0.8)" }}
                                        onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = rowBg }}
                                        onClick={() => { if (clickable) onRowClick?.(row, rowIndex) }}
                                    >
                                        {visibleColumns.map((col) => {
                                            const cell = col.renderCell
                                                ? col.renderCell(row, rowIndex)
                                                : renderCell
                                                    ? renderCell(row, col, rowIndex)
                                                    : row[col.key]

                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-3.5 text-sm text-gray-700 ${alignClass(col.align)} ${col.flex ? "w-full" : ""}`}
                                                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                                                >
                                                    {col.maxWidth ? (
                                                        <TruncatedCell content={cell} maxWidth={col.maxWidth} />
                                                    ) : (
                                                        cell ?? <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Bottom accent line ── */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${ACCENT}, transparent)` }} />
        </div>
    )
}
