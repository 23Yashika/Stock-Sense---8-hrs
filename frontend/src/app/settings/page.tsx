// src/app/settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  Warehouse as WarehouseIcon,
  ShieldCheck,
  Users,
  ArrowLeft,
  Settings as SettingsIcon,
  Plus,
  MapPin,
  X,
  AlertCircle,
} from "lucide-react";
import CreateWarehouseStaffModal from "@/components/settings/CreateWarehouseStaffModal";
import {
  getWarehouseStaffApi,
  getWarehousesApi,
  createWarehouseApi,
  getLocationsApi,
  createLocationApi,
  AuthUser,
  WarehouseItem,
  LocationItem,
} from "@/lib/api";

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<AuthUser[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Warehouse Modal State
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  // Location Modal State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [selectedWhId, setSelectedWhId] = useState("");

  const [formError, setFormError] = useState("");

  const fetchSettingsData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, whRes, locRes] = await Promise.all([
        getWarehouseStaffApi(),
        getWarehousesApi(),
        getLocationsApi(),
      ]);

      if (staffRes.success && staffRes.data) setStaffList(staffRes.data);
      if (whRes.warehouses || whRes.data) {
        const whs = whRes.warehouses || whRes.data || [];
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWhId(whs[0].id);
      }
      if (locRes.locations || locRes.data) setLocations(locRes.locations || locRes.data || []);
    } catch (err) {
      console.error("Error loading settings data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const res = await createWarehouseApi({ name: whName, code: whCode, address: whAddress });
      if (!res.success) {
        setFormError(res.message || "Failed to create warehouse");
        return;
      }
      await fetchSettingsData();
      setIsWhModalOpen(false);
      setWhName("");
      setWhCode("");
      setWhAddress("");
    } catch (err) {
      console.error(err);
      setFormError("Error creating warehouse");
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedWhId) {
      setFormError("Please select a warehouse.");
      return;
    }
    try {
      const res = await createLocationApi({ name: locName, code: locCode, warehouseId: selectedWhId });
      if (!res.success) {
        setFormError(res.message || "Failed to create location");
        return;
      }
      await fetchSettingsData();
      setIsLocModalOpen(false);
      setLocName("");
      setLocCode("");
    } catch (err) {
      console.error(err);
      setFormError("Error creating location");
    }
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
                <SettingsIcon className="w-6 h-6 text-emerald-400" /> Settings & IMS Control
              </h1>
              <p className="text-xs text-slate-400">Manage Warehouses, Internal Rack Locations, and Staff credentials.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" /> Role: Inventory Manager
          </div>
        </div>

        {/* SECTION 1: WAREHOUSES & LOCATIONS MANAGEMENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-teal-400" /> Warehouses & Locations
              </h2>
              <p className="text-xs text-slate-400">Configure company storage hubs and rack/shelf locations.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsWhModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Create Warehouse
              </button>
              <button
                onClick={() => setIsLocModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Location
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Warehouses Card List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Warehouses ({warehouses.length})</h3>
              <div className="space-y-2">
                {warehouses.map((w) => (
                  <div key={w.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-emerald-400 font-mono">{w.code}</div>
                      <div className="text-slate-200 font-medium">{w.name}</div>
                    </div>
                    <span className="text-[10px] text-slate-500">{w.address || "Main Facility"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Locations Card List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Internal Storage Locations ({locations.length})</h3>
              <div className="space-y-2">
                {locations.map((l) => (
                  <div key={l.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="font-bold text-slate-200">{l.code} ({l.name})</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: WAREHOUSE STAFF CREATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-4 h-4" /> Warehouse Personnel Access
            </div>
            <h2 className="text-xl font-bold text-white">Create Warehouse Staff Accounts</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provision credentials for Warehouse Staff to allow them to handle picking, packing, stock counts, and internal transfers.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Create Warehouse Staff
          </button>
        </div>

        {/* Registered Staff Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> Registered Warehouse Staff ({staffList.length})
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
                      Loading staff records from PostgreSQL database...
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

      {/* CREATE WAREHOUSE MODAL */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-4">
            <button onClick={() => setIsWhModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <WarehouseIcon className="w-5 h-5 text-emerald-400" /> Create Warehouse
            </h3>
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. Production Floor Warehouse"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Warehouse Code (Short Prefix)</label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  placeholder="e.g. WH2 or PROD"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 uppercase focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Address / Location</label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. Building C, Sector 12"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsWhModalOpen(false)} className="w-1/3 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LOCATION MODAL */}
      {isLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-4">
            <button onClick={() => setIsLocModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-400" /> Create Storage Location
            </h3>
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Belongs to Warehouse</label>
                <select
                  value={selectedWhId}
                  onChange={(e) => setSelectedWhId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} ({w.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Location Name</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Shelf A-12 or Rack B"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Location Code</label>
                <input
                  type="text"
                  required
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="e.g. Stock1 or RackA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsLocModalOpen(false)} className="w-1/3 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <CreateWarehouseStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSettingsData}
      />
    </div>
  );
}
