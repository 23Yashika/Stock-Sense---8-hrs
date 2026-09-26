// src/app/products/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Package,
  Plus,
  Search,
  AlertCircle,
  X,
  LogIn,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  Boxes,
} from "lucide-react";
import {
  getProductsApi,
  createProductApi,
  getWarehousesApi,
  ProductItem,
  WarehouseItem,
} from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [authError, setAuthError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Raw Materials");
  const [unitOfMeasure, setUnitOfMeasure] = useState("kg");
  const [initialStock, setInitialStock] = useState<number>(0);

  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchInitialData = async () => {
    setIsLoading(true);
    setAuthError("");
    try {
      const [prodRes, whRes] = await Promise.all([
        getProductsApi(),
        getWarehousesApi(),
      ]);

      if (prodRes.success) {
        const productList = prodRes.products || prodRes.data || [];
        setProducts(productList);
      } else {
        setAuthError(prodRes.message || "Unable to fetch products from backend database.");
      }

      if (whRes.success) {
        setWarehouses(whRes.warehouses || whRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setAuthError("Failed to connect to backend server (http://localhost:5000)");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setModalLoading(true);

    try {
      const res = await createProductApi({
        name,
        sku,
        category,
        unitOfMeasure,
        initialStock: Number(initialStock),
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to create product");
        setModalLoading(false);
        return;
      }

      // Refresh list from database
      await fetchInitialData();
      setIsModalOpen(false);
      setName("");
      setSku("");
      setInitialStock(0);
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to connect to backend server");
    } finally {
      setModalLoading(false);
    }
  };

  // Filter products by Search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpandRow = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-400" /> Products Catalog
            </h1>
            <p className="text-xs text-slate-400">
              Live inventory tracking across global stock & warehouse locations.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Product
          </button>
        </div>

        {/* Auth Error Banner if user is not logged in */}
        {authError && (
          <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{authError} Log in to load live data from PostgreSQL.</span>
            </div>
            <Link
              href="/login"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Go to Login
            </Link>
          </div>
        )}

        {/* Product Controls & Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Controls Bar: Search + Warehouse Filter Dropdown */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SKU or Product Name..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Warehouse Filter Dropdown */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 font-medium hidden sm:inline">View Scope:</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  <option value="ALL" className="bg-slate-900 text-slate-200">
                    🌐 All Warehouses (Global Stock)
                  </option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id} className="bg-slate-900 text-slate-200">
                      🏬 {wh.code} - {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Mode Summary Indicator */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Boxes className="w-3.5 h-3.5 text-teal-400" />
              {selectedWarehouseId === "ALL" ? (
                <span>Scope: <strong className="text-emerald-400">Global Aggregate</strong> across all locations</span>
              ) : (
                <span>
                  Filter: <strong className="text-teal-400">
                    {warehouses.find((w) => w.id === selectedWarehouseId)?.name || selectedWarehouseId}
                  </strong>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3.5 px-4 w-10"></th>
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">
                    {selectedWarehouseId === "ALL" ? "Total Stock (Global)" : "Warehouse On-Hand"}
                  </th>
                  <th className="py-3.5 px-4">Location Breakdown</th>
                  <th className="py-3.5 px-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading products from PostgreSQL database...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {authError ? (
                        <span className="text-amber-400 font-medium">{authError}</span>
                      ) : (
                        <span>No products found in the database. Click "Create Product" to add one!</span>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isExpanded = expandedProductId === p.id;

                    // Calculate stock entries per warehouse filter
                    const allStocks = p.stocks || [];
                    const filteredStocks =
                      selectedWarehouseId === "ALL"
                        ? allStocks
                        : allStocks.filter((s) => s.warehouse?.id === selectedWarehouseId || s.warehouseId === selectedWarehouseId);

                    const locationStockSum = filteredStocks.reduce(
                      (acc, curr) => acc + curr.quantity,
                      0
                    );

                    // If ALL, add initial stock as base stock; if specific warehouse, show validated location quantity
                    const displayTotal =
                      selectedWarehouseId === "ALL"
                        ? p.initialStock + locationStockSum
                        : locationStockSum;

                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          onClick={() => toggleExpandRow(p.id)}
                          className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isExpanded ? "bg-slate-800/50" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center text-slate-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                            {p.sku}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-100">{p.name}</td>
                          <td className="py-3.5 px-4 text-slate-400">
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-100 text-sm">
                              {displayTotal}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                {p.unitOfMeasure}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {filteredStocks.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {filteredStocks.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-mono text-teal-400"
                                  >
                                    <MapPin className="w-3 h-3 text-teal-500" />
                                    {s.warehouse?.code}/{s.location?.code}: <strong>+{s.quantity}</strong>
                                  </span>
                                ))}
                              </div>
                            ) : selectedWarehouseId === "ALL" ? (
                              <span className="text-[11px] text-slate-500 font-mono">
                                Base Store: {p.initialStock} {p.unitOfMeasure}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">
                                No stock in this warehouse
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>

                        {/* Expanded Location Stock Detail Cards */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80 border-b border-slate-800">
                            <td colSpan={7} className="p-4 pl-12">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Detailed Warehouse & Rack Location Breakdown
                                  </h4>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    Product ID: {p.id}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {/* Base Initial Stock Card */}
                                  {selectedWarehouseId === "ALL" && (
                                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                                      <div>
                                        <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                                          <Boxes className="w-3.5 h-3.5 text-indigo-400" /> Main Store (Initial)
                                        </div>
                                        <div className="text-[10px] text-slate-500">Unallocated Base Stock</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-slate-100 font-mono">
                                          {p.initialStock} {p.unitOfMeasure}
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                                          Baseline
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Location Stock Cards */}
                                  {allStocks.length > 0 ? (
                                    allStocks.map((stock, idx) => (
                                      <div
                                        key={idx}
                                        className={`p-3 border rounded-xl flex items-center justify-between ${
                                          selectedWarehouseId !== "ALL" &&
                                          (stock.warehouse?.id === selectedWarehouseId || stock.warehouseId === selectedWarehouseId)
                                            ? "bg-emerald-950/20 border-emerald-500/30"
                                            : "bg-slate-900 border-slate-800"
                                        }`}
                                      >
                                        <div className="space-y-0.5">
                                          <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
                                            {stock.warehouse?.name} ({stock.warehouse?.code})
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            Rack: <span className="text-slate-300">{stock.location?.name} ({stock.location?.code})</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-bold text-teal-300 font-mono">
                                            +{stock.quantity} {p.unitOfMeasure}
                                          </div>
                                          <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded inline-flex items-center gap-0.5">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Validated
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-500 text-xs italic">
                                      No extra location receipt entries recorded yet.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Create Product in Database
              </h3>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Steel Rods 10mm"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">SKU / Code</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. STL-1001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Components">Components</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    placeholder="e.g. kg, Units, Sheets"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  {modalLoading ? "Saving to DB..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}