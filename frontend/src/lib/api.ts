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

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  initialStock: number;
  isActive: boolean;
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
// WAREHOUSE STAFF API CALLS (PostgreSQL Database)
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
// PRODUCTS API CALLS (PostgreSQL Database)
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
