"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
    Building2,
    ChevronDown,
    Download,
    Eye,
    EyeOff,
    Search,
    FileText
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";


import AppHeader from "@/components/app/AppHeader";
import DataTableLedge, { InstrumentFilesPopover } from "@/components/app/DataTableLedge";
import SharedToolbar from "@/components/app/SharedToolbar";
import { DataTableColumn } from "@/components/app/DataTable";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

interface Unit {
    id: number | string;
    unit_name: string;
}

interface LedgerEntry {
    id: number;
    transactionId: number;
    createdAt: string;
    voucherDate: string;
    isVoucherDate: boolean;
    voucherNo: string;
    otherOwnerId: number | null;
    otherOwnerType: string | null;
    otherUnitId: number | null;
    transType: string;
    owner: string;
    particulars: string;
    deposit: number;
    withdrawal: number;
    outsBalance: number;
    transferGroupId: number | null;
    voucherAttachmentUrl: string | null;
    instrumentAttachments: any[];
    fundReference: string | null;
    personInCharge: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER = "rgba(0,0,0,0.12)";

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
    onChange,
    loading
}: {
    owners: Owner[];
    selectedId: string | number | null;
    onChange: (id: string | number) => void;
    loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    const selectedOwner = owners.find(o => String(o.id) === String(selectedId));
    const filteredOwners = owners.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={ref} className="relative shrink-0 w-72">
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white cursor-pointer transition-colors ${open ? 'border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {loading ? "Loading clients..." : (selectedOwner?.name ?? "Select Client...")}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && !loading && (
                <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search client..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No clients found</div>
                        ) : (
                            filteredOwners.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${String(selectedId) === String(o.id) ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
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

// ─── Unit Searchable Dropdown Component ──────────────────────────────────────

function UnitSelectDropdown({
    units,
    selectedId,
    onChange,
    disabled
}: {
    units: Unit[];
    selectedId: string | number;
    onChange: (id: string | number) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    const selectedUnit = selectedId === "ALL"
        ? null
        : units.find(u => String(u.id) === String(selectedId));

    const filteredUnits = units.filter(u => u.unit_name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={ref} className="relative shrink-0 w-56">
            <div
                onClick={() => !disabled && setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'} ${open ? 'border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20' : 'border-gray-300'}`}
            >
                <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {selectedUnit ? selectedUnit.unit_name : "Client"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && !disabled && (
                <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search unit..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => { onChange("ALL"); setOpen(false); setQuery(""); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedId === "ALL" ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                        >
                            Client
                        </button>
                        {filteredUnits.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No units found</div>
                        ) : (
                            filteredUnits.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => { onChange(u.id); setOpen(false); setQuery(""); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${String(selectedId) === String(u.id) ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                                >
                                    <span className="truncate block">{u.unit_name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ClientLedgerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");
    const [initialOwnerId] = useState(searchParams.get("targetOwnerId"));
    const [initialUnitId] = useState(searchParams.get("targetUnitId"));

    // Component State
    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(true);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | number | null>(null);

    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | number>("ALL");

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);

    // Filter/Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    // API Fetches
    useEffect(() => {
        setOwnersLoading(true);
        fetch('/api/accountant/maintenance/owners?per_page=all')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const rawData = Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []);
                    // Filter for CLIENT instead of MAIN
                    const clients = rawData.filter((o: Owner) => o.owner_type === "CLIENT");
                    setOwners(clients);
                    if (initialOwnerId) {
                        const exists = clients.find(o => String(o.id) === initialOwnerId);
                        if (exists) setSelectedOwnerId(initialOwnerId);
                        else if (clients.length > 0) setSelectedOwnerId(clients[0].id);
                    } else if (clients.length > 0) {
                        setSelectedOwnerId(clients[0].id);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setOwnersLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedOwnerId) return;
        fetch(`/api/accountant/maintenance/units?owner_id=${selectedOwnerId}&per_page=all`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const rawUnits = Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []);
                    setUnits(rawUnits);
                    if (initialUnitId && String(selectedOwnerId) === String(initialOwnerId)) {
                        const exists = rawUnits.find((u: Unit) => String(u.id) === initialUnitId);
                        if (exists) setSelectedUnitId(initialUnitId);
                    } else {
                        setSelectedUnitId("ALL");
                    }
                }
            })
            .catch(err => console.error(err));
    }, [selectedOwnerId]);

    const fetchLedger = useCallback(() => {
        if (!selectedOwnerId) return;
        setEntriesLoading(true);

        // Fetching from /clients endpoint
        let url = `/api/accountant/ledger/clients?owner_id=${selectedOwnerId}&sort=oldest`;
        if (selectedUnitId !== "ALL") {
            url += `&unit_id=${selectedUnitId}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEntries(data.data.transactions || []);
                    setOpeningBalance(data.data.openingBalance || 0);
                    setCurrentPage(1); // Reset to page 1 on new fetch
                } else {
                    setEntries([]);
                    setOpeningBalance(0);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setEntriesLoading(false));
    }, [selectedOwnerId, selectedUnitId]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const columns = React.useMemo<DataTableColumn<LedgerEntry>[]>(() => [
        {
            key: "createdAt",
            label: "DATE",
            align: "center",
            width: "160px",
            minWidth: "160px",
            maxWidth: "160px",
            sortable: true,
            renderCell: (row) => row.voucherDate
        },
        {
            key: "voucherNo",
            label: "VOUCHER NO.",
            align: "center",
            width: "150px",
            minWidth: "150px",
            maxWidth: "150px",
            sortable: true,
        },
        {
            key: "transType",
            label: "TRANS TYPE",
            align: "center",
            width: "150px",
            minWidth: "150px",
            maxWidth: "150px",
            sortable: true,
            renderCell: (row) => {
                const files: { name: string; url?: string | null }[] =
                    (row.instrumentAttachments ?? []).map((a: any) => ({
                        name: a.instrumentNo ?? a.file_name ?? a.name ?? "—",
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null
                    }))
                if (files.length === 0) return row.transType as string
                const trigger = (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#7a0f1f] cursor-pointer group/chip">
                        <span className="underline decoration-dotted underline-offset-2">{row.transType}</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-[#7a0f1f]/10 text-[#7a0f1f] group-hover/chip:bg-[#7a0f1f]/20 transition-colors">
                            <FileText className="w-2.5 h-2.5" />
                        </span>
                    </span>
                )
                return (
                    <InstrumentFilesPopover label={`${row.transType} files`} files={files}>
                        {trigger}
                    </InstrumentFilesPopover>
                )
            },
        },
        {
            key: "owner",
            label: "ACCOUNT SOURCE",
            align: "center",
            width: "180px",
            minWidth: "180px",
            maxWidth: "180px",
            sortable: true,
        },
        {
            key: "particulars",
            label: "PARTICULARS",
            align: "left",
            width: "500px",
            minWidth: "500px",
            maxWidth: "500px",
            sortable: true,
            renderCell: (row) => {
                const text: string = row.particulars ?? ""
                const sepIdx = text.indexOf(" - ")
                if (sepIdx === -1) return text
                const unit = text.slice(0, sepIdx)
                const rest = text.slice(sepIdx + 3)
                return (
                    <span>
                        <span className="font-bold">{unit}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span>{rest}</span>
                    </span>
                )
            },
        },
        {
            key: "deposit",
            label: "DEPOSIT",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-medium text-green-600">
                    {row.deposit > 0 ? `₱${row.deposit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "withdrawal",
            label: "WITHDRAWAL",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-medium text-red-600">
                    {row.withdrawal > 0 ? `₱${row.withdrawal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "-"}
                </span>
            )
        },
        {
            key: "outsBalance",
            label: "OUTS. BALANCE",
            align: "right",
            width: "140px",
            minWidth: "140px",
            maxWidth: "140px",
            sortable: true,
            renderCell: (row) => (
                <span className="font-bold text-gray-900">
                    ₱{row.outsBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: "fundReference",
            label: "FUND REFERENCES",
            align: "left",
            minWidth: "180px",
            maxWidth: "180px",
            hidden: !showExtraColumns,
            sortable: true,
            renderCell: (row) => row.fundReference || "-"
        },
        {
            key: "personInCharge",
            label: "PERSON IN CHARGE",
            align: "center",
            minWidth: "160px",
            maxWidth: "160px",
            hidden: !showExtraColumns,
            sortable: true,
            renderCell: (row) => row.personInCharge || "-"
        }
    ], [showExtraColumns]);

    const filteredEntries = React.useMemo(() => {
        if (!query.trim()) return entries;
        const lowerQuery = query.toLowerCase();
        return entries.filter(e =>
            (e.particulars && e.particulars.toLowerCase().includes(lowerQuery)) ||
            (e.transType && e.transType.toLowerCase().includes(lowerQuery)) ||
            (e.voucherNo && e.voucherNo.toLowerCase().includes(lowerQuery)) ||
            (e.owner && e.owner.toLowerCase().includes(lowerQuery)) ||
            (String(e.id).includes(lowerQuery))
        );
    }, [entries, query]);

    // Client-side pagination logic
    const PER_PAGE = 10;
    const totalRecords = filteredEntries.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));

    // Safety check for current page
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = (safeCurrentPage - 1) * PER_PAGE;
    const endIndex = Math.min(startIndex + PER_PAGE, totalRecords);

    const paginatedEntries = React.useMemo(() => {
        return filteredEntries.slice(startIndex, endIndex);
    }, [filteredEntries, startIndex, endIndex]);

    const paginationMeta = filteredEntries.length > 0 ? {
        current_page: safeCurrentPage,
        last_page: totalPages,
        per_page: PER_PAGE,
        total: totalRecords,
        from: startIndex + 1,
        to: endIndex
    } : null;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col">
            {/* AppHeader Component */}
            <AppHeader
                navigation={[]}
                title="Client Ledger"
                subtitle="View transaction history and running balances for clients."
                primaryAction={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full">

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
                            searchPlaceholder="Search transaction..."
                            onRefresh={fetchLedger}
                            containerMaxWidth="max-w-4xl"
                        >
                            {/* Client Filter - Searchable Dropdown */}
                            <OwnerSelectDropdown
                                owners={owners}
                                selectedId={selectedOwnerId}
                                onChange={(id) => {
                                    setSelectedOwnerId(id);
                                    setSelectedUnitId("ALL");
                                }}
                                loading={ownersLoading}
                            />

                            {/* Unit Filter - Smart Dropdown */}
                            <UnitSelectDropdown
                                units={units}
                                selectedId={selectedUnitId}
                                onChange={setSelectedUnitId}
                            />
                        </SharedToolbar>
                    </div>

                    {/* ── Table ── */}
                    <div className="mt-6">
                        {/* ── Top Section: Company Name, Owner Name, balances ── */}
                        <div className="bg-white rounded-md border-x border-t p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between" style={{ borderColor: BORDER }}>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#5f0c18]">ABIC REALTY & CONSULTANCY CORPORATION 2025</h1>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">
                                    {ownersLoading ? "Loading..." : (owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Select Client")}
                                </p>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0 text-right">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Balance</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                                        {entriesLoading ? "..." : `₱${openingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Running Balance</p>
                                    <p className="text-lg font-bold text-[#7a0f1f] mt-0.5">
                                        {entriesLoading ? "..." : (entries.length > 0 ? `₱${entries[entries.length - 1].outsBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "₱0.00")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DataTableLedge
                            columns={columns}
                            rows={paginatedEntries}
                            pagination={paginationMeta}
                            onPageChange={setCurrentPage}
                            itemName="entries"
                            loading={entriesLoading}
                            getRowId={(row) => `row-${row.transactionId}`}
                            highlightRowId={highlightTx ? `row-${highlightTx}` : undefined}
                            onRowClick={(row) => {
                                if (!row.otherOwnerType || !row.otherOwnerId) return;
                                const destinationLedgerType = row.otherOwnerType.toLowerCase();
                                let targetUrl = `/super/accountant/ledger/${destinationLedgerType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
                                if (row.otherUnitId) {
                                    targetUrl += `&targetUnitId=${row.otherUnitId}`;
                                }
                                router.push(targetUrl);
                            }}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function ClientLedgerPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <ClientLedgerPage />
        </Suspense>
    );
}
