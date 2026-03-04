"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Building2,
    Calendar,
    ChevronDown,
    Download,
    Eye,
    EyeOff,
    Filter,
    Search,
    FileText
} from "lucide-react";

import AppHeader from "@/components/app/AppHeader";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import SharedToolbar from "@/components/app/SharedToolbar";

// Dummy data for the static UI
const DUMMY_MAIN_OWNERS = [
    { id: "1", name: "Alpha Corporation" },
    { id: "2", name: "Beta Holdings Ltd." },
];

const DUMMY_LEDGER_ENTRIES = [
    {
        id: "TXN-001",
        voucher_date: "2026-03-01",
        voucher_no: "V-1001",
        trans_type: "CASH DEPOSIT",
        owner: "Alpha Corporation Real Estate Holdings & Consultancy Services International, Inc. - A very long subsidiary name to test the table owner column handling.",
        particulars: "Initial fund deposit from the corporate treasury department for the Q1 funding cycle, transferred directly to the main operating account via swift code transfer subject to internal audit review.",
        deposit: 500000.00,
        withdrawal: null,
        balance: 500000.00,
        fund_references: "REF-001A-LONG-REFERENCE-NUMBER-WITH-MULTIPLE-SEGMENTS-AND-DASHES-THAT-MIGHT-NOT-WRAP-NICELY",
        person_in_charge: "Johnathon Bartholomew Montgomery III",
    },
    {
        id: "TXN-002",
        voucher_date: "2026-03-02",
        voucher_no: "V-1002",
        trans_type: "CHEQUE",
        owner: "Beta Holdings Ltd.",
        particulars: "Payment to Supplier A and Supplier B for the procurement of office equipment, ongoing IT infrastructure maintenance, software licensing renewals, and consulting fees for the upcoming deployment phase.",
        deposit: null,
        withdrawal: 25000.00,
        balance: 475000.00,
        fund_references: "CHQ-88219-BDO-MAKATI-CLEARING-ACCOUNT-MAIN-BRANCH",
        person_in_charge: "Jane Smith-Wellington",
    },
    {
        id: "TXN-003",
        voucher_date: "2026-03-03",
        voucher_no: "V-1003",
        trans_type: "BANK TRANSFER",
        owner: "Alpha Corporation",
        particulars: "Fund transfer from Beta Holdings, previously delayed due to compliance checks under the new regulatory framework, finally cleared by the compliance officers on Tuesday morning.",
        deposit: 150000.00,
        withdrawal: null,
        balance: 625000.00,
        fund_references: "TRF-992B",
        person_in_charge: "Manager of Operations and Finance Department",
    },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handler();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [ref, handler]);
}

// ─── Searchable Dropdown Component ───────────────────────────────────────────

