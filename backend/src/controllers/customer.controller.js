import prisma from "../config/prisma.js";

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL CUSTOMERS
export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET CUSTOMER
export const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!customer || !customer.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Get Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
    } = req.body;

    const existing = await prisma.customer.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(email !== undefined && {
          email: email.trim() || null,
        }),

        ...(phone !== undefined && {
          phone: phone.trim() || null,
        }),

        ...(address !== undefined && {
          address: address.trim() || null,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    const existing = await prisma.customer.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await prisma.customer.update({
      where: {
        id: req.params.id,
      },
      data: {
        isActive: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};