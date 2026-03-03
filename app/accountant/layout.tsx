"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app/AppSidebar";
import { accountantNav } from "@/lib/navigation";

export default function AccountantLayout({
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
          const role = data.user?.role;
          if (role !== "accountant") {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#7B0F2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-[#F9F0F2] via-[#F5E8EC] to-[#F0E0E6]">
      <AppSidebar roleLabel="Accountant" basePath="/accountant" user={user} onLogout={handleLogout} navigation={accountantNav} />
      <main className="flex-1 min-w-0 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
