import prisma from "../config/prisma.js";

// ======================================================
// CREATE INTERNAL TRANSFER
// ======================================================

export const createTransfer = async (req, res) => {
  try {
    const {
      sourceWarehouseId,
      sourceLocationId,
      destinationWarehouseId,
      destinationLocationId,
      items,
    } = req.body;

    // ------------------------------------------
    // Basic validation
    // ------------------------------------------

    if (
      !sourceWarehouseId ||
      !sourceLocationId ||
      !destinationWarehouseId ||
      !destinationLocationId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source warehouse, source location, destination warehouse and destination location are required",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    // ------------------------------------------
    // Source and destination cannot be same
    // ------------------------------------------

    if (
      sourceLocationId === destinationLocationId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source and destination location cannot be the same",
      });
    }

    // ------------------------------------------
    // Validate product quantities
    // ------------------------------------------

    for (const item of items) {
      if (
        !item.productId ||
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each product must have a valid positive quantity",
        });
      }
    }

    // ------------------------------------------
    // Prevent duplicate products
    // ------------------------------------------

    const productIds = items.map(
      (item) => item.productId
    );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Same product cannot be added twice in one transfer",
      });
    }

    // ------------------------------------------
    // Validate source warehouse
    // ------------------------------------------

    const sourceWarehouse =
      await prisma.warehouse.findUnique({
        where: {
          id: sourceWarehouseId,
        },
      });

    if (
      !sourceWarehouse ||
      !sourceWarehouse.isActive
    ) {
      return res.status(404).json({
        success: false,
        message: "Source warehouse not found",
      });
    }

    // ------------------------------------------
    // Validate destination warehouse
    // ------------------------------------------

    const destinationWarehouse =
      await prisma.warehouse.findUnique({
        where: {
          id: destinationWarehouseId,
        },
      });

    if (
      !destinationWarehouse ||
      !destinationWarehouse.isActive
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Destination warehouse not found",
      });
    }

    // ------------------------------------------
    // Validate source location
    // ------------------------------------------

    const sourceLocation =
      await prisma.location.findFirst({
        where: {
          id: sourceLocationId,
          warehouseId: sourceWarehouseId,
        },
      });

    if (!sourceLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Source location does not belong to source warehouse",
      });
    }

    // ------------------------------------------
    // Validate destination location
    // ------------------------------------------

    const destinationLocation =
      await prisma.location.findFirst({
        where: {
          id: destinationLocationId,
          warehouseId: destinationWarehouseId,
        },
      });

    if (!destinationLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Destination location does not belong to destination warehouse",
      });
    }

    // ------------------------------------------
    // Validate products
    // ------------------------------------------

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          isActive: true,
        },
      });

    if (
      products.length !== productIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more products are invalid",
      });
    }

    // ------------------------------------------
    // Create transfer
    // ------------------------------------------

    const transfer =
      await prisma.$transaction(async (tx) => {
        const temporaryReference =
          `TMP-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`;

        const created =
          await tx.transfer.create({
            data: {
              reference: temporaryReference,

              sourceWarehouseId,
              sourceLocationId,

              destinationWarehouseId,
              destinationLocationId,

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
              sourceWarehouse: true,
              sourceLocation: true,

              destinationWarehouse: true,
              destinationLocation: true,

              items: {
                include: {
                  product: true,
                },
              },
            },
          });

        // --------------------------------------
        // Generate reference
        // --------------------------------------

        const reference =
          `${sourceWarehouse.code}/INT/${String(
            created.sequence
          ).padStart(4, "0")}`;

        return tx.transfer.update({
          where: {
            id: created.id,
          },

          data: {
            reference,
          },

          include: {
            sourceWarehouse: true,
            sourceLocation: true,

            destinationWarehouse: true,
            destinationLocation: true,

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
      message:
        "Internal transfer created successfully",

      transfer,
    });
  } catch (error) {
    console.error(
      "Create Transfer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// GET ALL TRANSFERS
// ======================================================

export const getTransfers = async (req, res) => {
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
      where.OR = [
        {
          sourceWarehouseId: warehouseId,
        },
        {
          destinationWarehouseId:
            warehouseId,
        },
      ];
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
          sourceLocation: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },

        {
          destinationLocation: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const transfers =
      await prisma.transfer.findMany({
        where,

        include: {
          sourceWarehouse: true,
          sourceLocation: true,

          destinationWarehouse: true,
          destinationLocation: true,

          items: {
            include: {
              product: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              loginId: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    console.error(
      "Get Transfers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// GET TRANSFER BY ID
// ======================================================

export const getTransferById = async (
  req,
  res
) => {
  try {
    const transfer =
      await prisma.transfer.findUnique({
        where: {
          id: req.params.id,
        },

        include: {
          sourceWarehouse: true,
          sourceLocation: true,

          destinationWarehouse: true,
          destinationLocation: true,

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

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    return res.status(200).json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error(
      "Get Transfer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// UPDATE TRANSFER
// ======================================================

export const updateTransfer = async (
  req,
  res
) => {
  try {
    const existing =
      await prisma.transfer.findUnique({
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
        message: "Transfer not found",
      });
    }

    if (existing.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft transfers can be updated",
      });
    }

    const {
      sourceWarehouseId,
      sourceLocationId,
      destinationWarehouseId,
      destinationLocationId,
      items,
    } = req.body;

    const finalSourceWarehouse =
      sourceWarehouseId ??
      existing.sourceWarehouseId;

    const finalSourceLocation =
      sourceLocationId ??
      existing.sourceLocationId;

    const finalDestinationWarehouse =
      destinationWarehouseId ??
      existing.destinationWarehouseId;

    const finalDestinationLocation =
      destinationLocationId ??
      existing.destinationLocationId;

    if (
      finalSourceLocation ===
      finalDestinationLocation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source and destination location cannot be the same",
      });
    }

    if (items !== undefined) {
      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one product is required",
        });
      }

      for (const item of items) {
        if (
          !item.productId ||
          typeof item.quantity !== "number" ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each product must have a valid positive quantity",
          });
        }
      }

      const productIds =
        items.map(
          (item) => item.productId
        );

      if (
        new Set(productIds).size !==
        productIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Same product cannot be added twice",
        });
      }
    }

    const transfer =
      await prisma.$transaction(async (tx) => {
        // -------------------------------
        // Source warehouse
        // -------------------------------

        const sourceWarehouse =
          await tx.warehouse.findUnique({
            where: {
              id: finalSourceWarehouse,
            },
          });

        if (
          !sourceWarehouse ||
          !sourceWarehouse.isActive
        ) {
          throw new Error(
            "SOURCE_WAREHOUSE_NOT_FOUND"
          );
        }

        // -------------------------------
        // Destination warehouse
        // -------------------------------

        const destinationWarehouse =
          await tx.warehouse.findUnique({
            where: {
              id: finalDestinationWarehouse,
            },
          });

        if (
          !destinationWarehouse ||
          !destinationWarehouse.isActive
        ) {
          throw new Error(
            "DESTINATION_WAREHOUSE_NOT_FOUND"
          );
        }

        // -------------------------------
        // Source location
        // -------------------------------

        const sourceLocation =
          await tx.location.findFirst({
            where: {
              id: finalSourceLocation,
              warehouseId:
                finalSourceWarehouse,
            },
          });

        if (!sourceLocation) {
          throw new Error(
            "SOURCE_LOCATION_NOT_FOUND"
          );
        }

        // -------------------------------
        // Destination location
        // -------------------------------

        const destinationLocation =
          await tx.location.findFirst({
            where: {
              id: finalDestinationLocation,
              warehouseId:
                finalDestinationWarehouse,
            },
          });

        if (!destinationLocation) {
          throw new Error(
            "DESTINATION_LOCATION_NOT_FOUND"
          );
        }

        const updateData = {
          sourceWarehouseId:
            finalSourceWarehouse,

          sourceLocationId:
            finalSourceLocation,

          destinationWarehouseId:
            finalDestinationWarehouse,

          destinationLocationId:
            finalDestinationLocation,
        };

        if (items !== undefined) {
          const productIds =
            items.map(
              (item) => item.productId
            );

          const products =
            await tx.product.findMany({
              where: {
                id: {
                  in: productIds,
                },
                isActive: true,
              },
            });

          if (
            products.length !==
            productIds.length
          ) {
            throw new Error(
              "PRODUCT_NOT_FOUND"
            );
          }

          await tx.transferItem.deleteMany({
            where: {
              transferId: existing.id,
            },
          });

          updateData.items = {
            create: items.map(
              (item) => ({
                productId:
                  item.productId,
                quantity:
                  item.quantity,
              })
            ),
          };
        }

        return tx.transfer.update({
          where: {
            id: existing.id,
          },

          data: updateData,

          include: {
            sourceWarehouse: true,
            sourceLocation: true,

            destinationWarehouse: true,
            destinationLocation: true,

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
      message:
        "Transfer updated successfully",
      transfer,
    });
  } catch (error) {
    console.error(
      "Update Transfer Error:",
      error
    );

    const messages = {
      SOURCE_WAREHOUSE_NOT_FOUND:
        "Source warehouse not found",

      DESTINATION_WAREHOUSE_NOT_FOUND:
        "Destination warehouse not found",

      SOURCE_LOCATION_NOT_FOUND:
        "Source location does not belong to source warehouse",

      DESTINATION_LOCATION_NOT_FOUND:
        "Destination location does not belong to destination warehouse",

      PRODUCT_NOT_FOUND:
        "One or more products not found",
    };

    if (messages[error.message]) {
      return res.status(400).json({
        success: false,
        message: messages[error.message],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// CANCEL TRANSFER
// ======================================================

export const cancelTransfer = async (
  req,
  res
) => {
  try {
    const transfer =
      await prisma.transfer.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    if (transfer.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft transfers can be cancelled",
      });
    }

    await prisma.transfer.update({
      where: {
        id: transfer.id,
      },

      data: {
        status: "CANCELLED",
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Transfer cancelled successfully",
    });
  } catch (error) {
    console.error(
      "Cancel Transfer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================================
// VALIDATE INTERNAL TRANSFER
// ======================================================

export const validateTransfer = async (
  req,
  res
) => {
  try {
    const transferId = req.params.id;

    const result =
      await prisma.$transaction(
        async (tx) => {
          // -----------------------------------
          // 1. Get transfer
          // -----------------------------------

          const transfer =
            await tx.transfer.findUnique({
              where: {
                id: transferId,
              },

              include: {
                items: true,
              },
            });

          if (!transfer) {
            throw new Error(
              "TRANSFER_NOT_FOUND"
            );
          }

          // -----------------------------------
          // 2. Must be DRAFT
          // -----------------------------------

          if (
            transfer.status !== "DRAFT"
          ) {
            throw new Error(
              "TRANSFER_NOT_DRAFT"
            );
          }

          if (
            transfer.items.length === 0
          ) {
            throw new Error(
              "TRANSFER_HAS_NO_ITEMS"
            );
          }

          const ledgerEntries = [];

          // -----------------------------------
          // 3. Process every product
          // -----------------------------------

          for (const item of transfer.items) {
            // =================================
            // SOURCE STOCK
            // =================================

            const sourceStock =
              await tx.stock.findUnique({
                where: {
                  productId_locationId: {
                    productId:
                      item.productId,

                    locationId:
                      transfer.sourceLocationId,
                  },
                },
              });

            const availableSourceStock =
              sourceStock?.quantity ?? 0;

            // ---------------------------------
            // Check sufficient stock
            // ---------------------------------

            if (
              availableSourceStock <
              item.quantity
            ) {
              throw new Error(
                `INSUFFICIENT_STOCK:${item.productId}:${availableSourceStock}`
              );
            }

            // =================================
            // SUBTRACT SOURCE STOCK
            // =================================

            await tx.stock.update({
              where: {
                id: sourceStock.id,
              },

              data: {
                quantity: {
                  decrement:
                    item.quantity,
                },
              },
            });

            // Get source stock after movement

            const sourceAfter =
              await tx.stock.findUnique({
                where: {
                  id: sourceStock.id,
                },
              });

            // =================================
            // DESTINATION STOCK
            // =================================

            const destinationStock =
              await tx.stock.upsert({
                where: {
                  productId_locationId: {
                    productId:
                      item.productId,

                    locationId:
                      transfer.destinationLocationId,
                  },
                },

                create: {
                  productId:
                    item.productId,

                  warehouseId:
                    transfer.destinationWarehouseId,

                  locationId:
                    transfer.destinationLocationId,

                  quantity:
                    item.quantity,
                },

                update: {
                  quantity: {
                    increment:
                      item.quantity,
                  },
                },
              });

            // =================================
            // SOURCE LEDGER
            // =================================

            const sourceLedger =
              await tx.stockLedger.create({
                data: {
                  productId:
                    item.productId,

                  warehouseId:
                    transfer.sourceWarehouseId,

                  locationId:
                    transfer.sourceLocationId,

                  moveType:
                    "TRANSFER",

                  quantityDelta:
                    -item.quantity,

                  stockAfter:
                    sourceAfter.quantity,

                  referenceType:
                    "TRANSFER",

                  referenceId:
                    transfer.reference,

                  transferId:
                    transfer.id,
                },
              });

            // =================================
            // DESTINATION LEDGER
            // =================================

            const destinationLedger =
              await tx.stockLedger.create({
                data: {
                  productId:
                    item.productId,

                  warehouseId:
                    transfer.destinationWarehouseId,

                  locationId:
                    transfer.destinationLocationId,

                  moveType:
                    "TRANSFER",

                  quantityDelta:
                    item.quantity,

                  stockAfter:
                    destinationStock.quantity,

                  referenceType:
                    "TRANSFER",

                  referenceId:
                    transfer.reference,

                  transferId:
                    transfer.id,
                },
              });

            ledgerEntries.push(
              sourceLedger,
              destinationLedger
            );
          }

          // -----------------------------------
          // 4. Mark transfer completed
          // -----------------------------------

          const completedTransfer =
            await tx.transfer.update({
              where: {
                id: transfer.id,
              },

              data: {
                status: "COMPLETED",
              },

              include: {
                sourceWarehouse: true,
                sourceLocation: true,

                destinationWarehouse: true,
                destinationLocation: true,

                items: {
                  include: {
                    product: true,
                  },
                },
              },
            });

          return {
            transfer:
              completedTransfer,

            ledgerEntries,
          };
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Internal transfer completed successfully",

      transfer:
        result.transfer,

      ledgerEntries:
        result.ledgerEntries,
    });
  } catch (error) {
    console.error(
      "Validate Transfer Error:",
      error
    );

    if (
      error.message ===
      "TRANSFER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    if (
      error.message ===
      "TRANSFER_NOT_DRAFT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only draft transfers can be validated",
      });
    }

    if (
      error.message ===
      "TRANSFER_HAS_NO_ITEMS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transfer has no products",
      });
    }

    if (
      error.message.startsWith(
        "INSUFFICIENT_STOCK:"
      )
    ) {
      const parts =
        error.message.split(":");

      return res.status(400).json({
        success: false,

        message:
          "Insufficient stock at source location",

        productId: parts[1],

        availableStock:
          Number(parts[2]),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

