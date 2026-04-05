/**
 * Script: Migrazione definitiva tabelle da public → simonefruit
 *
 * Problema: le tabelle del tenant sono in "public" invece di "simonefruit"
 * Il pooler Neon non supporta options=search_path
 *
 * Questo script:
 * 1. Sposta fisicamente le tabelle con ALTER TABLE SET SCHEMA (atomico, zero downtime)
 * 2. Aggiorna dbUrl con non-pooler + search_path (che funziona su Neon)
 * 3. Verifica che tutto sia a posto
 *
 * Uso: npx tsx scripts/migrate-public-to-schema.ts
 */

import "dotenv/config"
import pg from "pg"

const TENANT_SLUG = "simonefruit"

// Tutte le tabelle del tenant (in ordine sicuro per dipendenze FK)
const TENANT_TABLES = [
  // Prima le tabelle senza dipendenze esterne
  "VerificationToken",
  "UserPreferences",
  "AppSettings",
  "CompanyInfo",
  "NumberSequence",
  "ActivityLog",
  "WhatsAppMessage",
  "AudioTranscription",
  "IncomingEmail",
  "ShoppingList",
  "ProductCategory",
  // Poi quelle con dipendenze
  "Product",
  "Supplier",
  "Customer",
  "User",
  "Account",
  "Session",
  "Contact",
  "SupplierProduct",
  "CustomerProductPrice",
  "StockMovement",
  "ShoppingListItem",
  "Order",
  "OrderItem",
  "PurchaseOrder",
  "PurchaseOrderItem",
  "SupplierInvoice",
  "SupplierInvoiceItem",
  "DeliveryNote",
  "DeliveryNoteItem",
  "Invoice",
  "InvoiceItem",
  "InvoiceDDTLink",
  "CreditNote",
  "Payment",
]

