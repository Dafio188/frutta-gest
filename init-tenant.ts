import 'dotenv/config';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const TENANT_DB_URL = "postgresql://neondb_owner:npg_MKm67akPOqyT@ep-cool-cloud-abseyfr5-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const TENANT_SLUG = "simonefruit";
const TENANT_NAME = "Simone Fruit";

async function main() {
  console.log(`\n🚀 Inizializzazione Database per: ${TENANT_NAME} (${TENANT_SLUG})`);
  console.log(`URL: ${TENANT_DB_URL}\n`);

  try {
    // 1. Esegui il push dello schema
    console.log("⏳ Fase 1: Creazione tabelle nel database (Prisma Push)...");
    
    // Su Windows PowerShell, settiamo temporaneamente la variabile per il comando
    const envVars = { ...process.env, DATABASE_URL: TENANT_DB_URL };
    
    execSync('npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', { 
      stdio: 'inherit',
      env: envVars
    });

    console.log("✅ Fase 1 Completata: Tabelle create con successo.\n");

    // 2. Crea l'utente Admin di default
    console.log("⏳ Fase 2: Creazione account Amministratore...");
    
    // Update environment variable before creating client
    process.env.DATABASE_URL = TENANT_DB_URL;
    
    // Inizializza il client standard puntando al nuovo URL con l'adapter PG
    const pool = new pg.Pool({ connectionString: TENANT_DB_URL });
    const adapter = new PrismaPg(pool as any);
    const db = new PrismaClient({ adapter });

    const adminEmail = `Sfiore91@yahoo.it`;
    const adminPassword = await bcrypt.hash("admin123", 10);

    await db.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: adminPassword,
        name: `Admin ${TENANT_NAME}`,
        role: "ADMIN",
        isActive: true,
      }
    });

    await db.$disconnect();
    
    console.log(`✅ Fase 2 Completata: Utente Admin creato.`);
    console.log(`\n🎉 INIZIALIZZAZIONE TERMINATA CON SUCCESSO!`);
    console.log(`\n👉 Credenziali di accesso per ${TENANT_NAME}:`);
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: admin123\n`);

  } catch (error) {
    console.error("\n❌ ERRORE DURANTE L'INIZIALIZZAZIONE:", error);
  }
}

main();
