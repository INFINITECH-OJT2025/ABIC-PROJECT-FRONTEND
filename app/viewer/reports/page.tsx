"use client";

const BORDER = "rgba(0,0,0,0.12)";

export default function ViewerReportsPage() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Reports</h1>
      </div>
      <div className="flex-1 p-6">
        <div className="rounded-lg bg-white p-6 shadow-sm border" style={{ borderColor: BORDER }}>
          <p className="text-gray-600">Reports (view only). Content coming soon.</p>
        </div>
      </div>
    </div>
  );
}
