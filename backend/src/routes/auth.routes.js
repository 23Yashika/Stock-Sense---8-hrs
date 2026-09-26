import express from "express";

import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();


// Inventory Manager prototype signup
router.post("/signup", signup);


// Login
router.post("/login", login);


// Forgot password → send OTP
router.post(
  "/forgot-password",
  forgotPassword
);


// Verify OTP
router.post(
  "/verify-otp",
  verifyOtp
);


// Reset password
router.post(
  "/reset-password",
  resetPassword
);


export default router;