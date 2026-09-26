import express from "express";

import {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransfer,
  cancelTransfer,
  validateTransfer,
} from "../controllers/transfer.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// ==========================================
// LIST
// ==========================================

router.get("/", getTransfers);

// ==========================================
// CREATE
// ==========================================

router.post(
  "/",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  createTransfer
);

// ==========================================
// GET ONE
// ==========================================

router.get("/:id", getTransferById);

// ==========================================
// UPDATE DRAFT
// ==========================================

router.put(
  "/:id",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  updateTransfer
);

// ==========================================
// CANCEL DRAFT
// ==========================================

router.delete(
  "/:id",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  cancelTransfer
);

// ==========================================
// VALIDATE
// ==========================================

router.post(
  "/:id/validate",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  validateTransfer
);

export default router;