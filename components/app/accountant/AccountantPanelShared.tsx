"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import AppHeader from "@/components/app/AppHeader"
import { superAdminNav, accountantNav } from "@/lib/navigation"
import {
    Banknote, TrendingUp, TrendingDown, Clock, ArrowRight,
    CheckCircle2, AlertCircle, FileEdit, Eye, ChevronLeft, ChevronRight,
    Receipt, BookOpen, Wallet, Search, Filter, Users, LineChart, BarChart2
} from "lucide-react"

// ─── Backend Data Interfaces ────────────────────────────────────────────────────

export interface DashboardKPI {
    total_vouchers: number
    total_transactions: number
    total_owners: number
    ledger_entries: number
}

export interface WeeklyActivity {
    day: string
    value: number
    amount: number  // Re-purposed for net amount
    deposit_amount: number
    withdraw_amount: number
}

export interface OwnerRanking {
    owner_name: string
    amount: number
}

export interface OwnerRankingCount {
    owner_name: string
    count: number
}

export interface LargestTransaction {
    id: number
    method: "DEPOSIT" | "WITHDRAWAL"
    owner_name: string
    amount: number
    date: string
}

export interface DashboardDataPayload {
    kpi: DashboardKPI
    weekly_activity: WeeklyActivity[]
    owners_ranking: {
        depositors: OwnerRanking[]
        withdrawers: OwnerRanking[]
    }
    transaction_frequency: {
        all: OwnerRankingCount[]
        depositors: OwnerRankingCount[]
        withdrawers: OwnerRankingCount[]
    }
    largest_transactions: LargestTransaction[]
    payment_methods: {
        cash_deposit: number
        cheque_deposit: number
        bank_transfer: number
        cheque: number
    }
    recent_vouchers: RecentVoucher[]
}

type StatusType = "Approved" | "Pending" | "Draft" | "Cancelled";
export interface RecentVoucher {
    id: number;
    no: string;
    type: string;
    date: string;
    payee: string;
    amount: string;
    status: StatusType;
}

// ─── Initial Mock Data (Temporary until API is ready) ───────────────────────

const KPI_CONFIG = [
    { label: "Total Vouchers", sub: "Cash & Cheque vouchers", icon: Banknote, trend: "+8.2%", trendUp: true, accent: "#7B0F2B" },
    { label: "Total Transactions", sub: "All recorded transactions", icon: Receipt, trend: "+12.5%", trendUp: true, accent: "#A4163A" },
    { label: "Total Owners", sub: "Registered property owners", icon: Users, trend: "+3.1%", trendUp: true, accent: "#C4425A" },
    { label: "Ledger Entries", sub: "Across all ledgers", icon: BookOpen, trend: "+5.7%", trendUp: true, accent: "#8B1535" },
]

const MOCK_CHART_DATA: WeeklyActivity[] = [
    { day: "Mon", value: 45, amount: 45000, deposit_amount: 55000, withdraw_amount: 10000 },
    { day: "Tue", value: 62, amount: 62000, deposit_amount: 72000, withdraw_amount: 10000 },
    { day: "Wed", value: 38, amount: 38000, deposit_amount: 48000, withdraw_amount: 10000 },
    { day: "Thu", value: 75, amount: 75000, deposit_amount: 85000, withdraw_amount: 10000 },
    { day: "Fri", value: 55, amount: 55000, deposit_amount: 75000, withdraw_amount: 20000 },
    { day: "Sat", value: 30, amount: 30000, deposit_amount: 35000, withdraw_amount: 5000 },
    { day: "Sun", value: 50, amount: 50000, deposit_amount: 60000, withdraw_amount: 10000 },
]

const MOCK_VOUCHER_ROWS: RecentVoucher[] = [
    { id: 1, no: "CV-2026-001", type: "Cash", date: "Mar 04, 2026", payee: "Juan Dela Cruz", amount: "₱ 15,000.00", status: "Approved" },
    { id: 2, no: "CHV-2026-042", type: "Cheque", date: "Mar 03, 2026", payee: "Tech Corp Inc.", amount: "₱ 45,200.50", status: "Pending" },
    { id: 3, no: "CV-2026-002", type: "Cash", date: "Mar 03, 2026", payee: "Maria Santos", amount: "₱ 4,500.00", status: "Approved" },
    { id: 4, no: "CHV-2026-043", type: "Cheque", date: "Mar 02, 2026", payee: "Office Supplies Co.", amount: "₱ 12,850.00", status: "Draft" },
    { id: 5, no: "CV-2026-003", type: "Cash", date: "Mar 01, 2026", payee: "Pedro Penduko", amount: "₱ 8,000.00", status: "Approved" },
    { id: 6, no: "CHV-2026-044", type: "Cheque", date: "Feb 28, 2026", payee: "Global Solutions", amount: "₱ 32,750.00", status: "Pending" },
    { id: 7, no: "CV-2026-004", type: "Cash", date: "Feb 27, 2026", payee: "Ana Reyes", amount: "₱ 6,200.00", status: "Approved" },
    { id: 8, no: "CHV-2026-045", type: "Cheque", date: "Feb 26, 2026", payee: "Smart Logistics", amount: "₱ 89,400.00", status: "Draft" },
]

