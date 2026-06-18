import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('Initializing Prisma Client...');
  const prisma = new PrismaClient();

  try {
    console.log('Testing connection by querying databases/tables...');
    // Try to count leads
    const leadCount = await prisma.lead.count();
    console.log('✅ Connection Successful! Lead count is:', leadCount);
  } catch (error: any) {
    console.error('❌ Error connecting to database:');
    console.error(error.message || error);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
