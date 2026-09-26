import express from "express";

import {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  validateReceipt,
} from "../controllers/receipt.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// List
router.get("/", getReceipts);

// Create
router.post(
  "/",
  requireRole("INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  createReceipt
);

// Single receipt
router.get("/:id", getReceiptById);

// Update draft
router.put(
  "/:id",
  requireRole("INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  updateReceipt
);

// Cancel draft
router.delete(
  "/:id",
  requireRole("INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  deleteReceipt
);

// IMPORTANT: put validation before nothing? 
// /:id/validate is more specific than /:id, so Express handles it correctly.
router.post(
  "/:id/validate",
  requireRole("INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  validateReceipt
);

export default router;