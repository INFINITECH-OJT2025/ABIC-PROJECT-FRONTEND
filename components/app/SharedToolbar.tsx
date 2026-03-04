"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@base-ui/react";

const BORDER = "rgba(0,0,0,0.12)";

const Icons = {
    Refresh: (props: React.SVGProps<SVGSVGElement>) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
};

export interface SharedToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchPlaceholder?: string;
    statusFilter?: string;
    onStatusChange?: (status: string) => void;
    onRefresh: () => void;
    statusOptions?: { label: string; value: string }[];
    containerMaxWidth?: string;
    children?: React.ReactNode;
}

export default function SharedToolbar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Search...",
    statusFilter,
    onStatusChange,
    onRefresh,
    statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "Suspended", value: "Suspended" },
    ],
    containerMaxWidth = "max-w-xl",
    children,
}: SharedToolbarProps) {
    return (
        <div className="flex justify-end mt-6">
            <div className={`flex items-center gap-3 w-full ${containerMaxWidth}`}>
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-md border hover:bg-gray-50 transition-colors shrink-0"
                    style={{ borderColor: BORDER }}
                    title="Refresh"
                >
                    <Icons.Refresh />
                </button>

                {children}

                {statusFilter !== undefined && onStatusChange && (
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 text-sm px-3 text-gray-700 bg-white focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none shrink-0"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}

                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full text-sm h-10 pl-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#7B0F2B] focus:ring-2 focus:ring-[#7B0F2B]/20 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
