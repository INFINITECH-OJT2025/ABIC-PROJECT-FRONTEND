"use client";
import { superAdminNav, accountantNav, viewerNav } from "@/lib/navigation";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import {
    Download,
    Eye,
    EyeOff,
    FileText,
    FolderOpen,
    ArrowLeft,
    X,
    Check,
    Search,
    Calendar,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

import EditTransactionPanel from "@/components/app/super/accountant/EditTransactionPanel";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import AppHeader from "@/components/app/AppHeader";
import DataTableLedge, { InstrumentFilesPopover, VoucherPreviewButton } from "@/components/app/DataTableLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import SharedToolbar from "@/components/app/SharedToolbar";
import { DataTableColumn } from "@/components/app/DataTable";

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
    ownerForLedger: string;
    ownerType: string;
    owner: string;
    particulars: string;
    deposit: number;
    withdrawal: number;
    outsBalance: number;
    transferGroupId: number | null;
    voucherAttachmentUrl: string | null;
    voucherFileType: string | null;
    voucherFileSize: number | null;
    instrumentAttachments: any[];
    fundReference: string | null;
    personInCharge: string | null;
}

const BORDER = "rgba(0,0,0,0.12)";
const ACCENT = "#7a0f1f";

function ArchivalLedgerPage({ role }: { role: "superadmin" | "accountant" | "viewer" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [entriesLoading, setEntriesLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Folder State
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isViewingLedger, setIsViewingLedger] = useState(false);

    // Filter Filter values
    const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
    const [ownerSearch, setOwnerSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [actionModalTx, setActionModalTx] = useState<{ transactionId: number; targetUrl: string; row: any } | null>(null);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);
    const [isFetchingTransaction, setIsFetchingTransaction] = useState(false);
    const { showToast } = useAppToast();

    // Global Owners State
    const [allOwners, setAllOwners] = useState<{ name: string; type: string }[]>([]);
    const [allOwnersLoading, setAllOwnersLoading] = useState(false);

    const fetchAllOwners = useCallback(async () => {
        setAllOwnersLoading(true);
        try {
            const res = await fetch("/api/accountant/maintenance/owners?per_page=all");
            const data = await res.json();
            if (data.success) {
                const list = Array.isArray(data.data) ? data.data : (data.data?.data || []);
                setAllOwners(list.map((o: any) => ({
                    name: o.name,
                    type: o.owner_type || "Account"
                })).sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        } catch (err) {
            console.error("fetchAllOwners failed:", err);
        } finally {
            setAllOwnersLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllOwners();
    }, [fetchAllOwners]);

    // Fetch globally
    const fetchLedger = useCallback(() => {
        setEntriesLoading(true);

        fetch('/api/accountant/ledger/archival?sort=desc')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEntries(data.data.transactions || []);
                    setCurrentPage(1);
                } else {
                    setEntries([]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setEntriesLoading(false));
    }, []);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    // Derived Folder Data
    const foldersByYear = useMemo(() => {
        const folders: Record<string, { year: string, count: number, records: LedgerEntry[] }> = {};

        // Pre-populate specific years from 2024 to 2030 (the default display range)
        for (let y = 2024; y <= 2030; y++) {
            folders[y.toString()] = { year: y.toString(), count: 0, records: [] };
        }

        entries.forEach(entry => {
            // Extract year from voucherDate or fallback createdAt
            let entryYear = "Unknown";
            const dateStr = entry.voucherDate || entry.createdAt;
            if (dateStr && dateStr.length >= 4) {
                // Try to parse year from "M j, Y" (e.g., "Jan 1, 2025") or ISO8601
                if (dateStr.includes(',')) {
                    entryYear = dateStr.split(',')[1].trim().substring(0, 4);
                } else if (dateStr.includes('-')) {
                    entryYear = dateStr.substring(0, 4);
                }
            }
            if (entryYear === "Unknown" || isNaN(Number(entryYear))) {
                entryYear = "Archived";
            }

            if (!folders[entryYear]) {
                folders[entryYear] = { year: entryYear, count: 0, records: [] };
            }
            folders[entryYear].count += 1;
            folders[entryYear].records.push(entry);
        });

        // Sort dynamically (descending years)
        return Object.values(folders).sort((a, b) => {
            if (a.year === "Archived") return 1;
            if (b.year === "Archived") return -1;
            return parseInt(b.year) - parseInt(a.year);
        });
    }, [entries]);

    const availableOwners = useMemo(() => {
        return allOwners;
    }, [allOwners]);

    const ownerColumns = useMemo<DataTableColumn<{ name: string; type: string }>[]>(() => [
        {
            key: "select",
            label: (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (selectedOwners.length === availableOwners.length) setSelectedOwners([]);
                        else setSelectedOwners(availableOwners.map(o => o.name));
                    }}
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer ${selectedOwners.length === availableOwners.length && availableOwners.length > 0
                        ? 'bg-white border-white text-[#7a0f1f]'
                        : 'bg-transparent border-white/40 border-dashed'
                        }`}
                >
                    {selectedOwners.length === availableOwners.length && availableOwners.length > 0 && <Check className="w-2.5 h-2.5" strokeWidth={4} />}
                </div>
            ),
            width: "50px",
            align: "center",
            renderCell: (row) => {
                const isSelected = selectedOwners.includes(row.name);
                return (
                    <div
                        className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-[#7a0f1f] border-[#7a0f1f]' : 'bg-gray-100 border-gray-300'
                            }`}
                    >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                    </div>
                )
            }
        },
        {
            key: "name",
            label: "ACCOUNT NAME",
            sortable: true,
            flex: true,
            renderCell: (row) => <span className="font-black text-[11px] uppercase tracking-tight">{row.name}</span>
        },
        {
            key: "type",
            label: "TYPE",
            sortable: true,
            width: "120px",
            renderCell: (row) => (
                <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${row.type.toLowerCase() === 'bank' ? 'bg-blue-50 text-blue-600' :
                    row.type.toLowerCase() === 'cash' ? 'bg-green-50 text-green-600' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                    {row.type}
                </span>
            )
        }
    ], [selectedOwners, availableOwners]);

    const handleStartExtraction = (year: string) => {
        setSelectedYear(year);
        setShowFilters(true);
        setIsViewingLedger(false);
        // Clear previous filters
        setSelectedOwners([]);
        setStartDate("");
        setEndDate("");
    };

    const handleApplyFilters = () => {
        setIsViewingLedger(true);
        setShowFilters(false);
        setCurrentPage(1);
    };

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
            width: "200px",
            minWidth: "200px",
            maxWidth: "200px",
            sortable: true,
            renderCell: (row) => (
                <VoucherPreviewButton
                    voucherNo={row.voucherNo}
                    attachmentUrl={row.voucherAttachmentUrl}
                    fileType={row.voucherFileType}
                    fileSize={row.voucherFileSize}
                />
            ),
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
                const files: { name: string; url?: string | null; type?: string | null; size?: number | null }[] =
                    (row.instrumentAttachments ?? []).map((a: any) => ({
                        name: a.instrumentNo ?? a.file_name ?? a.name ?? "—",
                        url: a.attachmentUrl ?? a.file_url ?? a.url ?? null,
                        type: a.fileType ?? a.file_type ?? a.mimeType ?? a.mime_type ?? null,
                        size: a.fileSize ?? a.file_size ?? null,
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
            key: "ownerForLedger",
            label: "ACCOUNT",
            align: "center",
            width: "200px",
            minWidth: "200px",
            maxWidth: "200px",
            sortable: true,
            renderCell: (row) => (
                <InfoTooltip text={row.ownerForLedger}>
                    <span className="truncate block font-semibold text-gray-800">{row.ownerForLedger}</span>
                </InfoTooltip>
            ),
        },
        {
            key: "owner",
            label: "COUNTERPARTY",
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
                const routePrefix = role === 'viewer' ? 'viewer/accountant' : (role === 'superadmin' ? 'super/accountant' : 'accountant');
                let targetUrl = `/${routePrefix}/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
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
            label: "DEPOSIT / CR",
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
            label: "WITHDRAWAL / DR",
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
            label: "RUNNING BALANCE",
            align: "right",
            width: "160px",
            minWidth: "160px",
            maxWidth: "160px",
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
    ], [showExtraColumns, role, router]);

    // Apply specific year filter first
    let activeEntries = useMemo(() => {
        if (!selectedYear) return entries;
        let yearRecords = foldersByYear.find(f => f.year === selectedYear)?.records || [];

        // Filter by selected owners
        if (selectedOwners.length > 0) {
            yearRecords = yearRecords.filter(r => selectedOwners.includes(r.ownerForLedger));
        }

        // Filter by Date Range
        if (startDate || endDate) {
            yearRecords = yearRecords.filter(r => {
                const dateVal = r.voucherDate || r.createdAt;
                if (!dateVal) return true;

                // Simple string comparison for dates usually works if they are ISO or predictably formatted
                // In our case they are "M d, Y", so we might need better parsing or just let it be for now
                if (startDate && dateVal < startDate) return false;
                if (endDate && dateVal > endDate) return false;
                return true;
            });
        }

        return yearRecords;
    }, [entries, selectedYear, foldersByYear, selectedOwners, startDate, endDate]);

    const filteredEntries = React.useMemo(() => {
        if (!query.trim()) return activeEntries;
        const lowerQuery = query.toLowerCase();
        return activeEntries.filter(e =>
            (e.particulars && e.particulars.toLowerCase().includes(lowerQuery)) ||
            (e.transType && e.transType.toLowerCase().includes(lowerQuery)) ||
            (e.voucherNo && e.voucherNo.toLowerCase().includes(lowerQuery)) ||
            (e.owner && e.owner.toLowerCase().includes(lowerQuery)) ||
            (e.ownerForLedger && e.ownerForLedger.toLowerCase().includes(lowerQuery)) ||
            (String(e.id).includes(lowerQuery))
        );
    }, [activeEntries, query]);

    const PER_PAGE = 25;
    const totalRecords = filteredEntries.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
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

    const exportYearData = (year: string) => {
        showToast("Success", `Beginning download for year ${year}`, "success");
        // In a real implementation: Trigger CSV generation
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col overflow-x-hidden">
            <AppHeader
                navigation={[]}
                title="Archival Ledger"
                subtitle={
                    isViewingLedger
                        ? `Viewing ${selectedYear} Records`
                        : showFilters
                            ? `Select Records from ${selectedYear}`
                            : "View and retrieve completely global ledger information organized by year."
                }
                primaryAction={
                    isViewingLedger ? (
                        <button
                            onClick={() => exportYearData(selectedYear!)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download {selectedYear}
                        </button>
                    ) : null
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full relative min-h-[600px]">
                <AnimatePresence mode="wait">

                    {selectedYear && showFilters && (
                        <motion.section
                            key="filters"
                            initial={{ opacity: 0, scale: 0.98, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="w-full space-y-8 pb-12"
                        >
                            <div className="flex flex-col lg:flex-row gap-12 items-start">
                                {/* LEFT: SELECTED FOLDER VISUAL */}
                                <div className="w-full lg:w-80 flex-shrink-0 flex flex-col items-center lg:items-start gap-6">
                                    <div className="w-full">
                                        <button
                                            onClick={() => {
                                                setSelectedYear(null);
                                                setShowFilters(false);
                                            }}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#7a0f1f] transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 mb-6"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> Back to Archives
                                        </button>

                                        <div className="group relative w-full h-64 scale-100 lg:scale-110 origin-top-left" style={{ perspective: "1500px" }}>
                                            {/* Folder Tab */}
                                            <div className="absolute top-0 left-0 w-1/3 h-8 bg-[#5f0c18] rounded-t-xl z-0" />
                                            <div className="absolute top-0 left-[calc(33.333%-12px)] w-8 h-8 bg-[#5f0c18] transform skew-x-[30deg] rounded-tr border-r border-[#4a0912]/20 z-0" />
                                            <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] bg-[#5f0c18] rounded-xl rounded-tl-none shadow-inner z-0" />

                                            {/* Papers inside */}
                                            <div className="absolute top-10 left-4 right-4 h-40 bg-white rounded-md flex flex-col items-center justify-center border border-gray-200 shadow-[0_5px_15px_rgba(0,0,0,0.05)] z-10 -translate-y-8 rotate-1">
                                                <div className="absolute top-3 left-4 right-4 h-1.5 bg-gray-100 rounded-full" />
                                                <div className="absolute top-7 left-4 right-12 h-1.5 bg-gray-100 rounded-full" />
                                                <h3 className="text-5xl font-black text-[#5f0c18] tracking-tighter mt-4">{selectedYear}</h3>
                                            </div>

                                            {/* Front Flap */}
                                            <div className="absolute bottom-0 left-0 w-full h-[68%] bg-gradient-to-br from-[#9c1328] to-[#5f0c18] rounded-xl shadow-[0_-5px_15px_rgba(0,0,0,0.4)] border-t border-white/20 border-l border-white/10 flex flex-col justify-end p-5 z-20 origin-bottom" style={{ transform: "rotateX(5deg)" }}>
                                                <div className="flex items-end justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                                            <FolderOpen className="w-5 h-5 text-white/90" />
                                                        </div>
                                                        <span className="text-white font-bold text-lg tracking-wide">{selectedYear} Archive</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* RIGHT: EXTRACTION FORM */}
                                <div className="flex-1 w-full space-y-6">
                                    <div className="mb-4">
                                        <h2 className="text-3xl font-black text-[#5f0c18] uppercase tracking-tight">Extraction Configuration</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="h-px flex-1 bg-gray-200" />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{selectedYear} REPOSITORY</span>
                                            <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* ACCOUNT OWNERS SECTION */}
                                        <div className="space-y-6">
                                            <div className="rounded-xl border bg-white shadow-sm relative" style={{ borderColor: BORDER }}>
                                                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/60 rounded-t-xl" style={{ borderColor: BORDER }}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[#7a0f1f]"><Search className="w-4 h-4" /></span>
                                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Account Owners</h3>
                                                    </div>
                                                </div>
                                                <div className="px-6 py-5 space-y-4">
                                                    <div className="relative group/search">
                                                        <input
                                                            type="text"
                                                            placeholder="Search owners..."
                                                            value={ownerSearch}
                                                            onChange={(e) => setOwnerSearch(e.target.value)}
                                                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                                                        />
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-[#7a0f1f] transition-colors" />
                                                    </div>

                                                    <DataTableLedge
                                                        columns={ownerColumns}
                                                        rows={availableOwners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase()))}
                                                        loading={allOwnersLoading}
                                                        onRowClick={(row) => {
                                                            if (selectedOwners.includes(row.name)) setSelectedOwners(selectedOwners.filter(i => i !== row.name));
                                                            else setSelectedOwners([...selectedOwners, row.name]);
                                                        }}
                                                        isRowSelected={(row) => selectedOwners.includes(row.name)}
                                                        emptyTitle="No owners found"
                                                        emptyDescription="No matching account owners in this archive."
                                                        itemName="owners"
                                                        maxHeight="600px"
                                                        pagination={{
                                                            current_page: 1,
                                                            last_page: 1,
                                                            per_page: availableOwners.length,
                                                            total: availableOwners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).length,
                                                            from: availableOwners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).length > 0 ? 1 : 0,
                                                            to: availableOwners.filter(o => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).length,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DATE RANGE SECTION */}
                                        <div className="space-y-6">
                                            <div className="rounded-xl border bg-white shadow-sm relative" style={{ borderColor: BORDER }}>
                                                <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50/60 rounded-t-xl" style={{ borderColor: BORDER }}>
                                                    <span className="text-[#7a0f1f]"><Calendar className="w-4 h-4" /></span>
                                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Date Range</h3>
                                                </div>
                                                <div className="px-6 py-5 space-y-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Start Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                                            <input
                                                                type="date"
                                                                value={startDate}
                                                                onChange={(e) => setStartDate(e.target.value)}
                                                                className="w-full h-10 rounded-lg border border-gray-300 text-sm font-bold text-gray-900 bg-white px-3 pl-10 focus:outline-none focus:border-[#7a0f1f] focus:ring-2 focus:ring-[#7a0f1f]/20 transition-all uppercase"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">End Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                                            <input
                                                                type="date"
                                                                value={endDate}
                                                                onChange={(e) => setEndDate(e.target.value)}
                                                                className="w-full h-10 rounded-lg border border-gray-300 text-sm font-bold text-gray-900 bg-white px-3 pl-10 focus:outline-none focus:border-[#7a0f1f] focus:ring-2 focus:ring-[#7a0f1f]/20 transition-all uppercase"
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <button
                                                onClick={handleApplyFilters}
                                                className="w-full h-16 bg-[#7a0f1f] text-white rounded-xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#8e1124] hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group active:scale-95"
                                            >
                                                Proceed to Ledger
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* STEP 1: FOLDER GRID (Now shown below if filters are active) */}
                    {(!selectedYear || showFilters) && (
                        <motion.section
                            key="folders"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={selectedYear ? "mt-20 border-t border-gray-200 pt-12" : ""}
                        >
                            <h2 className="text-xl font-bold text-[#5f0c18] mb-6">
                                {selectedYear ? "Switch Archive Year" : "Archive Folders"}
                            </h2>
                            {entriesLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 pb-10 pt-4 px-2">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="relative w-full h-64 animate-pulse">
                                            {/* Skeleton Folder Visual */}
                                            <div className="absolute top-0 left-0 w-1/3 h-8 bg-gray-200 rounded-t-xl" />
                                            <div className="absolute top-0 left-[calc(33.333%-12px)] w-8 h-8 bg-gray-200 transform skew-x-[30deg] rounded-tr" />
                                            <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] bg-gray-100 rounded-xl rounded-tl-none shadow-sm" />
                                            <div className="absolute bottom-5 left-5 right-5 h-12 bg-gray-200/50 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 pb-10 pt-4 px-2">
                                    {foldersByYear.map((folder) => (
                                        <div
                                            key={folder.year}
                                            onClick={() => handleStartExtraction(folder.year)}
                                            className="group relative w-full h-64 cursor-pointer mt-4"
                                            style={{ perspective: "1500px" }}
                                        >
                                            {/* Folder Tab */}
                                            <div className="absolute top-0 left-0 w-1/3 h-8 bg-[#5f0c18] rounded-t-xl transition-colors duration-300 group-hover:bg-[#4a0912] shadow-sm z-0" />
                                            <div className="absolute top-0 left-[calc(33.333%-12px)] w-8 h-8 bg-[#5f0c18] transform skew-x-[30deg] rounded-tr border-r border-[#4a0912]/20 transition-colors duration-300 group-hover:bg-[#4a0912] z-0" />
                                            <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] bg-[#5f0c18] rounded-xl rounded-tl-none shadow-inner transition-colors duration-300 group-hover:bg-[#4a0912] z-0" />

                                            {/* Papers inside */}
                                            <div
                                                className="absolute top-10 left-4 right-4 h-40 bg-white rounded-md flex flex-col items-center justify-center border border-gray-200 transition-all duration-500 ease-out group-hover:-translate-y-12 group-hover:rotate-1 shadow-[0_5px_15px_rgba(0,0,0,0.05)] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] z-10"
                                            >
                                                <div className="absolute top-3 left-4 right-4 h-1.5 bg-gray-100 rounded-full" />
                                                <div className="absolute top-7 left-4 right-12 h-1.5 bg-gray-100 rounded-full" />
                                                <div className="absolute top-11 left-4 right-8 h-1.5 bg-gray-100 rounded-full" />
                                                <h3 className="text-5xl font-black text-[#5f0c18] tracking-tighter drop-shadow-sm mt-4">{folder.year}</h3>
                                                <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">{folder.count.toLocaleString()} ENTRIES</p>
                                            </div>

                                            {/* Front Flap */}
                                            <div
                                                className="absolute bottom-0 left-0 w-full h-[68%] bg-gradient-to-br from-[#9c1328] to-[#5f0c18] rounded-xl shadow-[0_-5px_15px_rgba(0,0,0,0.4)] border-t border-white/20 border-l border-white/10 flex flex-col justify-end p-5 transition-transform duration-500 ease-out z-20 origin-bottom"
                                                style={{ transform: "rotateX(5deg)" }}
                                            >
                                                <div className="flex items-end justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                                                            <FolderOpen className="w-6 h-6 text-white/90 drop-shadow-md" />
                                                        </div>
                                                        <span className="text-white font-bold text-xl tracking-wide drop-shadow-md">
                                                            {folder.year} Archive
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            exportYearData(folder.year);
                                                        }}
                                                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-[#7a0f1f] flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.2)] border border-white/20 hover:scale-110 z-30"
                                                        title={`Download ${folder.year}`}
                                                    >
                                                        <Download className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    )}

                    {/* STEP 3: DRILLED DOWN FOLDER VIEW (DATATABLE) */}
                    {selectedYear && isViewingLedger && (
                        <motion.section
                            key="ledger"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-xl bg-white p-6 shadow-xl border border-gray-200 animate-in fade-in duration-300"
                        >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                                <div>
                                    <button
                                        onClick={() => {
                                            setIsViewingLedger(false);
                                            setShowFilters(true);
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-black text-[#7a0f1f] hover:text-[#5f0c18] transition-colors mb-3 uppercase tracking-tighter"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Filters
                                    </button>
                                    <h2 className="text-2xl font-black text-[#5f0c18] flex items-center gap-3 italic uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-lg bg-[#5f0c18]/10 flex items-center justify-center">
                                            <FolderOpen className="w-6 h-6 text-[#5f0c18]" />
                                        </div>
                                        {selectedYear} Archived Records
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {selectedOwners.length > 0 ? (
                                            <p className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-flex items-center gap-1 uppercase tracking-widest">
                                                Filtering for: <span className="text-[#7a0f1f]">{selectedOwners.length} owners</span>
                                            </p>
                                        ) : (
                                            <p className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded inline-flex items-center gap-1 uppercase tracking-widest">
                                                Displaying <span className="text-[#7a0f1f]">ALL OWNERS</span>
                                            </p>
                                        )}
                                        {startDate && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">From {startDate}</span>}
                                        {endDate && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">To {endDate}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowExtraColumns(!showExtraColumns)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors uppercase tracking-widest"
                                    >
                                        {showExtraColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {showExtraColumns ? "Less Info" : "More Info"}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <SharedToolbar
                                    searchQuery={query}
                                    onSearchChange={(val: string) => setQuery(val)}
                                    searchPlaceholder={`Search through the extracted ${selectedYear} files...`}
                                    onRefresh={fetchLedger}
                                    containerMaxWidth="max-w-full"
                                />
                            </div>

                            <div className="mt-8">
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
                                        const routePrefix = role === 'viewer' ? 'viewer/accountant' : (role === 'superadmin' ? 'super/accountant' : 'accountant');
                                        let targetUrl = `/${routePrefix}/ledger/${destinationLedgerType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
                                        if (row.otherUnitId) {
                                            targetUrl += `&targetUnitId=${row.otherUnitId}`;
                                        }
                                        setActionModalTx({ transactionId: row.transactionId, targetUrl, row });
                                    }}
                                />
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {actionModalTx && role !== "viewer" && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full outline-none p-8 relative border border-gray-100"
                    >
                        <button
                            onClick={() => setActionModalTx(null)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-black text-[#5f0c18] mb-2 uppercase italic tracking-tight underline underline-offset-4 decoration-[#5f0c18]/20">Transaction Actions</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium italic">Manage record #<span className="font-black text-[#5f0c18]">{actionModalTx.transactionId}</span></p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={async () => {
                                    const txId = actionModalTx.transactionId;
                                    setIsFetchingTransaction(true);
                                    try {
                                        const res = await fetch(`/api/accountant/transactions/${txId}`);
                                        const data = await res.json();
                                        if (data.success) {
                                            setTransactionToEdit(data.data);
                                            setShowEditPanel(true);
                                            setActionModalTx(null);
                                        } else {
                                            showToast("Error", data.message || "Failed to load transaction data.", "error");
                                        }
                                    } catch (err: any) {
                                        showToast("Error", err.message || "An error occurred.", "error");
                                    } finally {
                                        setIsFetchingTransaction(false);
                                    }
                                }}
                                disabled={isFetchingTransaction}
                                className="w-full py-4 px-4 bg-[#7a0f1f] hover:bg-[#8e1124] text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_10px_15px_rgba(122,15,31,0.15)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                            >
                                {isFetchingTransaction ? "Searching..." : "Open Edit Record"}
                            </button>
                            <button
                                onClick={() => {
                                    router.push(actionModalTx.targetUrl);
                                    setActionModalTx(null);
                                }}
                                disabled={isFetchingTransaction}
                                className="w-full py-4 px-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center"
                            >
                                Source Ledger
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showEditPanel && (
                <EditTransactionPanel
                    open={showEditPanel}
                    transaction={transactionToEdit}
                    onClose={() => {
                        setShowEditPanel(false);
                        setTransactionToEdit(null);
                    }}
                    onSaved={() => {
                        fetchLedger();
                    }}
                />
            )}
        </div>
    );
}

export default function LedgerArchivalShared({ role }: { role: "superadmin" | "accountant" | "viewer" }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <div className="flex h-screen overflow-hidden bg-white">
                <main className="flex-1 overflow-y-auto w-full">
                    <ArchivalLedgerPage role={role} />
                </main>
            </div>
        </Suspense>
    );
}
