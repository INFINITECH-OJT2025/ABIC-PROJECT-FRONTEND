import React from "react";
import { PrintableData } from "./types";

interface PreviewSectionProps {
    formData: PrintableData;
}

function PreviewSection({ formData }: PreviewSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4 text-black">Live Preview</h2>

            <div
                id="printable-content"
                className="bg-white border-2 border-black text-black w-[1090px] min-h-[700px] overflow-visible"
                style={{
                    width: "1090px",
                    height: "725px",
                }}
            >
                {/* ================= HEADER ================= */}
                <div className="relative px-4 pt-3 pb-2 h-[120px]">
                    {/* TITLE - TOP MOST CENTER */}
                    <div className="flex justify-center">
                        <h2 className="text-3xl font-bold underline tracking-wider">
                            CASH VOUCHER
                        </h2>
                    </div>

                    {/* LOGO - LEFT */}
                    <div className="absolute left-4 top-2">
                        <img
                            src="/images/logo/ABIC-LOGO-VOUCHER.png"
                            alt="ABIC Realty Logo"
                            className="w-[200px] h-[70px] object-contain"
                        />
                    </div>
                </div>

                {/* ================= TOP SECTION ================= */}
                <div className="flex justify-between items-end text-xs px-4 mt-0 mb-3">
                    {/* LEFT SIDE - PAID TO */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Paid to:</span>
                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.paidTo || ""}
                        </span>
                    </div>

                    {/* RIGHT SIDE - VOUCHER / DATE */}
                    <div className="w-[260px] text-right space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Voucher No :</span>
                            <span className="border-b border-black w-36 h-5 text-left overflow-hidden whitespace-nowrap">
                                {formData.voucherNo || ""}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Date :</span>
                            <span className="border-b border-black w-36 h-5 text-left overflow-hidden whitespace-nowrap">
                                {formData.date || ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE ================= */}
                <div className="border border-black text-sm  mt-1 mx-4 mb-4">
                    <div className="grid grid-cols-12 border-b border-black font-semibold text-center bg-gray-100">
                        <div className="col-span-9 border-r border-black py-1">
                            PARTICULARS
                        </div>
                        <div className="col-span-3 py-1">AMOUNT</div>
                    </div>

                    <div className="grid grid-cols-12 h-[320px]">
                        <div className="col-span-9 border-r border-black p-3 relative overflow-hidden">
                            <div className="space-y-6">
                                {/* PURPOSE */}
                                <div className="flex gap-2">
                                    <span className="font-semibold min-w-[80px] h-[80px]">
                                        PURPOSE:
                                    </span>
                                    <div className="flex-1 whitespace-pre-wrap break-words">
                                        {formData.purpose || ""}
                                    </div>
                                </div>

                                {/* NOTE */}
                                <div className="flex gap-2">
                                    <span className="font-semibold min-w-[80px]">NOTE:</span>
                                    <div className="flex-1 whitespace-pre-wrap break-words">
                                        {formData.note || ""}
                                    </div>
                                </div>
                            </div>

                            <div></div>

                            <div className="absolute bottom-2 right-3 font-semibold">
                                TOTAL:
                            </div>
                        </div>

                        <div className="col-span-3 p-3 relative overflow-hidden">
                            <div className="absolute bottom-2 right-3 font-semibold whitespace-nowrap">
                                ₱{" "}
                                {formData.amount
                                    ? Number(formData.amount).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                    })
                                    : "0.00"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= PROJECT DETAILS ================= */}
                <div className="border border-black mt-3 px-3 py-2 text-xs space-y-3 mx-4">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm min-w-[130px]">
                            PROJECT DETAILS :
                        </span>
                        <span className="border-b border-black inline-block w-fit min-w-[240px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.projectDetails || ""}
                        </span>
                    </div>

                    <div className="flex items-center gap-5">
                        <span className="font-semibold text-sm min-w-[130px]">
                            OWNER/CLIENT :
                        </span>
                        <span className="border-b border-black inline-block w-fit min-w-[240px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.owner || ""}
                        </span>
                    </div>
                </div>

                {/* ================= SIGNATURES ================= */}
                <div className="grid grid-cols-12 mt-3 px-5 text-xs">
                    {/* RECEIVED FROM - 4 COLS */}
                    <div className="col-span-4">
                        <p className="mb-4 font-semibold">Received From</p>

                        <div className="flex items-end gap-4">
                            <div className="flex flex-col items-center relative">
                                {formData.receivedFromSignature && (
                                    <img
                                        src={formData.receivedFromSignature}
                                        alt="Received Signature"
                                        className="absolute -top-10 w-36 h-14 object-contain pointer-events-none"
                                    />
                                )}

                                <span className="border-b border-black w-56 h-6 text-center whitespace-nowrap">
                                    {formData.receivedBy || ""}
                                </span>

                                <span className="text-[10px] mt-1">
                                    PRINTED NAME AND SIGNATURE
                                </span>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="border-b border-black w-24 h-6 text-center whitespace-nowrap">
                                    {formData.receivedFromDate || ""}
                                </span>
                                <span className="text-[10px] mt-1">DATE</span>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE SPACE - 2 COLS */}
                    <div className="col-span-4"></div>

                    {/* APPROVED BY - 4 COLS */}
                    <div className="col-span-4">
                        <p className="mb-4 font-semibold text-left">Approved By</p>

                        <div className="flex items-end gap-4">
                            <div className="flex flex-col items-center relative">
                                {formData.approvedBySignature && (
                                    <img
                                        src={formData.approvedBySignature}
                                        alt="Approved Signature"
                                        className="absolute -top-10 w-36 h-14 object-contain pointer-events-none"
                                    />
                                )}

                                <span className="border-b border-black w-56 h-6 text-center whitespace-nowrap">
                                    {formData.approvedBy || ""}
                                </span>

                                <span className="text-[10px] mt-1">
                                    PRINTED NAME AND SIGNATURE
                                </span>
                            </div>

                            <div className="flex flex-col items-center">
                                <span className="border-b border-black w-24 h-6 text-center whitespace-nowrap">
                                    {formData.approvedByDate || ""}
                                </span>
                                <span className="text-[10px] mt-1">DATE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(PreviewSection);