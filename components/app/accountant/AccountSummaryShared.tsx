"use client";

import React, { useState } from "react";
import AppHeader from "@/components/app/AppHeader";
import { Download, Search, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import SharedToolbar from "@/components/app/SharedToolbar";

const BORDER = "rgba(0,0,0,0.12)";

export default function AccountSummaryShared({ role }: { role: "superadmin" | "accountant" | "viewer" }) {
    const [query, setQuery] = useState("");
    const [selectedTable, setSelectedTable] = useState("summary");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const [sortConfigs, setSortConfigs] = useState<Record<string, { key: string, direction: 'asc' | 'desc' } | null>>({});

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


    const unitOwnerData = [
        { owner: "ABIGAIL RUTHCHIN LAIFUN LIM", unit: "Bellagio B3 Slot 10" },
        { owner: "ALFONSO VY", unit: "Jazz Res. Tower A 1602" },
        { owner: "AMADOR , KRISTINE ANNE BANTOC", unit: "Air Res. 2470" },
        { owner: "ATHENA SOPHIA RHOSSA TIBI", unit: "Seibu 8A2" },
        { owner: "CHANGJIANG HUANG", unit: "KBR 2517" },
        { owner: "CHANGJIANG HUANG", unit: "KBR 5113" },
        { owner: "CHANGJIANG HUANG", unit: "Gramercy Res. 1702" },
        { owner: "CHENGSHENG SHI", unit: "KGR Icho 403" },
        { owner: "CHENGSHENG SHI", unit: "KGR Icho 412" },
        { owner: "CHEN BINBIN", unit: "Sheridan ST 3007" },
    ];

    const bankAccountsData = [
        { name: "ABIC REALTY", bank: "SECURITY BANK (202)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-381-202" },
        { name: "ABIC REALTY", bank: "SECURITY BANK (443)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-382-443" },
        { name: "ABIC REALTY", bank: "SECURITY BANK (483)", accountName: "ABIC REALTY CORPORATION", accountNumber: "0000-043-382-483" },
        { name: "ABIC REALTY & CONSULTANCY", bank: "SECURITY BANK (544)", accountName: "ABIC REALTY & CONSULTANCY CORPORATION", accountNumber: "0000-067-389-544" },
        { name: "ABIC UNO TRADING", bank: "SECURITY BANK - USD", accountName: "ABIC UNO TRADING CORP.", accountNumber: "0000-057-905-043" },
        { name: "ANGELLE S. SARMIENTO", bank: "SECURITY BANK", accountName: "ANGELLE SAMSON SARMIENTO", accountNumber: "0000-026-376-543" },
        { name: "BAO HAOMIAO", bank: "SECURITY BANK", accountName: "BAO HAOMIAO", accountNumber: "0000-033-123-578" },
        { name: "CHOU TIANYI", bank: "EASTWEST", accountName: "TIANYI CHOU", accountNumber: "200019904317" },
        { name: "DANDAN LI", bank: "BDO", accountName: "DANDAN LI", accountNumber: "006940028470" },
        { name: "FENG DAN", bank: "UNION BANK", accountName: "JIE ZHOU", accountNumber: "001540004445" },
    ];

    const otherBankAccountsData = [
        { name: "KALBE INTERNATIONAL PTE LTD.", bank: "PHILIPPINE BUSINESS BANK", accountName: "KALBE INTERNATIONAL PTE LTD.", accountNumber: "011000020780" },
        { name: "INFINITECH ADVERTISING CORPORATION", bank: "SECURITY BANK", accountName: "INFINITECH ADVERTISING CORPORATION", accountNumber: "0000074264683" },
    ];

    const employeeBankAccountsData = [
        { name: "ANGELY VICTORIANO", bank: "BDO", accountName: "ANGELY VICTORIANO", accountNumber: "013460007685" },
        { name: "MARIA KRISSA CHAREZ R. BONGON", bank: "SECURITY BANK", accountName: "MARIA KRISSA CHAREZ R. BONGON", accountNumber: "000069637410" },
    ];

    const securityBankContactData = [
        { branch: "SECURITY BANK - MEDICAL PLAZA", phone: "0917-886-5938", email: "", viber: "0917-886-5938" },
        { branch: "SECURITY BANK - CHINO ROCES - YAKAL", phone: "0917-845-3693 / 0920-986-041", email: "crmarano@securitybank.com.ph", viber: "0917-845-3693" },
        { branch: "SECURITY BANK - PASAY TAFT BRANCH", phone: "0917-801-3469 / 0920-977-975", email: "bracamonte@securitybank.com.ph, JAJalina@securitybank.com.ph, pasaytaft@securitybank.com.ph", viber: "" },
    ];

    const condoBankAccountsData = [
        { condominium: "ADB Avenue Tower", bank: "SECURITY BANK", accountName: "ADB Tower Condominium Corporation", accountNumber: "0000018983147" },
        { condominium: "Alea Residences", bank: "GCASH (Bills Payment)", accountName: "DMCI Homes (Condo Corp)", accountNumber: "Alea Budi 409" },
        { condominium: "Bellagio Two Condominium", bank: "CHINABANK", accountName: "Bellagio Two Condominium Association, Inc.", accountNumber: "2550017017" },
        { condominium: "Brixton Place", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "Brent1207" },
        { condominium: "Brixton Place", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "Brent4204" },
        { condominium: "Campos Rueda", bank: "METROBANK", accountName: "CAMPOS RUEDA & SONS INC", accountNumber: "0047004543153" },
        { condominium: "Coast Residences", bank: "BDO (Bills Payment)", accountName: "COASTB012833", accountNumber: "" },
        { condominium: "Fairlane", bank: "GCASH / Paymongo", accountName: "3518", accountNumber: "6000135018" },
        { condominium: "Fairlane", bank: "GCASH / Paymongo", accountName: "3519", accountNumber: "6000135019" },
        { condominium: "Field Residences", bank: "BDO (Bills Payment)", accountName: "Field Residences Condominium Corporation", accountNumber: "FIELDB80801" },
        { condominium: "Gramercy Residences", bank: "BDO (Bills Payment)", accountName: "Gramercy Residences Condominium Corporation", accountNumber: "003560197990" },
        { condominium: "Kai Garden Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5700204012" },
        { condominium: "Kai Garden Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5700204003" },
        { condominium: "Kai Garden Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5700203015" },
        { condominium: "Knightsbridge Residences", bank: "BDO (Bills Payment)", accountName: "Knightsbridge Residences", accountNumber: "003560233008" },
        { condominium: "Kroma Tower", bank: "BPI", accountName: "Kroma Tower Condominium Corporation", accountNumber: "1901-0012-58" },
        { condominium: "Milano Residences", bank: "METROBANK", accountName: "The Milano Residences Condo Corp", accountNumber: "7707770001761" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500132006" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500214010" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500119016" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500234010" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500133008" },
        { condominium: "Prisma Residences", bank: "GCASH (Bills Payment)", accountName: "*depends who own the unit property*", accountNumber: "5500102004" },
        { condominium: "Salcedo Skysuite", bank: "UNIONBANK", accountName: "Salcedo Skysuites Condominium Association Inc", accountNumber: "0012-4003-6090" },
        { condominium: "Sheridan South Tower", bank: "GCASH (Bills Payment)", accountName: "DMCI Homes (Condo Corp)", accountNumber: "Sheridan3007" },
        { condominium: "The Milano Residences Condo Corp", bank: "METROBANK", accountName: "The Milano Residences Condo Corp", accountNumber: "770-7-77000176-1" },
        { condominium: "The Venice Luxury Residences", bank: "UNIONBANK", accountName: "The Venice Luxury Residences Condominium Associa", accountNumber: "001240034286" },
    ];

    const remainingMoneyData = [
        { clientName: "ABIC - UNIT 303", amount: -154312.08 },
        { clientName: "ABIC REALTY", amount: 0 },
        { clientName: "ANGELLE SARMIENTO", amount: -320999.97 },
        { clientName: "BAO HAOMIAO", amount: 23000.00 },
        { clientName: "CHEN BINBIN", amount: 100050.00 },
        { clientName: "CHOU TIANYI", amount: 56750.00 },
        { clientName: "DANDAN LI", amount: -36026.25 },
        { clientName: "FENG DAN", amount: 0 },
        { clientName: "GUO JUNSHENG", amount: -33566.79 },
        { clientName: "GUO XIONGZHOU", amount: -594.58 },
    ];

    const clientDebtData = [
        { clientName: "ABIC - UNIT 303", amount: -154312.08 },
        { clientName: "ABIC REALTY", amount: -1000.00 },
        { clientName: "ANGELLE SARMIENTO", amount: -320999.97 },
        { clientName: "DANDAN LI", amount: -36026.25 },
        { clientName: "GUO JUNSHENG", amount: -33566.79 },
        { clientName: "GUO XIONGZHOU", amount: -594.58 },
        { clientName: "HONG TAO", amount: -3658.87 },
        { clientName: "INFINITECH ADVERTISING CORP.", amount: -393175.45 },
        { clientName: "INFINITRADE (UNIT 111)", amount: -155986.45 },
        { clientName: "JULIE CHEN", amount: -2889.44 },
    ];

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
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7a0f1f] focus:ring-2 focus:ring-[#7a0f1f]/20 focus:outline-none shrink-0"
                            >
                                <option value="summary">Summary (Money & Debt)</option>
                                <option value="bank_accounts">Unit Owners & Bank Accounts</option>
                                <option value="other_accounts">Other/Condo Bank Accounts</option>
                                <option value="employee_contacts">Employee / Security Bank Contact</option>
                            </select>
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
                                                {getSortedData(remainingMoneyData, "remainingMoney").map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                        <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.clientName}</td>
                                                        <td className={`px-4 py-2 text-sm font-bold text-right ${row.amount < 0 ? 'text-[#dc2626]' : 'text-gray-900'}`}>{formatCurrency(row.amount)}</td>
                                                    </tr>
                                                ))}
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
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-white w-1/3">3,609,441.21</td>
                                                </tr>
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">TOTAL CLIENT DEBT</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">-1,628,580.28</td>
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
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-white w-1/3">109,000.00</td>
                                                </tr>
                                                <tr className="bg-[#7a0f1f]">
                                                    <td className="px-4 py-3 font-bold text-xs uppercase text-center border-r border-white/20 text-white tracking-wider w-2/3">MISSING AMOUNT</td>
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">(3,500,441.21)</td>
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
                                                {getSortedData(clientDebtData, "clientDebt").map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                        <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.clientName}</td>
                                                        <td className="px-4 py-2 text-sm font-bold text-right text-[#dc2626]">{formatCurrency(row.amount)}</td>
                                                    </tr>
                                                ))}
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
                                                    <td className="px-4 py-3 font-bold text-sm text-right text-[#ff8a8a] w-1/3">-1,629,580.28</td>
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
                                                    <tr key={idx} className="border-b border-gray-100 transition-colors" style={{ background: idx % 2 === 1 ? 'rgba(253, 242, 248, 0.6)' : '#ffffff' }}>
                                                        <td className="px-4 py-2 text-xs text-gray-900 font-bold text-left border-r border-gray-200 uppercase">{row.owner}</td>
                                                        <td className="px-4 py-2 text-xs text-gray-900 text-left">{row.unit}</td>
                                                    </tr>
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
