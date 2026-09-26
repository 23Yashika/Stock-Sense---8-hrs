import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";


// ========================================
// GENERATE JWT
// ========================================

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};


// ========================================
// LOGIN
// ========================================

export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Login ID and password are required",
      });
    }

    // -----------------------------
    // Find user
    // -----------------------------

    const user = await prisma.user.findUnique({
      where: {
        loginId: loginId.trim(),
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid login ID or password",
      });
    }

    // -----------------------------
    // Check active account
    // -----------------------------

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });
    }

    // -----------------------------
    // Compare password
    // -----------------------------

    const passwordMatched = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid login ID or password",
      });
    }

    // -----------------------------
    // Generate JWT
    // -----------------------------

    const token = generateToken(user);

    // -----------------------------
    // Return user + token
    // -----------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};