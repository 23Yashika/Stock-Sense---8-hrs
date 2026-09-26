// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AuthUser {
  id: string;
  loginId: string;
  email: string;
  role: "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface StockLocationBreakdown {
  id: string;
  quantity: number;
  warehouseId?: string;
  locationId?: string;
  warehouse?: WarehouseItem;
  location?: LocationItem;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  initialStock: number;
  isActive: boolean;
  createdAt: string;
  stocks?: StockLocationBreakdown[];
}

export interface SupplierItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address?: string;
}

export interface LocationItem {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
}

export interface ReceiptItemPayload {
  productId: string;
  quantity: number;
  product?: ProductItem;
}

export interface ReceiptItem {
  id: string;
  reference: string;
  supplierId: string;
  warehouseId: string;
  locationId: string;
  scheduleDate?: string;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
  supplier?: SupplierItem;
  warehouse?: WarehouseItem;
  location?: LocationItem;
  items?: {
    id: string;
    productId: string;
    quantity: number;
    product?: ProductItem;
  }[];
  createdAt: string;
}

// Store & Retrieve JWT token
export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("stocksense_token", token);
  }
};

export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("stocksense_token");
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("stocksense_token");
  }
};

// ========================================
// AUTH API CALLS
// ========================================

export async function loginUser(payload: {
  loginId: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function signupUser(payload: {
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function forgotPasswordApi(email: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyOtpApi(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
}

export async function resetPasswordApi(payload: {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ========================================
// WAREHOUSE STAFF API CALLS
// ========================================

export async function getWarehouseStaffApi(): Promise<{ success: boolean; data?: AuthUser[]; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function createWarehouseStaffApi(payload: {
  loginId: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ========================================
// PRODUCTS API CALLS
// ========================================

export async function getProductsApi(): Promise<{ success: boolean; products?: ProductItem[]; data?: ProductItem[]; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function createProductApi(payload: {
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  initialStock?: number;
}): Promise<{ success: boolean; product?: ProductItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ========================================
// SUPPLIER, WAREHOUSE & LOCATION APIs
// ========================================

export async function getSuppliersApi(): Promise<{ success: boolean; suppliers?: SupplierItem[]; data?: SupplierItem[] }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createSupplierApi(payload: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<{ success: boolean; supplier?: SupplierItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getWarehousesApi(): Promise<{ success: boolean; warehouses?: WarehouseItem[]; data?: WarehouseItem[] }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createWarehouseApi(payload: {
  name: string;
  code: string;
  address?: string;
}): Promise<{ success: boolean; warehouse?: WarehouseItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getLocationsApi(): Promise<{ success: boolean; locations?: LocationItem[]; data?: LocationItem[] }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/locations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createLocationApi(payload: {
  name: string;
  code: string;
  warehouseId: string;
}): Promise<{ success: boolean; location?: LocationItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ========================================
// RECEIPT OPERATIONS APIs
// ========================================

export async function getReceiptsApi(params?: { search?: string; status?: string }): Promise<{ success: boolean; receipts?: ReceiptItem[]; message?: string }> {
  const token = getAuthToken();
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`${API_BASE_URL}/receipts?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getReceiptByIdApi(id: string): Promise<{ success: boolean; receipt?: ReceiptItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/receipts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createReceiptApi(payload: {
  supplierId: string;
  warehouseId: string;
  locationId: string;
  scheduleDate?: string;
  items: { productId: string; quantity: number }[];
}): Promise<{ success: boolean; receipt?: ReceiptItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/receipts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function validateReceiptApi(id: string): Promise<{ success: boolean; receipt?: ReceiptItem; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/receipts/${id}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function cancelReceiptApi(id: string): Promise<{ success: boolean; message?: string }> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/receipts/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
