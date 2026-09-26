import express from "express";

import { getStock, getStockLedger } from "../controllers/stock.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getStock);
router.get("/ledger", getStockLedger);

export default router;