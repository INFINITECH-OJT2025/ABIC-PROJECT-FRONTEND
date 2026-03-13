"use client";
import { superAdminNav, accountantNav } from "@/lib/navigation";
;


import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
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
    FileText,
    CheckSquare,
    X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EditTransactionPanel from "@/components/app/super/accountant/EditTransactionPanel";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import ConfirmationModal from "@/components/app/ConfirmationModal";

export type OwnerType = "COMPANY" | "CLIENT" | "MAIN" | "SYSTEM";
import AppHeader from "@/components/app/AppHeader";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import DataTableLedge, { InstrumentFilesPopover, VoucherPreviewButton } from "@/components/app/DataTableLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import SharedToolbar from "@/components/app/SharedToolbar";

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
    voucherFileType: string | null;
    voucherFileSize: number | null;
    instrumentAttachments: any[];
    fundReference: string | null;
    personInCharge: string | null;
}

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
                    {loading ? "Loading owners..." : (selectedOwner?.name ?? "Select Owner...")}
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
                    {selectedUnit ? selectedUnit.unit_name : "Main Owner (All Units)"}
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
                            Main Owner (All Units)
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

function MainLedgerPage({ role }: { role: "superadmin" | "accountant" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");
    const initialOwnerId = searchParams.get('owner_id');

    // Component State
    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(true);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | number | null>(null);

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [runningBalance, setRunningBalance] = useState<number>(0);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [showExportConfirm, setShowExportConfirm] = useState(false);

    // Filter/Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    const handleExport = () => {
        if (!entries || entries.length === 0) {
            showToast("Info", "No data to export.", "info");
            return;
        }

        import("xlsx-js-style").then((m) => {
            const XLSX = m.default || m;
            const currentOwnerName = owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Owner";
            const sanitizedName = currentOwnerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            const runningBalanceVal = runningBalance;

            const ws = XLSX.utils.json_to_sheet([]);

            // Add the Title section
            XLSX.utils.sheet_add_aoa(ws, [
                ["ABIC REALTY & CONSULTANCY CORPORATION 2025"],
                [currentOwnerName.toUpperCase()],
                [], // Spacer
            ], { origin: "A1" });

            // Add the Balances to the right (Columns G and H)
            XLSX.utils.sheet_add_aoa(ws, [
                ["OPENING BALANCE", "RUNNING BALANCE"],
                [openingBalance || 0, runningBalanceVal]
            ], { origin: "G1" });

            // Build rows one-by-one, expanding rows for multiple instrument attachments
            const baseUrl = window.location.origin;
            const allRows: any[][] = [];
            const hyperlinkCells: { r: number; c: number; url: string; text: string }[] = [];
            const dynMerges: any[] = [];

            // Header row at index 0 in allRows (will be placed at Excel row 5, 0-indexed row 4)
            allRows.push(["DATE", "VOUCHER NO.", "TRANS TYPE", "OWNER", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"]);

            const rowTxMap: Record<number, number> = {};

            let exportRunningBalance = openingBalance || 0;

            entries.forEach((entry, txIndex) => {
                const mainRowIdx = allRows.length; // index within allRows
                rowTxMap[mainRowIdx + 4] = txIndex;

                const depVal = Number(entry.deposit) || 0;
                const wthVal = Number(entry.withdrawal) || 0;
                exportRunningBalance += depVal - wthVal;

                // Main data row
                allRows.push([
                    entry.voucherDate,
                    entry.voucherNo,
                    entry.transType,
                    entry.owner,
                    entry.particulars,
                    depVal > 0 ? depVal : "",
                    wthVal > 0 ? wthVal : "",
                    exportRunningBalance,
                    entry.fundReference || "-",
                    entry.personInCharge || "-"
                ]);

                // Voucher No. hyperlink (column B)
                if (entry.voucherAttachmentUrl) {
                    const fullUrl = entry.voucherAttachmentUrl.startsWith("http") ? entry.voucherAttachmentUrl : `${baseUrl}${entry.voucherAttachmentUrl}`;
                    hyperlinkCells.push({ r: mainRowIdx + 4, c: 1, url: fullUrl, text: entry.voucherNo || "—" });
                }

                // Trans Type — handle instrument attachments
                const instrumentFiles = entry.instrumentAttachments ?? [];
                if (instrumentFiles.length > 0) {
                    // First file — replace trans type text and add direct hyperlink
                    const firstFile = instrumentFiles[0];
                    const firstName = firstFile.instrumentNo ?? firstFile.file_name ?? firstFile.name ?? "—";
                    const firstUrl = firstFile.attachmentUrl ?? firstFile.file_url ?? firstFile.url ?? null;
                    allRows[mainRowIdx][2] = firstName;
                    if (firstUrl) {
                        const fullUrl = firstUrl.startsWith("http") ? firstUrl : `${baseUrl}${firstUrl}`;
                        hyperlinkCells.push({ r: mainRowIdx + 4, c: 2, url: fullUrl, text: firstName });
                    }

                    // Additional files — each gets its own sub-row with its own direct hyperlink
                    for (let fi = 1; fi < instrumentFiles.length; fi++) {
                        const file = instrumentFiles[fi];
                        const fileName = file.instrumentNo ?? file.file_name ?? file.name ?? "—";
                        const fileUrl = file.attachmentUrl ?? file.file_url ?? file.url ?? null;
                        const subRowIdx = allRows.length;
                        rowTxMap[subRowIdx + 4] = txIndex;
                        allRows.push(["", "", fileName, "", "", "", "", "", "", ""]);
                        if (fileUrl) {
                            const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${baseUrl}${fileUrl}`;
                            hyperlinkCells.push({ r: subRowIdx + 4, c: 2, url: fullUrl, text: fileName });
                        }
                    }

                    if (instrumentFiles.length > 1) {
                        const startR = mainRowIdx + 4;
                        const endR = startR + instrumentFiles.length - 1;
                        [0, 1, 3, 4, 5, 6, 7, 8, 9].forEach(col => {
                            dynMerges.push({ s: { r: startR, c: col }, e: { r: endR, c: col } });
                        });
                    }
                }
            });

            // Write all rows starting at A5
            XLSX.utils.sheet_add_aoa(ws, allRows, { origin: "A5" });

            // Apply HYPERLINK formulas (each is a simple direct URL — no long gallery URLs)
            hyperlinkCells.forEach(({ r, c, url, text }) => {
                const cellAddr = XLSX.utils.encode_cell({ r, c });
                const safeUrl = url.replace(/"/g, '""');
                const safeText = String(text).replace(/"/g, '""');
                ws[cellAddr] = {
                    t: 'str',
                    f: `HYPERLINK("${safeUrl}","${safeText}")`,
                    s: {
                        font: { bold: true, color: { rgb: "0563C1" }, underline: true },
                        alignment: { vertical: "center" },
                        protection: { locked: true }
                    }
                };
            });

            // Define styling
            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "7A0F1F" } }, // Maroon
                alignment: { horizontal: "center", vertical: "center" }
            };

            const dataStyle = {
                alignment: { vertical: "center" }
            };

            const numStyle = {
                alignment: { horizontal: "right", vertical: "center" },
                numFmt: "#,##0.00"
            };

            const titleStyle = {
                font: { bold: true, sz: 14, color: { rgb: "7A0F1F" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            const subtitleStyle = {
                font: { bold: true, color: { rgb: "666666" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            const balanceLabelStyle = {
                font: { bold: true, sz: 10, color: { rgb: "888888" } },
                alignment: { horizontal: "right", vertical: "center" }
            };

            const balanceNumStyle = {
                font: { bold: true, sz: 12, color: { rgb: "7A0F1F" } },
                alignment: { horizontal: "right", vertical: "center" },
                numFmt: "#,##0.00"
            };

            // Set Column Widths
            ws['!cols'] = [
                { wch: 15 }, // A: DATE
                { wch: 20 }, // B: VOUCHER NO
                { wch: 25 }, // C: TRANS TYPE (increased from 15)
                { wch: 35 }, // D: OWNER (increased from 25)
                { wch: 80 }, // E: PARTICULARS (increased from 60)
                { wch: 18 }, // F: DEPOSIT
                { wch: 18 }, // G: WITHDRAWAL
                { wch: 20 }, // H: OUTS BALANCE
                { wch: 30 }, // I: FUND REFERENCES (increased from 20)
                { wch: 30 }, // J: PERSON IN CHARGE (increased from 20)
            ];

            // Merge cells for Title and Subtitle so they don't clip
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // ABIC REALTY...
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Owner name
                ...dynMerges
            ];

            const range = XLSX.utils.decode_range(ws['!ref'] || "A1:J10");

            // Apply styles
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    if (R === 0 && C === 0) {
                        ws[cellAddress].s = titleStyle;
                    } else if (R === 1 && C === 0) {
                        ws[cellAddress].s = subtitleStyle;
                    } else if (R === 0 && (C === 6 || C === 7)) { // G1, H1: Balance Labels
                        ws[cellAddress].s = balanceLabelStyle;
                    } else if (R === 1 && (C === 6 || C === 7)) { // G2, H2: Balance Nums
                        ws[cellAddress].s = balanceNumStyle;
                        if (!isNaN(Number(ws[cellAddress].v))) {
                            ws[cellAddress].t = "n"; // Force number formatting
                        }
                    } else if (R === 4) { // Table Header (index 4 is Row 5)
                        if (ws[cellAddress].v) ws[cellAddress].s = headerStyle;
                    } else if (R > 4) { // Table Data
                        const txIndex = rowTxMap[R];
                        const isStriped = txIndex !== undefined && txIndex % 2 === 1;
                        const rowFill = isStriped ? { fill: { fgColor: { rgb: "FFE4E8" } } } : {};

                        if (ws[cellAddress].f && String(ws[cellAddress].f).startsWith("HYPERLINK")) {
                            if (isStriped) ws[cellAddress].s = { ...ws[cellAddress].s, ...rowFill };
                            continue;
                        }

                        // Deposit, Withdrawal, Outs Balance are cols 5, 6, 7 (F, G, H)
                        if (C >= 5 && C <= 7) {
                            ws[cellAddress].s = { ...numStyle, ...rowFill };
                            if (ws[cellAddress].v !== "" && !isNaN(Number(ws[cellAddress].v))) {
                                ws[cellAddress].t = "n"; // Force number formatting
                            }
                        } else {
                            ws[cellAddress].s = { ...dataStyle, ...rowFill };
                        }
                    }
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ledger");

            XLSX.writeFile(wb, `${sanitizedName}_ledger.xlsx`);
        });
    };

    // API Fetches
    useEffect(() => {
        setOwnersLoading(true);
        fetch('/api/accountant/maintenance/owners?per_page=all')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const rawData = Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []);
                    const mains = rawData.filter((o: Owner) => o.owner_type === "MAIN");
                    setOwners(mains);
                    if (initialOwnerId) {
                        const exists = mains.find((o: Owner) => String(o.id) === initialOwnerId);
                        if (exists) setSelectedOwnerId(initialOwnerId);
                        else if (mains.length > 0) setSelectedOwnerId(mains[0].id);
                    } else if (mains.length > 0) {
                        setSelectedOwnerId(mains[0].id);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setOwnersLoading(false));
    }, [initialOwnerId]);

    // Add new states for action modal and edit panel
    const [actionModalTx, setActionModalTx] = useState<{ transactionId: number; targetUrl: string; row: any } | null>(null);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);
    const [isFetchingTransaction, setIsFetchingTransaction] = useState(false);
    const { showToast } = useAppToast();

    // Data Fetching Hooks
    const fetchLedger = useCallback(() => {
        if (!selectedOwnerId) return;
        setEntriesLoading(true);

        // Fetching oldest first as requested
        let url = `/api/accountant/ledger/mains?owner_id=${selectedOwnerId}&sort=oldest`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setEntries(data.data.transactions || []);
                    setOpeningBalance(data.data.openingBalance || 0);
                    setRunningBalance(data.data.runningBalance || 0);
                    setCurrentPage(1); // Reset to page 1 on new fetch
                } else {
                    setEntries([]);
                    setOpeningBalance(0);
                    setRunningBalance(0);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setEntriesLoading(false));
    }, [selectedOwnerId]);

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
                let targetUrl = `/${role === "superadmin" ? "super/accountant" : "accountant"}/ledger/${destType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
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

    // Compute virtual outsBalance for each row from openingBalance + cumulative deposits/withdrawals
    const entriesWithBalance = useMemo(() => {
        let balance = 0;
        return entries.map(e => {
            balance = balance + e.deposit - e.withdrawal;
            return { ...e, outsBalance: balance };
        });
    }, [entries]);

    const filteredEntries = useMemo(() => {
        if (!query.trim()) return entriesWithBalance;
        const lowerQuery = query.toLowerCase();
        return entriesWithBalance.filter(e =>
            (e.particulars && e.particulars.toLowerCase().includes(lowerQuery)) ||
            (e.transType && e.transType.toLowerCase().includes(lowerQuery)) ||
            (e.voucherNo && e.voucherNo.toLowerCase().includes(lowerQuery)) ||
            (e.owner && e.owner.toLowerCase().includes(lowerQuery)) ||
            (String(e.id).includes(lowerQuery))
        );
    }, [entriesWithBalance, query]);

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
            <ConfirmationModal
                open={showExportConfirm}
                title="Export Main Ledger"
                message="This will download the ledger data for the selected owner as an Excel file. Continue?"
                confirmLabel="Export"
                icon={Download}
                color="#7a0f1f"
                onCancel={() => setShowExportConfirm(false)}
                onConfirm={() => { setShowExportConfirm(false); handleExport(); }}
            />
            {/* AppHeader Component */}
            <AppHeader
                navigation={[]}
                title="Main Owner Ledger"
                subtitle="View transaction history and running balances for main owners."
                primaryAction={
                    <button
                        onClick={() => setShowExportConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
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
                            {/* Main Owner Filter - Searchable Dropdown */}
                            <OwnerSelectDropdown
                                owners={owners}
                                selectedId={selectedOwnerId}
                                onChange={setSelectedOwnerId}
                                loading={ownersLoading}
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
                                    {ownersLoading ? "Loading..." : (owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Select Owner")}
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
                                        {entriesLoading ? "..." : `₱${runningBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
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
                                let targetUrl = `/${role === "superadmin" ? "super/accountant" : "accountant"}/ledger/${destinationLedgerType}?targetOwnerId=${row.otherOwnerId}&highlightTx=${row.transactionId}`;
                                if (row.otherUnitId) {
                                    targetUrl += `&targetUnitId=${row.otherUnitId}`;
                                }
                                setActionModalTx({ transactionId: row.transactionId, targetUrl, row });
                            }}
                        />
                    </div>
                </section>
            </div>

            {/* Transaction Action Modal */}
            {actionModalTx && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full outline-none transform transition-all p-6 relative">
                        <button
                            onClick={() => setActionModalTx(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Transaction Action</h3>
                        <p className="text-sm text-gray-600 mb-6">Choose an action for Transaction #{actionModalTx.transactionId}.</p>
                        <div className="flex flex-col gap-3">
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
                                className="w-full py-2.5 px-4 bg-[#7a0f1f] hover:bg-[#8e1124] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isFetchingTransaction ? "Loading..." : "Edit Transaction"}
                            </button>
                            <button
                                onClick={() => {
                                    router.push(actionModalTx.targetUrl);
                                    setActionModalTx(null);
                                }}
                                disabled={isFetchingTransaction}
                                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors flex items-center justify-center"
                            >
                                Go to Ledger List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Transaction Panel */}
            <EditTransactionPanel
                open={showEditPanel}
                transaction={transactionToEdit}
                onClose={() => {
                    setShowEditPanel(false);
                    setTransactionToEdit(null);
                }}
                onSaved={() => {
                    fetchLedger(); // Refresh our ledger after edit
                }}
            />

        </div>
    );
}

export default function LedgerMainShared({ role }: { role: "superadmin" | "accountant" }) {
    const navigation = role === "superadmin" ? superAdminNav : accountantNav;
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <MainLedgerPage role={role} />
        </Suspense>
    );
}
