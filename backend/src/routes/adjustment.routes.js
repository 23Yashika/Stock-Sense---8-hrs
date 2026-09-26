
import express from "express";

import {
  createAdjustment,
  getAdjustments,
  getAdjustmentById,
} from "../controllers/adjustment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// ==========================================
// GET ALL
// ==========================================

router.get(
  "/",
  getAdjustments
);

// ==========================================
// CREATE
// ==========================================

router.post(
  "/",
  requireRole(
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  createAdjustment
);

// ==========================================
// GET ONE
// ==========================================

router.get(
  "/:id",
  getAdjustmentById
);

export default router;