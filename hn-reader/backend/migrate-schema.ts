import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrate() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.log('Dropping foreign key constraint...');

    // Drop the foreign key constraint from summaries table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE summaries DROP CONSTRAINT IF EXISTS summaries_story_id_fkey;
    `);

    console.log('✓ Foreign key constraint dropped successfully!');
    console.log('✓ Summaries can now be created independently of bookmarks');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
