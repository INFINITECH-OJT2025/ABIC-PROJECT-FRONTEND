"use client";

import React from "react";

export function StatPill({
    icon: Icon,
    label,
    value,
    children,
}: {
    icon: React.ElementType;
    label?: React.ReactNode;
    value?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#7a0f1f]/20 bg-[#7a0f1f]/5 px-3 py-2 text-[#7a0f1f] shadow-sm transition-colors hover:bg-[#7a0f1f]/10">
            <Icon className="h-4 w-4 shrink-0" />
            {children ? (
                <span>{children}</span>
            ) : (
                <span>
                    {label}{value !== undefined ? ": " : ""}
                    {value === null ? (
                        <span className="inline-block w-6 h-3 rounded bg-white/20 animate-pulse align-middle" />
                    ) : (
                        <span className="font-extrabold">{value}</span>
                    )}
                </span>
            )}
        </div>
    );
}

export default function SummaryBar({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="border-b bg-white shadow-sm border-gray-200"
        >
            <div className="w-full px-4 md:px-8 py-3.5">
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider text-[#7a0f1f]">
                    {children}
                </div>
            </div>
        </div>
    );
}
