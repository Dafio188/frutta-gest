import 'dotenv/config';
import { PrismaClient } from './src/generated/master-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const masterDb = new PrismaClient({ adapter });

async function main() {
  console.log('--- MASTER USERS ---');
  try {
    const users = await (masterDb as any).user.findMany();
    console.log(users.map((u: any) => ({ email: u.email, role: u.role, isActive: u.isActive })));
  } catch (e) {
    console.error('Errore durante la lettura degli utenti:', e);
  }

  console.log('\n--- ORGANIZATIONS ---');
  try {
    const orgs = await (masterDb as any).organization.findMany();
    console.log(orgs.map((o: any) => ({ slug: o.slug, dbUrl: o.dbUrl })));
  } catch (e) {
    console.error('Errore durante la lettura delle organizzazioni:', e);
  }
}

main()
  .finally(async () => {
    await masterDb.$disconnect();
    process.exit(0);
  });
