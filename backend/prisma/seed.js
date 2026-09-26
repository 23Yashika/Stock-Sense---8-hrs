import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

async function main() {
  const loginId = "manager01";
  const email = "manager@stocksense.com";
  const password = "Manager@123";

  const existingManager = await prisma.user.findFirst({
    where: {
      role: "INVENTORY_MANAGER",
    },
  });

  if (!existingManager) {
    const passwordHash = await bcrypt.hash(password, 12);
    const manager = await prisma.user.create({
      data: {
        loginId,
        email,
        passwordHash,
        role: "INVENTORY_MANAGER",
        isActive: true,
      },
    });

    console.log("\n=================================");
    console.log("Inventory Manager seeded!");
    console.log(`Login ID : ${manager.loginId}`);
    console.log(`Email    : ${manager.email}`);
    console.log(`Password : ${password}`);
    console.log("=================================\n");
  } else {
    console.log("Inventory Manager already exists.");
  }

  // ========================================
  // SEED INITIAL PRODUCTS
  // ========================================

  const productCount = await prisma.product.count();

  if (productCount === 0) {
    console.log("Seeding initial products into PostgreSQL...");

    await prisma.product.createMany({
      data: [
        {
          name: "Steel Rods 10mm",
          sku: "STL-1001",
          category: "Raw Materials",
          unitOfMeasure: "kg",
          initialStock: 150,
          isActive: true,
        },
        {
          name: "Ergonomic Office Chair",
          sku: "CHR-2004",
          category: "Finished Goods",
          unitOfMeasure: "Units",
          initialStock: 45,
          isActive: true,
        },
        {
          name: "Plywood Sheet 18mm",
          sku: "WOD-3002",
          category: "Raw Materials",
          unitOfMeasure: "Sheets",
          initialStock: 8,
          isActive: true,
        },
        {
          name: "Industrial Screws M6",
          sku: "SCR-5012",
          category: "Components",
          unitOfMeasure: "Boxes",
          initialStock: 200,
          isActive: true,
        },
      ],
    });

    console.log("✓ Initial products successfully seeded into PostgreSQL database!");
  }

  // ========================================
  // SEED INITIAL SUPPLIERS, WAREHOUSES & LOCATIONS
  // ========================================

  let warehouse = await prisma.warehouse.findFirst({ where: { code: "WH" } });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "Main Warehouse",
        code: "WH",
        address: "742 Evergreen Terrace, Sector 4",
      },
    });
    console.log("✓ Main Warehouse seeded:", warehouse.code);
  }

  let location = await prisma.location.findFirst({
    where: { warehouseId: warehouse.id, code: "Stock1" },
  });

  if (!location) {
    location = await prisma.location.create({
      data: {
        name: "Main Store",
        code: "Stock1",
        warehouseId: warehouse.id,
      },
    });
    console.log("✓ Location Stock1 seeded:", location.name);
  }

  let supplier = await prisma.supplier.findFirst({ where: { name: "Azure Interior" } });

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "Azure Interior",
        email: "vendor@azureinterior.com",
        phone: "+1 555-0192",
        address: "Industrial Park, Block B",
      },
    });
    console.log("✓ Supplier Azure Interior seeded:", supplier.name);
  }

  let customer = await prisma.customer.findFirst({ where: { name: "Decathlon Retail" } });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: "Decathlon Retail",
        email: "orders@decathlon.com",
        phone: "+1 555-9876",
        address: "102 Logistics Park, Warehouse 4",
      },
    });
    console.log("✓ Customer Decathlon Retail seeded:", customer.name);
  }

  console.log("Seeding process completed!");
}

main()
  .catch((error) => {
    console.error("\nSeed Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });