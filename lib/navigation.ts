import {
    LayoutDashboard,
    Crown,
    Shield,
    Calculator,
    Users,
    BookOpen,
    UserPlus,
    UserMinus,
    CheckSquare,
    FileText,
    ClipboardCheck,
    FilePlus,
    FolderOpen,
    User,
    Clock,
    Calendar,
    CalendarDays,
    Plus,
    Receipt,
    ScrollText,
    BookMarked,
    Wrench,
    Banknote,
    Building2,
    Ticket,
    BanknoteArrowDown,
} from "lucide-react"
import type { NavEntry } from "@/components/app/AppSidebar"

// ─── Super Admin ─────────────────────────────────────────────────────────────

export const superAdminNav: NavEntry[] = [
    { type: "link", label: "DASHBOARD", href: "/super", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "HEAD", icon: Crown, items: [
            { label: "Admins", href: "/super/head/admins", icon: Shield },
            { label: "Accountants", href: "/super/head/accountants", icon: Calculator },
        ],
    },
    { type: "link", label: "ACTIVITY LOG", href: "/super/activity-log", icon: ScrollText },

    // ── Admin section ──
    { type: "divider" },
    { type: "section", label: "Admin" },
    { type: "link", label: "ADMIN PANEL", href: "/super/admin", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "EMPLOYEE", icon: Users, items: [
            { label: "Masterfile", href: "/super/admin/employee/masterfile", icon: BookOpen },
            { label: "Onboard Employee", href: "/super/admin/employee/onboard", icon: UserPlus },
            { label: "Terminate Employee", href: "/super/admin/employee/terminate", icon: UserMinus },
            { label: "Evaluation", href: "/super/admin/employee/evaluation", icon: CheckSquare },
        ],
    },
    {
        type: "group", label: "FORMS", icon: FileText, items: [
            { label: "Clearance", href: "/super/admin/forms/clearance-checklist", icon: ClipboardCheck },
            { label: "Onboarding", href: "/super/admin/forms/onboarding-checklist", icon: FilePlus },
        ],
    },
    {
        type: "group", label: "DIRECTORY", icon: FolderOpen, items: [
            { label: "Process", href: "/super/admin/directory/process", icon: BookOpen },
            { label: "Contacts", href: "/super/admin/directory/contacts", icon: User },
        ],
    },
    {
        type: "group", label: "ATTENDANCE", icon: Clock, items: [
            { label: "Tardiness", href: "/super/admin/attendance/tardiness", icon: Clock },
            { label: "Leave", href: "/super/admin/attendance/leave", icon: Calendar },
            { label: "Leave Credits", href: "/super/admin/attendance/leave-credits", icon: CalendarDays },
        ],
    },

    // ── Accountant section ──
    { type: "divider" },
    { type: "section", label: "Accountant" },
    { type: "link", label: "ACCOUNTANT PANEL", href: "/super/accountant/accountant-panel", icon: LayoutDashboard, exact: true },
        {
        type: "group", label: "VOUCHERS", icon: Banknote, items: [
            { label: "Cash Voucher", href: "/super/accountant/voucher/cash-voucher", icon: Plus },
            { label: "Cheque Voucher", href: "/super/accountant/voucher/cheque-voucher", icon: Plus },
            { label: "Cash Vouchers List", href: "/super/accountant/voucher/cash-voucher-list", icon: ScrollText },
            { label: "Cheque Vouchers List", href: "/super/accountant/voucher/cheque-voucher-list", icon: ScrollText },
        ],
    },
    {
        type: "group", label: "TRANSACTIONS", icon: FileText, items: [
            { label: "New Transaction", href: "/super/accountant/transactions", icon: Plus },
            { label: "Transactions Receipt", href: "/super/accountant/transaction-receipt", icon: Receipt },
        ],
    },
    {
        type: "group", label: "LEDGER", icon: BookMarked, items: [
            { label: "Main Ledger", href: "/super/accountant/ledger/main", icon: BookOpen },
            { label: "Client Ledger", href: "/super/accountant/ledger/client", icon: BookOpen },
            { label: "Company Ledger", href: "/super/accountant/ledger/company", icon: BookOpen },
            { label: "System Ledger", href: "/super/accountant/ledger/system", icon: BookOpen },
        ],
    },
    {
        type: "group", label: "MAINTENANCE", icon: Wrench, items: [
            { label: "Banks", href: "/super/accountant/maintenance/banks", icon: Banknote },
            { label: "Owners", href: "/super/accountant/maintenance/owners", icon: User },
            { label: "Properties", href: "/super/accountant/maintenance/properties", icon: Building2 },
            { label: "Bank Accounts", href: "/super/accountant/maintenance/bank-accounts", icon: Banknote },
        ],
    },
]

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminNav: NavEntry[] = [
    { type: "link", label: "DASHBOARD", href: "/admin", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "EMPLOYEE", icon: Users, items: [
            { label: "Masterfile", href: "/admin/employee/masterfile", icon: BookOpen },
            { label: "Onboard Employee", href: "/admin/employee/onboard", icon: UserPlus },
            { label: "Terminate Employee", href: "/admin/employee/terminate", icon: UserMinus },
            { label: "Evaluation", href: "/admin/employee/evaluation", icon: CheckSquare },
        ],
    },
    {
        type: "group", label: "FORMS", icon: FileText, items: [
            { label: "Clearance", href: "/admin/forms/clearance-checklist", icon: ClipboardCheck },
            { label: "Onboarding", href: "/admin/forms/onboarding-checklist", icon: FilePlus },
        ],
    },
    { type: "link", label: "DIRECTORY", href: "/admin/directory/process", icon: BookOpen },
    {
        type: "group", label: "ATTENDANCE", icon: Clock, items: [
            { label: "Leave", href: "/admin/attendance/leave", icon: Calendar },
            { label: "Leave Credits", href: "/admin/attendance/leave-credits", icon: CalendarDays },
            { label: "Tardiness", href: "/admin/attendance/tardiness", icon: Clock },
        ],
    },
]

