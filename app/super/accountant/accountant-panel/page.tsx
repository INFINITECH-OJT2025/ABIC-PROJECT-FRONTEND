"use client"

import { useState, useEffect, useMemo } from "react"
import AppHeader from "@/components/app/AppHeader"
import { superAdminNav } from "@/lib/navigation"
import {
    Banknote, TrendingUp, TrendingDown, Clock, ArrowRight,
    CheckCircle2, AlertCircle, FileEdit, Eye, ChevronLeft, ChevronRight,
    Receipt, BookOpen, Wallet, Search, Filter
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const KPI_CARDS = [
    { label: "Total Vouchers", value: "1,042", sub: "Cash & Cheque vouchers", icon: Banknote, trend: "+8.2%", trendUp: true, accent: "#7B0F2B" },
    { label: "Total Transactions", value: "2,318", sub: "All recorded transactions", icon: Receipt, trend: "+12.5%", trendUp: true, accent: "#A4163A" },
    { label: "Pending Entries", value: "47", sub: "Awaiting processing", icon: Clock, trend: "-3.1%", trendUp: false, accent: "#C4425A" },
    { label: "Ledger Entries", value: "5,610", sub: "Across all ledgers", icon: BookOpen, trend: "+5.7%", trendUp: true, accent: "#8B1535" },
]

const CHART_DATA = [
    { day: "Mon", value: 45, amount: 45000 },
    { day: "Tue", value: 62, amount: 62000 },
    { day: "Wed", value: 38, amount: 38000 },
    { day: "Thu", value: 75, amount: 75000 },
    { day: "Fri", value: 55, amount: 55000 },
    { day: "Sat", value: 30, amount: 30000 },
    { day: "Sun", value: 50, amount: 50000 },
]

const VOUCHER_ROWS = [
    { no: "CV-2026-001", type: "Cash" as const, date: "Mar 04, 2026", payee: "Juan Dela Cruz", amount: "₱ 15,000.00", status: "Approved" as const },
    { no: "CHV-2026-042", type: "Cheque" as const, date: "Mar 03, 2026", payee: "Tech Corp Inc.", amount: "₱ 45,200.50", status: "Pending" as const },
    { no: "CV-2026-002", type: "Cash" as const, date: "Mar 03, 2026", payee: "Maria Santos", amount: "₱ 4,500.00", status: "Approved" as const },
    { no: "CHV-2026-043", type: "Cheque" as const, date: "Mar 02, 2026", payee: "Office Supplies Co.", amount: "₱ 12,850.00", status: "Draft" as const },
    { no: "CV-2026-003", type: "Cash" as const, date: "Mar 01, 2026", payee: "Pedro Penduko", amount: "₱ 8,000.00", status: "Approved" as const },
    { no: "CHV-2026-044", type: "Cheque" as const, date: "Feb 28, 2026", payee: "Global Solutions", amount: "₱ 32,750.00", status: "Pending" as const },
    { no: "CV-2026-004", type: "Cash" as const, date: "Feb 27, 2026", payee: "Ana Reyes", amount: "₱ 6,200.00", status: "Approved" as const },
    { no: "CHV-2026-045", type: "Cheque" as const, date: "Feb 26, 2026", payee: "Smart Logistics", amount: "₱ 89,400.00", status: "Draft" as const },
]

const RECENT_ACTIVITIES = [
    { icon: CheckCircle2, title: "Voucher CV-2026-001 approved", time: "2 hours ago", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: FileEdit, title: "Ledger entry #5610 created", time: "4 hours ago", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: AlertCircle, title: "Pending cheque CHV-2026-042", time: "5 hours ago", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Wallet, title: "Transaction deposit ₱62,000", time: "1 day ago", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: CheckCircle2, title: "Voucher CV-2026-002 approved", time: "1 day ago", color: "text-emerald-600", bg: "bg-emerald-50" },
]

const DONUT_SEGMENTS = [
    { label: "Approved", pct: 45, color: "#7B0F2B", count: 469 },
    { label: "Pending", pct: 30, color: "#A4163A", count: 312 },
    { label: "Draft", pct: 25, color: "#D4A0AD", count: 261 },
]

const BORDER = "rgba(0,0,0,0.08)"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
    return "₱" + n.toLocaleString()
}

type StatusType = "Approved" | "Pending" | "Draft"
const statusStyles: Record<StatusType, string> = {
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Draft: "bg-gray-100 text-gray-600 ring-gray-200",
}
const statusIcons: Record<StatusType, React.ElementType> = {
    Approved: CheckCircle2,
    Pending: Clock,
    Draft: FileEdit,
}

