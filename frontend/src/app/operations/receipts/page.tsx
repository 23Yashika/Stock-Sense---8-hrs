// src/app/operations/receipts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Inbox,
  Plus,
  Search,
  List,
  Kanban,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Warehouse as WarehouseIcon,
  MapPin,
  Building2,
  Trash2,
  Clock,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import {
  getReceiptsApi,
  createReceiptApi,
  validateReceiptApi,
  cancelReceiptApi,
  getSuppliersApi,
  createSupplierApi,
  getWarehousesApi,
  getLocationsApi,
  getProductsApi,
  ReceiptItem,
  SupplierItem,
  WarehouseItem,
  LocationItem,
  ProductItem,
} from "@/lib/api";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown Metadata
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Create Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [receiptItems, setReceiptItems] = useState<
    { productId: string; quantity: number }[]
  >([{ productId: "", quantity: 1 }]);

  // Add Supplier Inline Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);

  // Fetch Receipts from live PostgreSQL database
  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await getReceiptsApi({ search: searchQuery });
      if (res.success && res.receipts) {
        setReceipts(res.receipts);
      }
    } catch (err) {
      console.error("Error loading receipts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dropdown data
  const fetchMetadata = async () => {
    try {
      const [supRes, whRes, locRes, prodRes] = await Promise.all([
        getSuppliersApi(),
        getWarehousesApi(),
        getLocationsApi(),
        getProductsApi(),
      ]);

      if (supRes.suppliers || supRes.data) {
        const sups = supRes.suppliers || supRes.data || [];
        setSuppliers(sups);
        if (sups.length > 0 && !selectedSupplier) setSelectedSupplier(sups[0].id);
      }
      if (whRes.warehouses || whRes.data) {
        const whs = whRes.warehouses || whRes.data || [];
        setWarehouses(whs);
        if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id);
      }
      if (locRes.locations || locRes.data) {
        const locs = locRes.locations || locRes.data || [];
        setLocations(locs);
        if (locs.length > 0 && !selectedLocation) setSelectedLocation(locs[0].id);
      }
      if (prodRes.products || prodRes.data) setProducts(prodRes.products || prodRes.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchMetadata();
  }, []);

  const handleAddItemRow = () => {
    setReceiptItems([...receiptItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setReceiptItems(receiptItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: "productId" | "quantity", value: any) => {
    const updated = [...receiptItems];
    updated[index] = { ...updated[index], [field]: value };
    setReceiptItems(updated);
  };

  // Inline Supplier Creation
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    setSupplierLoading(true);

    try {
      const res = await createSupplierApi({
        name: newSupplierName,
        email: newSupplierEmail || undefined,
      });

      if (res.success && res.supplier) {
        await fetchMetadata();
        setSelectedSupplier(res.supplier.id);
        setIsSupplierModalOpen(false);
        setNewSupplierName("");
        setNewSupplierEmail("");
      } else {
        alert(res.message || "Failed to create supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating supplier");
    } finally {
      setSupplierLoading(false);
    }
  };

  // Create Receipt
  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedSupplier || !selectedWarehouse || !selectedLocation) {
      setErrorMessage("Please select Supplier, Warehouse, and Location.");
      return;
    }

    if (receiptItems.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMessage("All items must have a valid product and positive quantity.");
      return;
    }

    setModalLoading(true);

    try {
      const res = await createReceiptApi({
        supplierId: selectedSupplier,
        warehouseId: selectedWarehouse,
        locationId: selectedLocation,
        scheduleDate: scheduleDate || undefined,
        items: receiptItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to create receipt");
        setModalLoading(false);
        return;
      }

      await fetchReceipts();
      setIsModalOpen(false);
      setReceiptItems([{ productId: "", quantity: 1 }]);
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to connect to backend server");
    } finally {
      setModalLoading(false);
    }
  };

  // Validate Receipt (Updates Stock in DB)
  const handleValidateReceipt = async (receiptId: string) => {
    try {
      const res = await validateReceiptApi(receiptId);
      if (res.success) {
        await fetchReceipts();
        setSelectedReceipt(null);
      } else {
        alert(res.message || "Failed to validate receipt");
      }
    } catch (err) {
      console.error(err);
      alert("Error validating receipt");
    }
  };

  // Cancel Receipt (Changes Status to CANCELLED in DB)
  const handleCancelReceipt = async (receiptId: string) => {
    if (!confirm("Are you sure you want to cancel this receipt?")) return;
    try {
      const res = await cancelReceiptApi(receiptId);
      if (res.success) {
        await fetchReceipts();
        setSelectedReceipt(null);
      } else {
        alert(res.message || "Failed to cancel receipt");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling receipt");
    }
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> NEW
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Receipts</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference or contacts..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                title="Kanban View"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "kanban"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">From</th>
                    <th className="py-3.5 px-4">To</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Schedule Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading receipts from PostgreSQL database...
                      </td>
                    </tr>
                  ) : filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No receipts found in database. Click <strong>NEW</strong> to create one!
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedReceipt(r)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {r.reference}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">vendor</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {r.warehouse?.code}/{r.location?.code || "Stock1"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-200 font-medium">
                          {r.supplier?.name || "Azure Interior"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {r.scheduleDate
                            ? new Date(r.scheduleDate).toLocaleDateString()
                            : new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                              r.status === "RECEIVED"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : r.status === "CANCELLED"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                            }`}
                          >
                            {r.status === "RECEIVED" ? "Done" : r.status === "DRAFT" ? "Ready" : r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {r.status === "DRAFT" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCancelReceipt(r.id)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-[11px] rounded-lg shadow transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleValidateReceipt(r.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-lg shadow transition-all cursor-pointer"
                              >
                                Validate
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KANBAN VIEW */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Draft / Ready */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-teal-400 uppercase tracking-wider">
                <span>Ready / Draft</span>
                <span className="px-2 py-0.5 bg-teal-500/20 rounded-md">
                  {receipts.filter((r) => r.status === "DRAFT").length}
                </span>
              </div>
              <div className="space-y-3">
                {receipts
                  .filter((r) => r.status === "DRAFT")
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReceipt(r)}
                      className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl space-y-3 shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400 text-xs">{r.reference}</span>
                        <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        Supplier: <span className="text-white">{r.supplier?.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Destination: {r.warehouse?.code}/{r.location?.code}
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">{r.items?.length || 1} Item(s)</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelReceipt(r.id);
                            }}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-[10px] rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidateReceipt(r.id);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] rounded-lg cursor-pointer"
                          >
                            Validate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Received / Done */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Done (Received)</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded-md">
                  {receipts.filter((r) => r.status === "RECEIVED").length}
                </span>
              </div>
              <div className="space-y-3">
                {receipts
                  .filter((r) => r.status === "RECEIVED")
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReceipt(r)}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 opacity-90 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400 text-xs">{r.reference}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{r.supplier?.name}</div>
                      <div className="text-xs text-slate-500">{r.warehouse?.code}/{r.location?.code}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Cancelled */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Cancelled</span>
                <span className="px-2 py-0.5 bg-rose-500/20 rounded-md">
                  {receipts.filter((r) => r.status === "CANCELLED").length}
                </span>
              </div>
              <div className="space-y-3">
                {receipts
                  .filter((r) => r.status === "CANCELLED")
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReceipt(r)}
                      className="p-4 bg-slate-900 border border-rose-500/20 hover:border-rose-500/40 rounded-xl space-y-3 opacity-80 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-rose-400 text-xs">{r.reference}</span>
                        <span className="text-[10px] text-rose-400 font-semibold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md">
                          CANCELLED
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        Supplier: <span className="text-white">{r.supplier?.name || "Azure Interior"}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Destination: {r.warehouse?.code}/{r.location?.code}
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                        <span>{r.items?.length || 1} Item(s)</span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE RECEIPT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateReceipt} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-emerald-400" /> Create Receipt
                  </h3>
                  <p className="text-xs text-slate-400"></p>
                </div>
                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Draft → Ready
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Receive From (Supplier / Contact)</label>
                    <button
                      type="button"
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Supplier
                    </button>
                  </div>
                  <select
                    required
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Scheduled Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Warehouse</label>
                  <select
                    required
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Destination Location</label>
                  <select
                    required
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Operations Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product Operations</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {receiptItems.map((item, idx) => {
                    const selectedProd = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name}
                            </option>
                          ))}
                        </select>

                        <div className="w-28 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 text-center"
                          />
                          <span className="text-[11px] text-slate-400 font-mono">
                            {selectedProd?.unitOfMeasure || "UOM"}
                          </span>
                        </div>

                        {receiptItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 uppercase tracking-wider"
                >
                  {modalLoading ? "Creating Receipt..." : "Save Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE CREATE SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 relative space-y-4">
            <button
              onClick={() => setIsSupplierModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Add New Supplier / Contact
            </h3>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Steel Vendor Ltd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Supplier Email (Optional)</label>
                <input
                  type="email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  placeholder="vendor@steel.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supplierLoading}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                >
                  {supplierLoading ? "Saving..." : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT DETAIL & VALIDATE MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-6">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Receipt Reference</span>
                <h2 className="text-2xl font-mono font-bold text-emerald-400">{selectedReceipt.reference}</h2>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  selectedReceipt.status === "RECEIVED"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : selectedReceipt.status === "CANCELLED"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                }`}
              >
                {selectedReceipt.status === "RECEIVED"
                  ? "Done"
                  : selectedReceipt.status === "CANCELLED"
                  ? "Cancelled"
                  : "Ready"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Supplier (From)</span>
                <span className="font-semibold text-slate-200">{selectedReceipt.supplier?.name || "Azure Interior"}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Destination (To)</span>
                <span className="font-semibold text-slate-200">
                  {selectedReceipt.warehouse?.code}/{selectedReceipt.location?.code || "Stock1"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Received Products</h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {selectedReceipt.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{item.product?.name || "Steel Rods 10mm"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.product?.sku}</div>
                    </div>
                    <div className="font-bold text-emerald-400 font-mono text-sm">
                      +{item.quantity} {item.product?.unitOfMeasure}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
              {selectedReceipt.status === "DRAFT" && (
                <>
                  <button
                    onClick={() => handleCancelReceipt(selectedReceipt.id)}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" /> Cancel Receipt
                  </button>
                  <button
                    onClick={() => handleValidateReceipt(selectedReceipt.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Validate (Update Stock +Qty)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}