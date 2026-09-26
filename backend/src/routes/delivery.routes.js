import express from "express";

import {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  updateDelivery,
  cancelDelivery,
  pickDelivery,
  packDelivery,
  validateDelivery,
} from "../controllers/delivery.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// ==========================================
// LIST
// ==========================================

router.get("/", getDeliveries);

// ==========================================
// CREATE
// ==========================================

router.post(
  "/",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  createDelivery
);

// ==========================================
// GET ONE
// ==========================================

router.get("/:id", getDeliveryById);

// ==========================================
// UPDATE READY DELIVERY
// ==========================================

router.put(
  "/:id",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  updateDelivery
);

// ==========================================
// CANCEL READY DELIVERY
// ==========================================

router.delete(
  "/:id",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  cancelDelivery
);

// ==========================================
// PICK
// ==========================================

router.post(
  "/:id/pick",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  pickDelivery
);

// ==========================================
// PACK
// ==========================================

router.post(
  "/:id/pack",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  packDelivery
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
  validateDelivery
);

export default router;