// ─── Animated counter hook ───────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 1200) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        let start = 0
        const startTime = performance.now()
        const ease = (t: number) => 1 - Math.pow(1 - t, 3) // ease-out cubic
        const tick = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            setValue(Math.round(ease(progress) * target))
            if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }, [target, duration])
    return value
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AccountantPanelPage() {
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"All" | StatusType>("All")
    const [tablePage, setTablePage] = useState(1)
    const rowsPerPage = 5

    // Entrance animation
    useEffect(() => { setMounted(true) }, [])

    // Animated KPI numbers
    const totalVouchers = useAnimatedNumber(1042)
    const totalTransactions = useAnimatedNumber(2318)
    const pendingEntries = useAnimatedNumber(47)
    const ledgerEntries = useAnimatedNumber(5610)
    const kpiValues = [totalVouchers, totalTransactions, pendingEntries, ledgerEntries]

    // Table filtering
    const filteredRows = useMemo(() => {
        return VOUCHER_ROWS.filter(row => {
            const matchesSearch = searchQuery === "" ||
                row.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.no.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === "All" || row.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
    const paginatedRows = filteredRows.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage)

    // Reset to page 1 on filter change
    useEffect(() => { setTablePage(1) }, [searchQuery, statusFilter])

    // Donut conic-gradient string
    const donutGradient = useMemo(() => {
        let acc = 0
        const stops = DONUT_SEGMENTS.map(s => {
            const start = acc
            acc += s.pct
            return `${s.color} ${start}% ${acc}%`
        })
        return `conic-gradient(${stops.join(", ")})`
    }, [])

    return (
        <div className="min-h-full flex flex-col bg-gradient-to-br from-[#FAFAFA] to-[#F3EEF0]">
            <AppHeader
                navigation={superAdminNav}
                subtitle="Accountant panel summary and key metrics"
            />

            <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ── KPI Cards ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KPI_CARDS.map((card, i) => {
                        const Icon = card.icon
                        const TrendIcon = card.trendUp ? TrendingUp : TrendingDown
                        return (
                            <div
                                key={i}
                                className="group relative rounded-[20px] bg-white border border-gray-100/80 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 hover:-translate-y-1"
                                style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                                    transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
                                }}
                            >
                                {/* Dynamic Background Gradient */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at top right, ${card.accent}0A, transparent 50%)` }}
                                />
                                {/* Decorative corner shape glow */}
                                <div
                                    className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 scale-50 group-hover:scale-100 blur-2xl pointer-events-none"
                                    style={{ backgroundColor: card.accent }}
                                />

                                <div className="relative z-10 p-5 sm:p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div
                                            className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:rounded-xl"
                                            style={{
                                                background: `linear-gradient(135deg, ${card.accent}15 0%, ${card.accent}05 100%)`,
                                                border: `1px solid ${card.accent}20`
                                            }}
                                        >
                                            <Icon size={22} strokeWidth={2.2} style={{ color: card.accent }} className="transition-transform duration-500" />
                                        </div>

                                        <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 ${card.trendUp
                                            ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 border-emerald-200/50"
                                            : "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border-red-200/50"
                                            }`}>
                                            <TrendIcon size={14} strokeWidth={2.5} />
                                            <span>{card.trend}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400/80 uppercase tracking-[0.2em]">{card.label}</p>
                                        <p className="text-3xl font-black text-[#2D040C] tabular-nums tracking-tighter mix-blend-multiply">
                                            {kpiValues[i].toLocaleString()}
                                        </p>
                                        <p className="text-[13px] text-gray-500 font-medium pt-1">{card.sub}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Charts Row ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Bar Chart — spans 3 cols */}
                    <div
                        className="lg:col-span-3 rounded-[20px] bg-white border border-gray-100/80 p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 overflow-hidden"
                        style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(16px)",
                            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s",
                        }}
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Transaction Activity</h3>
                                <p className="text-[13px] text-gray-500 font-medium mt-1">Daily volume this week</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100/50 text-[11px] font-bold text-emerald-600 shadow-sm">
                                <TrendingUp size={14} className="text-emerald-500" strokeWidth={2.5} />
                                <span>+12% vs last week</span>
                            </div>
                        </div>

                        {/* Y-axis labels + bars */}
                        <div className="flex gap-3 sm:gap-4 mt-4">
                            {/* Y-axis */}
                            <div className="flex flex-col justify-between text-[11px] text-gray-400 font-medium py-[6px] pr-1 text-right" style={{ height: 260 }}>
                                <span>₱75k</span>
                                <span>₱50k</span>
                                <span>₱25k</span>
                                <span>₱0</span>
                            </div>

                            {/* Chart Area */}
                            <div className="flex-1 flex flex-col">
                                {/* Grid & Bars Container */}
                                <div className="relative w-full" style={{ height: 260 }}>
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="border-t border-dashed border-gray-200 w-full" />
                                        ))}
                                    </div>

                                    {/* Bars */}
                                    <div className="absolute inset-0 flex items-end justify-between px-1 sm:px-4">
                                        {CHART_DATA.map((item, i) => {
                                            const maxVal = 75
                                            // Max bar height is 180 out of 260 container, leaving 80px space at the top for tooltip
                                            const barHeight = Math.round((item.value / maxVal) * 180)
                                            const txnCount = Math.round(item.amount / 1200) || 15 // example placeholder
                                            return (
                                                <div key={i} className="group relative flex flex-col items-center justify-end h-full cursor-pointer flex-1 mx-1 sm:mx-2 md:mx-3">
                                                    {/* Enhanced Tooltip — wrapper handles centering, inner handles animation */}
                                                    <div
                                                        className="absolute z-[50] pointer-events-none"
                                                        style={{ bottom: barHeight + 16, left: "50%", transform: "translateX(-50%)" }}
                                                    >
                                                        <div
                                                            className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out origin-bottom"
                                                        >
                                                            <div
                                                                className="relative text-white rounded-xl px-4 py-3 whitespace-nowrap"
                                                                style={{
                                                                    backgroundColor: "#5f0c18",
                                                                    boxShadow: "0 12px 36px rgba(95,12,24,0.35), 0 4px 12px rgba(0,0,0,0.12)"
                                                                }}
                                                            >
                                                                {/* Day label */}
                                                                <p className="text-[10px] uppercase tracking-widest text-[#facc15] font-bold mb-1">{item.day} - DETAILS</p>
                                                                {/* Amount */}
                                                                <p className="text-xl font-extrabold tracking-tight leading-none mb-1.5 break-normal">{formatCurrency(item.amount)}</p>
                                                                {/* Transactions count placeholder */}
                                                                <p className="text-[11px] text-white/80 flex items-center gap-1.5">
                                                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                                                    {txnCount} Transactions processed
                                                                </p>
                                                                {/* Caret */}
                                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-transparent" style={{ borderTopColor: "#5f0c18" }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bar Shape */}
                                                    <div
                                                        className="w-full max-w-[100px] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                                        style={{
                                                            height: mounted ? barHeight : 0,
                                                            minHeight: mounted ? barHeight : 0,
                                                            background: "linear-gradient(180deg, #A4163A 0%, #7B0F2B 100%)",
                                                            boxShadow: "0 -4px 12px 0 rgba(123,15,43,0.15)",
                                                            transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.08}s`,
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* X-axis labels */}
                                <div className="flex items-center justify-between px-1 sm:px-4 pt-3 mt-0 border-t border-gray-100">
                                    {CHART_DATA.map((item, i) => (
                                        <div key={i} className="flex-1 mx-1 sm:mx-2 md:mx-3 text-center">
                                            <span className="text-xs text-gray-400 font-semibold">{item.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doughnut — spans 2 cols */}
                    <div className="lg:col-span-2">

                        {/* Doughnut card */}
                        <div
                            className="rounded-[20px] bg-white border border-gray-100/80 p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 flex flex-col h-full"
                            style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(16px)",
                                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s",
                            }}
                        >
                            <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Vouchers by Status</h3>
                            <p className="text-[13px] text-gray-500 font-medium mt-1 mb-10">Distribution of all vouchers</p>

                            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-10">
                                {/* Donut */}
                                <div
                                    className="relative rounded-full flex items-center justify-center shrink-0 transition-transform duration-700 hover:scale-105"
                                    style={{
                                        width: 160,
                                        height: 160,
                                        minWidth: 160,
                                        minHeight: 160,
                                        aspectRatio: "1 / 1",
                                        background: donutGradient,
                                        boxShadow: "0 0 0 8px rgba(123,15,43,0.03), 0 12px 32px rgba(123,15,43,0.08)"
                                    }}
                                >
                                    <div
                                        className="absolute bg-white rounded-full flex flex-col items-center justify-center"
                                        style={{ width: 90, height: 90, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)" }}
                                    >
                                        <span className="text-xl font-extrabold text-[#5f0c18] tabular-nums">{totalVouchers.toLocaleString()}</span>
                                        <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em] mt-0.5 font-bold">Total</span>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="space-y-3">
                                    {DONUT_SEGMENTS.map((seg, i) => {
                                        const barWidth = Math.round(seg.pct * 0.8)
                                        return (
                                            <div key={i} className="flex items-center gap-2.5 group cursor-default">
                                                <div className="w-3.5 h-3.5 rounded transition-transform group-hover:scale-125" style={{ backgroundColor: seg.color }} />
                                                <div className="min-w-[100px]">
                                                    <p className="text-sm font-semibold text-gray-700 leading-none group-hover:text-[#5f0c18] transition-colors">{seg.label}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {/* Mini progress bar */}
                                                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden" style={{ width: 64 }}>
                                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}px`, backgroundColor: seg.color }} />
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 font-medium tabular-nums">
                                                            {seg.count.toLocaleString()} <span className="text-gray-300">·</span> {seg.pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Table Section ─────────────────────────────────────────── */}
                <div
                    className="rounded-[20px] bg-white border border-gray-100/80 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200"
                    style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(16px)",
                        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.65s",
                    }}
                >
                    {/* Table header */}
                    <div className="px-6 sm:px-8 py-6 border-b border-gray-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Recent Vouchers</h3>
                            <p className="text-[13px] text-gray-500 font-medium mt-1">Latest encoded cash and cheque vouchers</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative group">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F2B] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search voucher or payee…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 text-[13px] font-medium bg-gray-50/50 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#7B0F2B]/10 focus:border-[#7B0F2B]/40 hover:border-gray-300 transition-all w-full sm:w-60 placeholder:text-gray-400"
                                />
                            </div>
                            {/* Filter */}
                            <div className="relative group">
                                <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F2B] transition-colors" />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value as any)}
                                    className="pl-10 pr-8 py-2.5 text-[13px] font-medium bg-gray-50/50 border border-gray-200/80 rounded-xl appearance-none focus:outline-none focus:ring-4 focus:ring-[#7B0F2B]/10 focus:border-[#7B0F2B]/40 hover:border-gray-300 transition-all cursor-pointer text-gray-700"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-50/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Voucher No.</th>
                                    <th className="px-6 py-3.5">Type</th>
                                    <th className="px-6 py-3.5">Date</th>
                                    <th className="px-6 py-3.5">Payee</th>
                                    <th className="px-6 py-3.5 text-right">Amount</th>
                                    <th className="px-6 py-3.5 text-center">Status</th>
                                    <th className="px-6 py-3.5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={28} className="text-gray-300" />
                                                <p className="text-sm font-medium">No vouchers found</p>
                                                <p className="text-xs">Try adjusting your search or filter</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((row, i) => {
                                        const SIcon = statusIcons[row.status]
                                        return (
                                            <tr
                                                key={i}
                                                className="group hover:bg-[#7B0F2B]/[0.02] transition-colors duration-150"
                                            >
                                                <td className="px-6 py-3.5">
                                                    <span className="font-semibold text-[#7B0F2B] group-hover:underline cursor-pointer">{row.no}</span>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${row.type === "Cash"
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        : "bg-blue-50 text-blue-700 ring-blue-200"
                                                        }`}>
                                                        <Banknote size={12} />
                                                        {row.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">{row.date}</td>
                                                <td className="px-6 py-3.5 font-medium text-gray-800">{row.payee}</td>
                                                <td className="px-6 py-3.5 text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">{row.amount}</td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ring-1 ring-inset ${statusStyles[row.status]}`}>
                                                        <SIcon size={11} />
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#7B0F2B] hover:text-[#5f0c18] hover:bg-[#7B0F2B]/5 px-3 py-1.5 rounded-lg transition-all">
                                                        <Eye size={13} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Showing <span className="font-semibold text-gray-600">{filteredRows.length === 0 ? 0 : (tablePage - 1) * rowsPerPage + 1}</span>–<span className="font-semibold text-gray-600">{Math.min(tablePage * rowsPerPage, filteredRows.length)}</span> of <span className="font-semibold text-gray-600">{filteredRows.length}</span> entries
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                                disabled={tablePage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setTablePage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${tablePage === i + 1
                                        ? "bg-[#7B0F2B] text-white shadow-sm"
                                        : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                                disabled={tablePage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
