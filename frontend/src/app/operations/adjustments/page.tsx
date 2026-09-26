// src/app/operations/adjustments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  SlidersHorizontal,
  Plus,
  Search,
  List,
  Kanban,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  MapPin,
  Building2,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import {
  getAdjustmentsApi,
  createAdjustmentApi,
  getProductsApi,
  getWarehousesApi,
  getLocationsApi,
  StockAdjustmentItem,
  ProductItem,
  WarehouseItem,
  LocationItem,
} from "@/lib/api";

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [countedQtyInput, setCountedQtyInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [adjRes, prodRes, whRes, locRes] = await Promise.all([
        getAdjustmentsApi({ search: searchQuery }).catch(() => null),
        getProductsApi().catch(() => null),
        getWarehousesApi().catch(() => null),
        getLocationsApi().catch(() => null),
      ]);

      if (adjRes?.success && adjRes.adjustments) {
        setAdjustments(adjRes.adjustments);
      } else if (adjRes?.message) {
        setErrorMessage(adjRes.message);
      }

      if (prodRes?.success) {
        setProducts(prodRes.products || (prodRes as any).data || []);
      }
      if (whRes?.success) {
        setWarehouses(whRes.warehouses || (whRes as any).data || []);
      }
      if (locRes?.success) {
        setLocations(locRes.locations || (locRes as any).data || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // Derived filtered locations based on selected warehouse
  const availableLocations = selectedWarehouseId
    ? locations.filter((loc) => loc.warehouseId === selectedWarehouseId)
    : locations;

  // Selected product object
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Derive System Quantity (recorded stock in database)
  const getSystemStock = (): number => {
    if (!selectedProductId || !selectedLocationId || !selectedProduct) return 0;
    const stockMatch = selectedProduct.stocks?.find(
      (s) => s.locationId === selectedLocationId
    );
    return stockMatch ? stockMatch.quantity : 0;
  };

  const systemQuantity = getSystemStock();
  const countedQuantity = countedQtyInput !== "" ? parseFloat(countedQtyInput) : NaN;
  const quantityDelta = !isNaN(countedQuantity) ? countedQuantity - systemQuantity : 0;

  // Reset Modal Form
  const resetForm = () => {
    setSelectedProductId("");
    setSelectedWarehouseId("");
    setSelectedLocationId("");
    setCountedQtyInput("");
    setReasonInput("");
    setModalError("");
  };

  // Open Modal
  const handleOpenModal = () => {
    resetForm();
    if (warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
      const firstLoc = locations.find((l) => l.warehouseId === warehouses[0].id);
      if (firstLoc) setSelectedLocationId(firstLoc.id);
    }
    setIsModalOpen(true);
  };

  // Handle Warehouse Change in Modal
  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    const firstLoc = locations.find((l) => l.warehouseId === whId);
    setSelectedLocationId(firstLoc ? firstLoc.id : "");
  };

  // Create Stock Adjustment Submit Handler
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!selectedProductId) {
      setModalError("Please select a product.");
      return;
    }
    if (!selectedWarehouseId) {
      setModalError("Please select a warehouse.");
      return;
    }
    if (!selectedLocationId) {
      setModalError("Please select a location.");
      return;
    }
    if (isNaN(countedQuantity) || countedQuantity < 0) {
      setModalError("Please enter a valid non-negative counted quantity.");
      return;
    }
    if (quantityDelta === 0) {
      setModalError(
        "Counted quantity is equal to the current recorded stock (0 difference). No adjustment needed."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdjustmentApi({
        productId: selectedProductId,
        warehouseId: selectedWarehouseId,
        locationId: selectedLocationId,
        countedQuantity,
        reason: reasonInput,
      });

      if (res.success) {
        setSuccessMessage(
          `Stock adjustment (${res.adjustment?.reference || "COMPLETED"}) saved successfully!`
        );
        setTimeout(() => setSuccessMessage(""), 5000);
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } else {
        setModalError(res.message || "Failed to save stock adjustment");
      }
    } catch (err: any) {
      setModalError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Notification Alerts */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <SlidersHorizontal className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Stock Adjustments</h1>
                <p className="text-sm text-slate-500">
                  Reconcile physical inventory counts with system recorded stock
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Adjustment
            </button>
          </div>
        </div>

        {/* Filter and View Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ref, product, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-4 h-4" />
              Kanban View
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Loading stock adjustments...</p>
          </div>
        ) : adjustments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No stock adjustments found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              There are no physical stock adjustments recorded yet. Click "New Adjustment" to fix stock mismatches.
            </p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create First Adjustment
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* List View Table */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">System Qty</th>
                    <th className="px-6 py-3.5 text-right">Counted Qty</th>
                    <th className="px-6 py-3.5 text-right">Adjustment</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Done By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {adjustments.map((adj) => {
                    const isPositive = adj.quantityDelta > 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                          {adj.reference}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(adj.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {adj.product?.name || "Unknown Product"}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {adj.product?.sku}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {adj.warehouse?.code || "WH"}/{adj.location?.code || "LOC"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-600">
                          {adj.systemQuantity} {adj.product?.unitOfMeasure || "Units"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                          {adj.countedQuantity} {adj.product?.unitOfMeasure || "Units"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              isPositive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {isPositive ? `+${adj.quantityDelta}` : adj.quantityDelta}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-500">
                          {adj.reason || <span className="italic text-slate-300">No reason specified</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                          {adj.createdBy?.loginId || "System Admin"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adjustments.map((adj) => {
              const isPositive = adj.quantityDelta > 0;
              return (
                <div
                  key={adj.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-indigo-600 text-sm">
                      {adj.reference}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        isPositive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isPositive ? `+${adj.quantityDelta}` : adj.quantityDelta}{" "}
                      {adj.product?.unitOfMeasure || "Units"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {adj.product?.name || "Unknown Product"}
                    </h4>
                    <p className="text-xs font-mono text-slate-400">SKU: {adj.product?.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        System Stock
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        {adj.systemQuantity} {adj.product?.unitOfMeasure || "Units"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Counted Stock
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {adj.countedQuantity} {adj.product?.unitOfMeasure || "Units"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {adj.warehouse?.code}/{adj.location?.code}
                    </span>
                    <span>
                      {new Date(adj.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW STOCK ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">New Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-5 overflow-y-auto">
              {modalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. Select Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose a Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Warehouse & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Warehouse *
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Select Warehouse --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location *
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Select Location --</option>
                    {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. System Stock Display Card */}
              {selectedProductId && selectedLocationId && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-700 font-medium block">
                      Current System Stock (Recorded)
                    </span>
                    <span className="text-2xl font-bold font-mono text-indigo-900">
                      {systemQuantity} {selectedProduct?.unitOfMeasure || "Units"}
                    </span>
                  </div>
                  <Package className="w-8 h-8 text-indigo-400" />
                </div>
              )}

              {/* 4. Counted Physical Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Counted Physical Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Enter actual physical count..."
                  value={countedQtyInput}
                  onChange={(e) => setCountedQtyInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-medium"
                  required
                />
              </div>

              {/* 5. Adjustment Difference Calculation Preview */}
              {selectedProductId && selectedLocationId && countedQtyInput !== "" && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    quantityDelta > 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : quantityDelta < 0
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {quantityDelta > 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : quantityDelta < 0 ? (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Calculated Adjustment Delta:</span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {quantityDelta > 0 ? `+${quantityDelta}` : quantityDelta}{" "}
                    {selectedProduct?.unitOfMeasure || "Units"}
                  </span>
                </div>
              )}

              {/* 6. Reason Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical count audit, Damaged items, Lost stock..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
