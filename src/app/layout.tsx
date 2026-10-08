import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AccountSlot } from "@/components/AccountMark";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Locksmith — Locked picks & research",
  description: "Members-only MLB and NFL research. Settled tickets are posted. Live plays stay inside.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid`}>
        <AccountSlot />
        {children}
        <footer className="px-4 py-6 text-center text-xs text-muted">
          <Link href="/disclaimer">21+ only, not financial advice, 1-800-GAMBLER</Link>
        </footer>
      </body>
    </html>
  );
}
