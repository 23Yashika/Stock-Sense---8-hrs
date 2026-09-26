import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./src/routes/auth.routes.js";
import staffRoutes from "./src/routes/staff.routes.js";
import productRoutes from "./src/routes/product.routes.js";

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

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `StockSense server running on http://localhost:${PORT}`
  );
});