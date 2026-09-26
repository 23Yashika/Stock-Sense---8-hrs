// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Warehouse, ShieldCheck, Users, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import CreateWarehouseStaffModal from "@/components/settings/CreateWarehouseStaffModal";
import { getWarehouseStaffApi, AuthUser } from "@/lib/api";

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    try {
      const res = await getWarehouseStaffApi();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error("Error fetching staff list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const handleStaffCreated = () => {
    // Refresh list directly from PostgreSQL
    fetchStaffMembers();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-emerald-400" /> Settings & Staff Management
              </h1>
              <p className="text-xs text-slate-400">Manage warehouse locations and provision staff access.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" /> Role: Inventory Manager
          </div>
        </div>

        {/* Action Banner for Staff Creation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Warehouse className="w-4 h-4" /> Warehouse Personnel Management
            </div>
            <h2 className="text-xl font-bold text-white">Create Warehouse Staff Accounts</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              As an Inventory Manager, you can provision user credentials for Warehouse Staff to allow them to handle picking, packing, stock counts, and internal transfers.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Create Warehouse Staff
          </button>
        </div>

        {/* Registered Staff Table (Loaded from PostgreSQL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> Active Warehouse Staff ({staffList.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">Login ID</th>
                  <th className="py-3 px-4">Email ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Loading staff records ...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No Warehouse Staff accounts found in PostgreSQL. Click "Create Warehouse Staff" to add one!
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{staff.loginId}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{staff.email}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-md text-[11px]">
                          Warehouse Staff
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateWarehouseStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStaffCreated}
      />
    </div>
  );
}
