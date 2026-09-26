import crypto from "crypto";
import prisma from "../config/prisma.js";

export const createReceipt = async (req, res) => {
  try {
    const {
      supplierId,
      warehouseId,
      locationId,
      scheduleDate,
      items,
    } = req.body;

    if (!supplierId || !warehouseId || !locationId) {
      return res.status(400).json({
        success: false,
        message: "Supplier, warehouse and location are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    // Prevent duplicate products inside the same receipt
    const productIds = items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Same product cannot be added twice in one receipt",
      });
    }

    // Validate quantities
    for (const item of items) {
      if (
        !item.productId ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Each product must have a valid positive quantity",
        });
      }
    }

    // Validate supplier
    const supplier = await prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });

    if (!supplier || !supplier.isActive) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Validate warehouse
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

    // Validate location belongs to warehouse
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        warehouseId,
      },
    });

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location does not belong to selected warehouse",
      });
    }

    // Validate products
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid",
      });
    }

    const receipt = await prisma.$transaction(async (tx) => {
      // Temporary unique reference
      const temporaryReference = `TMP-${crypto.randomUUID()}`;

      const created = await tx.receipt.create({
        data: {
          reference: temporaryReference,
          supplierId,
          warehouseId,
          locationId,
          scheduleDate: scheduleDate
            ? new Date(scheduleDate)
            : null,
          status: "DRAFT",
          createdById: req.user.id,

          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },

        include: {
          supplier: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const reference =
        `${warehouse.code}/IN/${String(created.sequence).padStart(4, "0")}`;

      return tx.receipt.update({
        where: {
          id: created.id,
        },
        data: {
          reference,
        },
        include: {
          supplier: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Receipt created successfully",
      receipt,
    });
  } catch (error) {
    console.error("Create Receipt Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getReceipts = async (req, res) => {
  try {
    const {
      search,
      status,
      warehouseId,
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
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
          supplier: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,

      include: {
        supplier: true,
        warehouse: true,
        location: true,
        items: {
          include: {
            product: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: receipts.length,
      receipts,
    });
  } catch (error) {
    console.error("Get Receipts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getReceiptById = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        supplier: true,
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
        items: {
          include: {
            product: true,
          },
        },
        stockLedger: true,
      },
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    return res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error("Get Receipt Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateReceipt = async (req, res) => {
  try {
    const {
      supplierId,
      warehouseId,
      locationId,
      scheduleDate,
      items,
    } = req.body;

    const existing = await prisma.receipt.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        items: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    if (existing.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft receipts can be updated",
      });
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one product is required",
        });
      }

      const productIds = items.map((item) => item.productId);

      if (new Set(productIds).size !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Same product cannot be added twice",
        });
      }

      for (const item of items) {
        if (
          !item.productId ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid product quantity",
          });
        }
      }
    }

    const receipt = await prisma.$transaction(async (tx) => {
      const updateData = {};

      if (supplierId !== undefined) {
        const supplier = await tx.supplier.findUnique({
          where: { id: supplierId },
        });

        if (!supplier || !supplier.isActive) {
          throw new Error("SUPPLIER_NOT_FOUND");
        }

        updateData.supplierId = supplierId;
      }

      if (warehouseId !== undefined) {
        const warehouse = await tx.warehouse.findUnique({
          where: { id: warehouseId },
        });

        if (!warehouse || !warehouse.isActive) {
          throw new Error("WAREHOUSE_NOT_FOUND");
        }

        updateData.warehouseId = warehouseId;
      }

      const finalWarehouseId =
        warehouseId ?? existing.warehouseId;

      if (locationId !== undefined) {
        const location = await tx.location.findFirst({
          where: {
            id: locationId,
            warehouseId: finalWarehouseId,
          },
        });

        if (!location) {
          throw new Error("LOCATION_NOT_FOUND");
        }

        updateData.locationId = locationId;
      }

      if (scheduleDate !== undefined) {
        updateData.scheduleDate = scheduleDate
          ? new Date(scheduleDate)
          : null;
      }

      if (items !== undefined) {
        await tx.receiptItem.deleteMany({
          where: {
            receiptId: existing.id,
          },
        });

        updateData.items = {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        };
      }

      return tx.receipt.update({
        where: {
          id: existing.id,
        },
        data: updateData,
        include: {
          supplier: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Receipt updated successfully",
      receipt,
    });
  } catch (error) {
    console.error("Update Receipt Error:", error);

    if (error.message === "SUPPLIER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    if (error.message === "WAREHOUSE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    if (error.message === "LOCATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Location not found for selected warehouse",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteReceipt = async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    if (receipt.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft receipts can be cancelled",
      });
    }

    await prisma.receipt.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Receipt cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Receipt Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const validateReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: {
          id: receiptId,
        },

        include: {
          items: true,
        },
      });

      if (!receipt) {
        throw new Error("RECEIPT_NOT_FOUND");
      }

      if (receipt.status !== "DRAFT") {
        throw new Error("RECEIPT_ALREADY_PROCESSED");
      }

      if (receipt.items.length === 0) {
        throw new Error("RECEIPT_HAS_NO_ITEMS");
      }

      const ledgerEntries = [];

      for (const item of receipt.items) {
        /*
         * Increase stock.
         *
         * If stock does not exist:
         * quantity = item.quantity
         *
         * If stock exists:
         * quantity = existing quantity + item.quantity
         */
        const stock = await tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: receipt.locationId,
            },
          },

          create: {
            productId: item.productId,
            warehouseId: receipt.warehouseId,
            locationId: receipt.locationId,
            quantity: item.quantity,
          },

          update: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create ledger entry
        const ledger = await tx.stockLedger.create({
          data: {
            productId: item.productId,
            warehouseId: receipt.warehouseId,
            locationId: receipt.locationId,

            moveType: "RECEIPT",

            quantityDelta: item.quantity,
            stockAfter: stock.quantity,

            referenceType: "RECEIPT",
            referenceId: receipt.reference,

            receiptId: receipt.id,
          },
        });

        ledgerEntries.push(ledger);
      }

      // Change receipt status
      const updatedReceipt = await tx.receipt.update({
        where: {
          id: receipt.id,
        },

        data: {
          status: "RECEIVED",
        },

        include: {
          supplier: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return {
        receipt: updatedReceipt,
        ledgerEntries,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Receipt validated successfully. Stock updated.",
      receipt: result.receipt,
      ledgerEntries: result.ledgerEntries,
    });
  } catch (error) {
    console.error("Validate Receipt Error:", error);

    if (error.message === "RECEIPT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    if (error.message === "RECEIPT_ALREADY_PROCESSED") {
      return res.status(400).json({
        success: false,
        message: "Receipt is already processed",
      });
    }

    if (error.message === "RECEIPT_HAS_NO_ITEMS") {
      return res.status(400).json({
        success: false,
        message: "Receipt has no products",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

