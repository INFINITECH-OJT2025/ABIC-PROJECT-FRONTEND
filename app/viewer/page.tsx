"use client";

const BORDER = "rgba(0,0,0,0.12)";

export default function ViewerDashboard() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Dashboard (Viewer)</h1>
      </div>

      <div className="flex-1 max-w-10xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section
          className="rounded-lg bg-white p-5 shadow-sm border"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Read-only Overview</h2>
              <p className="text-sm text-gray-600 mt-1">View reports and analytics (viewer access)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Reports Available", value: "24", sub: "View only", color: "#7a0f1f" },
              { label: "Analytics Views", value: "8", sub: "Dashboards", color: "#7a0f1f" },
              { label: "Activity Logs", value: "1,240", sub: "Last 30 days", color: "#7a0f1f" },
              { label: "Users", value: "45", sub: "Overview only", color: "#7a0f1f" },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-lg bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: BORDER }}
              >
                <p className="text-xs font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="rounded-lg border p-5" style={{ borderColor: BORDER }}>
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">Quick Access</h3>
              <p className="text-sm text-gray-600 mb-4">View reports and activity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Reports", href: "/viewer/reports" },
                  { label: "Analytics", href: "/viewer/analytics" },
                  { label: "Activity Log", href: "/viewer/activity" },
                  { label: "Ledger Summary", href: "/viewer/ledger-summary" },
                ].map((link, i) => (
                  <a
                    key={i}
                    href={link.href}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-colors text-sm font-medium text-gray-800"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-5" style={{ borderColor: BORDER }}>
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">Viewer Notice</h3>
              <p className="text-sm text-gray-600">
                You are logged in with viewer access. You can view reports, analytics, and activity logs but cannot make changes to data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