const RECENT_ACTIVITIES = [
    { icon: CheckCircle2, title: "Voucher CV-2026-001 approved", time: "2 hours ago", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: FileEdit, title: "Ledger entry #5610 created", time: "4 hours ago", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: AlertCircle, title: "Pending cheque CHV-2026-042", time: "5 hours ago", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Wallet, title: "Transaction deposit ₱62,000", time: "1 day ago", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: CheckCircle2, title: "Voucher CV-2026-002 approved", time: "1 day ago", color: "text-emerald-600", bg: "bg-emerald-50" },
]

const BORDER = "rgba(0,0,0,0.08)"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
    return "₱" + n.toLocaleString()
}


const statusStyles: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Draft: "bg-gray-100 text-gray-600 ring-gray-200",
    Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
}
const statusIcons: Record<string, React.ElementType> = {
    Approved: CheckCircle2,
    Pending: Clock,
    Draft: FileEdit,
    Cancelled: AlertCircle,
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

export default function AccountantPanelShared({ role }: { role: "superadmin" | "accountant" }) {
    const navigation = role === "superadmin" ? superAdminNav : accountantNav;
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Data State
    const [dashboardData, setDashboardData] = useState<DashboardDataPayload | null>(null)
    const [chartType, setChartType] = useState<"bar" | "line">("bar")
    const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")
    const [rankingTab, setRankingTab] = useState<"depositors" | "withdrawers">("depositors")
    const [freqTab, setFreqTab] = useState<"all" | "depositors" | "withdrawers">("all")

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"All" | StatusType>("All")
    const [tablePage, setTablePage] = useState(1)
    const rowsPerPage = 5

    // Entrance animation and Data Fetching
    useEffect(() => {
        setMounted(true)

        async function fetchDashboardData() {
            try {
                const response = await fetch(`${role === "superadmin" ? "/api/head/accountant/dashboard-stats" : "/api/accountant/dashboard-stats"}?timeframe=${timeframe}`);

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();

                // Keep the smooth entrance effect
                setTimeout(() => {
                    setDashboardData(data);
                    setIsLoading(false);
                }, 300);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setIsLoading(false);
            }
        }

        fetchDashboardData()
    }, [timeframe])

    // Animated KPI numbers
    const totalVouchers = useAnimatedNumber(dashboardData?.kpi.total_vouchers || 0)
    const totalTransactions = useAnimatedNumber(dashboardData?.kpi.total_transactions || 0)
    const totalOwners = useAnimatedNumber(dashboardData?.kpi.total_owners || 0)
    const ledgerEntries = useAnimatedNumber(dashboardData?.kpi.ledger_entries || 0)
    const kpiValues = [totalVouchers, totalTransactions, totalOwners, ledgerEntries]

    // Table filtering
    const safeRecentVouchers = dashboardData?.recent_vouchers || []
    const filteredRows = useMemo(() => {
        return safeRecentVouchers.filter(row => {
            const matchesSearch = searchQuery === "" ||
                row.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.no.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === "All" || row.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [safeRecentVouchers, searchQuery, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
    const paginatedRows = filteredRows.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage)

    // Reset to page 1 on filter change
    useEffect(() => { setTablePage(1) }, [searchQuery, statusFilter])

    const totalWeeklyNet = dashboardData ?
        dashboardData.weekly_activity.reduce((acc, curr) => acc + curr.amount, 0)
        : 0

    return (
        <div className="min-h-full flex flex-col bg-gradient-to-br from-[#FAFAFA] to-[#F3EEF0]">
            <AppHeader
                navigation={navigation}
                subtitle="Accountant panel summary and key metrics"
            />

            <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                {/* ── KPI Cards ─────────────────────────────────────────────── */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-1000 ${isLoading ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    {KPI_CONFIG.map((card, i) => {
                        const Icon = card.icon
                        const TrendIcon = card.trendUp ? TrendingUp : TrendingDown
                        return (
                            <div
                                key={i}
                                className="relative rounded-lg bg-white border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 overflow-hidden"
                                style={{
                                    borderColor: "rgba(0,0,0,0.12)",
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                                    transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
                                }}
                            >
                                {/* Card Header (Sidebar Color Theme) */}
                                <div className="bg-gradient-to-r from-[#7B0F2B] to-[#5E0C20] px-5 py-3.5 border-b border-[#5E0C20] flex items-center justify-between z-20 relative shadow-sm">
                                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">{card.label}</span>
                                    <Icon size={16} className="text-white/80" />
                                </div>

                                {/* Advanced Lighting/Glow Effects */}
                                <div
                                    className="absolute bottom-0 -right-12 w-32 h-32 rounded-full opacity-[0.08] blur-3xl pointer-events-none"
                                    style={{ backgroundColor: card.accent }}
                                />

                                <div className="relative z-10 p-6 pt-5 flex flex-col flex-1 ring-1 ring-inset ring-gray-900/5 rounded-b-[20px] bg-white">
                                    <div className="mt-auto flex flex-col justify-end h-full pt-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Count</span>
                                            <p className="text-[34px] leading-none font-black text-[#2D040C] tabular-nums tracking-tighter drop-shadow-sm">
                                                {kpiValues[i].toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="flex-1 h-[3px] rounded-full bg-gray-100/80 overflow-hidden">
                                                <div className="h-full rounded-full w-[65%] opacity-80" style={{ backgroundColor: card.accent }} />
                                            </div>
                                            <p className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                                                {card.sub}
                                            </p>
                                        </div>
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
                        className="lg:col-span-3 rounded-[20px] bg-white border p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 overflow-hidden"
                        style={{
                            borderColor: "rgba(0,0,0,0.12)",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(16px)",
                            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s",
                        }}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Transaction Activity</h3>
                                <div className="flex items-center gap-3 mt-2 flex-wrap sm:flex-nowrap">
                                    <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-xl shadow-inner border border-gray-200 shrink-0">
                                        <button onClick={() => setTimeframe("daily")} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-300 ${timeframe === "daily" ? "bg-white text-[#2D040C] shadow-sm ring-1 ring-gray-900/10" : "text-gray-400 hover:text-gray-600"} pointer-events-auto cursor-pointer`}>Daily</button>
                                        <button onClick={() => setTimeframe("weekly")} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-300 ${timeframe === "weekly" ? "bg-white text-[#2D040C] shadow-sm ring-1 ring-gray-900/10" : "text-gray-400 hover:text-gray-600"} pointer-events-auto cursor-pointer`}>Weekly</button>
                                        <button onClick={() => setTimeframe("monthly")} className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-300 ${timeframe === "monthly" ? "bg-white text-[#2D040C] shadow-sm ring-1 ring-gray-900/10" : "text-gray-400 hover:text-gray-600"} pointer-events-auto cursor-pointer`}>Monthly</button>
                                    </div>
                                    <div className="w-px h-4 bg-gray-200 hidden sm:block shrink-0"></div>
                                    <div className="flex items-center shrink-0 bg-gray-100/80 p-0.5 rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => setChartType("bar")}
                                            className={`p-1 rounded-md transition-all duration-200 ${chartType === "bar" ? "bg-white shadow-sm text-[#7B0F2B]" : "text-gray-400 hover:text-gray-600"}`}
                                            title="Bar Chart View"
                                        >
                                            <BarChart2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setChartType("line")}
                                            className={`p-1 rounded-md transition-all duration-200 ${chartType === "line" ? "bg-white shadow-sm text-[#7B0F2B]" : "text-gray-400 hover:text-gray-600"}`}
                                            title="Line Chart View"
                                        >
                                            <LineChart size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Total Amount Card */}
                            <div className="flex flex-col items-start sm:items-end gap-1 shadow-[0_6px_12px_rgba(123,15,43,0.12)] bg-gradient-to-br from-[#7B0F2B] to-[#4a0812] text-white px-4 py-3 rounded-[14px] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_10px_20px_rgba(123,15,43,0.2)] hover:-translate-y-0.5 border border-white/10 mt-2 sm:mt-0">
                                {/* Subtle animated shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

                                <div className="flex items-center gap-2 relative z-10 w-full justify-between sm:justify-end">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#facc15]/90">Total Amount</span>
                                </div>

                                <div className="relative z-10 mt-0.5">
                                    <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                                        {formatCurrency(totalWeeklyNet)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Y-axis labels + bars */}
                        <div className="flex gap-3 sm:gap-4 mt-4">
                            {/* Y-axis */}
                            <div className="relative w-12 text-[11px] text-gray-400 font-medium pr-1 text-right" style={{ height: 260 }}>
                                {[500, 450, 400, 350, 300, 250, 200, 150, 100, 50, 0].map((val, i) => (
                                    <span key={i} className="absolute right-1 w-full translate-y-[-50%]" style={{ top: `${(i / 10) * 100}%` }}>
                                        ₱{val}k
                                    </span>
                                ))}
                            </div>

                            {/* Chart Area */}
                            <div className="flex-1 flex flex-col">
                                {/* Grid & Bars Container */}
                                <div className="relative w-full flex items-end" style={{ height: 260 }}>
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Render 10 lines (from 0% down to 90%). At 100% (0k), the X-axis already has a solid border */}
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="absolute border-t border-dashed border-gray-200 w-full" style={{ top: `${(i / 10) * 100}%` }} />
                                        ))}
                                    </div>

                                    {/* Bars */}
                                    <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-between px-1 sm:px-4">
                                        {(dashboardData?.weekly_activity || []).map((item, i) => {
                                            const maxVal = 500000;
                                            // 500k corresponds to 260px height
                                            const depositRawHeight = (item.deposit_amount / maxVal) * 260;
                                            const depositBarHeight = Math.min(Math.round(depositRawHeight), 260);

                                            const withdrawRawHeight = (item.withdraw_amount / maxVal) * 260;
                                            const withdrawBarHeight = Math.min(Math.round(withdrawRawHeight), 260);

                                            const maxBarHeight = Math.max(depositBarHeight, withdrawBarHeight);
                                            const txnCount = item.value; // Real transaction count
                                            return (
                                                <div key={i} className="group relative flex items-end justify-center h-full cursor-pointer flex-1 mx-1 sm:mx-2 md:mx-3 gap-[2px] sm:gap-1">
                                                    {/* Enhanced Tooltip — wrapper handles centering, inner handles animation */}
                                                    <div
                                                        className="absolute z-[50] pointer-events-none"
                                                        style={{ bottom: maxBarHeight + 16, left: "50%", transform: "translateX(-50%)" }}
                                                    >
                                                        <div
                                                            className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out origin-bottom"
                                                        >
                                                            <div
                                                                className="relative text-white rounded-md px-4 py-3 whitespace-nowrap min-w-[150px]"
                                                                style={{
                                                                    backgroundColor: "#5f0c18",
                                                                    boxShadow: "0 12px 36px rgba(95,12,24,0.35), 0 4px 12px rgba(0,0,0,0.12)"
                                                                }}
                                                            >
                                                                {/* Day label */}
                                                                <p className="text-[10px] uppercase tracking-widest text-[#facc15] font-bold mb-1">{item.day} - DETAILS</p>

                                                                {/* Net Amount */}
                                                                <p className="text-xl font-extrabold tracking-tight leading-none mb-2 break-normal">
                                                                    Net: {formatCurrency(item.amount)}
                                                                </p>

                                                                {/* Breakdown */}
                                                                <div className="flex flex-col gap-1.5 mb-2.5 border-t border-white/10 pt-2.5">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                                                                            <span className="text-[11px] text-white/80 font-medium">Deposit</span>
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-emerald-300">+{formatCurrency(item.deposit_amount)}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
                                                                            <span className="text-[11px] text-white/80 font-medium">Withdraw</span>
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-rose-300">-{formatCurrency(item.withdraw_amount)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Transactions count */}
                                                                <p className="text-[11px] text-white/80 flex items-center gap-1.5">
                                                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                                                    {txnCount} Transactions
                                                                </p>

                                                                {/* Caret */}
                                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-transparent" style={{ borderTopColor: "#5f0c18" }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {chartType === "bar" ? (
                                                        <>
                                                            {/* Withdraw Bar (Red) */}
                                                            <div
                                                                className="w-full max-w-[20px] sm:max-w-[28px] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                                                                style={{
                                                                    height: mounted ? withdrawBarHeight : 0,
                                                                    minHeight: mounted ? withdrawBarHeight : 0,
                                                                    background: "linear-gradient(180deg, #f43f5e 0%, #be123c 100%)",
                                                                    boxShadow: "0 -4px 12px 0 rgba(244,63,94,0.15)",
                                                                    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.08}s`,
                                                                }}
                                                            />

                                                            {/* Deposit Bar (Green) */}
                                                            <div
                                                                className="w-full max-w-[20px] sm:max-w-[28px] rounded-t-sm transition-all duration-500 group-hover:brightness-110"
                                                                style={{
                                                                    height: mounted ? depositBarHeight : 0,
                                                                    minHeight: mounted ? depositBarHeight : 0,
                                                                    background: "linear-gradient(180deg, #10b981 0%, #047857 100%)",
                                                                    boxShadow: "0 -4px 12px 0 rgba(16,185,129,0.15)",
                                                                    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.45 + i * 0.08}s`,
                                                                }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Invisible trigger column for Line Chart hover area */}
                                                            <div className="w-full h-full bg-transparent mx-2" />

                                                            {/* Withdraw Dot */}
                                                            <div
                                                                className="absolute w-3 h-3 rounded-full bg-[#f43f5e] ring-2 ring-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] transition-all duration-500 group-hover:scale-[1.3] group-hover:shadow-[0_4px_16px_rgba(244,63,94,0.6)] z-20"
                                                                style={{
                                                                    bottom: mounted ? withdrawBarHeight - 6 : 0,
                                                                    opacity: mounted ? 1 : 0,
                                                                    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.08}s`,
                                                                }}
                                                            />

                                                            {/* Deposit Dot */}
                                                            <div
                                                                className="absolute w-3 h-3 rounded-full bg-[#10b981] ring-2 ring-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all duration-500 group-hover:scale-[1.3] group-hover:shadow-[0_4px_16px_rgba(16,185,129,0.6)] z-20"
                                                                style={{
                                                                    bottom: mounted ? depositBarHeight - 6 : 0,
                                                                    opacity: mounted ? 1 : 0,
                                                                    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.35 + i * 0.08}s`,
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Line SVG Overlay (Only rendered if chartType is set to "line") */}
                                    {chartType === "line" && mounted && (
                                        <div className="absolute inset-x-0 bottom-0 h-full px-1 sm:px-4 pointer-events-none z-10">
                                            <svg className="w-full h-full overflow-visible drop-shadow-[0_8px_14px_rgba(16,185,129,0.15)]">
                                                {(() => {
                                                    const data = dashboardData?.weekly_activity || [];
                                                    const maxVal = 500000;
                                                    const count = data.length;

                                                    if (count === 0) return null;

                                                    const getX = (i: number) => `${((i + 0.5) / count) * 100}%`;
                                                    const getY = (val: number) => 260 - Math.min((val / maxVal) * 260, 260);

                                                    const depositLines = [];
                                                    const withdrawLines = [];

                                                    for (let i = 0; i < count - 1; i++) {
                                                        const d1 = data[i];
                                                        const d2 = data[i + 1];

                                                        depositLines.push(
                                                            <line
                                                                key={`d-${i}`}
                                                                x1={getX(i)}
                                                                y1={getY(d1.deposit_amount)}
                                                                x2={getX(i + 1)}
                                                                y2={getY(d2.deposit_amount)}
                                                                stroke="url(#depositGradient)"
                                                                strokeWidth="3.5"
                                                                strokeLinecap="round"
                                                                className="transition-opacity duration-1000 ease-out animate-in fade-in fill-mode-both"
                                                                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                                                            />
                                                        );

                                                        withdrawLines.push(
                                                            <line
                                                                key={`w-${i}`}
                                                                x1={getX(i)}
                                                                y1={getY(d1.withdraw_amount)}
                                                                x2={getX(i + 1)}
                                                                y2={getY(d2.withdraw_amount)}
                                                                stroke="url(#withdrawGradient)"
                                                                strokeWidth="3.5"
                                                                strokeLinecap="round"
                                                                className="transition-opacity duration-1000 ease-out animate-in fade-in fill-mode-both"
                                                                style={{ animationDelay: `${i * 0.05}s` }}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <defs>
                                                                <linearGradient id="depositGradient" x1="0" y1="0" x2="1" y2="0">
                                                                    <stop offset="0%" stopColor="#10b981" />
                                                                    <stop offset="100%" stopColor="#047857" />
                                                                </linearGradient>
                                                                <linearGradient id="withdrawGradient" x1="0" y1="0" x2="1" y2="0">
                                                                    <stop offset="0%" stopColor="#f43f5e" />
                                                                    <stop offset="100%" stopColor="#be123c" />
                                                                </linearGradient>
                                                            </defs>
                                                            {withdrawLines}
                                                            {depositLines}
                                                        </>
                                                    )
                                                })()}
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* X-axis labels */}
                                <div className="flex items-center justify-between px-1 sm:px-4 pt-3 mt-0 border-t border-gray-100">
                                    {(dashboardData?.weekly_activity || []).map((item, i) => (
                                        <div key={i} className="flex-1 mx-1 sm:mx-2 md:mx-3 text-center">
                                            <span className="text-xs text-gray-400 font-semibold">{item.day}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom Context Footer */}
                                <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 px-1 sm:px-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 group cursor-default">
                                            <div className="w-3 h-3 rounded-[3px] bg-gradient-to-br from-[#10b981] to-[#047857] shadow-sm group-hover:scale-110 transition-transform" />
                                            <span className="text-[13px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">Inbound (Deposits)</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-default">
                                            <div className="w-3 h-3 rounded-[3px] bg-gradient-to-br from-[#f43f5e] to-[#be123c] shadow-sm group-hover:scale-110 transition-transform" />
                                            <span className="text-[13px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">Outbound (Withdrawals)</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <Clock size={14} className="text-gray-400" />
                                        <span>Data synced to latest activity</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doughnut — spans 2 cols */}
                    <div className="lg:col-span-2">

                        {/* Doughnut card */}
                        <div
                            className="rounded-[20px] bg-white border p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 flex flex-col h-full"
                            style={{
                                borderColor: "rgba(0,0,0,0.12)",
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? "translateY(0)" : "translateY(16px)",
                                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s",
                            }}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#7B0F2B]/[0.03] to-transparent rounded-bl-full pointer-events-none" />

                            <div className="relative z-10 flex flex-col justify-between mb-8 gap-1">
                                <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Top Owners Overview</h3>
                                <p className="text-[13px] text-gray-500 font-medium">Rankings by aggregate volume</p>

                                {/* Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-full sm:w-fit mt-4 border border-gray-200 shadow-inner">
                                    <button
                                        onClick={() => setRankingTab("depositors")}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${rankingTab === "depositors" ? "bg-white text-[#10b981] shadow-sm ring-1 ring-gray-900/5" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Deposits
                                    </button>
                                    <button
                                        onClick={() => setRankingTab("withdrawers")}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${rankingTab === "withdrawers" ? "bg-white text-[#f43f5e] shadow-sm ring-1 ring-gray-900/5" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Withdrawals
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col gap-3 justify-center w-full">
                                {(() => {
                                    const items = rankingTab === "depositors"
                                        ? (dashboardData?.owners_ranking?.depositors || [])
                                        : (dashboardData?.owners_ranking?.withdrawers || []);

                                    if (items.length === 0) {
                                        // Empty state
                                        return (
                                            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <Users size={24} className="text-gray-300 mb-2" />
                                                <p className="text-sm font-semibold text-gray-400">No rankings available</p>
                                            </div>
                                        )
                                    }

                                    // Find max value to normalize progress bars
                                    const maxAmount = Math.max(...items.map(i => i.amount));

                                    return items.map((item, idx) => {
                                        const progress = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                                        const isDeposit = rankingTab === "depositors";

                                        return (
                                            <div key={idx} className="group relative flex flex-col p-4 rounded-[16px] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-gray-200/80 transition-all duration-300 overflow-hidden cursor-default">
                                                {/* Progress Bar background fill */}
                                                <div
                                                    className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-1000 ease-out ${isDeposit ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: mounted ? `${progress}%` : '0%' }}
                                                />

                                                <div className="relative z-10 flex items-center justify-between gap-4 w-full">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {/* Rank Bubble */}
                                                        <div className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-black tabular-nums transition-colors shadow-sm
                                                            ${idx === 0 ? 'bg-amber-100/80 text-amber-700 ring-1 ring-amber-200' :
                                                                idx === 1 ? 'bg-slate-100/80 text-slate-700 ring-1 ring-slate-200' :
                                                                    idx === 2 ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60' :
                                                                        'bg-white text-gray-400 ring-1 ring-gray-100'}
                                                        `}>
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-sm font-extrabold text-gray-800 tracking-tight leading-none group-hover:text-[#2D040C] transition-colors truncate">{item.owner_name}</p>
                                                    </div>

                                                    <div className="text-right flex flex-col items-end shrink-0 ml-auto">
                                                        <span className={`text-[15px] font-black tracking-tight drop-shadow-sm tabular-nums ${isDeposit ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    });
                                })()}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Payment Method Distribution ─────────────────────────────── */}
                <div
                    className="rounded-[20px] bg-white border p-6 sm:p-8 mt-6 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200"
                    style={{
                        borderColor: "rgba(0,0,0,0.12)",
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(16px)",
                        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s",
                    }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Payment Method Distribution</h3>
                            <p className="text-[13px] text-gray-500 font-medium mt-1">Breakdown of transaction channels</p>
                        </div>
                    </div>

                    {(() => {
                        const methods = dashboardData?.payment_methods || { cash_deposit: 0, cheque_deposit: 0, bank_transfer: 0, cheque: 0 }
                        const totalAmount = methods.cash_deposit + methods.cheque_deposit + methods.bank_transfer + methods.cheque;

                        // Calculate percentages
                        const getPct = (val: number) => totalAmount > 0 ? (val / totalAmount) * 100 : 0;
                        const pCashDep = getPct(methods.cash_deposit);
                        const pChequeDep = getPct(methods.cheque_deposit);
                        const pBankTrans = getPct(methods.bank_transfer);
                        const pCheque = getPct(methods.cheque);

                        // Colors
                        const cCashDep = "bg-[#10b981]";
                        const cChequeDep = "bg-[#3b82f6]";
                        const cBankTrans = "bg-[#6366f1]";
                        const cCheque = "bg-[#f59e0b]";

                        return (
                            <div className="flex flex-col gap-6">
                                {/* Segmented Progress Bar */}
                                <div className="h-4 sm:h-5 w-full bg-gray-100 rounded-full flex overflow-hidden ring-1 ring-inset ring-gray-900/5">
                                    <div className={`${cCashDep} h-full transition-all duration-1000 ease-out`} style={{ width: mounted ? `${pCashDep}%` : '0%' }} title={`Cash Deposit: ${pCashDep.toFixed(1)}%`} />
                                    <div className={`${cChequeDep} h-full transition-all duration-1000 ease-out`} style={{ width: mounted ? `${pChequeDep}%` : '0%' }} title={`Cheque Deposit: ${pChequeDep.toFixed(1)}%`} />
                                    <div className={`${cBankTrans} h-full transition-all duration-1000 ease-out`} style={{ width: mounted ? `${pBankTrans}%` : '0%' }} title={`Bank Transfer: ${pBankTrans.toFixed(1)}%`} />
                                    <div className={`${cCheque} h-full transition-all duration-1000 ease-out`} style={{ width: mounted ? `${pCheque}%` : '0%' }} title={`Cheque: ${pCheque.toFixed(1)}%`} />
                                </div>

                                {/* Legend Matrix */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-[3px] shadow-sm ${cCashDep}`} />
                                            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Cash Deposit</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-black text-gray-800 tracking-tight tabular-nums">{pCashDep.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-[3px] shadow-sm ${cChequeDep}`} />
                                            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Cheque Deposit</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-black text-gray-800 tracking-tight tabular-nums">{pChequeDep.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-[3px] shadow-sm ${cBankTrans}`} />
                                            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Bank Transfer</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-black text-gray-800 tracking-tight tabular-nums">{pBankTrans.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-[3px] shadow-sm ${cCheque}`} />
                                            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Cheque</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-black text-gray-800 tracking-tight tabular-nums">{pCheque.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>

                {/* ── Transaction Frequency & Largest Transactions ────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Frequency Leaders */}
                    <div
                        className="rounded-[20px] bg-white border overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 flex flex-col h-full"
                        style={{
                            borderColor: "rgba(0,0,0,0.12)",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(16px)",
                            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s",
                        }}
                    >
                        <div className="px-6 sm:px-8 py-6 border-b border-gray-100/80">
                            <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Transaction Frequency</h3>
                            <p className="text-[13px] text-gray-500 font-medium mt-1 mb-4">Owners with the most transactions</p>

                            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-full sm:w-fit mt-2 border border-gray-200 shadow-inner">
                                <button
                                    onClick={() => setFreqTab("all")}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${freqTab === "all" ? "bg-white text-[#4f46e5] shadow-sm ring-1 ring-gray-900/5" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    All Txs
                                </button>
                                <button
                                    onClick={() => setFreqTab("depositors")}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${freqTab === "depositors" ? "bg-white text-[#10b981] shadow-sm ring-1 ring-gray-900/5" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Deposits
                                </button>
                                <button
                                    onClick={() => setFreqTab("withdrawers")}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer ${freqTab === "withdrawers" ? "bg-white text-[#f43f5e] shadow-sm ring-1 ring-gray-900/5" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    Withdrawals
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 sm:p-8">
                            <div className="flex flex-col gap-3">
                                {(() => {
                                    const items = freqTab === "all"
                                        ? (dashboardData?.transaction_frequency?.all || [])
                                        : freqTab === "depositors"
                                            ? (dashboardData?.transaction_frequency?.depositors || [])
                                            : (dashboardData?.transaction_frequency?.withdrawers || []);

                                    if (items.length === 0) {
                                        return <div className="text-center text-sm font-medium text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed my-auto">No data available</div>
                                    }

                                    const maxCount = Math.max(...items.map(i => i.count));

                                    return items.map((item, idx) => {
                                        const progress = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                        const progressColor = freqTab === "all" ? 'bg-indigo-500' : freqTab === "depositors" ? 'bg-emerald-500' : 'bg-rose-500';

                                        return (
                                            <div key={idx} className="group relative flex flex-col p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 hover:border-gray-200 transition-all overflow-hidden cursor-default">
                                                <div
                                                    className={`absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-1000 ease-out ${progressColor}`}
                                                    style={{ width: mounted ? `${progress}%` : '0%' }}
                                                />
                                                <div className="relative z-10 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold ${idx < 3 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-[13px] font-bold text-gray-700 truncate">{item.owner_name}</p>
                                                    </div>
                                                    <div className="shrink-0 font-black text-[15px] opacity-90 drop-shadow-sm tabular-nums text-gray-800">
                                                        {item.count} <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-0.5">Txns</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    });
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Largest Transactions */}
                    <div
                        className="rounded-[20px] bg-white border overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200 flex flex-col h-full"
                        style={{
                            borderColor: "rgba(0,0,0,0.12)",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateY(0)" : "translateY(16px)",
                            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s",
                        }}
                    >
                        <div className="px-6 sm:px-8 py-6 border-b border-gray-100/80 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-black text-[#2D040C] tracking-tight">Largest Transactions</h3>
                                <p className="text-[13px] text-gray-500 font-medium mt-1">Highest value transfers</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 ring-1 ring-amber-100 hidden sm:block">
                                <AlertCircle size={18} className="text-amber-600" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">Target / Source</th>
                                        <th className="px-6 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/80">
                                    {(dashboardData?.largest_transactions || []).length > 0 ? (
                                        (dashboardData?.largest_transactions || []).map((txn) => (
                                            <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-[12px] font-bold text-gray-500">{txn.date}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md whitespace-nowrap shadow-sm ${txn.method === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
                                                            {txn.method}
                                                        </span>
                                                        <span className="text-[12px] font-extrabold text-[#2D040C] line-clamp-1">{txn.owner_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="text-[14px] font-black tracking-tight text-[#2D040C] drop-shadow-sm tabular-nums">
                                                        {formatCurrency(txn.amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-[13px] font-medium text-gray-400 bg-gray-50">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── Table Section ─────────────────────────────────────────── */}
                <div
                    className="rounded-[20px] bg-white border overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-gray-200"
                    style={{
                        borderColor: "rgba(0,0,0,0.12)",
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
                                    className="pl-10 pr-4 py-2.5 text-[13px] font-medium bg-gray-50/50 border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-[#7B0F2B]/10 focus:border-[#7B0F2B]/40 hover:border-gray-300 transition-all w-full sm:w-60 placeholder:text-gray-400"
                                />
                            </div>
                            {/* Filter */}
                            <div className="relative group">
                                <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F2B] transition-colors" />
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value as any)}
                                    className="pl-10 pr-8 py-2.5 text-[13px] font-medium bg-gray-50/50 border border-gray-200/80 rounded-md appearance-none focus:outline-none focus:ring-4 focus:ring-[#7B0F2B]/10 focus:border-[#7B0F2B]/40 hover:border-gray-300 transition-all cursor-pointer text-gray-700"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            {/* Navigation */}
                            <Link
                                href={`/${role === "superadmin" ? "super/accountant" : "accountant"}/voucher/cash-voucher-list`}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold text-white bg-gradient-to-r from-[#7B0F2B] to-[#5f0c18] hover:from-[#5f0c18] hover:to-[#4a0812] rounded-md transition-all shadow-[0_4px_12px_rgba(123,15,43,0.15)] hover:shadow-[0_6px_16px_rgba(123,15,43,0.25)] hover:-translate-y-0.5"
                            >
                                <span className="hidden sm:inline">Vouchers List</span>
                                <span className="sm:hidden">List</span>
                                <ArrowRight size={14} />
                            </Link>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
                                                key={row.id}
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
