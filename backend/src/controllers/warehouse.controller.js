import prisma from "../config/prisma.js";

// CREATE
export const createWarehouse = async (req, res) => {
  try {
    const { name, code, address } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Warehouse name and code are required",
      });
    }

    const warehouseCode = code.trim().toUpperCase();

    const existing = await prisma.warehouse.findUnique({
      where: {
        code: warehouseCode,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Warehouse code already exists",
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: warehouseCode,
        address: address?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Create Warehouse Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL
export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        isActive: true,
      },
      include: {
        locations: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: warehouses.length,
      warehouses,
    });
  } catch (error) {
    console.error("Get Warehouses Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ONE
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        locations: true,
      },
    });

    if (!warehouse || !warehouse.isActive) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.status(200).json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("Get Warehouse Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE
export const updateWarehouse = async (req, res) => {
  try {
    const { name, code, address } = req.body;

    const existing = await prisma.warehouse.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    if (code !== undefined) {
      const duplicate = await prisma.warehouse.findFirst({
        where: {
          code: code.trim().toUpperCase(),
          NOT: {
            id: req.params.id,
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Warehouse code already exists",
        });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && {
          code: code.trim().toUpperCase(),
        }),
        ...(address !== undefined && {
          address: address.trim(),
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Update Warehouse Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE
export const deleteWarehouse = async (req, res) => {
  try {
    const existing = await prisma.warehouse.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    await prisma.warehouse.update({
      where: {
        id: req.params.id,
      },
      data: {
        isActive: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error("Delete Warehouse Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};