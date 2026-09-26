import express from "express";

import {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("INVENTORY_MANAGER"),
  createLocation
);

router.get("/", getLocations);

router.get("/:id", getLocationById);

router.put(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  updateLocation
);

router.delete(
  "/:id",
  requireRole("INVENTORY_MANAGER"),
  deleteLocation
);

export default router;