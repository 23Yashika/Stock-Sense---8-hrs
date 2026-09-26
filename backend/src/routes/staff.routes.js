import express from "express";

import {
  createWarehouseStaff,
} from "../controllers/staff.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  requireRole,
} from "../middleware/role.middleware.js";

const router = express.Router();


// ========================================
// CREATE WAREHOUSE STAFF
// ========================================
//
// Only an authenticated Inventory Manager
// can create Warehouse Staff.
//
// ========================================

router.post(
  "/",
  authenticate,
  requireRole("INVENTORY_MANAGER"),
  createWarehouseStaff
);


export default router;