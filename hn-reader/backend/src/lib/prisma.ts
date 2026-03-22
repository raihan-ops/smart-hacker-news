import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Create Prisma adapter with pool configuration
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma client instance with adapter
const prisma = new PrismaClient({
  adapter,
});

export default prisma;
