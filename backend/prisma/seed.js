import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


// ========================================
// PRISMA CONNECTION
// ========================================

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});


// ========================================
// SEED INVENTORY MANAGER
// ========================================

async function main() {
  const loginId = "manager01";
  const email = "manager@stocksense.com";
  const password = "Manager@123";


  // Check whether Inventory Manager
  // already exists
  const existingManager = await prisma.user.findFirst({
    where: {
      role: "INVENTORY_MANAGER",
    },
  });


  if (existingManager) {
    console.log("\n=================================");
    console.log("Inventory Manager already exists");
    console.log("=================================");
    console.log(`Login ID : ${existingManager.loginId}`);
    console.log(`Email    : ${existingManager.email}`);
    console.log(`Role     : ${existingManager.role}`);
    console.log("=================================\n");

    return;
  }


  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);


  // Create Inventory Manager
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
  console.log("=================================");
  console.log(`Login ID : ${manager.loginId}`);
  console.log(`Email    : ${manager.email}`);
  console.log(`Password : ${password}`);
  console.log(`Role     : ${manager.role}`);
  console.log("=================================\n");
}


// ========================================
// RUN SEED
// ========================================

main()
  .catch((error) => {
    console.error("\nSeed Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });