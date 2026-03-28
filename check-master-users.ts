import 'dotenv/config';
import { PrismaClient } from './src/generated/master-client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
  const adapter = new PrismaPg(pool as any);
  const masterDb = new PrismaClient({ adapter });

  try {
    const users = await (masterDb as any).user.findMany();
    console.log('--- Utenti nel Master DB ---');
    users.forEach((u: any) => {
      console.log(`Email: ${u.email}, Ruolo: ${u.role}, Attivo: ${u.isActive}`);
    });
    
    if (users.length === 0) {
      console.log('Nessun utente trovato nel Master DB.');
    }
  } catch (error) {
    console.error('Errore durante la lettura del Master DB:', error);
  } finally {
    await masterDb.$disconnect();
    await pool.end();
  }
}

main();
