"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
    Download,
    Eye,
    EyeOff,
    FileText
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import AppHeader from "@/components/app/AppHeader";
import DataTableLedge, { InstrumentFilesPopover } from "@/components/app/DataTableLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import SharedToolbar from "@/components/app/SharedToolbar";
import { DataTableColumn } from "@/components/app/DataTable";

// ─── Interfaces ────────────────────────────────────────────────────────────────

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

function SystemLedgerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");

    // Component State
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [entriesLoading, setEntriesLoading] = useState(false);

    // We can extract ownername from the response if we really want, but it's SYSTEM
    const [ownerName, setOwnerName] = useState<string>("SYSTEM");

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);

    // Filter/Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    const fetchLedger = useCallback(() => {
        setEntriesLoading(true);

        const url = `/api/accountant/ledger/system?sort=oldest`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEntries(data.data.transactions || []);
                    setOpeningBalance(data.data.openingBalance || 0);
                    if (data.data.owner?.name) {
                        setOwnerName(data.data.owner.name);
                    }
                    setCurrentPage(1); // Reset to page 1 on new fetch
                } else {
                    setEntries([]);
                    setOpeningBalance(0);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setEntriesLoading(false));
    }, []);

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
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null,
                        type: a.file_type ?? a.mimeType ?? a.mime_type ?? null,
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
            label: "OWNER",
            align: "center",
            width: "180px",
            minWidth: "180px",
            maxWidth: "180px",
            sortable: true,
            renderCell: (row) => {
                if (!row.otherOwnerType || !row.otherOwnerId) {
                    return (
                        <InfoTooltip text={row.owner}>
                            <span className="truncate block cursor-default">{row.owner}</span>
                        </InfoTooltip>
                    );
                }
                const destType = row.otherOwnerType.toLowerCase();
                let targetUrl = `/super/accountant/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
                if (row.otherUnitId) targetUrl += `&targetUnitId=${row.otherUnitId}`;
                return (
                    <InfoTooltip text={row.owner}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); router.push(targetUrl); }}
                            className="truncate block w-full font-semibold text-[#7a0f1f] underline decoration-dotted underline-offset-2 hover:text-[#5f0c18] transition-colors cursor-pointer"
                        >
                            {row.owner}
                        </button>
                    </InfoTooltip>
                );
            },
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
                title="System Ledger"
                subtitle="View transaction history and running balances for the system owner."
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
                        />
                    </div>

                    {/* ── Table ── */}
                    <div className="mt-6">
                        {/* ── Top Section: Company Name, Owner Name, balances ── */}
                        <div className="bg-white rounded-md border-x border-t p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between" style={{ borderColor: BORDER }}>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#5f0c18]">ABIC REALTY & CONSULTANCY CORPORATION 2025</h1>
                                <p className="text-sm font-semibold text-gray-500 mt-1 uppercase">
                                    {entriesLoading ? "Loading..." : ownerName}
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

export default function SystemLedgerPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <SystemLedgerPage />
        </Suspense>
    );
}
