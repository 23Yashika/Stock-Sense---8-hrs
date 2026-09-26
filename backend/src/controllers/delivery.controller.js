import prisma from "../config/prisma.js";

// ==========================================
// CREATE DELIVERY
// ==========================================

export const createDelivery = async (req, res) => {
  try {
    const {
      customerId,
      warehouseId,
      locationId,
      scheduleDate,
      items,
    } = req.body;

    if (!customerId || !warehouseId || !locationId) {
      return res.status(400).json({
        success: false,
        message: "Customer, warehouse and location are required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    // Prevent duplicate products
    const productIds = items.map(
      (item) => item.productId
    );

    if (
      new Set(productIds).size !== productIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Same product cannot be added twice in one delivery",
      });
    }

    // Validate quantities
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

    // Validate customer
    const customer =
      await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

    if (!customer || !customer.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Validate warehouse
    const warehouse =
      await prisma.warehouse.findUnique({
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
    const location =
      await prisma.location.findFirst({
        where: {
          id: locationId,
          warehouseId,
        },
      });

    if (!location) {
      return res.status(400).json({
        success: false,
        message:
          "Location does not belong to selected warehouse",
      });
    }

    // Validate products
    const products =
      await prisma.product.findMany({
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

    // Create delivery
    const delivery =
      await prisma.$transaction(async (tx) => {
        const temporaryReference =
          `TMP-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`;

        const created =
          await tx.delivery.create({
            data: {
              reference: temporaryReference,

              customerId,
              warehouseId,
              locationId,

              scheduleDate: scheduleDate
                ? new Date(scheduleDate)
                : null,

              status: "READY",

              createdById: req.user.id,

              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
              },
            },

            include: {
              customer: true,
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
          `${warehouse.code}/OUT/${String(
            created.sequence
          ).padStart(4, "0")}`;

        return tx.delivery.update({
          where: {
            id: created.id,
          },

          data: {
            reference,
          },

          include: {
            customer: true,
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
      message: "Delivery created successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Create Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET ALL DELIVERIES
// ==========================================

export const getDeliveries = async (req, res) => {
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
          customer: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const deliveries =
      await prisma.delivery.findMany({
        where,

        include: {
          customer: true,
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
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error(
      "Get Deliveries Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// GET DELIVERY BY ID
// ==========================================

export const getDeliveryById = async (
  req,
  res
) => {
  try {
    const delivery =
      await prisma.delivery.findUnique({
        where: {
          id: req.params.id,
        },

        include: {
          customer: true,
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

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    return res.status(200).json({
      success: true,
      delivery,
    });
  } catch (error) {
    console.error(
      "Get Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// UPDATE DELIVERY
// ==========================================

export const updateDelivery = async (
  req,
  res
) => {
  try {
    const {
      customerId,
      warehouseId,
      locationId,
      scheduleDate,
      items,
    } = req.body;

    const existing =
      await prisma.delivery.findUnique({
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
        message: "Delivery not found",
      });
    }

    if (existing.status !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          "Only ready deliveries can be updated",
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
            "Same product cannot be added twice",
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
            message: "Invalid product quantity",
          });
        }
      }
    }

    const delivery =
      await prisma.$transaction(async (tx) => {
        const updateData = {};

        if (customerId !== undefined) {
          const customer =
            await tx.customer.findUnique({
              where: {
                id: customerId,
              },
            });

          if (
            !customer ||
            !customer.isActive
          ) {
            throw new Error(
              "CUSTOMER_NOT_FOUND"
            );
          }

          updateData.customerId =
            customerId;
        }

        if (warehouseId !== undefined) {
          const warehouse =
            await tx.warehouse.findUnique({
              where: {
                id: warehouseId,
              },
            });

          if (
            !warehouse ||
            !warehouse.isActive
          ) {
            throw new Error(
              "WAREHOUSE_NOT_FOUND"
            );
          }

          updateData.warehouseId =
            warehouseId;
        }

        const finalWarehouseId =
          warehouseId ??
          existing.warehouseId;

        if (locationId !== undefined) {
          const location =
            await tx.location.findFirst({
              where: {
                id: locationId,
                warehouseId:
                  finalWarehouseId,
              },
            });

          if (!location) {
            throw new Error(
              "LOCATION_NOT_FOUND"
            );
          }

          updateData.locationId =
            locationId;
        }

        if (scheduleDate !== undefined) {
          updateData.scheduleDate =
            scheduleDate
              ? new Date(scheduleDate)
              : null;
        }

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

          await tx.deliveryItem.deleteMany({
            where: {
              deliveryId: existing.id,
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

        return tx.delivery.update({
          where: {
            id: existing.id,
          },

          data: updateData,

          include: {
            customer: true,
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
      message:
        "Delivery updated successfully",
      delivery,
    });
  } catch (error) {
    console.error(
      "Update Delivery Error:",
      error
    );

    if (
      error.message ===
      "CUSTOMER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (
      error.message ===
      "WAREHOUSE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    if (
      error.message ===
      "LOCATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Location not found for selected warehouse",
      });
    }

    if (
      error.message ===
      "PRODUCT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "One or more products not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// CANCEL DELIVERY
// ==========================================

export const cancelDelivery = async (
  req,
  res
) => {
  try {
    const delivery =
      await prisma.delivery.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          "Only ready deliveries can be cancelled",
      });
    }

    await prisma.delivery.update({
      where: {
        id: delivery.id,
      },

      data: {
        status: "CANCELLED",
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Delivery cancelled successfully",
    });
  } catch (error) {
    console.error(
      "Cancel Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// PICK DELIVERY
// ==========================================

export const pickDelivery = async (
  req,
  res
) => {
  try {
    const delivery =
      await prisma.delivery.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status !== "READY") {
      return res.status(400).json({
        success: false,
        message:
          "Only ready deliveries can be picked",
      });
    }

    const updated =
      await prisma.delivery.update({
        where: {
          id: delivery.id,
        },

        data: {
          status: "PICKED",
        },

        include: {
          customer: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Delivery picked successfully",
      delivery: updated,
    });
  } catch (error) {
    console.error(
      "Pick Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// PACK DELIVERY
// ==========================================

export const packDelivery = async (
  req,
  res
) => {
  try {
    const delivery =
      await prisma.delivery.findUnique({
        where: {
          id: req.params.id,
        },
      });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (delivery.status !== "PICKED") {
      return res.status(400).json({
        success: false,
        message:
          "Only picked deliveries can be packed",
      });
    }

    const updated =
      await prisma.delivery.update({
        where: {
          id: delivery.id,
        },

        data: {
          status: "PACKED",
        },

        include: {
          customer: true,
          warehouse: true,
          location: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Delivery packed successfully",
      delivery: updated,
    });
  } catch (error) {
    console.error(
      "Pack Delivery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// VALIDATE DELIVERY
// ==========================================

export const validateDelivery = async (
  req,
  res
) => {
  try {
    const deliveryId = req.params.id;

    const result =
      await prisma.$transaction(
        async (tx) => {
          // -----------------------------
          // 1. Get delivery
          // -----------------------------

          const delivery =
            await tx.delivery.findUnique({
              where: {
                id: deliveryId,
              },

              include: {
                items: true,
              },
            });

          if (!delivery) {
            throw new Error(
              "DELIVERY_NOT_FOUND"
            );
          }

          // -----------------------------
          // 2. Must be PACKED
          // -----------------------------

          if (
            delivery.status !== "PACKED"
          ) {
            throw new Error(
              "DELIVERY_NOT_PACKED"
            );
          }

          if (
            delivery.items.length === 0
          ) {
            throw new Error(
              "DELIVERY_HAS_NO_ITEMS"
            );
          }

          const ledgerEntries = [];

          // -----------------------------
          // 3. Process every product
          // -----------------------------

          for (const item of delivery.items) {
            /*
             * Atomic stock decrement.
             *
             * Only update when available
             * quantity >= requested quantity.
             */

            const updatedStock =
              await tx.stock.updateMany({
                where: {
                  productId:
                    item.productId,

                  locationId:
                    delivery.locationId,

                  warehouseId:
                    delivery.warehouseId,

                  quantity: {
                    gte: item.quantity,
                  },
                },

                data: {
                  quantity: {
                    decrement:
                      item.quantity,
                  },
                },
              });

            // -----------------------------
            // 4. Insufficient stock
            // -----------------------------

            if (
              updatedStock.count === 0
            ) {
              const currentStock =
                await tx.stock.findUnique({
                  where: {
                    productId_locationId: {
                      productId:
                        item.productId,

                      locationId:
                        delivery.locationId,
                    },
                  },

                  include: {
                    product: true,
                  },
                });

              const available =
                currentStock?.quantity ?? 0;

              throw new Error(
                `INSUFFICIENT_STOCK:${item.productId}:${available}`
              );
            }

            // -----------------------------
            // 5. Get updated stock
            // -----------------------------

            const stock =
              await tx.stock.findUnique({
                where: {
                  productId_locationId: {
                    productId:
                      item.productId,

                    locationId:
                      delivery.locationId,
                  },
                },
              });

            // -----------------------------
            // 6. Create ledger
            // -----------------------------

            const ledger =
              await tx.stockLedger.create({
                data: {
                  productId:
                    item.productId,

                  warehouseId:
                    delivery.warehouseId,

                  locationId:
                    delivery.locationId,

                  moveType: "DELIVERY",

                  quantityDelta:
                    -item.quantity,

                  stockAfter:
                    stock.quantity,

                  referenceType:
                    "DELIVERY",

                  referenceId:
                    delivery.reference,

                  deliveryId:
                    delivery.id,
                },
              });

            ledgerEntries.push(ledger);
          }

          // -----------------------------
          // 7. Mark delivery delivered
          // -----------------------------

          const updatedDelivery =
            await tx.delivery.update({
              where: {
                id: delivery.id,
              },

              data: {
                status: "DELIVERED",
              },

              include: {
                customer: true,
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
            delivery:
              updatedDelivery,

            ledgerEntries,
          };
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Delivery validated successfully. Stock updated.",

      delivery:
        result.delivery,

      ledgerEntries:
        result.ledgerEntries,
    });
  } catch (error) {
    console.error(
      "Validate Delivery Error:",
      error
    );

    if (
      error.message ===
      "DELIVERY_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    if (
      error.message ===
      "DELIVERY_NOT_PACKED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery must be packed before validation",
      });
    }

    if (
      error.message ===
      "DELIVERY_HAS_NO_ITEMS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery has no products",
      });
    }

    if (
      error.message.startsWith(
        "INSUFFICIENT_STOCK:"
      )
    ) {
      const parts =
        error.message.split(":");

      const productId = parts[1];
      const available = Number(parts[2]);

      return res.status(400).json({
        success: false,
        message:
          "Insufficient stock for one or more products",

        productId,
        availableStock: available,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

