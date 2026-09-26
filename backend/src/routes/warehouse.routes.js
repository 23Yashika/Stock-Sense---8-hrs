import express from "express";

import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouse.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("INVENTORY_MANAGER"),
  createWarehouse
);

router.get("/", getWarehouses);

router.get("/:id", getWarehouseById);

router.put(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  updateWarehouse
);

router.delete(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  deleteWarehouse
);

export default router;