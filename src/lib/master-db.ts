import { PrismaClient as MasterPrismaClient } from '../generated/master-client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForMaster = global as unknown as { masterPrisma: MasterPrismaClient };

const masterUrl = process.env.MASTER_DATABASE_URL!;
const pool = new pg.Pool({ connectionString: masterUrl });
const adapter = new PrismaPg(pool as any);

console.log('[MASTER DB] Initializing Master DB Client with Adapter...');

export const masterDb =
  globalForMaster.masterPrisma ||
  new MasterPrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForMaster.masterPrisma = masterDb;

console.log(`[MASTER DB] Initialized.`);
