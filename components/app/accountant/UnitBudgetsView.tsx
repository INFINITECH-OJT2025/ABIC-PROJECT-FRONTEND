"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";

import { Building2, ChevronDown, Search, Plus, List, ArrowDownToLine, ArrowUpToLine, Wallet, ChevronRight, Loader2, Link, Eye, EyeOff, FileText } from "lucide-react";
import CreateUnitBudgetPanel from "@/components/app/super/accountant/CreateUnitBudgetPanel";
import UnitBudgetLedgerPanel from "@/components/app/accountant/UnitBudgetLedgerPanel";
import UnitBudgetTransactionPanel from "@/components/app/accountant/UnitBudgetTransactionPanel";
import SharedToolbar from "@/components/app/SharedToolbar";
import DataTable, { DataTableColumn } from "@/components/app/DataTable";
import DataTableLedge, { InstrumentFilesPopover, VoucherPreviewButton } from "@/components/app/DataTableLedge";
import { useRouter } from "next/navigation";
import InfoTooltip from "@/components/app/InfoTooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface Owner {
    id: number | string;
    name: string;
    owner_type: string;
}

interface Unit {
    id: number | string;
    unit_name: string;
}

export interface UnitBudget {
    id: number;
    owner_id: number;
    budget_name: string;
    opening_balance: string;
    current_balance: string;
    total_units_balance?: number;
    status: string;
    units: Unit[];
    transactions: any[];
}

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


