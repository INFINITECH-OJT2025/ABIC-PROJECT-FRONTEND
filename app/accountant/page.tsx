"use client";

const BORDER = "rgba(0,0,0,0.12)";

export default function AccountantDashboard() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center shrink-0 border-b border-[#6A0D25]/30">
        <h1 className="text-lg font-semibold tracking-wide">Dashboard</h1>
      </div>

      <div className="flex-1 max-w-10xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <section
          className="rounded-lg bg-white p-5 shadow-sm border"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Overview</h2>
              <p className="text-sm text-gray-600 mt-1">Accountant dashboard and key metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Transactions Today", value: "24", sub: "New & updated", color: "#7a0f1f" },
              { label: "Pending Receipts", value: "6", sub: "Awaiting review", color: "#7a0f1f" },
              { label: "Ledger Entries", value: "1,842", sub: "This month", color: "#7a0f1f" },
              { label: "Bank Accounts", value: "12", sub: "Active", color: "#7a0f1f" },
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
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">Recent Transactions</h3>
              <p className="text-sm text-gray-600 mb-4">Latest accounting activity</p>
              <div className="space-y-3">
                {[
                  { title: "Journal entry posted", desc: "Transaction #JT-2847", time: "1 hour ago" },
                  { title: "Receipt saved", desc: "Bank deposit receipt", time: "3 hours ago" },
                  { title: "Ledger updated", desc: "Client ledger sync", time: "5 hours ago" },
                ].map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(123, 15, 43, 0.15)" }}
                    >
                      <span className="text-xs font-bold" style={{ color: "#7B0F2B" }}>!</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 text-sm">{a.title}</p>
                      <p className="text-gray-600 text-xs">{a.desc}</p>
                      <p className="text-gray-400 text-xs mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-5" style={{ borderColor: BORDER }}>
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">Quick Links</h3>
              <p className="text-sm text-gray-600 mb-4">Jump to common tasks</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "New Transaction", href: "/accountant/transactions" },
                  { label: "Transactions Receipt", href: "/accountant/saved-receipts" },
                  { label: "Mains Ledger", href: "/accountant/ledger/mains" },
                  { label: "Account Summary", href: "/accountant/account-summary" },
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
          </div>
        </section>
      </div>
    </div>
  );
}