async function main() {
  const masterUrl = process.env.MASTER_DATABASE_URL
  if (!masterUrl) {
    console.error("❌ MASTER_DATABASE_URL mancante")
    process.exit(1)
  }

  console.log("🚀 Migrazione definitiva: public → simonefruit")
  console.log(`   Tenant: ${TENANT_SLUG}`)
  console.log(`   Data: ${new Date().toLocaleString("it-IT")}\n`)

  // URL base non-pooler (senza search_path)
  const rawBase = masterUrl.split("?")[0].replace("-pooler.", ".")

  // URL per operazioni admin (nessun search_path = usa public di default)
  const adminUrl = `${rawBase}?sslmode=require&channel_binding=require`

  // URL corretto per il tenant (non-pooler + search_path)
  // Il non-pooler di Neon supporta options=-c search_path
  const tenantDbUrl = `${rawBase}?sslmode=require&channel_binding=require&options=-c%20search_path%3D${TENANT_SLUG}`

  const pool = new pg.Pool({ connectionString: adminUrl })

  // ─── STEP 1: Verifica stato attuale ──────────────────────────────────────
  console.log("━━━ STEP 1: Stato attuale ━━━")

  const publicTables = await pool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = ANY($1::text[])
    ORDER BY tablename
  `, [TENANT_TABLES])

  const simoneTables = await pool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = $1
    ORDER BY tablename
  `, [TENANT_SLUG])

  console.log(`   Tabelle in "public":      ${publicTables.rows.length}`)
  console.log(`   Tabelle in "simonefruit": ${simoneTables.rows.length}`)

  if (publicTables.rows.length === 0) {
    console.log("\n✅ Nessuna tabella da migrare in public! Verifico simonefruit...")
    if (simoneTables.rows.length > 0) {
      console.log(`✅ ${simoneTables.rows.length} tabelle già in simonefruit!`)
      await fixDbUrl(pool, masterUrl, tenantDbUrl)
      await pool.end()
      return
    } else {
      console.error("❌ Nessuna tabella trovata né in public né in simonefruit!")
      await pool.end()
      process.exit(1)
    }
  }

  // ─── STEP 2: Disabilita FK temporaneamente e sposta tabelle ─────────────
  console.log("\n━━━ STEP 2: Spostamento tabelle public → simonefruit ━━━")
  console.log("⚠️  Disabilitazione trigger FK per la migrazione...")

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    let moved = 0
    let skipped = 0

    for (const table of TENANT_TABLES) {
      // Verifica se la tabella esiste in public
      const exists = await client.query(`
        SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = $1
      `, [table])

      if (!exists.rows.length) {
        skipped++
        continue
      }

      // Verifica se già esiste in simonefruit (evita duplicati)
      const alreadyInSchema = await client.query(`
        SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2
      `, [TENANT_SLUG, table])

      if (alreadyInSchema.rows.length > 0) {
        console.log(`   ⏭️  ${table}: già in simonefruit, skip`)
        skipped++
        continue
      }

      try {
        // Conta i record prima di spostare
        const countRes = await client.query(`SELECT COUNT(*) FROM public."${table}"`)
        const count = countRes.rows[0].count

        // Sposta la tabella (FK vengono mantenute automaticamente via OID)
        await client.query(`ALTER TABLE public."${table}" SET SCHEMA "${TENANT_SLUG}"`)
        
        console.log(`   ✅ ${table}: spostata (${count} record)`)
        moved++
      } catch (e: any) {
        console.error(`   ❌ ${table}: errore → ${e.message}`)
        await client.query("ROLLBACK")
        client.release()
        await pool.end()
        process.exit(1)
      }
    }

    await client.query("COMMIT")

    console.log(`\n   📊 Risultato: ${moved} spostate, ${skipped} saltate`)
  } catch (e: any) {
    await client.query("ROLLBACK")
    await client.query("SET session_replication_role = DEFAULT")
    client.release()
    throw e
  }

  client.release()

  // ─── STEP 3: Aggiorna dbUrl nel Master DB ────────────────────────────────
  await fixDbUrl(pool, masterUrl, tenantDbUrl)

  // ─── STEP 4: Verifica finale ──────────────────────────────────────────────
  console.log("\n━━━ STEP 4: Verifica finale ━━━")
  
  const verifyPool = new pg.Pool({ connectionString: tenantDbUrl })
  try {
    const tables = await verifyPool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
      [TENANT_SLUG]
    )
    console.log(`✅ ${tables.rows.length} tabelle in "${TENANT_SLUG}":`)
    tables.rows.forEach((r: any) => console.log(`   - ${r.tablename}`))

    // Conta record nelle tabelle chiave
    console.log("\n📊 Record nelle tabelle principali:")
    const keyCounts = ["Customer", "Product", "Order", "User", "Invoice"]
    for (const t of keyCounts) {
      try {
        const r = await verifyPool.query(`SELECT COUNT(*) FROM "${TENANT_SLUG}"."${t}"`)
        console.log(`   ${t}: ${r.rows[0].count} record`)
      } catch {
        console.log(`   ${t}: tabella non trovata`)
      }
    }

    // Verifica tabelle rimaste in public
    const leftover = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY($1::text[])
    `, [TENANT_TABLES])
    
    if (leftover.rows.length > 0) {
      console.log(`\n⚠️  ${leftover.rows.length} tabelle ancora in public: ${leftover.rows.map((r: any) => r.tablename).join(", ")}`)
    } else {
      console.log("\n✅ Nessuna tabella tenant rimasta in public!")
    }
  } catch (e: any) {
    console.error("❌ Verifica fallita:", e.message)
  }
  await verifyPool.end()

  await pool.end()

  console.log(`\n🎉 Migrazione completata!`)
  console.log(`   tenant "${TENANT_SLUG}" → schema isolato in ep-still-wildflower`)
  console.log(`\n💡 Prossimo step: riavvia il server con npm run dev`)
}

async function fixDbUrl(pool: pg.Pool, masterUrl: string, tenantDbUrl: string) {
  console.log("\n━━━ STEP 3: Aggiornamento dbUrl nel Master DB ━━━")
  console.log(`   Nuova dbUrl (non-pooler + search_path):`)
  console.log(`   ${tenantDbUrl}`)
  
  try {
    await pool.query(
      `UPDATE master."Organization" SET "dbUrl" = $1 WHERE slug = $2`,
      [tenantDbUrl, TENANT_SLUG]
    )
    console.log(`✅ dbUrl aggiornata correttamente`)
  } catch (e: any) {
    console.error("❌ Errore aggiornamento dbUrl:", e.message)
  }
}

main().catch((e) => {
  console.error("\n❌ Errore fatale:", e.message)
  process.exit(1)
})
