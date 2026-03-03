import React from "react";
import { Eye, Image as ImageIcon } from "lucide-react";

const BORDER = "rgba(0,0,0,0.12)";

export interface CardGridListProps {
    items: Record<string, any>[];
    onView: (item: any) => void;
    imageKey?: string;
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

export default function CardGridList({
    items,
    onView,
    imageKey = "image",
    titleKey = "name",
    subtitleKey = "email",
    dateKey = "promoted_at",
    statusKey = "status",
    titleLabel = "Account Name",
    subtitleLabel = "Email",
    dateLabel = "Promoted"
}: CardGridListProps) {
    if (!items || items.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, i) => {
                const title = item[titleKey] || "—";
                const subtitle = item[subtitleKey] || "—";
                const status = item[statusKey];
                const date = item[dateKey];
                const imageUrl = item[imageKey];

                return (
                    <div
                        key={item.id || i}
                        className="rounded-xl overflow-hidden bg-white border shadow-sm hover:shadow-md transition-all flex flex-col group"
                        style={{ borderColor: BORDER }}
                    >
                        <div className="relative w-full h-40 bg-gray-100 flex items-center justify-center border-b" style={{ borderColor: BORDER }}>
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ImageIcon className="w-12 h-12 text-gray-300" />
                            )}
                            <div className="absolute top-3 right-3">
                                <div
                                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${status === "Active" ? "bg-green-100/95 text-green-800" :
                                            status === "Pending" ? "bg-amber-100/95 text-amber-800" :
                                                status === "Suspended" ? "bg-red-100/95 text-red-800" :
                                                    "bg-gray-100/95 text-gray-800"
                                        }`}
                                >
                                    {status || "—"}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 truncate" title={title}>{title}</h3>
                                <p className="text-sm text-gray-500 truncate" title={subtitle}>{subtitle}</p>
                            </div>

                            {dateLabel && date && (
                                <div className="mt-auto mb-4 bg-gray-50 rounded-lg p-2 border" style={{ borderColor: BORDER }}>
                                    <div className="text-xs text-gray-500">{dateLabel}</div>
                                    <div className="text-sm font-medium text-gray-900">{formatDate(date)}</div>
                                </div>
                            )}

                            <button
                                onClick={() => onView(item)}
                                className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity active:scale-95"
                                style={{ background: "#7a0f1f" }}
                            >
                                <Eye className="w-4 h-4" />
                                View Details
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
