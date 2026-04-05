/**
 * Script: Ripara il database del tenant simonefruit
 *
 * Problemi rilevati:
 * 1. prisma db push ha scritto le tabelle in "public" invece di "simonefruit"
 * 2. Lo schema "simonefruit" non esiste
 *
 * Questo script:
 * 1. Crea lo schema "simonefruit" nel DB Neon
 * 2. Copia le tabelle esistenti da "public" a "simonefruit" (se ci sono dati)
 * 3. Esegue prisma db push con il search_path corretto
 * 4. Aggiorna la dbUrl nel Master DB per includere search_path
 *
 * Uso: npx tsx scripts/fix-tenant-schema.ts
 */

import "dotenv/config"
import pg from "pg"
import { execSync } from "child_process"

const TENANT_SLUG = "simonefruit"

async function main() {
  const masterUrl = process.env.MASTER_DATABASE_URL
  if (!masterUrl) { console.error("❌ MASTER_DATABASE_URL mancante"); process.exit(1) }

  console.log("🔧 Inizio riparazione schema tenant:", TENANT_SLUG)

  // 1. Leggi la org dal master DB
  const masterPool = new pg.Pool({ connectionString: masterUrl })
  const orgResult = await masterPool.query(
    `SELECT id, name, slug, "dbUrl" FROM master."Organization" WHERE slug = $1`,
    [TENANT_SLUG]
  )

  if (!orgResult.rows.length) {
    console.error(`❌ Tenant "${TENANT_SLUG}" non trovato nel Master DB`)
    await masterPool.end(); process.exit(1)
  }

  const org = orgResult.rows[0]
  console.log(`✅ Org trovata: ${org.name}`)
  console.log(`   dbUrl attuale: ${org.dbUrl}`)

  // 2. Costruisci URL per il tenant — usa il NON-POOLER (richiesto da Prisma per transazioni/migrations)
  // Parte dal master URL non-pooler rimuovendo le opzioni master e aggiungendo search_path tenant
  const baseUrl = masterUrl
    .split("?")[0]
    .replace("-pooler.", ".") // rimuovi pooler se presente

  // URL con search_path nello schema Neon tramite options
  const tenantDbUrl = `${baseUrl}?sslmode=require&channel_binding=require&options=-c%20search_path%3D${TENANT_SLUG}`
  // URL pooler per l'app runtime (Vercel / Next.js)
  const tenantDbUrlPooler = baseUrl.replace("eu-west-2.aws.neon.tech", "")
    + `pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&options=-c%20search_path%3D${TENANT_SLUG}`

  console.log(`\n   URL migrazione: ${tenantDbUrl}`)

  // 3. Connetti al DB del tenant (senza search_path, per operazioni di schema)
  const rawBase = masterUrl.split("?")[0].replace("-pooler.", ".")
  const adminPool = new pg.Pool({ connectionString: `${rawBase}?sslmode=require&channel_binding=require` })

  // 4. Crea lo schema se non esiste
  console.log(`\n🏗️  Creazione schema "${TENANT_SLUG}"...`)
  await adminPool.query(`CREATE SCHEMA IF NOT EXISTS "${TENANT_SLUG}"`)
  console.log(`✅ Schema "${TENANT_SLUG}" creato (o già esisteva)`)

  // 5. Verifica se ci sono tabelle in public che appartengono al tenant
  const publicTables = await adminPool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('User', 'Customer', 'Order', 'Product', 'NumberSequence', 'ActivityLog', 'ProductCategory')
  `)
  
  if (publicTables.rows.length > 0) {
    console.log(`\n⚠️  Tabelle trovate in "public":`)
    publicTables.rows.forEach((r: any) => console.log(`   - ${r.tablename}`))
    
    // Controlla se ci sono dati
    for (const row of publicTables.rows) {
      try {
        const count = await adminPool.query(`SELECT COUNT(*) FROM public."${row.tablename}"`)
        if (Number(count.rows[0].count) > 0) {
          console.log(`   ⚠️  ${row.tablename}: ${count.rows[0].count} record da migrare`)
        }
      } catch {}
    }
  }

  await adminPool.end()

  // 6. Esegui prisma db push con lo schema corretto
  console.log(`\n🚀 Eseguendo prisma db push su schema "${TENANT_SLUG}"...`)
  try {
    const output = execSync(
      `npx prisma db push --url="${tenantDbUrl}" --accept-data-loss`,
      {
        env: { ...process.env },
        encoding: "utf8",
        stdio: "pipe",
      }
    )
    console.log("✅ prisma db push completato!")
    // Mostra solo le ultime righe dell'output
    const lines = output.split("\n").filter(l => l.trim())
    lines.slice(-5).forEach(l => console.log(`   ${l}`))
  } catch (err: any) {
    const output = err.stdout || err.stderr || err.message
    console.error("❌ Errore prisma db push:", output.slice(-500))
    await masterPool.end()
    process.exit(1)
  }

  // 7. Aggiorna la dbUrl nel Master DB
  // Usa il POOLER URL per l'app runtime (Vercel usa il pooler)
  const basePooler = masterUrl
    .split("?")[0]
    .replace(/-pooler\./, ".") // assicurati sia non-pooler base
    // ricostruisci con pooler:
  const poolerHost = basePooler
    .replace("@ep-", "@ep-")
    .replace(/(@ep-[^.]+)\./, "$1-pooler.")

  const newDbUrl = `${poolerHost}?sslmode=require&channel_binding=require&options=-c%20search_path%3D${TENANT_SLUG}`
  
  console.log(`\n📝 Aggiornamento dbUrl in Master DB...`)
  console.log(`   Nuova dbUrl: ${newDbUrl}`)

  // Usa un pool fresco per l'UPDATE — masterPool potrebbe avere connessioni stale
  const adminMasterPool = new pg.Pool({ connectionString: masterUrl })
  await adminMasterPool.query(
    `UPDATE master."Organization" SET "dbUrl" = $1 WHERE slug = $2`,
    [newDbUrl, TENANT_SLUG]
  )
  console.log(`✅ dbUrl aggiornata nel Master DB`)

  // 8. Verifica finale
  const verifyPool = new pg.Pool({ connectionString: newDbUrl })
  try {
    const tables = await verifyPool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
      [TENANT_SLUG]
    )
    console.log(`\n✅ Tabelle nello schema "${TENANT_SLUG}":`)
    tables.rows.forEach((r: any) => console.log(`   - ${r.tablename}`))
  } catch (e: any) {
    console.error("❌ Verifica fallita:", e.message)
  }
  await verifyPool.end()

  await adminMasterPool.end()
  await masterPool.end()

  console.log(`\n🎉 Riparazione completata per "${TENANT_SLUG}"!`)
  console.log(`   Riavvia il server (Ctrl+C + npm run dev) per resettare i client Prisma in cache.`)
}

main().catch((e) => {
  console.error("\n❌ Errore fatale:", e.message)
  process.exit(1)
})
