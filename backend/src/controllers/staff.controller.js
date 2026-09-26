import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";


// ========================================
// CREATE WAREHOUSE STAFF
// ========================================

export const createWarehouseStaff = async (req, res) => {
  try {
    const {
      loginId,
      email,
      password,
      confirmPassword,
    } = req.body;


    // ========================================
    // REQUIRED FIELDS
    // ========================================

    if (
      !loginId ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }


    // ========================================
    // LOGIN ID VALIDATION
    // ========================================

    const trimmedLoginId = loginId.trim();

    if (
      trimmedLoginId.length < 6 ||
      trimmedLoginId.length > 12
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Login ID must be between 6 and 12 characters",
      });
    }


    // ========================================
    // EMAIL VALIDATION
    // ========================================

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }


    // ========================================
    // PASSWORD CONFIRMATION
    // ========================================

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }


    // ========================================
    // PASSWORD VALIDATION
    // ========================================

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{7,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, special character and be more than 6 characters",
      });
    }


    // ========================================
    // CHECK LOGIN ID
    // ========================================

    const existingLoginId =
      await prisma.user.findUnique({
        where: {
          loginId: trimmedLoginId,
        },
      });

    if (existingLoginId) {
      return res.status(409).json({
        success: false,
        message: "Login ID already exists",
      });
    }


    // ========================================
    // CHECK EMAIL
    // ========================================

    const existingEmail =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }


    // ========================================
    // HASH PASSWORD
    // ========================================

    const passwordHash = await bcrypt.hash(
      password,
      12
    );


    // ========================================
    // CREATE STAFF
    // ========================================
    //
    // IMPORTANT:
    // Role is NOT coming from frontend.
    //
    // Backend automatically assigns:
    // WAREHOUSE_STAFF
    // ========================================

    const staff = await prisma.user.create({
      data: {
        loginId: trimmedLoginId,
        email: normalizedEmail,
        passwordHash,

        role: "WAREHOUSE_STAFF",

        isActive: true,
      },
    });


    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message:
        "Warehouse Staff account created successfully",

      user: {
        id: staff.id,
        loginId: staff.loginId,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
      },
    });

  } catch (error) {
    console.error(
      "Create Warehouse Staff Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};