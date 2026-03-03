import React from "react";
import { Eye } from "lucide-react";

const BORDER = "rgba(0,0,0,0.12)";

export interface CardRowColumn {
    header: React.ReactNode;
    key?: string;
    render?: (item: any) => React.ReactNode;
    className?: string; // used for header & cell width/alignment (e.g. "w-32 text-right")
}

export interface CardRowListProps {
    items: Record<string, any>[];
    onView?: (item: any) => void;
    columns?: CardRowColumn[];

    // Legacy default props
    titleKey?: string;
    subtitleKey?: string;
    dateKey?: string;
    statusKey?: string;
    titleLabel?: string;
    subtitleLabel?: string;
    dateLabel?: string;
}

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid date";
        return date.toLocaleDateString();
    } catch {
        return "Invalid date";
    }
};

export default function CardRowList({
    items,
    onView,
    columns,
    titleKey = "name",
    subtitleKey = "email",
    dateKey = "promoted_at",
    statusKey = "status",
    titleLabel = "Account Name",
    subtitleLabel = "Email",
    dateLabel = "Promoted"
}: CardRowListProps) {
    if (!items || items.length === 0) return null;

    // Use customized columns or fallback to the standard legacy layout
    const activeColumns: CardRowColumn[] = columns || [
        {
            header: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-bold text-neutral-900">
                    <div>{titleLabel}</div>
                    <div>{subtitleLabel}</div>
                </div>
            ),
            key: "primary",
            className: "flex-1 min-w-[200px]",
            render: (item) => {
                const title = item[titleKey] || "—";
                const subtitle = item[subtitleKey] || "—";
                const initial = typeof title === 'string' && title.length > 0 ? title.charAt(0).toUpperCase() : "?";

                return (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-[#7a0f1f]/10 flex items-center justify-center shrink-0">
                            <span className="text-base font-semibold text-[#7a0f1f]">{initial}</span>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="min-w-0">
                                <div className="font-semibold text-neutral-900 truncate" title={title}>{title}</div>
                                <div className="text-xs text-neutral-500 mt-0.5">{titleLabel}</div>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm text-neutral-900 truncate" title={subtitle}>{subtitle}</div>
                                <div className="text-xs text-neutral-500 mt-0.5">{subtitleLabel}</div>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        ...(dateLabel ? [{
            header: <div className="text-right text-sm font-bold text-neutral-900">{dateLabel}</div>,
            key: "date",
            className: "w-24 shrink-0 hidden sm:block",
            render: (item: any) => {
                const date = item[dateKey];
                return (
                    <div className="text-right">
                        <div className="text-xs text-neutral-500 mb-1">{dateLabel}</div>
                        <div className="text-xs text-neutral-700">{date ? formatDate(date) : "—"}</div>
                    </div>
                );
            }
        }] : []),
        {
            header: <div className="text-sm font-bold text-neutral-900">Status</div>,
            key: "status",
            className: "w-24 shrink-0 hidden sm:block",
            render: (item) => {
                const status = item[statusKey];
                return (
                    <div
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block ${status === "Active" ? "bg-green-100 text-green-700" :
                                status === "Pending" ? "bg-amber-100 text-amber-700" :
                                    status === "Suspended" ? "bg-red-100 text-red-700" :
                                        "bg-gray-100 text-gray-700"
                            }`}
                    >
                        {status || "—"}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="w-full relative">
            {/* Header Row (Sticky) */}
            <div
                className="sticky top-0 z-10 rounded-md border bg-neutral-50/95 backdrop-blur shadow-sm px-4 py-3 mb-3 flex items-center gap-4 min-w-max md:min-w-0"
                style={{ borderColor: BORDER }}
            >
                {activeColumns.map((col, i) => (
                    <div key={col.key || i} className={col.className}>
                        {col.header}
                    </div>
                ))}

                {/* Fixed Spacer for 'View' Button column alignment */}
                {onView && <div className="w-[85px] shrink-0"></div>}
            </div>

            {/* List Body */}
            <div className="space-y-3 min-w-max md:min-w-0">
                {items.map((item, i) => (
                    <div
                        key={item.id || i}
                        className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                        style={{ borderColor: BORDER }}
                    >
                        {activeColumns.map((col, cIndex) => (
                            <div key={col.key || cIndex} className={col.className}>
                                {col.render ? col.render(item) : (
                                    <div className="text-sm text-neutral-900 truncate" title={item[col.key || ""]}>
                                        {item[col.key || ""] || "—"}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Action Column */}
                        {onView && (
                            <div className="w-[85px] shrink-0 text-right">
                                <button
                                    onClick={() => onView(item)}
                                    className="inline-flex items-center justify-center gap-2 w-full rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 transition-opacity active:scale-95"
                                    style={{ background: "#7a0f1f", height: 32 }}
                                    title="View"
                                    aria-label="View"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
