import express from "express";

import {
  createWarehouseStaff,
  getWarehouseStaff,
} from "../controllers/staff.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  requireRole,
} from "../middleware/role.middleware.js";

const router = express.Router();


// ========================================
// GET ALL WAREHOUSE STAFF
// ========================================

router.get(
  "/",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  getWarehouseStaff
);


// ========================================
// CREATE WAREHOUSE STAFF
// ========================================

router.post(
  "/",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  createWarehouseStaff
);


export default router;