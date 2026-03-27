import 'dotenv/config';
import { PrismaClient } from '../src/generated/master-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const masterDb = new PrismaClient({ adapter });

async function main() {
  const tenantUrl = process.env.DATABASE_URL;
  if (!tenantUrl) {
    throw new Error("DATABASE_URL non trovata nel file .env");
  }

  const org = await (masterDb as any).organization.upsert({
    where: { slug: 'fruttagest' },
    update: {
      dbUrl: tenantUrl,
    },
    create: {
      name: 'FruttaGest Main',
      slug: 'fruttagest',
      dbUrl: tenantUrl,
      isActive: true,
    },
  });

  console.log('✅ Organizzazione creata/aggiornata nel Master DB:', org.slug);

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'fio.davide@gmail.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await (masterDb as any).user.upsert({
    where: { email: superAdminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'Super Admin',
      email: superAdminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ SuperAdmin creato/aggiornato nel Master DB:', superAdmin.email);
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await masterDb.$disconnect();
  });
