import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToastProvider } from "@/components/app/toast/AppToastProvider";
import { ExportProgressProvider } from "@/components/app/export/ExportProgressProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Abic",
  description: "Abic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <AppToastProvider>
          <ExportProgressProvider>
            {children}
          </ExportProgressProvider>
        </AppToastProvider>
      </body>
    </html>
  );
}