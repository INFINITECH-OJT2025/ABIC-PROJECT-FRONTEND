"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import SummaryBar, { StatPill } from "@/components/app/SummaryBar";
import { superAdminNav } from "@/lib/navigation";
import { ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import TransactionForm, { TransactionMode } from "@/components/app/super/accountant/TransactionForm";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Sync mode with URL query param (?mode=deposit | withdrawal)
    const rawMode = searchParams.get("mode")?.toUpperCase();
    const initialMode: TransactionMode =
        rawMode === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";

    const [mode, setMode] = useState<TransactionMode>(initialMode);

    function handleModeChange(newMode: TransactionMode) {
        setMode(newMode);
        const params = new URLSearchParams(window.location.search);
        params.set("mode", newMode.toLowerCase());
        router.replace(`?${params.toString()}`, { scroll: false });
    }

    // Keep mode in sync if URL changes externally
    useEffect(() => {
        const m = searchParams.get("mode")?.toUpperCase();
        if (m === "WITHDRAWAL" || m === "DEPOSIT") {
            setMode(m as TransactionMode);
        }
    }, [searchParams]);

    return (
        <div className="min-h-full flex flex-col">
            <AppHeader
                navigation={superAdminNav}
                subtitle={mode === "DEPOSIT" ? "Record a new deposit transaction" : "Record a new withdrawal transaction"}
            />

            {/* Stats Bar */}
            <SummaryBar>
                <StatPill icon={ArrowDownCircle} label="Mode">
                    <span className={mode === "DEPOSIT" ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                        {mode === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                    </span>
                </StatPill>
                <StatPill icon={Receipt} label="Transaction" value="New" />
                <StatPill icon={mode === "DEPOSIT" ? ArrowDownCircle : ArrowUpCircle}
                    label={mode === "DEPOSIT" ? "Cash In" : "Cash Out"} value="—" />
            </SummaryBar>

            {/* Page Body */}
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <TransactionForm
                    initialMode={mode}
                    onModeChange={handleModeChange}
                />
            </div>
        </div>
    );
}
