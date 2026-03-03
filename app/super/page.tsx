"use client"

const BORDER = 'rgba(0,0,0,0.12)'

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header bar - matches employee page design */}
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
              <p className="text-sm text-gray-600 mt-1">System overview and key metrics</p>
            </div>
          </div>

          {/* KPI Cards - matching employee page card style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Records", value: "45,892", sub: "+342 this month", color: "#7a0f1f" },
              { label: "Reports Generated", value: "127", sub: "Today & this week", color: "#7a0f1f" },
              { label: "Pending Exports", value: "8", sub: "Awaiting processing", color: "#7a0f1f" },
              { label: "Active Users Today", value: "156", sub: "Currently logged in", color: "#7a0f1f" },
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

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="rounded-lg border p-5" style={{ borderColor: BORDER }}>
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">System Activity</h3>
              <p className="text-sm text-gray-600 mb-4">Daily activity across all systems</p>
              <div className="h-48 flex items-end justify-between gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const height = Math.random() * 60 + 30
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t transition-colors hover:opacity-90"
                        style={{
                          height: `${height}%`,
                          background: "linear-gradient(to top, #7B0F2B, #A4163A)",
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border p-5" style={{ borderColor: BORDER }}>
              <h3 className="text-base font-bold text-[#5f0c18] mb-2">Recent Activities</h3>
              <p className="text-sm text-gray-600 mb-4">Latest system-wide activities</p>
              <div className="space-y-3">
                {[
                  { title: "New admin added", desc: "System administrator created", time: "2 hours ago" },
                  { title: "System report viewed", desc: "Monthly system report accessed", time: "4 hours ago" },
                  { title: "Credentials sent", desc: "Password reset email sent", time: "6 hours ago" },
                  { title: "Data exported", desc: "System data exported successfully", time: "1 day ago" },
                ].map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(123, 15, 43, 0.15)" }}>
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
          </div>
        </section>
      </div>
    </div>
  )
}