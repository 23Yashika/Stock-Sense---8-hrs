import express from "express";

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("INVENTORY_MANAGER"),
  createCustomer
);

router.get("/", getCustomers);

router.get("/:id", getCustomerById);

router.put(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  updateCustomer
);

router.delete(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  deleteCustomer
);

export default router;