export function BudgetSelectDropdown({
    budgets,
    selectedId,
    onChange,
    disabled
}: {
    budgets: UnitBudget[];
    selectedId: number | null;
    onChange: (id: number) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setOpen(false));

    const selectedBudget = budgets.find(b => b.id === selectedId);
    const filteredBudgets = budgets.filter(b => b.budget_name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={ref} className={`relative shrink-0 w-64 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center w-full h-10 pl-3 pr-8 rounded-lg border text-sm font-semibold bg-white cursor-pointer transition-colors ${open ? 'border-[#7B0F2B] ring-2 ring-[#7B0F2B]/20' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <Wallet className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <span className="truncate text-gray-700">
                    {selectedBudget?.budget_name ?? "Select Budget..."}
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
                            placeholder="Search..."
                            className="flex-1 text-sm outline-none bg-transparent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filteredBudgets.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
                        ) : (
                            filteredBudgets.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => { onChange(b.id); setOpen(false); setQuery(""); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedId === b.id ? "bg-red-50 text-[#7a0f1f] font-bold" : "text-gray-900 font-medium"}`}
                                >
                                    <span className="truncate block font-semibold">{b.budget_name}</span>
                                    <span className="truncate block text-xs text-gray-500 mt-0.5">Balance: ₱{parseFloat(b.current_balance).toLocaleString()}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function UnitLedgerAccordion({ role, ownerId, ownerType, unit, expanded: initialExpanded = false }: {
    role?: "superadmin" | "accountant",
    ownerId: number | string,
    ownerType: string,
    unit: Unit,
    expanded?: boolean
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(initialExpanded);

    useEffect(() => {
        if (initialExpanded) setExpanded(true);
    }, [initialExpanded]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const [openingBalance, setOpeningBalance] = useState<number>(0);

    const fetchLedger = React.useCallback(async () => {
        setLoading(true);
        try {
            const apiOwnerType = ownerType === 'CLIENT' ? 'clients' : 'company';
            const res = await fetch(`/api/accountant/ledger/${apiOwnerType}?owner_id=${ownerId}&unit_id=${unit.id}&sort=oldest`);
            const data = await res.json();
            if (data.success) {
                setTransactions(data.data?.transactions || []);
                setOpeningBalance(data.data?.openingBalance || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [ownerId, ownerType, unit.id]);

    useEffect(() => {
        if (expanded && transactions.length === 0 && !loading) {
            fetchLedger();
        }
    }, [expanded, fetchLedger]);

    const runningBalance = transactions.length > 0
        ? (transactions[transactions.length - 1]?.outsBalance || 0)
        : openingBalance;

    const columns = React.useMemo<DataTableColumn<any>[]>(() => [
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
            width: "400px",
            minWidth: "400px",
            maxWidth: "400px",
            sortable: true,
            renderCell: (row) => {
                const text: string = row.particulars ?? ""
                const sepIdx = text.indexOf(" - ")
                if (sepIdx === -1) return text
                const unitStr = text.slice(0, sepIdx)
                const rest = text.slice(sepIdx + 3)
                return (
                    <span>
                        <span className="font-bold">{unitStr}</span>
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

    return (
        <div id={`unit-ledger-${unit.id}`} className="bg-white border text-sm border-gray-200 rounded-lg shadow-sm overflow-hidden mb-3 scroll-mt-24">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-5 py-2.5 bg-[#7a0f1f] hover:bg-[#8e1227] transition-colors text-left focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex flex-shrink-0 items-center justify-center shadow-inner">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-base">{unit.unit_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-100 uppercase tracking-widest mr-2 opacity-0 sm:opacity-100">{expanded ? 'Close Ledger' : 'View Ledger'}</span>
                    <ChevronDown className={`w-5 h-5 text-white transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                        <h4 className="font-bold text-gray-800 self-center">Ledger Entries</h4>

                        <div className="flex flex-col items-end gap-3">
                            <button
                                onClick={() => setShowExtraColumns(!showExtraColumns)}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7a0f1f] bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 w-full md:w-auto"
                            >
                                {showExtraColumns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showExtraColumns ? "Hide Extra Columns" : "Show Extra Columns"}
                            </button>

                            <div className="flex items-center gap-6 text-right">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Opening</p>
                                    <div className="h-5 mt-1">
                                        {loading ? (
                                            <Skeleton className="h-full w-20" />
                                        ) : (
                                            <p className="text-sm font-bold text-gray-900">
                                                ₱{openingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-gray-200"></div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Running</p>
                                    <div className="h-5 mt-1">
                                        {loading ? (
                                            <Skeleton className="h-full w-20" />
                                        ) : (
                                            <p className="text-sm font-bold text-[#7a0f1f]">
                                                ₱{runningBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden overflow-x-auto">
                        <DataTableLedge
                            columns={columns}
                            rows={transactions}
                            itemName="transactions"
                            loading={loading}
                            getRowId={(row) => `tx-${row.transactionId}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UnitBudgetsView({
    role,
    ownerType,
    ownerId,
    activeBudget,
    onRefreshBudgets,
    hideControls = false,
    loading = false
}: {
    role: "superadmin" | "accountant";
    ownerType: "CLIENT" | "COMPANY";
    ownerId: string | number | null;
    activeBudget: UnitBudget | null;
    onRefreshBudgets: () => void;
    hideControls?: boolean;
    loading?: boolean;
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [ledgerPanelBudget, setLedgerPanelBudget] = useState<UnitBudget | null>(null);
    const [transactionPanelBudget, setTransactionPanelBudget] = useState<UnitBudget | null>(null);
    const [editPanelBudget, setEditPanelBudget] = useState<UnitBudget | null>(null);
    const [actionType, setActionType] = useState<"ADD" | "DEDUCT" | null>(null);
    const [expandedUnitId, setExpandedUnitId] = useState<number | string | null>(null);

    const scrollToUnit = (unitId: number | string) => {
        setExpandedUnitId(unitId);
        setTimeout(() => {
            const el = document.getElementById(`unit-ledger-${unitId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <div className="w-full flex flex-col gap-4 mt-6">
            {!ownerId ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Please select an owner to view their budgets.</p>
                </div>
            ) : loading ? (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex gap-2 overflow-hidden pb-2">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full shrink-0" />)}
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : !activeBudget ? (
                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    <Wallet className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium mb-2">No budget selected or available for this owner yet.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-[#7a0f1f] font-semibold text-sm hover:underline"
                    >
                        Create the first budget
                    </button>
                </div>
            ) : (
                <div className="flex flex-col">
                    {!hideControls && (
                        <div className="mb-4 flex flex-row flex-wrap gap-2 justify-end">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-3 py-2 text-xs font-semibold text-white bg-[#7a0f1f] hover:bg-[#5f0c18] rounded shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> New Budget
                            </button>
                            <button
                                onClick={() => setEditPanelBudget(activeBudget)}
                                className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:text-[#7a0f1f] hover:border-[#7a0f1f]/40 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Manage Units
                            </button>
                            <button
                                onClick={() => setLedgerPanelBudget(activeBudget)}
                                className="px-3 py-2 text-xs font-semibold text-[#7a0f1f] bg-red-50 border border-red-100 hover:bg-red-100 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <List className="w-3.5 h-3.5" /> Budget Ledger
                            </button>
                        </div>
                    )}

                    <div className="mt-2">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Link className="w-4 h-4 text-gray-400" /> Linked Unit Ledgers
                        </h4>

                        {activeBudget.units && activeBudget.units.length > 1 && (
                            <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-[#f8fafc]/80 backdrop-blur-sm border-b border-gray-100 mb-4 overflow-x-auto no-scrollbar flex items-center gap-2">
                                <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-gray-200 mr-2">
                                    <List className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Nav</span>
                                </div>
                                {activeBudget.units.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => scrollToUnit(u.id)}
                                        className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#7a0f1f] hover:text-[#7a0f1f] transition-all shadow-sm active:scale-95"
                                    >
                                        {u.unit_name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!activeBudget.units || activeBudget.units.length === 0 ? (
                            <div className="py-8 text-center bg-white rounded-lg border border-[rgba(0,0,0,0.12)] shadow-sm">
                                <p className="text-gray-500 text-sm">No units are assigned to this budget yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                {activeBudget.units.map(unit => (
                                    <UnitLedgerAccordion
                                        key={unit.id}
                                        role={role}
                                        ownerId={ownerId}
                                        ownerType={ownerType}
                                        unit={unit}
                                        expanded={expandedUnitId === unit.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {
                ownerId && (
                    <CreateUnitBudgetPanel
                        ownerId={ownerId}
                        open={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreated={() => {
                            setIsCreateModalOpen(false);
                            onRefreshBudgets();
                        }}
                    />
                )
            }

            <UnitBudgetLedgerPanel
                open={!!ledgerPanelBudget}
                budget={ledgerPanelBudget}
                onClose={() => setLedgerPanelBudget(null)}
            />

            <UnitBudgetTransactionPanel
                open={!!transactionPanelBudget}
                budget={transactionPanelBudget}
                initialAction={actionType}
                onClose={() => {
                    setTransactionPanelBudget(null);
                    setActionType(null);
                }}
                onSuccess={() => {
                    onRefreshBudgets();
                }}
            />

            <CreateUnitBudgetPanel
                ownerId={ownerId as number | string}
                open={!!editPanelBudget}
                editBudget={editPanelBudget}
                onClose={() => setEditPanelBudget(null)}
                onCreated={() => {
                    setEditPanelBudget(null);
                    onRefreshBudgets();
                }}
            />
        </div >
    );
}
