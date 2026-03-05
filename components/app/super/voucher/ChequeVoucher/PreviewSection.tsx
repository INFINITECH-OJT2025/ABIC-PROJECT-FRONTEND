import React from "react";
import { PrintableData } from "./types";

interface PreviewSectionProps {
    formData: PrintableData;
}

function PreviewSection({ formData }: PreviewSectionProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 mt-5">
            <h2 className="text-xl font-semibold mb-4 text-black">Live Preview</h2>

            <div
                id="printable-content"
                className="bg-white border-2 border-black text-black w-[1090px] min-h-[700px] overflow-visible"
                style={{
                    width: "1090px",
                    height: "710px",
                }}
            >
                {/* ================= HEADER ================= */}
                <div className="relative px-4 pt-3 pb-2 h-[120px]">
                    {/* TITLE */}
                    <div className="flex justify-center">
                        <h2 className="text-3xl font-bold underline tracking-wider">
                            CHEQUE VOUCHER
                        </h2>
                    </div>

                    {/* LOGO */}
                    <div className="absolute left-4 top-2">
                        <img
                            src="/images/logo/ABIC-LOGO-VOUCHER.png"
                            alt="ABIC Realty Logo"
                            className="h-[100px] w-auto object-contain"
                        />
                    </div>
                </div>

                {/* ================= TOP SECTION ================= */}
                <div className="flex justify-between items-end text-xs px-4 mb-3">
                    {/* LEFT - PAID TO */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Paid to:</span>
                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.paidTo || ""}
                        </span>
                    </div>

                    {/* RIGHT - VOUCHER / DATE */}
                    <div className="w-[220px] space-y-1">
                        {/* VOUCHER NO */}
                        <div className="flex items-center">
                            <span className="font-semibold w-[100px]">
                                VOUCHER NO
                            </span>
                            <span className="w-[8px] text-center">:</span>
                            <span className="border-b border-black w-64 h-5 overflow-hidden whitespace-nowrap">
                                {formData.voucherNo || ""}
                            </span>
                        </div>

                        {/* DATE */}
                        <div className="flex items-center">
                            <span className="font-semibold w-[100px]">
                                DATE
                            </span>
                            <span className="w-[8px] text-center">:</span>
                            <span className="border-b border-black w-64 h-5 overflow-hidden whitespace-nowrap">
                                {formData.date || ""}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ================= TABLE ================= */}
                <div className="border border-black text-sm mt-1 mx-4 mb-4">
                    <div className="grid grid-cols-12 border-b border-black font-semibold text-center bg-gray-100">
                        <div className="col-span-9 border-r border-black py-1">
                            PARTICULARS
                        </div>
                        <div className="col-span-3 py-1">
                            AMOUNT
                        </div>
                    </div>

                    <div className="grid grid-cols-12 h-[320px]">
                        {/* LEFT COLUMN */}
                        <div className="col-span-9 border-r border-black p-3 relative overflow-hidden">
                            <div className="space-y-6">
                                {/* PURPOSE */}
                                <div className="flex">
                                    <span className="font-semibold min-w-[80px] h-[80px]">
                                        PURPOSE
                                    </span>
                                    <span className="w-[15px] text-center">:</span>
                                    <div className="flex-1 whitespace-pre-wrap break-words">
                                        {formData.purpose || ""}
                                    </div>
                                </div>

                                {/* NOTE */}
                                <div className="flex mt-2">
                                    <span className="font-semibold min-w-[80px]">
                                        NOTE
                                    </span>
                                    <span className="w-[15px] text-center">:</span>
                                    <div className="flex-1 whitespace-pre-wrap break-words">
                                        {formData.note || ""}
                                    </div>
                                </div>

                                {/* CHEQUE DETAILS */}
                                <div className="space-y-1 mt-4">
                                    <div className="flex items-center">
                                        <span className="font-semibold w-[170px]">
                                            CHECK DATE
                                        </span>
                                        <span className="w-[10px] text-center">:</span>
                                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                                            {formData.checkDate || ""}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="font-semibold w-[170px]">
                                            CHECK NO
                                        </span>
                                        <span className="w-[10px] text-center">:</span>
                                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                                            {formData.checkNo || ""}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="font-semibold w-[170px]">
                                            ACCOUNT NAME
                                        </span>
                                        <span className="w-[10px] text-center">:</span>
                                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                                            {formData.accountName || ""}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="font-semibold w-[170px]">
                                            ACCOUNT NUMBER
                                        </span>
                                        <span className="w-[10px] text-center">:</span>
                                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                                            {formData.accountNumber || ""}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="font-semibold w-[170px]">
                                            AMOUNT
                                        </span>
                                        <span className="w-[10px] text-center">:</span>
                                        <span className="border-b border-black inline-block w-fit min-w-[160px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                                            {formData.amount || ""}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-2 right-3 font-semibold">
                                TOTAL:
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
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
                <div className="border border-black mt-2 px-3 py-2 text-xs space-y-1 mx-4">
                    <div className="flex items-center">
                        <span className="font-semibold text-sm w-[130px]">
                            PROJECT DETAILS
                        </span>
                        <span className="w-[15px] text-center">:</span>
                        <span className="border-b border-black inline-block w-fit min-w-[240px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.projectDetails || ""}
                        </span>
                    </div>

                    <div className="flex items-center">
                        <span className="font-semibold text-sm w-[130px]">
                            OWNER / CLIENT
                        </span>
                        <span className="w-[15px] text-center">:</span>
                        <span className="border-b border-black inline-block w-fit min-w-[240px] max-w-[520px] h-5 overflow-hidden whitespace-nowrap">
                            {formData.owner || ""}
                        </span>
                    </div>
                </div>

                {/* ================= SIGNATURES ================= */}
                <div className="grid grid-cols-12 mt-3 px-5 text-xs">
                    {/* RECEIVED FROM */}
                    <div className="col-span-4">
                        <p className="mb-4 font-semibold">
                            Received From
                        </p>

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
                                <span className="border-b border-black w-24 h-6">
                                    {formData.receivedFromDate || ""}
                                </span>
                                <span className="text-[10px] mt-1">
                                    DATE
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-4" />

                    {/* APPROVED BY */}
                    <div className="col-span-4">
                        <p className="mb-4 font-semibold text-left">
                            Approved By
                        </p>

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
                                <span className="border-b border-black w-24 h-6">
                                    {formData.approvedByDate || ""}
                                </span>
                                <span className="text-[10px] mt-1">
                                    DATE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(PreviewSection);