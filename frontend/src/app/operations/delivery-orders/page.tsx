// src/app/operations/delivery-orders/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Truck,
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
  PackageCheck,
  PackageSearch,
  UserPlus,
  ArrowRight,
  Boxes,
  Printer,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import {
  getDeliveriesApi,
  createDeliveryApi,
  pickDeliveryApi,
  packDeliveryApi,
  validateDeliveryApi,
  cancelDeliveryApi,
  getCustomersApi,
  createCustomerApi,
  getWarehousesApi,
  getLocationsApi,
  getProductsApi,
  DeliveryOrder,
  CustomerItem,
  WarehouseItem,
  LocationItem,
  ProductItem,
} from "@/lib/api";

export default function DeliveryOrdersPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown Metadata
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Create Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [deliveryItems, setDeliveryItems] = useState<
    { productId: string; quantity: number }[]
  >([{ productId: "", quantity: 1 }]);

  // Add Customer Inline Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);

  const [authError, setAuthError] = useState("");

  // Fetch Deliveries from live PostgreSQL database
  const fetchDeliveries = async () => {
    setIsLoading(true);
    setAuthError("");
    try {
      const res = await getDeliveriesApi({ search: searchQuery });
      if (res.success && res.deliveries) {
        setDeliveries(res.deliveries);
      } else if (res.message) {
        setAuthError(res.message);
      }
    } catch (err) {
      console.error("Error loading deliveries:", err);
      setAuthError("Unable to connect to backend server (http://localhost:5000). Please ensure server is running and you are logged in.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dropdown metadata
  const fetchMetadata = async () => {
    try {
      const custRes = await getCustomersApi().catch(() => null);
      const whRes = await getWarehousesApi().catch(() => null);
      const locRes = await getLocationsApi().catch(() => null);
      const prodRes = await getProductsApi().catch(() => null);

      if (custRes?.customers || custRes?.data) {
        const custs = custRes.customers || custRes.data || [];
        setCustomers(custs);
        if (custs.length > 0 && !selectedCustomer) setSelectedCustomer(custs[0].id);
      }
      if (whRes?.warehouses || whRes?.data) {
        const whs = whRes.warehouses || whRes.data || [];
        setWarehouses(whs);
        if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id);
      }
      if (locRes?.locations || locRes?.data) {
        const locs = locRes.locations || locRes.data || [];
        setLocations(locs);
        if (locs.length > 0 && !selectedLocation) setSelectedLocation(locs[0].id);
      }
      if (prodRes?.products || prodRes?.data) setProducts(prodRes.products || prodRes.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchMetadata();
  }, []);

  const handleAddItemRow = () => {
    setDeliveryItems([...deliveryItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setDeliveryItems(deliveryItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: "productId" | "quantity", value: any) => {
    const updated = [...deliveryItems];
    updated[index] = { ...updated[index], [field]: value };
    setDeliveryItems(updated);
  };

  // Inline Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setCustomerLoading(true);

    try {
      const res = await createCustomerApi({
        name: newCustomerName,
        email: newCustomerEmail || undefined,
        address: newCustomerAddress || undefined,
      });

      if (res.success && res.customer) {
        await fetchMetadata();
        setSelectedCustomer(res.customer.id);
        setIsCustomerModalOpen(false);
        setNewCustomerName("");
        setNewCustomerEmail("");
        setNewCustomerAddress("");
      } else {
        alert(res.message || "Failed to create customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating customer");
    } finally {
      setCustomerLoading(false);
    }
  };

  // Create Delivery Order
  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedCustomer || !selectedWarehouse || !selectedLocation) {
      setErrorMessage("Please select Customer Contact, Warehouse, and Location.");
      return;
    }

    if (deliveryItems.some((i) => !i.productId || i.quantity <= 0)) {
      setErrorMessage("All items must have a valid product and positive quantity.");
      return;
    }

    setModalLoading(true);

    try {
      const res = await createDeliveryApi({
        customerId: selectedCustomer,
        warehouseId: selectedWarehouse,
        locationId: selectedLocation,
        scheduleDate: scheduleDate || undefined,
        items: deliveryItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });

      if (!res.success) {
        setErrorMessage(res.message || "Failed to create delivery order");
        setModalLoading(false);
        return;
      }

      await fetchDeliveries();
      setIsModalOpen(false);
      setDeliveryItems([{ productId: "", quantity: 1 }]);
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to connect to backend server");
    } finally {
      setModalLoading(false);
    }
  };

  // Action 1: Pick Delivery (READY -> PICKED)
  const handlePickDelivery = async (deliveryId: string) => {
    try {
      const res = await pickDeliveryApi(deliveryId);
      if (res.success) {
        await fetchDeliveries();
        if (selectedDelivery?.id === deliveryId && res.delivery) {
          setSelectedDelivery(res.delivery);
        }
      } else {
        alert(res.message || "Failed to pick items");
      }
    } catch (err) {
      console.error(err);
      alert("Error picking delivery");
    }
  };

  // Action 2: Pack Delivery (PICKED -> PACKED)
  const handlePackDelivery = async (deliveryId: string) => {
    try {
      const res = await packDeliveryApi(deliveryId);
      if (res.success) {
        await fetchDeliveries();
        if (selectedDelivery?.id === deliveryId && res.delivery) {
          setSelectedDelivery(res.delivery);
        }
      } else {
        alert(res.message || "Failed to pack items");
      }
    } catch (err) {
      console.error(err);
      alert("Error packing delivery");
    }
  };

  // Action 3: Validate Delivery (PACKED -> DELIVERED, Decrements Stock in PostgreSQL)
  const handleValidateDelivery = async (deliveryId: string) => {
    try {
      const res = await validateDeliveryApi(deliveryId);
      if (res.success) {
        await fetchDeliveries();
        setSelectedDelivery(null);
      } else {
        if (res.availableStock !== undefined) {
          alert(`Insufficient Stock! Available in warehouse: ${res.availableStock} units.`);
        } else {
          alert(res.message || "Failed to validate delivery order");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error validating delivery");
    }
  };

  // Action 4: Cancel Delivery
  const handleCancelDelivery = async (deliveryId: string) => {
    if (!confirm("Are you sure you want to cancel this delivery order?")) return;
    try {
      const res = await cancelDeliveryApi(deliveryId);
      if (res.success) {
        await fetchDeliveries();
        setSelectedDelivery(null);
      } else {
        alert(res.message || "Failed to cancel delivery order");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling delivery");
    }
  };

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to calculate available stock for a product in selected location
  const getProductAvailableStock = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return 0;
    const locationStockSum = prod.stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
    return prod.initialStock + locationStockSum;
  };

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
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Truck className="w-6 h-6 text-emerald-400" /> Delivery Orders (Outgoing Goods)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference or customer..."
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

        {/* Auth Error Banner if user is not logged in or backend error */}
        {authError && (
          <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{authError}</span>
            </div>
            <Link
              href="/login"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" /> Go to Login
            </Link>
          </div>
        )}

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
                    <th className="py-3.5 px-4">Contact (Customer)</th>
                    <th className="py-3.5 px-4">Schedule Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading delivery orders...
                      </td>
                    </tr>
                  ) : filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No delivery orders found in database. Click <strong>NEW</strong> to create one!
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedDelivery(d)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {d.reference}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {d.warehouse?.code}/{d.location?.code || "Stock1"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">vendor (customer)</td>
                        <td className="py-3.5 px-4 text-slate-200 font-medium">
                          {d.customer?.name || "Azure Interior"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {d.scheduleDate
                            ? new Date(d.scheduleDate).toLocaleDateString()
                            : new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                              d.status === "DELIVERED"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : d.status === "PACKED"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : d.status === "PICKED"
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                : d.status === "CANCELLED"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                            }`}
                          >
                            {d.status === "DELIVERED"
                              ? "Done"
                              : d.status === "DRAFT" || d.status === "READY"
                              ? "Ready"
                              : d.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(d.status === "READY" || d.status === "DRAFT") && (
                              <>
                                <button
                                  onClick={() => handleCancelDelivery(d.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-[11px] rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handlePickDelivery(d.id)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg shadow cursor-pointer"
                                >
                                  1. Pick
                                </button>
                              </>
                            )}
                            {d.status === "PICKED" && (
                              <button
                                onClick={() => handlePackDelivery(d.id)}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] rounded-lg shadow cursor-pointer"
                              >
                                2. Pack
                              </button>
                            )}
                            {d.status === "PACKED" && (
                              <button
                                onClick={() => handleValidateDelivery(d.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-lg shadow cursor-pointer"
                              >
                                3. Validate
                              </button>
                            )}
                          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Column 1: Ready / Draft */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-teal-400 uppercase tracking-wider">
                <span>Ready / Draft</span>
                <span className="px-2 py-0.5 bg-teal-500/20 rounded-md">
                  {deliveries.filter((d) => d.status === "READY" || d.status === "DRAFT").length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === "READY" || d.status === "DRAFT")
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelivery(d)}
                      className="p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl space-y-2.5 shadow-lg cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400 text-xs">{d.reference}</span>
                        <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        To: <span className="text-white">{d.customer?.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        From: {d.warehouse?.code}/{d.location?.code}
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500">{d.items?.length || 1} Item(s)</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDelivery(d.id);
                            }}
                            className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold text-[10px] rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickDelivery(d.id);
                            }}
                            className="px-2 py-0.5 bg-indigo-600 text-white font-semibold text-[10px] rounded"
                          >
                            Pick
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Picked */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <span>Picked</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 rounded-md">
                  {deliveries.filter((d) => d.status === "PICKED").length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === "PICKED")
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelivery(d)}
                      className="p-3.5 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-2.5 cursor-pointer shadow"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-indigo-400 text-xs">{d.reference}</span>
                        <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                          <PackageSearch className="w-3 h-3" /> Picked
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{d.customer?.name}</div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                        <span className="text-[10px] text-slate-500">{d.items?.length || 1} Item(s)</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePackDelivery(d.id);
                          }}
                          className="px-2.5 py-1 bg-amber-600 text-white font-semibold text-[10px] rounded"
                        >
                          Pack
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Packed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>Packed</span>
                <span className="px-2 py-0.5 bg-amber-500/20 rounded-md">
                  {deliveries.filter((d) => d.status === "PACKED").length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === "PACKED")
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelivery(d)}
                      className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-xl space-y-2.5 cursor-pointer shadow"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-amber-400 text-xs">{d.reference}</span>
                        <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" /> Packed
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{d.customer?.name}</div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                        <span className="text-[10px] text-slate-500">{d.items?.length || 1} Item(s)</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateDelivery(d.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-semibold text-[10px] rounded"
                        >
                          Validate
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 4: Done (Delivered) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Done (Delivered)</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded-md">
                  {deliveries.filter((d) => d.status === "DELIVERED").length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === "DELIVERED")
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelivery(d)}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 opacity-90 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-emerald-400 text-xs">{d.reference}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{d.customer?.name}</div>
                      <div className="text-[10px] text-slate-500">{d.warehouse?.code}/{d.location?.code}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 5: Cancelled */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Cancelled</span>
                <span className="px-2 py-0.5 bg-rose-500/20 rounded-md">
                  {deliveries.filter((d) => d.status === "CANCELLED").length}
                </span>
              </div>
              <div className="space-y-3">
                {deliveries
                  .filter((d) => d.status === "CANCELLED")
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelivery(d)}
                      className="p-3.5 bg-slate-900 border border-rose-500/20 rounded-xl space-y-2 opacity-70 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-rose-400 text-xs">{d.reference}</span>
                        <span className="text-[10px] text-rose-400 font-semibold">CANCELLED</span>
                      </div>
                      <div className="text-xs text-slate-400">{d.customer?.name}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE DELIVERY ORDER FORM MODAL (Excalidraw Form Layout) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateDelivery} className="space-y-6">
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-400" /> Create Delivery Order
                  </h3>
                  <p className="text-xs text-slate-400">Outgoing goods shipment to customer</p>
                </div>

                {/* Excalidraw Status Progress Pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono font-bold text-slate-300">
                  <span className="text-teal-400">Draft</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-indigo-400">Picked</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-amber-400">Packed</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-emerald-400">Done</span>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Delivery Address (Customer Contact)</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Customer
                    </button>
                  </div>
                  <select
                    required
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                  <label className="text-xs font-semibold text-slate-300">Source Warehouse</label>
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
                  <label className="text-xs font-semibold text-slate-300">Source Rack Location</label>
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
                  {deliveryItems.map((item, idx) => {
                    const selectedProd = products.find((p) => p.id === item.productId);
                    const availStock = item.productId ? getProductAvailableStock(item.productId) : 0;
                    const isStockInsufficient = item.productId && item.quantity > availStock;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-950 p-2.5 rounded-xl border ${
                          isStockInsufficient
                            ? "border-rose-500/60 bg-rose-950/10"
                            : "border-slate-800"
                        }`}
                      >
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

                        <div className="w-32 flex items-center gap-1">
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

                        {/* Live Stock Alert Status */}
                        {item.productId && (
                          <div className="text-[10px] font-mono whitespace-nowrap">
                            {isStockInsufficient ? (
                              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                Out of stock! ({availStock} avail)
                              </span>
                            ) : (
                              <span className="text-teal-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
                                Available: {availStock}
                              </span>
                            )}
                          </div>
                        )}

                        {deliveryItems.length > 1 && (
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
                  {modalLoading ? "Creating Delivery..." : "Save Delivery Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE CREATE CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 relative space-y-4">
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Add New Customer Contact
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Decathlon Retail Ltd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Customer Email (Optional)</label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="orders@decathlon.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Delivery Address (Optional)</label>
                <input
                  type="text"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  placeholder="102 Logistics Park, Warehouse 4"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-1/2 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customerLoading}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                >
                  {customerLoading ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERY ORDER DETAIL & STEP PROGRESSION MODAL */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-6">
            <button
              onClick={() => setSelectedDelivery(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Delivery Reference</span>
                <h2 className="text-2xl font-mono font-bold text-emerald-400">{selectedDelivery.reference}</h2>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                  selectedDelivery.status === "DELIVERED"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : selectedDelivery.status === "PACKED"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : selectedDelivery.status === "PICKED"
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    : selectedDelivery.status === "CANCELLED"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                }`}
              >
                {selectedDelivery.status === "DELIVERED" ? "Done" : selectedDelivery.status}
              </span>
            </div>

            {/* Stepper Workflow Progress Bar */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className={`flex items-center gap-1 ${selectedDelivery.status === "READY" ? "text-teal-400 font-bold" : "text-slate-500"}`}>
                <span>1. Ready</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <div className={`flex items-center gap-1 ${selectedDelivery.status === "PICKED" ? "text-indigo-400 font-bold" : "text-slate-500"}`}>
                <span>2. Picked</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <div className={`flex items-center gap-1 ${selectedDelivery.status === "PACKED" ? "text-amber-400 font-bold" : "text-slate-500"}`}>
                <span>3. Packed</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <div className={`flex items-center gap-1 ${selectedDelivery.status === "DELIVERED" ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                <span>4. Done</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Customer Contact (To)</span>
                <span className="font-semibold text-slate-200">{selectedDelivery.customer?.name || "Decathlon Retail"}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Source Location (From)</span>
                <span className="font-semibold text-slate-200">
                  {selectedDelivery.warehouse?.code}/{selectedDelivery.location?.code || "Stock1"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Shipped Line Items</h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {selectedDelivery.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{item.product?.name || "Steel Rods 10mm"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.product?.sku}</div>
                    </div>
                    <div className="font-bold text-rose-400 font-mono text-sm">
                      -{item.quantity} {item.product?.unitOfMeasure}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-800">
              <button
                onClick={() => setSelectedDelivery(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {(selectedDelivery.status === "READY" || selectedDelivery.status === "DRAFT") && (
                  <>
                    <button
                      onClick={() => handleCancelDelivery(selectedDelivery.id)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={() => handlePickDelivery(selectedDelivery.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <PackageSearch className="w-4 h-4" /> Pick Items
                    </button>
                  </>
                )}

                {selectedDelivery.status === "PICKED" && (
                  <button
                    onClick={() => handlePackDelivery(selectedDelivery.id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" /> Pack Items
                  </button>
                )}

                {selectedDelivery.status === "PACKED" && (
                  <button
                    onClick={() => handleValidateDelivery(selectedDelivery.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Validate (Decrement Stock)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
