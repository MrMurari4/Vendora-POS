import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  // Check if an admin already exists to prevent duplicates
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        name: 'Store Owner',
        email: 'admin@store.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Master Admin created successfully: ${admin.email}`);
  } else {
    console.log('⚠️ Admin already exists. Skipping...');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });