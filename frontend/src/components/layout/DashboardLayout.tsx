// src/components/layout/DashboardLayout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Package,
  Inbox,
  Truck,
  Sliders,
  History,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    {
      name: "Operations",
      icon: Inbox,
      children: [
        { name: "Receipts (Incoming)", href: "/operations/receipts", icon: Inbox },
        { name: "Delivery Orders", href: "/operations/delivery-orders", icon: Truck },
        { name: "Stock Adjustments", href: "/operations/adjustments", icon: Sliders },
        { name: "Move History", href: "/operations/move-history", icon: History },
      ],
    },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-8">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">StockSense</span>
            </Link>
            <button
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="space-y-1 pt-2">
                    <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {item.name}
                    </div>
                    {item.children.map((sub) => {
                      const isActive = pathname === sub.href;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                IM
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200">Alex Carter</div>
                <div className="text-[10px] text-slate-500">Inventory Manager</div>
              </div>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-rose-400 transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search SKU, Product, or Reference..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-10 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}