import express from "express";

import { getStock } from "../controllers/stock.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getStock);

export default router;