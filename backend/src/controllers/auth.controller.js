import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import prisma from "../config/prisma.js";
import transporter from "../config/mailer.js";


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
// SIGNUP
// ========================================
// Prototype signup page.
//
// The Inventory Manager is already seeded
// in the database.
//
// This endpoint verifies the seeded
// Inventory Manager credentials and does
// NOT create another Inventory Manager.
// ========================================

export const signup = async (req, res) => {
  try {
    const {
      loginId,
      email,
      password,
      confirmPassword,
    } = req.body;


    // ----------------------------------------
    // Required fields
    // ----------------------------------------

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


    // ----------------------------------------
    // Login ID validation
    // ----------------------------------------

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


    // ----------------------------------------
    // Email validation
    // ----------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }


    // ----------------------------------------
    // Password confirmation
    // ----------------------------------------

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }


    // ----------------------------------------
    // Password validation
    // ----------------------------------------

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{7,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, special character and be more than 6 characters",
      });
    }


    // ----------------------------------------
    // Find seeded Inventory Manager
    // ----------------------------------------

    const manager = await prisma.user.findFirst({
      where: {
        role: "INVENTORY_MANAGER",
      },
    });


    if (!manager) {
      return res.status(500).json({
        success: false,
        message:
          "Inventory Manager has not been seeded yet",
      });
    }


    // ----------------------------------------
    // Verify login ID + email
    // ----------------------------------------

    if (
      manager.loginId !== trimmedLoginId ||
      manager.email !== normalizedEmail
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Please use the seeded Inventory Manager credentials",
      });
    }


    // ----------------------------------------
    // Verify password
    // ----------------------------------------

    const passwordMatched = await bcrypt.compare(
      password,
      manager.passwordHash
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Inventory Manager credentials",
      });
    }


    // ----------------------------------------
    // Check active status
    // ----------------------------------------

    if (!manager.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Inventory Manager account is disabled",
      });
    }


    // ----------------------------------------
    // Generate JWT
    // ----------------------------------------

    const token = generateToken(manager);


    // ----------------------------------------
    // Response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Inventory Manager signup completed successfully",

      token,

      user: {
        id: manager.id,
        loginId: manager.loginId,
        email: manager.email,
        role: manager.role,
      },
    });

  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ========================================
// LOGIN
// ========================================

export const login = async (req, res) => {
  try {
    const {
      loginId,
      password,
    } = req.body;


    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Login ID and password are required",
      });
    }


    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        loginId: loginId.trim(),
      },
    });


    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid login ID or password",
      });
    }


    // ----------------------------------------
    // Check active account
    // ----------------------------------------

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled",
      });
    }


    // ----------------------------------------
    // Compare password
    // ----------------------------------------

    const passwordMatched =
      await bcrypt.compare(
        password,
        user.passwordHash
      );


    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid login ID or password",
      });
    }


    // ----------------------------------------
    // Generate JWT
    // ----------------------------------------

    const token = generateToken(user);


    // ----------------------------------------
    // Response
    // ----------------------------------------

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


// ========================================
// FORGOT PASSWORD
// SEND OTP
// ========================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;


    // ----------------------------------------
    // Validate email
    // ----------------------------------------

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email",
      });
    }


    // ----------------------------------------
    // Generate 6 digit OTP
    // ----------------------------------------

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();


    // ----------------------------------------
    // Hash OTP
    // ----------------------------------------

    const otpHash = await bcrypt.hash(
      otp,
      10
    );


    // ----------------------------------------
    // OTP expires after 10 minutes
    // ----------------------------------------

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );


    // ----------------------------------------
    // Invalidate previous OTPs
    // ----------------------------------------

    await prisma.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        used: false,
      },

      data: {
        used: true,
      },
    });


    // ----------------------------------------
    // Save OTP
    // ----------------------------------------

    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
      },
    });


    // ----------------------------------------
    // Send OTP email
    // ----------------------------------------

    await transporter.sendMail({
      from: `"StockSense" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject:
        "StockSense Password Reset OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 20px;
        ">

          <h2>StockSense Password Reset</h2>

          <p>
            Hello <strong>${user.loginId}</strong>,
          </p>

          <p>
            Use the OTP below to reset your
            StockSense password.
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background: #f4f4f4;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset,
            please ignore this email.
          </p>

          <p>
            Regards,<br>
            <strong>StockSense Team</strong>
          </p>

        </div>
      `,
    });


    // ----------------------------------------
    // Response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully to your email",
    });

  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
    });
  }
};


