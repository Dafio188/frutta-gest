/**
 * Fix definitivo del tenant simonefruit
 *
 * Problemi risolti:
 * - La dbUrl nel master usava il POOLER senza schema → set search_path falliva
 * - Neon pooler NON supporta options=-c search_path
 * - prisma db push ignorava options= e scriveva in "public"
 *
 * Soluzione:
 * - Usare endpoint NON-POOLER (PrismaPg crea il proprio pool, non serve il pooler Neon)
 * - UsarE ?schema=simonefruit (parametro nativo Prisma, funziona con db push E con tenant-db.ts)
 *
 * Uso: npx tsx scripts/quick-fix-tenant.ts
 */

import "dotenv/config"
import pg from "pg"
import { execSync } from "child_process"

const SLUG = "simonefruit"

async function main() {
  const masterUrl = process.env.MASTER_DATABASE_URL!
  
  // Pool admin per operazioni master (usa search_path=master dall'URL)
  const masterPool = new pg.Pool({ connectionString: masterUrl })

  // 1. Leggi l'attuale dbUrl dal master
  const orgRes = await masterPool.query(
    `SELECT id, name, "dbUrl" FROM master."Organization" WHERE slug = $1`, [SLUG]
  )
  if (!orgRes.rows.length) {
    console.error("❌ Org non trovata"); await masterPool.end(); process.exit(1)
  }
  const { id: orgId, name: orgName, dbUrl: currentDbUrl } = orgRes.rows[0]
  console.log(`📋 Org: ${orgName}`)
  console.log(`   dbUrl attuale: ${currentDbUrl}`)

  // 2. Costruisci la URL NON-POOLER con schema=SLUG (parametro nativo Prisma)
  //    - NON-POOLER perché PrismaPg adapter gestisce il suo pool
  //    - ?schema= perché è il parametro che Prisma usa per SET search_path
  //    - Il Neon NON-POOLER supporta questo, il pooler no
  const rawBase = currentDbUrl.split("?")[0]
    .replace("-pooler.", ".") // rimuovi -pooler- dall'hostname
  
  const nonPoolerUrl = `${rawBase}?sslmode=require&channel_binding=require&schema=${SLUG}`
  console.log(`\n🔗 URL non-pooler con schema: ${nonPoolerUrl}`)

  // 3. Connetti senza schema (con search_path=master) per operazioni DDL
  //    Usa la master URL (che ha search_path=master) come base pool admin
  //    Per creare lo schema nel DB del tenant, serve una connessione diretta
  const directBase = rawBase + "?sslmode=require&channel_binding=require"
  const directPool = new pg.Pool({ connectionString: directBase })
  
  console.log(`\n🏗️  Verifica/creazione schema "${SLUG}"...`)
  await directPool.query(`CREATE SCHEMA IF NOT EXISTS "${SLUG}"`)
  console.log(`✅ Schema "${SLUG}" confermato`)
  await directPool.end()

  // 4. Prisma db push con URL NON-POOLER e schema=SLUG
  //    Prisma interpreta ?schema=X come SET search_path TO "X" → scrive tabelle in simonefruit
  console.log(`\n🚀 prisma db push su schema "${SLUG}"...`)
  try {
    execSync(
      `npx prisma db push --accept-data-loss --url "${nonPoolerUrl}"`,
      { stdio: "inherit" }
    )
    console.log("\n✅ prisma db push completato!")
  } catch (e: any) {
    console.error("❌ prisma db push fallito")
    await masterPool.end()
    process.exit(1)
  }

  // 5. Aggiorna dbUrl nel Master DB con la URL corretta
  console.log(`\n📝 Aggiornamento dbUrl nel Master DB...`)
  await masterPool.query(
    `UPDATE master."Organization" SET "dbUrl" = $1 WHERE id = $2`,
    [nonPoolerUrl, orgId]
  )
  console.log(`✅ dbUrl aggiornata: ${nonPoolerUrl}`)

  // 6. Verifica finale — connetti con schema=SLUG e controlla le tabelle
  console.log(`\n🔍 Verifica finale...`)
  const verifyPool = new pg.Pool({ connectionString: directBase })
  
  const tables = await verifyPool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`, [SLUG]
  )
  
  if (tables.rows.length > 0) {
    console.log(`✅ Tabelle nello schema "${SLUG}" (${tables.rows.length}):`)
    tables.rows.forEach((r: any) => console.log(`   ✓ ${r.tablename}`))
  } else {
    console.error(`❌ Nessuna tabella nello schema "${SLUG}" — prisma db push non ha funzionato!`)
  }

  // 7. Verifica User esistenti
  try {
    const users = await verifyPool.query(
      `SELECT name, email, role FROM "${SLUG}"."User" LIMIT 10`
    )
    if (users.rows.length) {
      console.log(`\n👤 Utenti nel tenant:`)
      users.rows.forEach((u: any) => console.log(`   - ${u.name} <${u.email}> [${u.role}]`))
    }
  } catch {}

  await verifyPool.end()
  await masterPool.end()

  console.log(`\n🎉 Fix completato!`)
  console.log(`\n⚠️  AZIONI RICHIESTE:`)
  console.log(`   1. Riavvia il server: premi Ctrl+C nel terminale npm run dev, poi riesegui npm run dev`)
  console.log(`   2. Questo resetta i client Prisma in cache (TenantDbManager.clients Map)`)
  console.log(`   3. Poi testa di nuovo la sezione Clienti su simonefruit.fruttagest.it`)
}

main().catch(e => {
  console.error("❌ Errore fatale:", e.message)
  console.error(e.stack)
  process.exit(1)
})
