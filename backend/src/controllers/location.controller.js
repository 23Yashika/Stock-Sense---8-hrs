import prisma from "../config/prisma.js";

// CREATE LOCATION
export const createLocation = async (req, res) => {
  try {
    const { warehouseId, name, code } = req.body;

    if (!warehouseId || !name?.trim() || !code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Warehouse, location name and code are required",
      });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: {
        id: warehouseId,
      },
    });

    if (!warehouse || !warehouse.isActive) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    const locationCode = code.trim().toUpperCase();

    const existing = await prisma.location.findFirst({
      where: {
        warehouseId,
        code: locationCode,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Location code already exists in this warehouse",
      });
    }

    const location = await prisma.location.create({
      data: {
        warehouseId,
        name: name.trim(),
        code: locationCode,
      },
    });

    res.status(201).json({
      success: true,
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    console.error("Create Location Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET LOCATIONS
export const getLocations = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const locations = await prisma.location.findMany({
      where: warehouseId
        ? { warehouseId }
        : undefined,
      include: {
        warehouse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.error("Get Locations Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ONE
export const getLocationById = async (req, res) => {
  try {
    const location = await prisma.location.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        warehouse: true,
      },
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    console.error("Get Location Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE
export const updateLocation = async (req, res) => {
  try {
    const { name, code } = req.body;

    const existing = await prisma.location.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    if (code !== undefined) {
      const duplicate = await prisma.location.findFirst({
        where: {
          warehouseId: existing.warehouseId,
          code: code.trim().toUpperCase(),
          NOT: {
            id: req.params.id,
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Location code already exists",
        });
      }
    }

    const location = await prisma.location.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),
        ...(code !== undefined && {
          code: code.trim().toUpperCase(),
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    console.error("Update Location Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE
export const deleteLocation = async (req, res) => {
  try {
    const existing = await prisma.location.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    await prisma.location.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Delete Location Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};