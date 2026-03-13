"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/app/AppHeader";
import { Download, Search, ChevronsUpDown, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import SharedToolbar from "@/components/app/SharedToolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BORDER = "rgba(0,0,0,0.12)";

export default function AccountSummaryShared({ role }: { role: "superadmin" | "accountant" | "viewer" }) {
    const [query, setQuery] = useState("");
    const [selectedTable, setSelectedTable] = useState("summary");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    // API state for summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [remainingMoneyData, setRemainingMoneyData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [clientDebtData, setClientDebtData] = useState<any[]>([]);
    const [totalRemainingClientMoney, setTotalRemainingClientMoney] = useState(0);
    const [totalClientDebt, setTotalClientDebt] = useState(0);
    const [totalActualMoney, setTotalActualMoney] = useState(0);
    const [missingAmount, setMissingAmount] = useState(0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [unitOwnerData, setUnitOwnerData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bankAccountsData, setBankAccountsData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [otherBankAccountsData, setOtherBankAccountsData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [condoBankAccountsData, setCondoBankAccountsData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employeeBankAccountsData, setEmployeeBankAccountsData] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [securityBankContactData, setSecurityBankContactData] = useState<any[]>([]);

    const [sortConfigs, setSortConfigs] = useState<Record<string, { key: string, direction: 'asc' | 'desc' } | null>>({});

    const fetchSummaryData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/accountant/account-summary");
            const data = await res.json();

            if (data?.success) {
                const results = data.data;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedMoney = results.table_client_money_and_debt?.items?.map((item: any) => ({
                    clientName: item.name,
                    amount: item.raw_balance,
                })) || [];
                setRemainingMoneyData(formattedMoney);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedDebt = results.table_client_debt?.items?.map((item: any) => ({
                    clientName: item.name,
                    amount: item.raw_balance,
                })) || [];
                setClientDebtData(formattedDebt);

                setTotalRemainingClientMoney(results.result?.total_remaining_client_money || 0);
                setTotalClientDebt(results.result?.total_client_debt || 0);
                setTotalActualMoney(results.separate?.total_actual_money || 0);
                setMissingAmount(results.separate?.missing_amount || 0);

                // Now read units and banks directly from new payload
                setUnitOwnerData(results.table_units || []);
                setBankAccountsData(results.table_bank_accounts || []);
                setCondoBankAccountsData(results.table_condo_bank_accounts || []);
            }
        } catch (error) {
            console.error("Failed to fetch account summary:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaryData();
    }, []);

    const handleSort = (tableId: string, key: string) => {
        setSortConfigs((prev) => {
            const current = prev[tableId];
            let direction: 'asc' | 'desc' = 'asc';
            if (current && current.key === key && current.direction === 'asc') {
                direction = 'desc';
            }
            return { ...prev, [tableId]: { key, direction } };
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSortedData = (data: any[], tableId: string) => {
        let processedData = data;

        if (query && query.trim() !== "") {
            const lowerQuery = query.toLowerCase();
            processedData = data.filter(item =>
                Object.values(item).some(val =>
                    val != null && String(val).toLowerCase().includes(lowerQuery)
                )
            );
        }

        const config = sortConfigs[tableId];
        if (!config) return processedData;

        return [...processedData].sort((a, b) => {
            let valA = a[config.key];
            let valB = b[config.key];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };


    const formatCurrency = (amount: number) => {
        if (amount < 0) {
            return `(${Math.abs(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })})`;
        }
        if (amount === 0) return "-";
        return amount.toLocaleString("en-PH", { minimumFractionDigits: 2 });
    };
    return (
        <div className="min-h-screen bg-gray-50/50 pb-12 font-sans flex flex-col">
            <AppHeader
                navigation={[]}
                title="Account Summary"
                subtitle="View remaining client money and client debt summaries."
            />

            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full">
                <section
                    className="rounded-md bg-white p-5 shadow-sm border"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-gray-100 gap-4">
                        <div className="flex flex-col space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#5f0c18]">Summary Overview</h2>
                                <p className="text-sm text-gray-600 mt-1">Overview of remaining client money and debts</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm text-[#7a0f1f] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" />
                            Export Data
                        </button>
                    </div>

                    <div className="mt-5 mb-6">
                        <SharedToolbar
                            searchQuery={query}
                            onSearchChange={(val: string) => setQuery(val)}
                            searchPlaceholder="Search client..."
                            containerMaxWidth="max-w-full"
                            onRefresh={() => { }}
                        >
                            <Tabs value={selectedTable} onValueChange={setSelectedTable} className="w-full sm:w-auto overflow-x-auto">
                                <TabsList className="bg-gray-100 border border-gray-200/60 shadow-inner h-11 p-1 w-full flex-nowrap sm:w-auto space-x-1 rounded-xl">
                                    <TabsTrigger value="summary" className="rounded-lg font-bold text-xs tracking-wider whitespace-nowrap px-4 py-2 data-[state=active]:bg-[#7a0f1f] data-[state=active]:text-white text-gray-600 data-[state=active]:shadow-md transition-all duration-300">SUMMARY (MONEY & DEBT)</TabsTrigger>
                                    <TabsTrigger value="bank_accounts" className="rounded-lg font-bold text-xs tracking-wider whitespace-nowrap px-4 py-2 data-[state=active]:bg-[#7a0f1f] data-[state=active]:text-white text-gray-600 data-[state=active]:shadow-md transition-all duration-300">UNIT OWNERS & BANK ACCOUNTS</TabsTrigger>
                                    <TabsTrigger value="other_accounts" className="rounded-lg font-bold text-xs tracking-wider whitespace-nowrap px-4 py-2 data-[state=active]:bg-[#7a0f1f] data-[state=active]:text-white text-gray-600 data-[state=active]:shadow-md transition-all duration-300">OTHER ACCOUNTS</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </SharedToolbar>
                    </div>

                    {selectedTable === "summary" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Side (Main Table + Summary Table) */}
                            <div className="flex flex-col gap-4 h-fit">
                                {/* Left Table */}
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest truncate">REMAINING CLIENT MONEY & CLIENT DEBT</span>
                                    </div>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 border-b border-gray-200">
                                                <tr>
                                                    <th onClick={() => handleSort('remainingMoney', 'clientName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 w-2/3 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            CLIENT NAME
                                                            {sortConfigs['remainingMoney']?.key === 'clientName' ? (
                                                                sortConfigs['remainingMoney']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('remainingMoney', 'amount')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center w-1/3 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            AMOUNT
                                                            {sortConfigs['remainingMoney']?.key === 'amount' ? (
                                                                sortConfigs['remainingMoney']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {isLoading ? (
                                                    Array.from({ length: 5 }).map((_, idx) => (
                                                        <tr key={`skel-money-${idx}`} className="border-b border-gray-50 transition-colors bg-white">
                                                            <td className="px-5 py-4">
                                                                <Skeleton className="h-4 w-[60%] bg-gray-200 rounded-md" />
                                                            </td>
                                                            <td className="px-5 py-4 flex justify-end">
                                                                <Skeleton className="h-4 w-24 bg-gray-200 rounded-md" />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : getSortedData(remainingMoneyData, "remainingMoney").length === 0 ? (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                                                            No remaining money or debt found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getSortedData(remainingMoneyData, "remainingMoney").map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                            <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.clientName}</td>
                                                            <td className={`px-4 py-2 text-sm font-bold text-right ${row.amount < 0 ? 'text-[#dc2626]' : 'text-gray-900'}`}>{formatCurrency(row.amount)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>

                                {/* Left Extra Summary Table 1 */}
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white mt-1">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <tbody className="divide-y divide-white/20">
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">TOTAL REMAINING CLIENT MONEY</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-white w-1/3">{formatCurrency(totalRemainingClientMoney)}</td>
                                                </tr>
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">TOTAL CLIENT DEBT</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">{formatCurrency(totalClientDebt)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>

                                {/* Left Extra Summary Table 2 */}
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <tbody className="divide-y divide-white/20">
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">TOTAL ACTUAL MONEY</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-white w-1/3">{formatCurrency(totalActualMoney)}</td>
                                                </tr>
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">MISSING AMOUNT</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">{formatCurrency(missingAmount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>
                            </div>

                            {/* Right Table */}
                            <div className="flex flex-col h-fit">
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest truncate">CLIENT DEBT</span>
                                    </div>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 border-b border-gray-200">
                                                <tr>
                                                    <th onClick={() => handleSort('clientDebt', 'clientName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 w-2/3 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            CLIENT NAME
                                                            {sortConfigs['clientDebt']?.key === 'clientName' ? (
                                                                sortConfigs['clientDebt']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('clientDebt', 'amount')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center w-1/3 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            AMOUNT
                                                            {sortConfigs['clientDebt']?.key === 'amount' ? (
                                                                sortConfigs['clientDebt']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {isLoading ? (
                                                    Array.from({ length: 5 }).map((_, idx) => (
                                                        <tr key={`skel-debt-${idx}`} className="border-b border-gray-50 transition-colors bg-white">
                                                            <td className="px-5 py-4">
                                                                <Skeleton className="h-4 w-[60%] bg-gray-200 rounded-md" />
                                                            </td>
                                                            <td className="px-5 py-4 flex justify-end">
                                                                <Skeleton className="h-4 w-24 bg-gray-200 rounded-md" />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : getSortedData(clientDebtData, "clientDebt").length === 0 ? (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                                                            No debt found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    getSortedData(clientDebtData, "clientDebt").map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                            <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.clientName}</td>
                                                            <td className="px-4 py-2 text-sm font-bold text-right text-[#dc2626]">{formatCurrency(row.amount)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>

                                {/* Right Extra Summary Table */}
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white mt-1">
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <tbody className="divide-y divide-white/20">
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">TOTAL DEBT</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">{formatCurrency(totalClientDebt)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTable === "bank_accounts" && (
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2.2fr] gap-8 items-start">
                            {/* Left Table (Unit Owner) */}
                            <div className="flex flex-col gap-4 h-fit">
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest truncate">UNIT OWNER</span>
                                    </div>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 border-b border-gray-200">
                                                <tr>
                                                    <th onClick={() => handleSort('unitOwner', 'owner')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 w-1/2 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            OWNER
                                                            {sortConfigs['unitOwner']?.key === 'owner' ? (
                                                                sortConfigs['unitOwner']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('unitOwner', 'unit')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center w-1/2 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            UNIT
                                                            {sortConfigs['unitOwner']?.key === 'unit' ? (
                                                                sortConfigs['unitOwner']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {getSortedData(unitOwnerData, "unitOwner").map((row, idx) => (
                                                    row.units && row.units.length > 0 ? (
                                                        row.units.map((unit: string, unitIdx: number) => (
                                                            <tr key={`${idx}-${unitIdx}`} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                                {unitIdx === 0 && (
                                                                    <td rowSpan={row.units.length} className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase align-top">
                                                                        {row.owner}
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-2 text-xs text-gray-900 text-left border-b border-gray-50">{unit}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                            <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase align-top">{row.owner}</td>
                                                            <td className="px-4 py-2 text-xs text-gray-900 text-left border-b border-gray-50">-</td>
                                                        </tr>
                                                    )
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>
                            </div>

                            {/* Right Table (Bank Accounts) */}
                            <div className="flex flex-col gap-4 h-fit">
                                <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                    <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest truncate">BANK ACCOUNTS</span>
                                    </div>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 border-b border-gray-200">
                                                <tr>
                                                    <th onClick={() => handleSort('bankAccounts', 'name')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            NAME
                                                            {sortConfigs['bankAccounts']?.key === 'name' ? (
                                                                sortConfigs['bankAccounts']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('bankAccounts', 'bank')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            BANK
                                                            {sortConfigs['bankAccounts']?.key === 'bank' ? (
                                                                sortConfigs['bankAccounts']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('bankAccounts', 'accountName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            ACCOUNT NAME
                                                            {sortConfigs['bankAccounts']?.key === 'accountName' ? (
                                                                sortConfigs['bankAccounts']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('bankAccounts', 'accountNumber')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            ACCOUNT NUMBER
                                                            {sortConfigs['bankAccounts']?.key === 'accountNumber' ? (
                                                                sortConfigs['bankAccounts']?.direction === 'desc' ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                                ) : (
                                                                    <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                                )
                                                            ) : (
                                                                <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                            )}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {getSortedData(bankAccountsData, "bankAccounts").map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                        <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.name}</td>
                                                        <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.bank || "-"}</td>
                                                        <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.accountName || "-"}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono whitespace-nowrap">{row.accountNumber || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTable === "other_accounts" && (
                        <div className="flex flex-col gap-8">
                            <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest truncate">OTHER BANK ACCOUNTS</span>
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="sticky top-0 z-10 border-b border-gray-200">
                                            <tr>
                                                <th onClick={() => handleSort('otherBankAccounts', 'name')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        NAME
                                                        {sortConfigs['otherBankAccounts']?.key === 'name' ? (
                                                            sortConfigs['otherBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('otherBankAccounts', 'bank')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        BANK
                                                        {sortConfigs['otherBankAccounts']?.key === 'bank' ? (
                                                            sortConfigs['otherBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('otherBankAccounts', 'accountName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NAME
                                                        {sortConfigs['otherBankAccounts']?.key === 'accountName' ? (
                                                            sortConfigs['otherBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('otherBankAccounts', 'accountNumber')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NUMBER
                                                        {sortConfigs['otherBankAccounts']?.key === 'accountNumber' ? (
                                                            sortConfigs['otherBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {getSortedData(otherBankAccountsData, "otherBankAccounts").map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                    <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.name}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.bank || "-"}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.accountName || "-"}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono whitespace-nowrap">{row.accountNumber || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                            </div>

                            <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest truncate">CONDO / PROPERTY GCASH/BANK ACCOUNTS</span>
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="sticky top-0 z-10 border-b border-gray-200">
                                            <tr>
                                                <th onClick={() => handleSort('condoBankAccounts', 'condominium')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        CONDOMINIUM
                                                        {sortConfigs['condoBankAccounts']?.key === 'condominium' ? (
                                                            sortConfigs['condoBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('condoBankAccounts', 'bank')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        BANK
                                                        {sortConfigs['condoBankAccounts']?.key === 'bank' ? (
                                                            sortConfigs['condoBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('condoBankAccounts', 'accountName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NAME
                                                        {sortConfigs['condoBankAccounts']?.key === 'accountName' ? (
                                                            sortConfigs['condoBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('condoBankAccounts', 'accountNumber')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center w-48 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NUMBER/SAN
                                                        {sortConfigs['condoBankAccounts']?.key === 'accountNumber' ? (
                                                            sortConfigs['condoBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {getSortedData(condoBankAccountsData, "condoBankAccounts").map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                    <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200">{row.condominium}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.bank || "-"}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.accountName || "-"}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono whitespace-nowrap">{row.accountNumber || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                            </div>
                        </div>
                    )}

                    {selectedTable === "employee_contacts" && (
                        <div className="flex flex-col gap-8">
                            <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest truncate">ABIC EMPLOYEE BANK ACCOUNTS</span>
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="sticky top-0 z-10 border-b border-gray-200">
                                            <tr>
                                                <th onClick={() => handleSort('employeeBankAccounts', 'name')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        NAME
                                                        {sortConfigs['employeeBankAccounts']?.key === 'name' ? (
                                                            sortConfigs['employeeBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('employeeBankAccounts', 'bank')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        BANK
                                                        {sortConfigs['employeeBankAccounts']?.key === 'bank' ? (
                                                            sortConfigs['employeeBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('employeeBankAccounts', 'accountName')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NAME
                                                        {sortConfigs['employeeBankAccounts']?.key === 'accountName' ? (
                                                            sortConfigs['employeeBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('employeeBankAccounts', 'accountNumber')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        ACCOUNT NUMBER
                                                        {sortConfigs['employeeBankAccounts']?.key === 'accountNumber' ? (
                                                            sortConfigs['employeeBankAccounts']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {getSortedData(employeeBankAccountsData, "employeeBankAccounts").map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                    <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.name}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.bank || "-"}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200">{row.accountName || "-"}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono whitespace-nowrap">{row.accountNumber || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                            </div>

                            <div className="w-full flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                                <div className="px-4 py-3 bg-[#7a0f1f] flex items-center justify-center border-b border-white/20">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest truncate">SECURITY BANK CONTACT DETAILS</span>
                                </div>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="sticky top-0 z-10 border-b border-gray-200">
                                            <tr>
                                                <th onClick={() => handleSort('securityBankContact', 'branch')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        BRANCH
                                                        {sortConfigs['securityBankContact']?.key === 'branch' ? (
                                                            sortConfigs['securityBankContact']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('securityBankContact', 'phone')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 whitespace-nowrap cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        PHONE NO.
                                                        {sortConfigs['securityBankContact']?.key === 'phone' ? (
                                                            sortConfigs['securityBankContact']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('securityBankContact', 'email')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center border-r border-white/20 cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        EMAIL ADDRESS
                                                        {sortConfigs['securityBankContact']?.key === 'email' ? (
                                                            sortConfigs['securityBankContact']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th onClick={() => handleSort('securityBankContact', 'viber')} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-white bg-[#7a0f1f] text-center cursor-pointer group hover:bg-[#8e1124] transition-colors">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        VIBER
                                                        {sortConfigs['securityBankContact']?.key === 'viber' ? (
                                                            sortConfigs['securityBankContact']?.direction === 'desc' ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-white transition-colors" />
                                                            ) : (
                                                                <ChevronUp className="w-3.5 h-3.5 text-white transition-colors" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {getSortedData(securityBankContactData, "securityBankContact").map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                    <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.branch}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200 whitespace-nowrap">{row.phone || "-"}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left border-r border-gray-200 break-words">{row.email || "-"}</td>
                                                    <td className="px-4 py-2 text-xs text-gray-900 text-left whitespace-nowrap">{row.viber || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, #7a0f1f, transparent)` }} />
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
