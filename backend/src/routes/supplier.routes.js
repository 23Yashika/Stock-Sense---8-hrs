import express from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("INVENTORY_MANAGER"),
  createSupplier
);

router.get("/", getSuppliers);

router.get("/:id", getSupplierById);

router.put(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  updateSupplier
);

router.delete(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  deleteSupplier
);

export default router;