// ========================================
// VERIFY OTP
// ========================================

export const verifyOtp = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;


    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required",
      });
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    // ----------------------------------------
    // Find latest unused OTP
    // ----------------------------------------

    const resetOtp =
      await prisma.passwordResetOtp.findFirst({
        where: {
          userId: user.id,
          used: false,
        },

        orderBy: {
          createdAt: "desc",
        },
      });


    if (!resetOtp) {
      return res.status(400).json({
        success: false,
        message:
          "OTP not found or already used",
      });
    }


    // ----------------------------------------
    // Check expiry
    // ----------------------------------------

    if (
      new Date() >
      resetOtp.expiresAt
    ) {
      await prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          used: true,
        },
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }


    // ----------------------------------------
    // Check attempts
    // ----------------------------------------

    if (resetOtp.attempts >= 5) {
      await prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          used: true,
        },
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });
    }


    // ----------------------------------------
    // Compare OTP
    // ----------------------------------------

    const otpMatched =
      await bcrypt.compare(
        otp.toString(),
        resetOtp.otpHash
      );


    if (!otpMatched) {
      await prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }


    // ----------------------------------------
    // Success
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully",
    });

  } catch (error) {
    console.error(
      "Verify OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP",
    });
  }
};


// ========================================
// RESET PASSWORD
// ========================================

export const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;


    // ----------------------------------------
    // Required fields
    // ----------------------------------------

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }


    // ----------------------------------------
    // Password confirmation
    // ----------------------------------------

    if (
      newPassword !== confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match",
      });
    }


    // ----------------------------------------
    // Password validation
    // ----------------------------------------

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{7,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain uppercase, lowercase, special character and be more than 6 characters",
      });
    }


    const normalizedEmail =
      email.trim().toLowerCase();


    // ----------------------------------------
    // Find user
    // ----------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    // ----------------------------------------
    // Find OTP
    // ----------------------------------------

    const resetOtp =
      await prisma.passwordResetOtp.findFirst({
        where: {
          userId: user.id,
          used: false,
        },

        orderBy: {
          createdAt: "desc",
        },
      });


    if (!resetOtp) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired OTP",
      });
    }


    // ----------------------------------------
    // Check expiry
    // ----------------------------------------

    if (
      new Date() >
      resetOtp.expiresAt
    ) {
      await prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          used: true,
        },
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }


    // ----------------------------------------
    // Check attempts
    // ----------------------------------------

    if (resetOtp.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts",
      });
    }


    // ----------------------------------------
    // Verify OTP
    // ----------------------------------------

    const otpMatched =
      await bcrypt.compare(
        otp.toString(),
        resetOtp.otpHash
      );


    if (!otpMatched) {
      await prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }


    // ----------------------------------------
    // Hash new password
    // ----------------------------------------

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );


    // ----------------------------------------
    // Update password + consume OTP
    // ----------------------------------------

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          passwordHash:
            newPasswordHash,
        },
      }),

      prisma.passwordResetOtp.update({
        where: {
          id: resetOtp.id,
        },

        data: {
          used: true,
        },
      }),
    ]);


    // ----------------------------------------
    // Response
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now login.",
    });

  } catch (error) {
    console.error(
      "Reset Password Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset password",
    });
  }
};