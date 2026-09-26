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