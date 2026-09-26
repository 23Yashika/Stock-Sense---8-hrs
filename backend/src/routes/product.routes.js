import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  requireRole,
} from "../middleware/role.middleware.js";

const router = express.Router();


// ========================================
// CREATE PRODUCT
// ========================================

router.post(
  "/",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  createProduct
);


// ========================================
// GET ALL PRODUCTS
// ========================================

router.get(
  "/",
  authenticate,
  getProducts
);


// ========================================
// GET SINGLE PRODUCT
// ========================================

router.get(
  "/:id",
  authenticate,
  getProductById
);


// ========================================
// UPDATE PRODUCT
// ========================================

router.put(
  "/:id",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  updateProduct
);


// ========================================
// DELETE PRODUCT
// ========================================

router.delete(
  "/:id",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  deleteProduct
);


export default router;