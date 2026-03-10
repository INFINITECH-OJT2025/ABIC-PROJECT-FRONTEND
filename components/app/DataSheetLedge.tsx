"use client"

import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import EmptyState from "@/components/app/EmptyState"
import InfoTooltip from "@/components/app/InfoTooltip"
import ViewImagePanel, { ViewImagePanelFile } from "@/components/app/ViewImagePanel"

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

    // For non-primitive ReactNode content (e.g. a popover/component), render it
    // directly so that hover/click interactions are not broken by overflow:hidden
    if (!StringContent && content != null) {
        return <>{content}</>
    }

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

// ─── Instrument Files Popover ─────────────────────────────────────────────────

interface InstrumentFilesPopoverProps {
    label: string
    files: { name: string; url?: string | null; type?: string | null; size?: number | null }[]
    children: React.ReactNode
}

function InstrumentFilesPopover({ label, files, children }: InstrumentFilesPopoverProps) {
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const [previewFile, setPreviewFile] = useState<ViewImagePanelFile | null>(null)
    const [panelOpen, setPanelOpen] = useState(false)

    const show = useCallback((e: React.MouseEvent) => {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null }
        const rect = e.currentTarget.getBoundingClientRect()
        setPos({ top: rect.bottom + 4, left: rect.left })
        setVisible(true)
    }, [])

    const scheduleHide = useCallback(() => {
        hideTimerRef.current = setTimeout(() => { setVisible(false); hideTimerRef.current = null }, 180)
    }, [])

    const cancelHide = useCallback(() => {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null }
    }, [])

    function openFile(f: { name: string; url?: string | null; type?: string | null; size?: number | null }) {
        if (!f.url) return
        setPreviewFile({ name: f.name, src: f.url, type: f.type ?? undefined, size: f.size ?? undefined })
        setPanelOpen(true)
        setVisible(false)
    }

    if (!files || files.length === 0) return <>{children}</>

    return (
        <>
            <div ref={triggerRef} className="relative inline-flex w-full" onMouseEnter={show} onMouseLeave={scheduleHide} onClick={(e) => e.stopPropagation()}>
                {children}
                {visible && (
                    <div
                        className="fixed z-[9999]"
                        style={{ top: pos.top, left: pos.left }}
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-[200px] overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase tracking-widest truncate">{label}</span>
                                <span className="text-xs font-semibold text-white/60 shrink-0 ml-2">{files.length}</span>
                            </div>
                            {/* File list */}
                            <div className="divide-y divide-gray-100">
                                {files.map((f, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!f.url}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => { e.stopPropagation(); openFile(f) }}
                                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <span className="text-sm font-semibold text-gray-800 truncate block">
                                            {f.name}
                                        </span>
                                        {!f.url && <span className="text-[10px] text-gray-400">No file</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ViewImagePanel
                open={panelOpen}
                file={previewFile}
                onClose={() => setPanelOpen(false)}
                zIndex={9998}
            />
        </>
    )
}

export { InstrumentFilesPopover }

// ─── Voucher Preview Button ───────────────────────────────────────────────────

interface VoucherPreviewButtonProps {
    voucherNo: string | null
    attachmentUrl: string | null
    fileType?: string | null
    fileSize?: number | null
}

export function VoucherPreviewButton({ voucherNo, attachmentUrl, fileType, fileSize }: VoucherPreviewButtonProps) {
    const [previewFile, setPreviewFile] = useState<ViewImagePanelFile | null>(null)
    const [panelOpen, setPanelOpen] = useState(false)

    if (!voucherNo) return <span className="text-gray-300">—</span>

    if (!attachmentUrl) return <span>{voucherNo}</span>

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    setPreviewFile({
                        name: voucherNo,
                        src: attachmentUrl,
                        type: fileType ?? undefined,
                        size: fileSize ?? undefined,
                    })
                    setPanelOpen(true)
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-[#7a0f1f] cursor-pointer group/voucher"
                title="Click to view voucher"
            >
                <span className="underline decoration-dotted underline-offset-2">{voucherNo}</span>
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-[#7a0f1f]/10 text-[#7a0f1f] group-hover/voucher:bg-[#7a0f1f]/20 transition-colors">
                    <FileText className="w-2.5 h-2.5" />
                </span>
            </button>

            <ViewImagePanel
                open={panelOpen}
                file={previewFile}
                onClose={() => setPanelOpen(false)}
                zIndex={9998}
            />
        </>
    )
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

export interface DataSheetColumn<T = any> {
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

export interface DataSheetProps<T = any> {
    columns: DataSheetColumn<T>[]
    rows: T[]
    /** Custom render fallback if column has no renderCell */
    renderCell?: (row: T, col: DataSheetColumn<T>, rowIndex: number) => React.ReactNode
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
    /** Right-click row */
    onRowContextMenu?: (e: React.MouseEvent, row: T, index: number) => void
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
    /** Optional function to generate a specific ID string for a row (useful for URL hash scrolling) */
    getRowId?: (row: T) => string
    /** If provided, after rows render, it will smooth-scroll this row ID into view */
    highlightRowId?: string
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

function SkeletonRow({ columns, rowIndex }: { columns: DataSheetColumn[], rowIndex: number }) {
    const isOdd = rowIndex % 2 === 1
    const rowBg = isOdd ? "rgba(253, 242, 248, 0.6)" : "#ffffff"
    return (
        <tr style={{ background: rowBg }} className="border-b border-gray-200 last:border-0">
            {columns.map((col) => (
                <td
                    key={col.key}
                    className="px-4 py-2"
                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                >
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-full" />
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

export default function DataSheetLedge<T extends Record<string, any>>({
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
    getRowId,
    highlightRowId,
    onRowContextMenu,
}: DataSheetProps<T>) {
    const [internalSortKey, setInternalSortKey] = useState<string | null>(null)
    const [internalSortDir, setInternalSortDir] = useState<SortDirection>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Handle highlighted row scroll + flash animation
    useEffect(() => {
        if (!highlightRowId || displayRows.length === 0) return;

        // Wait a small tick for DOM to update and rows to truly mount
        const timer = setTimeout(() => {
            const el = document.getElementById(highlightRowId);
            if (el) {
                // Smooth scroll into center of view
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Pulse animation: flash amber background 3 times
                let flashes = 0;
                const originalBg = el.style.background;
                const flash = () => {
                    if (flashes >= 3) {
                        el.style.transition = '';
                        el.style.background = originalBg;
                        return;
                    }
                    el.style.transition = 'background 250ms ease';
                    el.style.background = 'rgba(251, 191, 36, 0.45)'; // amber-400/45
                    flashes++;
                    setTimeout(() => {
                        el.style.transition = 'background 350ms ease';
                        el.style.background = originalBg;
                        setTimeout(flash, 300);
                    }, 350);
                };
                setTimeout(flash, 200);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [highlightRowId, rows]); // only depend on rows (raw) to re-trigger when data finishes loading

    // Allow regular mouse wheel to scroll horizontally
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return // already horizontal gesture
            if (e.deltaY === 0) return
            e.preventDefault()
            el.scrollLeft += e.deltaY
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [])

    const sortKey = controlledSortKey !== undefined ? controlledSortKey : internalSortKey
    const sortDirection = controlledSortDir !== undefined ? controlledSortDir : internalSortDir

    const visibleColumns = columns.filter((c) => !c.hidden)

    function handleHeaderClick(col: DataSheetColumn<T>) {
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
            <div ref={scrollRef} className="w-full overflow-x-auto">
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
                                            px-4 py-2 font-bold text-xs uppercase tracking-wider whitespace-pre-wrap
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

                    <tbody className="divide-y divide-gray-200">
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
                                const rowBg = selected ? "#fce7f3" : isOdd ? "rgba(253, 242, 248, 0.6)" : "#ffffff"
                                const rowHtmlId = getRowId ? getRowId(row) : undefined;
                                return (
                                    <tr
                                        id={rowHtmlId}
                                        key={row.id ?? rowIndex}
                                        className={`group border-b border-gray-100 transition-colors ${selected ? "border-l-[3px] border-l-[#7a0f1f] shadow-[inset_0_0_10px_rgba(122,15,31,0.1)]" : "border-l-[3px] border-l-transparent"} ${clickable ? "cursor-pointer" : ""}`}
                                        style={{ background: rowBg }}
                                        onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = isOdd ? "rgba(251, 207, 232, 0.35)" : "rgba(253, 242, 248, 0.9)" }}
                                        onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = rowBg }}
                                        onContextMenu={(e) => {
                                            if (onRowContextMenu) {
                                                e.preventDefault()
                                                onRowContextMenu(e, row, rowIndex)
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (!clickable) return
                                            // If the click originated from (or bubbled through) a button or anchor,
                                            // treat it as a cell-level interactive element click — don't navigate.
                                            const target = e.target as HTMLElement
                                            if (target.closest('button, a, [role="button"]')) return
                                            onRowClick?.(row, rowIndex)
                                        }}
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
                                                    className={`px-4 py-2 text-sm text-gray-900 font-medium ${alignClass(col.align)} ${col.flex ? "w-full" : ""}`}
                                                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                                                >
                                                    {/* All cells are forced single-line with tooltip on overflow */}
                                                    <TruncatedCell content={cell} maxWidth={col.maxWidth ?? "9999px"} />
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
