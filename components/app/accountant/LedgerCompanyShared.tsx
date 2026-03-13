"use client";
import { superAdminNav, accountantNav } from "@/lib/navigation";
;


import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import {
    Building2,
    ChevronDown,
    Download,
    Eye,
    EyeOff,
    Search,
    FileText,
    ChevronRight,
    Loader2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import AppHeader from "@/components/app/AppHeader";
import DataTableLedge, { InstrumentFilesPopover, VoucherPreviewButton } from "@/components/app/DataTableLedge";
import InfoTooltip from "@/components/app/InfoTooltip";
import { Skeleton } from "@/components/ui/skeleton";
import SharedToolbar from "@/components/app/SharedToolbar";
import { DataTableColumn } from "@/components/app/DataTable";
import UnitBudgetsView, { BudgetSelectDropdown, UnitBudget } from "@/components/app/accountant/UnitBudgetsView";
import { useAppToast } from "@/components/app/toast/AppToastProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ConfirmationModal from "@/components/app/ConfirmationModal";

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
                    {loading ? "Loading companies..." : (selectedOwner?.name ?? "Select Company...")}
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
                            placeholder="Search company..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredOwners.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No companies found</div>
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
                    {selectedUnit ? selectedUnit.unit_name : "Company"}
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
                            Company
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

function CompanyLedgerPage({ role }: { role: "superadmin" | "accountant" }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightTx = searchParams.get("highlightTx");
    const [initialOwnerId] = useState(searchParams.get("targetOwnerId"));
    const [initialUnitId] = useState(searchParams.get("targetUnitId"));

    const [activeTab, setActiveTab] = useState<"MAIN_LEDGER" | "UNIT_BUDGETS">("MAIN_LEDGER");

    // Component State
    const [owners, setOwners] = useState<Owner[]>([]);
    const [ownersLoading, setOwnersLoading] = useState(true);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | number | null>(null);

    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | number>("ALL");

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [runningBalance, setRunningBalance] = useState<number>(0);
    const [entriesLoading, setEntriesLoading] = useState(false);

    const [budgets, setBudgets] = useState<UnitBudget[]>([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
    const [budgetsLoading, setBudgetsLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [showExtraColumns, setShowExtraColumns] = useState(false);

    // Filter/Pagination states
    const [currentPage, setCurrentPage] = useState(1);

    const { showToast } = useAppToast();

    // Export States
    const [exportingBudgets, setExportingBudgets] = useState(false);
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [pendingExportType, setPendingExportType] = useState<"main" | "budgets" | null>(null);

    const exportMainLedger = () => {
        if (!entries || entries.length === 0) {
            showToast("Info", "No data to export.", "info");
            return;
        }

        import("xlsx-js-style").then((m) => {
            const XLSX = m.default || m;
            const currentOwnerName = owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Company";
            const currentUnitName = selectedUnitId !== "ALL" ? units.find((u) => String(u.id) === String(selectedUnitId))?.unit_name : null;
            const sanitizedName = (currentOwnerName + (currentUnitName ? `_${currentUnitName}` : "")).replace(/[^a-z0-9]/gi, '_').toLowerCase();

            const runningBalanceVal = runningBalance;
            const ws = XLSX.utils.json_to_sheet([]);

            XLSX.utils.sheet_add_aoa(ws, [
                ["ABIC REALTY & CONSULTANCY CORPORATION 2025"],
                [(currentOwnerName.toUpperCase() + (selectedUnitId !== "ALL" ? ` - ${units.find((u) => String(u.id) === String(selectedUnitId))?.unit_name}` : ""))],
                [], // Spacer
            ], { origin: "A1" });

            XLSX.utils.sheet_add_aoa(ws, [
                ["OPENING BALANCE", "RUNNING BALANCE"],
                [openingBalance || 0, runningBalanceVal]
            ], { origin: "G1" });

            const baseUrl = window.location.origin;
            const allRows: any[][] = [];
            const hyperlinkCells: { r: number; c: number; url: string; text: string }[] = [];
            const dynMerges: any[] = [];

            // Header row
            allRows.push(["DATE", "VOUCHER NO.", "TRANS TYPE", "ACCOUNT SOURCE", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"]);

            const rowTxMap: Record<number, number> = {};

            entries.forEach((entry, txIndex) => {
                const mainRowIdx = allRows.length;
                rowTxMap[mainRowIdx + 4] = txIndex;

                // Main data row
                allRows.push([
                    entry.voucherDate,
                    entry.voucherNo,
                    entry.transType,
                    entry.owner,
                    entry.particulars,
                    entry.deposit > 0 ? entry.deposit : "",
                    entry.withdrawal > 0 ? entry.withdrawal : "",
                    entry.outsBalance,
                    entry.fundReference || "-",
                    entry.personInCharge || "-"
                ]);

                // Voucher No. hyperlink
                if (entry.voucherAttachmentUrl) {
                    const fullUrl = entry.voucherAttachmentUrl.startsWith("http") ? entry.voucherAttachmentUrl : `${baseUrl}${entry.voucherAttachmentUrl}`;
                    hyperlinkCells.push({ r: mainRowIdx + 4, c: 1, url: fullUrl, text: entry.voucherNo || "—" });
                }

                // Trans Type — handle instrument attachments
                const instrumentFiles = entry.instrumentAttachments ?? [];
                if (instrumentFiles.length > 0) {
                    const firstFile = instrumentFiles[0];
                    const firstName = firstFile.instrumentNo ?? firstFile.file_name ?? firstFile.name ?? "—";
                    const firstUrl = firstFile.attachmentUrl ?? firstFile.file_url ?? firstFile.url ?? null;
                    allRows[mainRowIdx][2] = firstName;
                    if (firstUrl) {
                        const fullUrl = firstUrl.startsWith("http") ? firstUrl : `${baseUrl}${firstUrl}`;
                        hyperlinkCells.push({ r: mainRowIdx + 4, c: 2, url: fullUrl, text: firstName });
                    }

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

            XLSX.utils.sheet_add_aoa(ws, allRows, { origin: "A5" });

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

            const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };
            const dataStyle = { alignment: { vertical: "center" } };
            const numStyle = { alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };
            const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };
            const subtitleStyle = { font: { bold: true, color: { rgb: "666666" } }, alignment: { horizontal: "center", vertical: "center" } };
            const balanceLabelStyle = { font: { bold: true, sz: 10, color: { rgb: "888888" } }, alignment: { horizontal: "right", vertical: "center" } };
            const balanceNumStyle = { font: { bold: true, sz: 12, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };

            ws['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 35 }, { wch: 80 }, { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 30 }
            ];

            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
                ...dynMerges
            ];

            const range = XLSX.utils.decode_range(ws['!ref'] || "A1:J10");

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    if (R === 0 && C === 0) ws[cellAddress].s = titleStyle;
                    else if (R === 1 && C === 0) ws[cellAddress].s = subtitleStyle;
                    else if (R === 0 && (C === 6 || C === 7)) ws[cellAddress].s = balanceLabelStyle;
                    else if (R === 1 && (C === 6 || C === 7)) {
                        ws[cellAddress].s = balanceNumStyle;
                        if (!isNaN(Number(ws[cellAddress].v))) ws[cellAddress].t = "n";
                    } else if (R === 4) {
                        if (ws[cellAddress].v) ws[cellAddress].s = headerStyle;
                    } else if (R > 4) {
                        const txIndex = rowTxMap[R];
                        const isStriped = txIndex !== undefined && txIndex % 2 === 1;
                        const rowFill = isStriped ? { fill: { fgColor: { rgb: "FFE4E8" } } } : {};

                        if (ws[cellAddress].f && String(ws[cellAddress].f).startsWith("HYPERLINK")) {
                            if (isStriped) ws[cellAddress].s = { ...ws[cellAddress].s, ...rowFill };
                            continue;
                        }
                        if (C >= 5 && C <= 7) {
                            ws[cellAddress].s = { ...numStyle, ...rowFill };
                            if (ws[cellAddress].v !== "" && !isNaN(Number(ws[cellAddress].v))) ws[cellAddress].t = "n";
                        } else {
                            ws[cellAddress].s = { ...dataStyle, ...rowFill };
                        }
                    }
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Company Ledger");
            XLSX.writeFile(wb, `${sanitizedName}_company_ledger.xlsx`);
        });
    };

    const exportUnitBudgets = async () => {
        if (!activeBudget) {
            showToast("Info", "Please select a Unit Budget to export.", "info");
            return;
        }

        if (!activeBudget.units || activeBudget.units.length === 0) {
            showToast("Info", "No units linked to this budget.", "info");
            return;
        }

        setExportingBudgets(true);

        try {
            const currentOwnerName = owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Company";
            const sanitizedName = currentOwnerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const budgetName = activeBudget.budget_name;

            // Fetch all units' ledgers concurrently
            const unitPromises = activeBudget.units.map(async (unit) => {
                const res = await fetch(`/api/accountant/ledger/companies?owner_id=${selectedOwnerId}&unit_id=${unit.id}&sort=oldest`);
                const data = await res.json();
                return {
                    unitName: unit.unit_name,
                    transactions: data.success ? data.data.transactions : [],
                    openingBalance: data.success ? data.data.openingBalance : 0
                };
            });

            const unitResults = await Promise.all(unitPromises);

            const baseUrl = window.location.origin;
            const wsData: any[][] = [];
            const wsMerges: any[] = [];
            const hyperlinkCells: { r: number; c: number; url: string; text: string }[] = [];
            const dynMerges: any[] = [];
            const headerRowIndices: number[] = [];
            const dataRowIndices: number[] = [];
            const unitHeaderRowIndices: number[] = [];
            const infoRowIndices: number[] = [];

            const rowTxMap: Record<number, number> = {};

            // Row 0: Company Title
            wsData.push(["ABIC REALTY & CONSULTANCY CORPORATION 2025", "", "", "", "", "", "", "", "", ""]);
            wsMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });

            // Row 1: Subtitle
            wsData.push([`${currentOwnerName.toUpperCase()} - UNIT BUDGETS (${budgetName.toUpperCase()})`, "", "", "", "", "", "", "", "", ""]);
            wsMerges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

            // Row 2: RUNNING BUDGET
            wsData.push([
                "", "", "", "", "", "",
                "RUNNING BUDGET", parseFloat(activeBudget.current_balance) || 0,
                "", ""
            ]);

            // Row 3: TOTAL RUNNING BALANCE
            wsData.push([
                "", "", "", "", "", "",
                "TOTAL RUNNING BALANCE", activeBudget.total_units_balance !== undefined ? activeBudget.total_units_balance : (parseFloat(activeBudget.current_balance) || 0),
                "", ""
            ]);

            wsData.push([]); // Spacer

            unitResults.forEach((ur) => {
                const runningBal = ur.transactions && ur.transactions.length > 0 ? ur.transactions[ur.transactions.length - 1].outsBalance : ur.openingBalance;

                // Unit Header Row
                const unitRowIndex = wsData.length;
                unitHeaderRowIndices.push(unitRowIndex);
                wsData.push([
                    ur.unitName, "", "", "", "", "", "", "", "", ""
                ]);
                wsMerges.push({ s: { r: unitRowIndex, c: 0 }, e: { r: unitRowIndex, c: 9 } });

                // Info Row
                const infoRowIndex = wsData.length;
                infoRowIndices.push(infoRowIndex);
                wsData.push([
                    "", "", "", "", "", "",
                    "OPENING", ur.openingBalance,
                    "RUNNING", runningBal
                ]);

                // Columns Header Row
                const headerRowIndex = wsData.length;
                headerRowIndices.push(headerRowIndex);
                wsData.push([
                    "DATE", "VOUCHER NO.", "TRANS TYPE", "ACCOUNT SOURCE", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"
                ]);

                // Trans Data
                if (ur.transactions && ur.transactions.length > 0) {
                    ur.transactions.forEach((entry: any, txIndex: number) => {
                        const drIndex = wsData.length;
                        dataRowIndices.push(drIndex);
                        rowTxMap[drIndex] = txIndex;

                        wsData.push([
                            entry.voucherDate,
                            entry.voucherNo,
                            entry.transType,
                            entry.owner,
                            entry.particulars,
                            entry.deposit > 0 ? entry.deposit : "",
                            entry.withdrawal > 0 ? entry.withdrawal : "",
                            entry.outsBalance,
                            entry.fundReference || "-",
                            entry.personInCharge || "-"
                        ]);

                        if (entry.voucherAttachmentUrl) {
                            const fullUrl = entry.voucherAttachmentUrl.startsWith("http") ? entry.voucherAttachmentUrl : `${baseUrl}${entry.voucherAttachmentUrl}`;
                            hyperlinkCells.push({ r: drIndex, c: 1, url: fullUrl, text: entry.voucherNo || "—" });
                        }

                        const instrumentFiles = entry.instrumentAttachments ?? [];
                        if (instrumentFiles.length > 0) {
                            const firstFile = instrumentFiles[0];
                            const firstName = firstFile.instrumentNo ?? firstFile.file_name ?? firstFile.name ?? "—";
                            const firstUrl = firstFile.attachmentUrl ?? firstFile.file_url ?? firstFile.url ?? null;
                            wsData[drIndex][2] = firstName;

                            if (firstUrl) {
                                const fullUrl = firstUrl.startsWith("http") ? firstUrl : `${baseUrl}${firstUrl}`;
                                hyperlinkCells.push({ r: drIndex, c: 2, url: fullUrl, text: firstName });
                            }

                            for (let fi = 1; fi < instrumentFiles.length; fi++) {
                                const file = instrumentFiles[fi];
                                const fileName = file.instrumentNo ?? file.file_name ?? file.name ?? "—";
                                const fileUrl = file.attachmentUrl ?? file.file_url ?? file.url ?? null;
                                const subRowIdx = wsData.length;
                                wsData.push(["", "", fileName, "", "", "", "", "", "", ""]);
                                dataRowIndices.push(subRowIdx);
                                rowTxMap[subRowIdx] = txIndex;
                                if (fileUrl) {
                                    const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${baseUrl}${fileUrl}`;
                                    hyperlinkCells.push({ r: subRowIdx, c: 2, url: fullUrl, text: fileName });
                                }
                            }

                            if (instrumentFiles.length > 1) {
                                const startR = drIndex;
                                const endR = startR + instrumentFiles.length - 1;
                                [0, 1, 3, 4, 5, 6, 7, 8, 9].forEach(col => {
                                    dynMerges.push({ s: { r: startR, c: col }, e: { r: endR, c: col } });
                                });
                            }
                        }
                    });
                } else {
                    const drIndex = wsData.length;
                    dataRowIndices.push(drIndex);
                    wsData.push([
                        "No records found", "-", "-", "-", "-", "", "", ur.openingBalance, "-", "-"
                    ]);
                }

                wsData.push([]); // Spacer row for next unit
                wsData.push([]);
                wsData.push([]);
            });

            const m = await import("xlsx-js-style");
            const XLSX = m.default || m;
            const ws = XLSX.utils.aoa_to_sheet(wsData);

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

            // Define formatting styles
            const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };
            const unitHeaderStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "7A0F1F" } }, alignment: { vertical: "center" } }; // Same maroon as table header
            const numStyle = { alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };
            const dataStyle = { alignment: { vertical: "center" } };

            const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };
            const subtitleStyle = { font: { bold: true, color: { rgb: "666666" } }, alignment: { horizontal: "center", vertical: "center" } };

            const balanceLabelStyle = { font: { bold: true, sz: 10, color: { rgb: "888888" } }, alignment: { horizontal: "right", vertical: "center" } };
            const balanceNumStyle = { font: { bold: true, sz: 12, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };
            const mainLabelStyle = { font: { bold: true, sz: 11, color: { rgb: "888888" } }, alignment: { horizontal: "right", vertical: "center" } };
            const mainNumStyle = { font: { bold: true, sz: 14, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };

            ws['!cols'] = [
                { wch: 15 }, // A: DATE
                { wch: 20 }, // B: VOUCHER NO
                { wch: 25 }, // C: TRANS TYPE
                { wch: 35 }, // D: ACCOUNT SOURCE
                { wch: 80 }, // E: PARTICULARS
                { wch: 18 }, // F: DEPOSIT
                { wch: 25 }, // G: WITHDRAWAL
                { wch: 20 }, // H: OUTS BALANCE
                { wch: 30 }, // I: FUND REFERENCES
                { wch: 30 }, // J: PERSON IN CHARGE
            ];

            ws['!merges'] = [...wsMerges, ...dynMerges];

            const range = XLSX.utils.decode_range(ws['!ref'] || "A1:J10");

            for (let R = 0; R <= range.e.r; ++R) {
                for (let C = 0; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    if (R === 0 && C === 0) ws[cellAddress].s = titleStyle;
                    else if (R === 1 && C === 0) ws[cellAddress].s = subtitleStyle;
                    else if (R === 2) {
                        if (C === 6) ws[cellAddress].s = balanceLabelStyle; // RUNNING BUDGET label
                        if (C === 7) { ws[cellAddress].s = balanceNumStyle; ws[cellAddress].t = "n"; } // RUNNING BUDGET amount
                    }
                    else if (R === 3) {
                        if (C === 6) ws[cellAddress].s = mainLabelStyle; // TOTAL RUNNING BALANCE label
                        if (C === 7) { ws[cellAddress].s = mainNumStyle; ws[cellAddress].t = "n"; } // TOTAL RUNNING BALANCE amount
                    }
                    else if (unitHeaderRowIndices.includes(R)) {
                        ws[cellAddress].s = unitHeaderStyle;
                    }
                    else if (infoRowIndices.includes(R)) {
                        if (C === 6 || C === 8) ws[cellAddress].s = balanceLabelStyle;
                        if (C === 7 || C === 9) { ws[cellAddress].s = balanceNumStyle; ws[cellAddress].t = "n"; }
                    }
                    else if (headerRowIndices.includes(R)) {
                        ws[cellAddress].s = headerStyle;
                    }
                    else if (dataRowIndices.includes(R)) {
                        const txIndex = rowTxMap[R];
                        const isStriped = txIndex !== undefined && txIndex % 2 === 1;
                        const rowFill = isStriped ? { fill: { fgColor: { rgb: "FFE4E8" } } } : {};

                        if (ws[cellAddress].f && String(ws[cellAddress].f).startsWith("HYPERLINK")) {
                            if (isStriped) ws[cellAddress].s = { ...ws[cellAddress].s, ...rowFill };
                            continue;
                        }

                        if (C >= 5 && C <= 7) {
                            ws[cellAddress].s = { ...numStyle, ...rowFill };
                            if (ws[cellAddress].v !== "" && !isNaN(Number(ws[cellAddress].v))) ws[cellAddress].t = "n";
                        } else {
                            ws[cellAddress].s = { ...dataStyle, ...rowFill };
                        }
                    }
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Unit Budgets");
            XLSX.writeFile(wb, `${sanitizedName}_unit_budgets_ledger.xlsx`);

        } catch (error) {
            console.error(error);
            showToast("Error", "Failed to generate Unit Budgets export.", "error");
        } finally {
            setExportingBudgets(false);
        }
    };

    // API Fetches
    useEffect(() => {
        setOwnersLoading(true);
        fetch('/api/accountant/maintenance/owners?per_page=all')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const rawData = Array.isArray(data.data?.data) ? data.data.data : (Array.isArray(data.data) ? data.data : []);
                    // Filter for COMPANY instead of MAIN/CLIENT
                    const companies = rawData.filter((o: Owner) => o.owner_type === "COMPANY");
                    setOwners(companies);
                    if (initialOwnerId) {
                        const exists = companies.find((o: Owner) => String(o.id) === initialOwnerId);
                        if (exists) setSelectedOwnerId(initialOwnerId);
                        else if (companies.length > 0) setSelectedOwnerId(companies[0].id);
                    } else if (companies.length > 0) {
                        setSelectedOwnerId(companies[0].id);
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

        // Fetching from /companies endpoint
        let url = `/api/accountant/ledger/companies?owner_id=${selectedOwnerId}&sort=oldest`;
        if (selectedUnitId !== "ALL") {
            url += `&unit_id=${selectedUnitId}`;
        }

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
    }, [selectedOwnerId, selectedUnitId]);

    const fetchBudgets = useCallback(() => {
        if (!selectedOwnerId) {
            setBudgets([]);
            setSelectedBudgetId(null);
            return;
        }
        setBudgetsLoading(true);
        fetch(`/api/accountant/budgets/owner/${selectedOwnerId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBudgets(data.data || []);
                    if (data.data && data.data.length > 0) {
                        setSelectedBudgetId(data.data[0].id);
                    } else {
                        setSelectedBudgetId(null);
                    }
                } else {
                    setBudgets([]);
                    setSelectedBudgetId(null);
                }
            })
            .catch(err => {
                console.error(err);
                setSelectedBudgetId(null);
            })
            .finally(() => setBudgetsLoading(false));
    }, [selectedOwnerId]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const activeBudget = budgets.find(b => b.id === selectedBudgetId) || null;

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
            label: "ACCOUNT SOURCE",
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
                title={pendingExportType === "main" ? "Export Main Ledger" : "Export Unit Budgets"}
                message={pendingExportType === "main"
                    ? "This will download the main ledger for the selected company as an Excel file. Continue?"
                    : "This will download the unit budgets ledger for the selected company as an Excel file. Continue?"}
                confirmLabel="Export"
                icon={Download}
                color="#7a0f1f"
                onCancel={() => { setShowExportConfirm(false); setPendingExportType(null); }}
                onConfirm={() => {
                    setShowExportConfirm(false);
                    if (pendingExportType === "main") exportMainLedger();
                    else if (pendingExportType === "budgets") exportUnitBudgets();
                    setPendingExportType(null);
                }}
            />
            {/* AppHeader Component */}
            <AppHeader
                navigation={[]}
                title="Company Ledger"
                subtitle="View transaction history and running balances for companies."
                primaryAction={
                    <Popover>
                        <PopoverTrigger asChild>
                            <button disabled={exportingBudgets} className={`flex items-center gap-2 px-4 py-2 bg-white text-[#7a0f1f] rounded-lg text-sm font-semibold transition-colors shadow-sm outline-none ${exportingBudgets ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                                {exportingBudgets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {exportingBudgets ? "Exporting..." : "Export Data"}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 border border-gray-100 shadow-xl rounded-xl z-50 bg-white" align="end" sideOffset={8}>
                            <button onClick={() => { setPendingExportType("main"); setShowExportConfirm(true); }} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#7a0f1f] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 outline-none">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Main Ledger
                            </button>
                            <button onClick={() => { setPendingExportType("budgets"); setShowExportConfirm(true); }} className="w-full mt-1 text-left px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-[#7a0f1f] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 outline-none">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                Unit Budgets
                            </button>
                        </PopoverContent>
                    </Popover>
                }
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full">

                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    {/* ── Top Level Context ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-gray-100 gap-4">
                        <div className="flex flex-col space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#5f0c18]">Company Financials</h2>
                                <p className="text-sm text-gray-600 mt-1">Manage main ledger entries or individual unit budgets</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Filters (SharedToolbar) ── */}
                    <div className="mt-5">
                        <SharedToolbar
                            searchQuery={query}
                            onSearchChange={(val: string) => setQuery(val)}
                            searchPlaceholder="Search transaction..."
                            onRefresh={() => { fetchLedger(); fetchBudgets(); }}
                            containerMaxWidth="max-w-full"
                        >
                            {/* Segmented Control */}
                            <div className="inline-flex p-1 bg-gray-100/80 rounded-lg w-max shrink-0 border border-gray-200/60 items-center h-10">
                                <button
                                    onClick={() => setActiveTab("MAIN_LEDGER")}
                                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === "MAIN_LEDGER" ? "bg-white text-[#7a0f1f] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                                >
                                    Main Ledger
                                </button>
                                <button
                                    onClick={() => setActiveTab("UNIT_BUDGETS")}
                                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === "UNIT_BUDGETS" ? "bg-white text-[#7a0f1f] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                                >
                                    Unit Budgets
                                </button>
                            </div>

                            <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>

                            <OwnerSelectDropdown
                                owners={owners}
                                selectedId={selectedOwnerId}
                                onChange={(id) => {
                                    setSelectedOwnerId(id);
                                    setSelectedUnitId("ALL");
                                    setSelectedBudgetId(null);
                                }}
                                loading={ownersLoading}
                            />
                            {activeTab === "MAIN_LEDGER" && (
                                <UnitSelectDropdown
                                    units={units}
                                    selectedId={selectedUnitId}
                                    onChange={(id) => {
                                        setSelectedUnitId(id);
                                        setActiveTab("MAIN_LEDGER");
                                    }}
                                />
                            )}
                            {activeTab === "UNIT_BUDGETS" && (
                                <BudgetSelectDropdown
                                    budgets={budgets}
                                    selectedId={selectedBudgetId}
                                    onChange={(id) => {
                                        setSelectedBudgetId(id);
                                        setActiveTab("UNIT_BUDGETS");
                                    }}
                                    disabled={budgetsLoading || budgets.length === 0}
                                />
                            )}
                        </SharedToolbar>
                    </div>

                    <div className="mt-6">
                        {/* ── Top Section: Company Name, Owner Name, balances ── */}
                        <div className="bg-white rounded-md border-x border-t border-b p-6 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between" style={{ borderColor: BORDER }}>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[#5f0c18]">ABIC REALTY & CONSULTANCY CORPORATION 2025</h1>
                                <div className="text-sm font-bold text-gray-500 mt-1 uppercase flex items-center gap-1.5 flex-wrap">
                                    {ownersLoading ? "Loading..." : (
                                        <>
                                            <span>{owners.find(o => String(o.id) === String(selectedOwnerId))?.name ?? "Select Company"}</span>
                                            {activeTab === "MAIN_LEDGER" && selectedUnitId !== "ALL" && (
                                                <>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[#7a0f1f]">{units.find(u => String(u.id) === String(selectedUnitId))?.unit_name}</span>
                                                </>
                                            )}
                                            {activeTab === "UNIT_BUDGETS" && (
                                                <>
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-[#7a0f1f]">{activeBudget?.budget_name || "BUDGET"}</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mt-4 md:mt-0 text-right">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {activeTab === "UNIT_BUDGETS" ? "Running Budget" : "Opening Balance"}
                                    </p>
                                    <div className="mt-0.5 flex flex-col items-end justify-center min-h-[28px]">
                                        {activeTab === "UNIT_BUDGETS" && activeBudget ? (
                                            <>
                                                <p className="text-lg font-bold text-gray-900 leading-none">
                                                    ₱{parseFloat(activeBudget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-semibold tracking-wider mt-1 leading-none">
                                                    OPENING: ₱{parseFloat(activeBudget.opening_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                                </p>
                                            </>
                                        ) : entriesLoading ? (
                                            <Skeleton className="h-7 w-24 ml-auto" />
                                        ) : (
                                            <p className="text-lg font-bold text-gray-900 leading-none">
                                                ₱{openingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {activeTab === "UNIT_BUDGETS" ? "Total Running Balance" : "Running Balance"}
                                    </p>
                                    <div className="h-7 mt-0.5">
                                        {activeTab === "UNIT_BUDGETS" && activeBudget ? (
                                            <p className="text-lg font-bold text-[#7a0f1f]">
                                                ₱{activeBudget.total_units_balance !== undefined ? activeBudget.total_units_balance.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : parseFloat(activeBudget.current_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </p>
                                        ) : entriesLoading ? (
                                            <Skeleton className="h-full w-24 ml-auto" />
                                        ) : (
                                            <p className="text-lg font-bold text-[#7a0f1f]">
                                                {`₱${runningBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {activeTab === "MAIN_LEDGER" ? (
                            <>
                                {/* ── Section header ── */}
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Ledger Entries</h3>
                                    <button
                                        onClick={() => setShowExtraColumns(!showExtraColumns)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        {showExtraColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {showExtraColumns ? "Hide Extra Columns" : "Show Extra Columns"}
                                    </button>
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
                                        router.push(targetUrl);
                                    }}
                                />
                            </>
                        ) : (
                            <UnitBudgetsView
                                role={role}
                                ownerType="COMPANY"
                                ownerId={selectedOwnerId}
                                activeBudget={activeBudget}
                                onRefreshBudgets={fetchBudgets}
                                hideControls={true}
                                loading={budgetsLoading}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default function LedgerCompanyShared({ role }: { role: "superadmin" | "accountant" }) {
    const navigation = role === "superadmin" ? superAdminNav : accountantNav;
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50/50" />}>
            <CompanyLedgerPage role={role} />
        </Suspense>
    );
}
