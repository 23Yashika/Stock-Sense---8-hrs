import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSense - Inventory Management System",
  description: "Real-time, modular stock and warehouse management application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-900 text-slate-100 font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
