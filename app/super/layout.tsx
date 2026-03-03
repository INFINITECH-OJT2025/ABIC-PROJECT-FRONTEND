"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app/AppSidebar";
import { superAdminNav } from "@/lib/navigation";

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
          // Only allow super_admin and super_admin_viewer (adjust exact role string if your backend uses a different one)
          const role = data.user?.role;

          if (role !== "super_admin") {
            router.replace("/auth/login");
            return;
          }
        } else {
          router.push("/auth/login");
        }
      } catch {
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden flex bg-gradient-to-br from-[#F9F0F2] via-[#F5E8EC] to-[#F0E0E6]">
        {/* Skeleton Sidebar */}
        <AppSidebar
          roleLabel="Super Admin"
          basePath="/super"
          user={null}
          onLogout={() => { }}
          navigation={superAdminNav}
        />

        <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Skeleton Header */}
          <div className="relative flex-shrink-0 bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 animate-pulse border border-white/10" />
              <div className="space-y-3">
                <div className="h-6 w-48 bg-white/20 animate-pulse rounded-md" />
                <div className="h-4 w-32 bg-white/20 animate-pulse rounded-md" />
              </div>
            </div>
          </div>

          {/* Skeleton Content Group */}
          <div className="flex-1 p-6 space-y-6 overflow-hidden">
            {/* Search / Filter Toolbar Skeleton */}
            <div className="w-full h-14 bg-white/50 animate-pulse rounded-xl border border-black/5" />

            {/* Data Table / Cards Skeleton */}
            <div className="w-full h-full bg-white/50 animate-pulse rounded-xl border border-black/5" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-[#F9F0F2] via-[#F5E8EC] to-[#F0E0E6]">
      <AppSidebar roleLabel="Super Admin" basePath="/super" user={user} onLogout={handleLogout} navigation={superAdminNav} />
      <main className="flex-1 min-w-0 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  );
}