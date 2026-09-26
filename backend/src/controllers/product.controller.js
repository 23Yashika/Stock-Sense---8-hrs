import prisma from "../config/prisma.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      unitOfMeasure,
      initialStock,
    } = req.body;

    if (!name || !sku || !category || !unitOfMeasure) {
      return res.status(400).json({
        success: false,
        message: "Name, SKU, category and unit of measure are required",
      });
    }

    const stock = initialStock ?? 0;

    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Initial stock must be a non-negative number",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        sku: sku.trim(),
      },
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        unitOfMeasure: unitOfMeasure.trim(),
        initialStock: stock,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL PRODUCTS (Includes location & warehouse stock breakdown)
export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        stocks: {
          include: {
            warehouse: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET SINGLE PRODUCT
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        stocks: {
          include: {
            warehouse: true,
            location: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, unitOfMeasure, initialStock } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || !existingProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (sku !== undefined) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          sku: sku.trim(),
          NOT: { id },
        },
      });

      if (duplicateSku) {
        return res.status(409).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sku !== undefined) updateData.sku = sku.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (unitOfMeasure !== undefined) updateData.unitOfMeasure = unitOfMeasure.trim();
    if (initialStock !== undefined) updateData.initialStock = initialStock;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || !existingProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};