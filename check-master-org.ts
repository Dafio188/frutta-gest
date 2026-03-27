import 'dotenv/config';
import { PrismaClient } from './src/generated/master-client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function checkMasterOrg() {
  const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
  const adapter = new PrismaPg(pool as any);
  const masterDb = new PrismaClient({ adapter });

  try {
    const org = await masterDb.organization.findUnique({
      where: { slug: 'fruttagest' },
      include: { subscription: true }
    });
    console.log('Organizzazione fruttagest nel Master DB:', org);
  } catch (err) {
    console.error('Errore:', err);
  } finally {
    await masterDb.$disconnect();
    await pool.end();
  }
}

checkMasterOrg();
