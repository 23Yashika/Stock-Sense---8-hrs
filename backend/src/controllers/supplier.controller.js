import prisma from "../config/prisma.js";

// CREATE SUPPLIER
export const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Create Supplier Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET SUPPLIERS
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("Get Suppliers Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ONE SUPPLIER
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error("Get Supplier Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE SUPPLIER
export const updateSupplier = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const existing = await prisma.supplier.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const supplier = await prisma.supplier.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(address !== undefined && { address: address.trim() }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update Supplier Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE SUPPLIER
export const deleteSupplier = async (req, res) => {
  try {
    const existing = await prisma.supplier.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await prisma.supplier.update({
      where: {
        id: req.params.id,
      },
      data: {
        isActive: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete Supplier Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};