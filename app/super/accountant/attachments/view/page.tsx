"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from "lucide-react";

function AttachmentGallery() {
    const searchParams = useSearchParams();

    // Parse query params: files=name1|url1,name2|url2,...
    const filesParam = searchParams.get("files") || "";
    const title = searchParams.get("title") || "Instrument Attachments";
    const voucherNo = searchParams.get("voucherNo") || "";

    const files = React.useMemo(() => {
        if (!filesParam) return [];
        return filesParam.split(",").map((item) => {
            const [name, ...urlParts] = item.split("|");
            return { name: decodeURIComponent(name || "—"), url: decodeURIComponent(urlParts.join("|") || "") };
        });
    }, [filesParam]);

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [loadError, setLoadError] = useState<Record<number, boolean>>({});

    const selectedFile = files[selectedIdx] || null;

    const isImage = (url: string) => {
        const ext = url.split(".").pop()?.toLowerCase() || "";
        return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext) ||
            url.includes("/attachments/");
    };

    const handleDownload = (url: string, name: string) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (files.length === 0) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">No Attachments Found</h2>
                    <p className="text-sm text-gray-500 mt-2">The link may be invalid or expired.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Top bar */}
            <header className="bg-[#7a0f1f] px-6 py-4 flex items-center justify-between shadow-lg">
                <div>
                    <h1 className="text-lg font-bold tracking-tight">
                        {title}
                    </h1>
                    {voucherNo && (
                        <p className="text-sm text-white/70 mt-0.5">
                            Voucher: <span className="font-semibold text-white/90">{voucherNo}</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white/70">
                        {files.length} file{files.length > 1 ? "s" : ""}
                    </span>
                    <button
                        onClick={() => window.close()}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar — file list */}
                <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Files</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {files.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSelectedIdx(idx); setZoom(1); }}
                                className={`w-full text-left px-4 py-3 border-b border-gray-800/50 transition-all ${selectedIdx === idx
                                    ? "bg-[#7a0f1f]/30 border-l-4 border-l-[#7a0f1f]"
                                    : "hover:bg-gray-800/50 border-l-4 border-l-transparent"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon className={`w-4 h-4 shrink-0 ${selectedIdx === idx ? "text-[#e8a0a0]" : "text-gray-500"}`} />
                                    <span className={`text-sm font-semibold truncate ${selectedIdx === idx ? "text-white" : "text-gray-400"}`}>
                                        {file.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main preview area */}
                <main className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                disabled={selectedIdx <= 0}
                                onClick={() => { setSelectedIdx(selectedIdx - 1); setZoom(1); }}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-400">
                                {selectedIdx + 1} / {files.length}
                            </span>
                            <button
                                disabled={selectedIdx >= files.length - 1}
                                onClick={() => { setSelectedIdx(selectedIdx + 1); setZoom(1); }}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors disabled:opacity-30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono text-gray-400 w-12 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <div className="w-px h-5 bg-gray-700 mx-2" />
                            <button
                                onClick={() => selectedFile && handleDownload(selectedFile.url, selectedFile.name)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7a0f1f] hover:bg-[#5f0c18] text-sm font-semibold transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Image/Preview */}
                    <div className="flex-1 flex items-center justify-center overflow-auto p-8 bg-gray-950/50">
                        {selectedFile && (
                            loadError[selectedIdx] ? (
                                <div className="text-center">
                                    <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 font-semibold">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">Preview not available</p>
                                    <button
                                        onClick={() => handleDownload(selectedFile.url, selectedFile.name)}
                                        className="mt-4 px-4 py-2 bg-[#7a0f1f] hover:bg-[#5f0c18] rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Download File
                                    </button>
                                </div>
                            ) : (
                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.name}
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transformOrigin: "center center",
                                        transition: "transform 0.2s ease",
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "contain"
                                    }}
                                    className="rounded-lg shadow-2xl"
                                    onError={() => setLoadError(prev => ({ ...prev, [selectedIdx]: true }))}
                                />
                            )
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function AttachmentsViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
            <AttachmentGallery />
        </Suspense>
    );
}