function OwnerSelectDropdown({
    owners,
    selectedId,
    onChange
}: {
    owners: any[];
    selectedId: string;
    onChange: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    const selectedOwner = owners.find(o => o.id === selectedId);
    const filteredOwners = owners.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={ref} className="relative shrink-0 w-72">
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white cursor-pointer transition-colors ${open ? 'border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {selectedOwner?.name ?? "Select Owner..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && (
                <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search owner..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No owners found</div>
                        ) : (
                            filteredOwners.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedId === o.id ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                                >
                                    <span className="truncate block">{o.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MainLedgerPage() {
    const [selectedOwner, setSelectedOwner] = useState(DUMMY_MAIN_OWNERS[0].id);
    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);

    const columns = React.useMemo<DataTableColumn<any>[]>(() => [
        {
            key: "voucher_date",
            label: "VOUCHER DATE",
            align: "center",
            width: "160px",
            minWidth: "160px",
            renderCell: (row) => new Date(row.voucher_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        },
        {
            key: "voucher_no",
            label: "VOUCHER NO.",
            align: "center",
            minWidth: "120px",
        },
        {
            key: "trans_type",
            label: "TRANS TYPE",
            align: "center",
            minWidth: "120px",
        },
        {
            key: "owner",
            label: "OWNER",
            align: "center",
            minWidth: "180px",
            maxWidth: "180px",
        },
        {
            key: "particulars",
            label: "PARTICULARS",
            align: "left",
            minWidth: "250px",
            maxWidth: "250px",
        },
        {
            key: "deposit",
            label: "DEPOSIT",
            align: "right",
            minWidth: "140px",
            renderCell: (row) => (
                <span className="font-medium text-green-600">
                    {row.deposit !== null ? `₱${row.deposit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "withdrawal",
            label: "WITHDRAWAL",
            align: "right",
            minWidth: "140px",
            renderCell: (row) => (
                <span className="font-medium text-red-600">
                    {row.withdrawal !== null ? `₱${row.withdrawal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "balance",
            label: "OUTS. BALANCE",
            align: "right",
            minWidth: "150px",
            renderCell: (row) => (
                <span className="font-bold text-gray-900">
                    ₱{row.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: "fund_references",
            label: "FUND REFERENCES",
            align: "left",
            minWidth: "180px",
            maxWidth: "180px",
            hidden: !showExtraColumns,
            renderCell: (row) => row.fund_references || "-"
        },
        {
            key: "person_in_charge",
            label: "PERSON IN CHARGE",
            align: "center",
            minWidth: "160px",
            maxWidth: "160px",
            hidden: !showExtraColumns,
            renderCell: (row) => row.person_in_charge || "-"
        }
    ], [showExtraColumns]);

    // Dummy data for units
    const DUMMY_UNITS = [
        { id: "ALL", name: "Main Owner (All Units)" },
        { id: "U-001", name: "Unit A - South Tower" },
        { id: "U-002", name: "Unit B - North Tower" },
    ];

    const [selectedUnit, setSelectedUnit] = useState("ALL");

    // Example pagination
    const [currentPage, setCurrentPage] = useState(1);
    const paginationMeta = {
        current_page: currentPage,
        last_page: 5,
        per_page: 10,
        total: 45,
        from: (currentPage - 1) * 10 + 1,
        to: Math.min(currentPage * 10, 45)
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col">
            {/* AppHeader Component */}
            <AppHeader
                navigation={[]}
                title="Main Owner Ledger"
                subtitle="View transaction history and running balances for main owners."
                primaryAction={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">


                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    {/* ── Section header ── */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#5f0c18]">Ledger Entries</h2>
                            <p className="text-sm text-gray-600 mt-1">Review the transaction timeline and balances</p>
                        </div>
                        <button
                            onClick={() => setShowExtraColumns(!showExtraColumns)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            {showExtraColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showExtraColumns ? "Hide Extra Columns" : "Show Extra Columns"}
                        </button>
                    </div>

                    {/* ── Filters (SharedToolbar) ── */}
                    <div className="mt-4">
                        <SharedToolbar
                            searchQuery={query}
                            onSearchChange={(val: string) => setQuery(val)}
                            searchPlaceholder="Search particulars or ID..."
                            onRefresh={() => { }}
                            containerMaxWidth="max-w-4xl"
                        >
                            {/* Main Owner Filter - Searchable Dropdown */}
                            <OwnerSelectDropdown
                                owners={DUMMY_MAIN_OWNERS}
                                selectedId={selectedOwner}
                                onChange={setSelectedOwner}
                            />

                            {/* Unit Filter - Smart Dropdown */}
                            <div className="relative shrink-0 w-56">
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {DUMMY_UNITS.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </SharedToolbar>
                    </div>

                    {/* ── Table ── */}
                    <div className="mt-6">
                        {/* ── Top Section: Company Name, Owner Name, balances ── */}
                        <div className="bg-white rounded-md border-x border-t p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between" style={{ borderColor: BORDER }}>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#5f0c18]">ABIC REALTY & CONSULTANCY CORPORATION 2025</h1>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">
                                    {DUMMY_MAIN_OWNERS.find(o => o.id === selectedOwner)?.name ?? "Select Owner"}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0 text-right">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Balance</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">₱500,000.00</p>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Running Balance</p>
                                    <p className="text-lg font-bold text-[#7a0f1f] mt-0.5">₱625,000.00</p>
                                </div>
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            rows={DUMMY_LEDGER_ENTRIES}
                            pagination={paginationMeta}
                            onPageChange={setCurrentPage}
                            itemName="entries"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
