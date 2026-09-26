import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./src/routes/auth.routes.js";
import staffRoutes from "./src/routes/staff.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import supplierRoutes from "./src/routes/supplier.routes.js";
import warehouseRoutes from "./src/routes/warehouse.routes.js";
import locationRoutes from "./src/routes/location.routes.js";
import receiptRoutes from "./src/routes/receipt.routes.js";
import stockRoutes from "./src/routes/stock.routes.js";
const app = express();

const PORT = process.env.PORT || 5000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StockSense Backend is running 🚀",
  });
});


// ========================================
// AUTH ROUTES
// ========================================

app.use(
  "/api/auth",
  authRoutes
);


// ========================================
// STAFF ROUTES
// ========================================

app.use(
  "/api/staff",
  staffRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use("/api/suppliers", supplierRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/stock", stockRoutes);

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `StockSense server running on http://localhost:${PORT}`
  );
});