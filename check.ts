import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log("Products count:", products.length);
  if (products.length > 0) {
    console.log("First product status:", products[0].status);
    console.log("First product featured:", products[0].featured);
  }
}

main().finally(() => prisma.$disconnect());
