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
  } else {
    console.log(`Product table in database already contains ${productCount} records.`);
  }
}

main()
  .catch((error) => {
    console.error("\nSeed Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });