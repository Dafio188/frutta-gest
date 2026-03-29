import { PrismaClient as MasterPrismaClient } from '../generated/master-client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForMaster = global as unknown as { masterPrisma: MasterPrismaClient };

const masterUrl = process.env.MASTER_DATABASE_URL!;
const pool = new pg.Pool({ connectionString: masterUrl });
const adapter = new PrismaPg(pool as any);

console.log('[MASTER DB] Initializing Master DB Client with Adapter...');

let instance = globalForMaster.masterPrisma;

// SICUREZZA DEV: Se abbiamo una vecchia istanza in cache (senza la tabella Lead), forziamo il refresh
if (instance && !('lead' in instance)) {
  console.log('[MASTER DB] Stale client instance detected (missing Lead model). Refreshing...');
  instance = undefined as any;
}

export const masterDb =
  instance ||
  new MasterPrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForMaster.masterPrisma = masterDb;

console.log(`[MASTER DB] Initialized. Models available: ${Object.keys(masterDb).filter(k => !k.startsWith('$')).join(', ')}`);
