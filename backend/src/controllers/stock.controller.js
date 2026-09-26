import prisma from "../config/prisma.js";

export const getStock = async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
    } = req.query;

    const stock = await prisma.stock.findMany({
      where: {
        ...(productId && { productId }),
        ...(warehouseId && { warehouseId }),
        ...(locationId && { locationId }),
      },

      include: {
        product: true,
        warehouse: true,
        location: true,
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: stock.length,
      stock,
    });
  } catch (error) {
    console.error("Get Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getStockLedger = async (req, res) => {
  try {
    const { search, moveType, productId, warehouseId } = req.query;

    const where = {};

    if (moveType) {
      where.moveType = moveType;
    }

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.OR = [
        { referenceId: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
        { receipt: { supplier: { name: { contains: search, mode: "insensitive" } } } },
        { delivery: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const ledger = await prisma.stockLedger.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        location: true,
        receipt: {
          include: {
            supplier: true,
          },
        },
        delivery: {
          include: {
            customer: true,
          },
        },
        transfer: {
          include: {
            sourceWarehouse: true,
            sourceLocation: true,
            destinationWarehouse: true,
            destinationLocation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: ledger.length,
      ledger,
    });
  } catch (error) {
    console.error("Get Stock Ledger Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};