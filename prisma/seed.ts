import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString =
  (process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL) ||
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_PROD;

if (!connectionString) {
  throw new Error('Database connection string is missing in environment variables.');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be defined in the .env file.',
    );
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  console.log('Admin account seeded successfully:');
  console.log(`  ID: ${admin.id}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Role: ${admin.role}`);
  console.log(`  Verified: ${admin.isVerified}`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
