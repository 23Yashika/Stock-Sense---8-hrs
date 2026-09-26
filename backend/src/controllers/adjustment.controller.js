import prisma from "../config/prisma.js";

// ======================================================
// CREATE STOCK ADJUSTMENT
// ======================================================

export const createAdjustment = async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      locationId,
      countedQuantity,
      reason,
    } = req.body;

    // ------------------------------------------
    // Basic validation
    // ------------------------------------------

    if (
      !productId ||
      !warehouseId ||
      !locationId ||
      countedQuantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product, warehouse, location and counted quantity are required",
      });
    }

    // ------------------------------------------
    // Counted quantity must be valid
    // ------------------------------------------

    if (
      typeof countedQuantity !== "number" ||
      !Number.isFinite(countedQuantity) ||
      countedQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Counted quantity must be a non-negative number",
      });
    }

    // ------------------------------------------
    // Validate product
    // ------------------------------------------

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ------------------------------------------
    // Validate warehouse
    // ------------------------------------------

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

    // ------------------------------------------
    // Validate location belongs to warehouse
    // ------------------------------------------

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        warehouseId,
      },
    });

    if (!location) {
      return res.status(400).json({
        success: false,
        message:
          "Location does not belong to the selected warehouse",
      });
    }

    // ------------------------------------------
    // TRANSACTION
    // ------------------------------------------

    const result = await prisma.$transaction(
      async (tx) => {
        // --------------------------------------
        // Find current stock
        // --------------------------------------

        const existingStock =
          await tx.stock.findUnique({
            where: {
              productId_locationId: {
                productId,
                locationId,
              },
            },
          });

        const systemQuantity =
          existingStock?.quantity ?? 0;

        // --------------------------------------
        // Calculate difference
        // --------------------------------------

        const quantityDelta =
          countedQuantity - systemQuantity;

        // --------------------------------------
        // If there is no difference
        // --------------------------------------

        if (quantityDelta === 0) {
          throw new Error(
            "NO_ADJUSTMENT_REQUIRED"
          );
        }

        // --------------------------------------
        // Update or create stock
        // --------------------------------------

        const updatedStock =
          await tx.stock.upsert({
            where: {
              productId_locationId: {
                productId,
                locationId,
              },
            },

            create: {
              productId,
              warehouseId,
              locationId,
              quantity: countedQuantity,
            },

            update: {
              quantity: countedQuantity,
            },
          });

        // --------------------------------------
        // Create temporary reference
        // --------------------------------------

        const temporaryReference =
          `TMP-ADJ-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`;

        // --------------------------------------
        // Create adjustment
        // --------------------------------------

        const adjustment =
          await tx.stockAdjustment.create({
            data: {
              reference: temporaryReference,

              productId,
              warehouseId,
              locationId,

              systemQuantity,
              countedQuantity,
              quantityDelta,

              reason:
                reason?.trim() || null,

              status: "COMPLETED",

              createdById: req.user.id,
            },
          });

        // --------------------------------------
        // Generate proper reference
        // --------------------------------------

        const reference =
          `WH/ADJ/${String(
            adjustment.sequence
          ).padStart(4, "0")}`;

        const updatedAdjustment =
          await tx.stockAdjustment.update({
            where: {
              id: adjustment.id,
            },

            data: {
              reference,
            },

            include: {
              product: true,
              warehouse: true,
              location: true,

              createdBy: {
                select: {
                  id: true,
                  loginId: true,
                  email: true,
                },
              },
            },
          });

        // --------------------------------------
        // Create ledger entry
        // --------------------------------------

        const ledger =
          await tx.stockLedger.create({
            data: {
              productId,
              warehouseId,
              locationId,

              moveType: "ADJUSTMENT",

              quantityDelta,

              stockAfter:
                updatedStock.quantity,

              referenceType:
                "ADJUSTMENT",

              referenceId:
                reference,

              adjustmentId:
                adjustment.id,
            },
          });

        return {
          adjustment: updatedAdjustment,
          stock: updatedStock,
          ledger,
        };
      }
    );

    return res.status(201).json({
      success: true,

      message:
        "Stock adjustment completed successfully",

      adjustment:
        result.adjustment,

      stock:
        result.stock,

      ledger:
        result.ledger,
    });
  } catch (error) {
    console.error(
      "Create Adjustment Error:",
      error
    );

    if (
      error.message ===
      "NO_ADJUSTMENT_REQUIRED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Counted quantity is the same as recorded stock. No adjustment required.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// GET ALL ADJUSTMENTS
// ======================================================

export const getAdjustments = async (req, res) => {
  try {
    const {
      search,
      warehouseId,
      locationId,
      productId,
    } = req.query;

    const where = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        {
          reference: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          product: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          product: {
            sku: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const adjustments =
      await prisma.stockAdjustment.findMany({
        where,

        include: {
          product: true,
          warehouse: true,
          location: true,

          createdBy: {
            select: {
              id: true,
              loginId: true,
            },
          },

          stockLedger: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: adjustments.length,
      adjustments,
    });
  } catch (error) {
    console.error(
      "Get Adjustments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// GET ADJUSTMENT BY ID
// ======================================================

export const getAdjustmentById = async (
  req,
  res
) => {
  try {
    const adjustment =
      await prisma.stockAdjustment.findUnique({
        where: {
          id: req.params.id,
        },

        include: {
          product: true,
          warehouse: true,
          location: true,

          createdBy: {
            select: {
              id: true,
              loginId: true,
              email: true,
              role: true,
            },
          },

          stockLedger: true,
        },
      });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: "Adjustment not found",
      });
    }

    return res.status(200).json({
      success: true,
      adjustment,
    });
  } catch (error) {
    console.error(
      "Get Adjustment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};