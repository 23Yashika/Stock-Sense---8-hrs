// src/app/products/page.tsx
"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Package, Plus, Search, Tag, MapPin, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [products] = useState([
    { sku: "STL-1001", name: "Steel Rods 10mm", category: "Raw Materials", uom: "kg", stock: 150, minQty: 20, location: "Main Warehouse - Rack A" },
    { sku: "CHR-2004", name: "Ergonomic Office Chair", category: "Finished Goods", uom: "Units", stock: 45, minQty: 10, location: "Warehouse 2 - Shelf B" },
    { sku: "WOD-3002", name: "Plywood Sheet 18mm", category: "Raw Materials", uom: "Sheets", stock: 8, minQty: 15, location: "Main Warehouse - Rack C" },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Products Catalog</h1>
            <p className="text-xs text-slate-400">Stock availability, SKUs, and reordering rules per location.</p>
          </div>

          <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Create Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by SKU or Product Name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">Primary Location</th>
                  <th className="py-3 px-4">Stock On Hand</th>
                  <th className="py-3 px-4 text-right">Reorder Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{p.sku}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{p.uom}</td>
                    <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {p.location}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {p.stock <= p.minQty ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {p.stock} ({p.uom})
                        </span>
                      ) : (
                        <span>{p.stock} ({p.uom})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      Min: {p.minQty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}