// ─── Accountant ──────────────────────────────────────────────────────────────

export const accountantNav: NavEntry[] = [
    { type: "link", label: "DASHBOARD", href: "/accountant", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "TRANSACTIONS", icon: FileText, items: [
            { label: "New Transaction", href: "/accountant/transactions", icon: Plus },
            { label: "Transactions Receipt", href: "/accountant/transaction-receipt", icon: Receipt },
            { label: "Accountant Log", href: "/accountant/activity-log", icon: ScrollText },
        ],
    },
    {
        type: "group", label: "LEDGER", icon: BookMarked, items: [
            { label: "Main Ledger", href: "/accountant/ledger/main", icon: BookOpen },
            { label: "Client Ledger", href: "/accountant/ledger/client", icon: BookOpen },
            { label: "System Ledger", href: "/accountant/ledger/system", icon: BookOpen },
        ],
    },
    {
        type: "group", label: "MAINTENANCE", icon: Wrench, items: [
            { label: "Banks", href: "/accountant/maintenance/banks", icon: Banknote },
            { label: "Owners", href: "/accountant/maintenance/owners", icon: User },
            { label: "Properties", href: "/accountant/maintenance/properties", icon: Building2 },
            { label: "Bank Accounts", href: "/accountant/maintenance/bank-accounts", icon: Banknote },
        ],
    },
]

// ─── Viewer (read-only super admin view) ─────────────────────────────────────

export const viewerNav: NavEntry[] = [
    { type: "link", label: "DASHBOARD", href: "/viewer", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "HEAD", icon: Crown, items: [
            { label: "Admins", href: "/viewer/head/admins", icon: Shield },
            { label: "Accountants", href: "/viewer/head/accountants", icon: Calculator },
        ],
    },

    // ── Admin section ──
    { type: "divider" },
    { type: "section", label: "Admin" },
    { type: "link", label: "EMPLOYEE DASHBOARD", href: "/viewer/admin", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "EMPLOYEE", icon: Users, items: [
            { label: "Masterfile", href: "/viewer/admin/employee/masterfile", icon: BookOpen },
            { label: "Onboard Employee", href: "/viewer/admin/employee/onboard", icon: UserPlus },
            { label: "Terminate Employee", href: "/viewer/admin/employee/terminate", icon: UserMinus },
            { label: "Evaluation", href: "/viewer/admin/employee/evaluation", icon: CheckSquare },
        ],
    },
    {
        type: "group", label: "FORMS", icon: FileText, items: [
            { label: "Clearance", href: "/viewer/admin/forms/clearance-checklist", icon: ClipboardCheck },
            { label: "Onboarding", href: "/viewer/admin/forms/onboarding-checklist", icon: FilePlus },
        ],
    },
    {
        type: "group", label: "DIRECTORY", icon: FolderOpen, items: [
            { label: "Process", href: "/viewer/admin/directory/process", icon: BookOpen },
            { label: "Contacts", href: "/viewer/admin/directory/contacts", icon: User },
        ],
    },
    {
        type: "group", label: "ATTENDANCE", icon: Clock, items: [
            { label: "Leave", href: "/viewer/admin/attendance/leave", icon: Calendar },
            { label: "Leave Credits", href: "/viewer/admin/attendance/leave-credits", icon: CalendarDays },
            { label: "Tardiness", href: "/viewer/admin/attendance/tardiness", icon: Clock },
        ],
    },

    // ── Accountant section ──
    { type: "divider" },
    { type: "section", label: "Accountant" },
    { type: "link", label: "ACCOUNTANT DASHBOARD", href: "/viewer/accountant", icon: LayoutDashboard, exact: true },
    {
        type: "group", label: "TRANSACTIONS", icon: FileText, items: [
            { label: "New Transaction", href: "/viewer/accountant/transactions", icon: Plus },
            { label: "Transactions Receipt", href: "/viewer/accountant/transaction-receipt", icon: Receipt },
            { label: "Accountant Log", href: "/viewer/accountant/activity-log", icon: ScrollText },
        ],
    },
    {
        type: "group", label: "LEDGER", icon: BookMarked, items: [
            { label: "Main Ledger", href: "/viewer/accountant/ledger/main", icon: BookOpen },
            { label: "Client Ledger", href: "/viewer/accountant/ledger/client", icon: BookOpen },
            { label: "Company Ledger", href: "/viewer/accountant/ledger/company", icon: BookOpen },
            { label: "System Ledger", href: "/viewer/accountant/ledger/system", icon: BookOpen },
        ],
    },
    {
        type: "group", label: "MAINTENANCE", icon: Wrench, items: [
            { label: "Banks", href: "/viewer/accountant/maintenance/banks", icon: Banknote },
            { label: "Owners", href: "/viewer/accountant/maintenance/owners", icon: User },
            { label: "Properties", href: "/viewer/accountant/maintenance/properties", icon: Building2 },
            { label: "Bank Accounts", href: "/viewer/accountant/maintenance/bank-accounts", icon: Banknote },
        ],
    },
]
