/**
 * Script: Verifica Integrità Database
 *
 * Controlla:
 * 1. Schemi presenti nel DB
 * 2. Tabelle per schema e conteggio record
 * 3. Tabelle orfane in "public"
 * 4. Integrità FK (ordini senza cliente, etc.)
 * 5. Numerazioni sequenza
 * 6. Configurazione tenant nel Master DB
 *
 * Uso: npx tsx scripts/verify-integrity.ts [--schema=simonefruit]
 */

import "dotenv/config"
import pg from "pg"

const TENANT_SCHEMAS = ["simonefruit"] // aggiungi altri tenant qui

type CheckResult = {
  name: string
  status: "OK" | "WARN" | "ERROR" | "INFO"
  message: string
  details?: string
}

const results: CheckResult[] = []

function log(name: string, status: CheckResult["status"], message: string, details?: string) {
  results.push({ name, status, message, details })
  const icon = { OK: "✅", WARN: "⚠️ ", ERROR: "❌", INFO: "ℹ️ " }[status]
  console.log(`${icon} [${name}] ${message}`)
  if (details) console.log(`   ${details}`)
}

async function checkSchemas(pool: pg.Pool) {
  console.log("\n━━━ 1. SCHEMI POSTGRESQL ━━━")
  const res = await pool.query(
    `SELECT schema_name FROM information_schema.schemata 
     WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
     ORDER BY schema_name`
  )
  const schemas = res.rows.map((r: any) => r.schema_name)
  log("Schemi", "INFO", `Trovati ${schemas.length} schemi`, schemas.join(", "))

  const expectedSchemas = ["master", "public", ...TENANT_SCHEMAS]
  for (const expected of expectedSchemas) {
    if (schemas.includes(expected)) {
      log(`Schema:${expected}`, "OK", `Schema "${expected}" presente`)
    } else {
      log(`Schema:${expected}`, "WARN", `Schema "${expected}" NON trovato!`)
    }
  }
  return schemas
}

async function checkTablesInSchema(pool: pg.Pool, schema: string) {
  console.log(`\n━━━ Tabelle in schema "${schema}" ━━━`)
  const res = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
    [schema]
  )
  const tables = res.rows.map((r: any) => r.tablename)

  if (tables.length === 0) {
    log(`${schema}:tabelle`, "WARN", `Nessuna tabella trovata in "${schema}"`)
    return []
  }

  log(`${schema}:tabelle`, "INFO", `${tables.length} tabelle in "${schema}"`, tables.join(", "))
  return tables
}

async function checkRecordCounts(pool: pg.Pool, schema: string) {
  console.log(`\n━━━ Record counts per "${schema}" ━━━`)

  const tables = [
    "Customer", "Supplier", "Product", "ProductCategory",
    "Order", "OrderItem", "Invoice", "DeliveryNote",
    "User", "ActivityLog", "NumberSequence", "StockMovement"
  ]

  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM "${schema}"."${table}"`)
      const count = parseInt(res.rows[0].count)
      const status = count === 0 ? "INFO" : "OK"
      log(`${schema}:${table}`, status, `${count} record`)
    } catch {
      log(`${schema}:${table}`, "WARN", `Tabella non trovata (potrebbe essere OK)`)
    }
  }
}

async function checkPublicSchema(pool: pg.Pool) {
  console.log("\n━━━ 2. SCHEMA PUBLIC (tabelle orfane) ━━━")
  const res = await pool.query(
    `SELECT tablename FROM pg_tables 
     WHERE schemaname = 'public' 
     AND tablename NOT IN ('_prisma_migrations')
     ORDER BY tablename`
  )
  const tables = res.rows.map((r: any) => r.tablename)

  if (tables.length === 0) {
    log("public:clean", "OK", "Schema public pulito (nessuna tabella orfana)")
  } else {
    log(
      "public:orfane",
      "WARN",
      `${tables.length} tabelle trovate in "public" (need cleanup)`,
      tables.join(", ")
    )
  }
}

async function checkForeignKeyIntegrity(pool: pg.Pool, schema: string) {
  console.log(`\n━━━ 3. INTEGRITÀ FK per "${schema}" ━━━`)

  const checks = [
    {
      name: "orders_without_customer",
      label: "Ordini senza Cliente",
      sql: `SELECT COUNT(*) FROM "${schema}"."Order" o 
            WHERE NOT EXISTS (SELECT 1 FROM "${schema}"."Customer" c WHERE c.id = o."customerId")`,
    },
    {
      name: "order_items_without_order",
      label: "OrderItem senza Ordine",
      sql: `SELECT COUNT(*) FROM "${schema}"."OrderItem" oi 
            WHERE NOT EXISTS (SELECT 1 FROM "${schema}"."Order" o WHERE o.id = oi."orderId")`,
    },
    {
      name: "invoices_without_customer",
      label: "Fatture senza Cliente",
      sql: `SELECT COUNT(*) FROM "${schema}"."Invoice" i 
            WHERE NOT EXISTS (SELECT 1 FROM "${schema}"."Customer" c WHERE c.id = i."customerId")`,
    },
    {
      name: "users_without_customer",
      label: "Utenti Customer senza entità Customer",
      sql: `SELECT COUNT(*) FROM "${schema}"."User" u 
            WHERE u."customerId" IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM "${schema}"."Customer" c WHERE c.id = u."customerId")`,
    },
  ]

  for (const check of checks) {
    try {
      const res = await pool.query(check.sql)
      const count = parseInt(res.rows[0].count)
      if (count === 0) {
        log(`fk:${check.name}`, "OK", `${check.label}: OK (0 violazioni)`)
      } else {
        log(`fk:${check.name}`, "ERROR", `${check.label}: ${count} VIOLAZIONI FK!`)
      }
    } catch (e: any) {
      log(`fk:${check.name}`, "WARN", `Impossibile verificare: ${e.message}`)
    }
  }
}

async function checkMasterDB(pool: pg.Pool) {
  console.log("\n━━━ 4. MASTER DB — Configurazione Tenant ━━━")

  try {
    const res = await pool.query(
      `SELECT id, name, slug, "isActive", "dbUrl" IS NOT NULL as "hasDbUrl", 
              "createdAt", "updatedAt"
       FROM master."Organization" ORDER BY "createdAt"`
    )

    if (res.rows.length === 0) {
      log("master:orgs", "WARN", "Nessuna Organization trovata nel Master DB!")
    } else {
      log("master:orgs", "INFO", `${res.rows.length} Organization(s) nel Master DB`)
      res.rows.forEach((org: any) => {
        const status = org.isActive ? "OK" : "WARN"
        log(
          `org:${org.slug}`,
          status,
          `${org.name} (${org.slug}) — ${org.isActive ? "ATTIVO" : "INATTIVO"}`,
          `hasDbUrl: ${org.hasDbUrl}`
        )
      })
    }
  } catch (e: any) {
    log("master:orgs", "ERROR", `Impossibile leggere dal Master DB: ${e.message}`)
  }

  // Controlla le subscription
  try {
    const res = await pool.query(
      `SELECT o.slug, s.plan, s.status, s."expiresAt" 
       FROM master."Organization" o 
       LEFT JOIN master."Subscription" s ON s."organizationId" = o.id`
    )
    res.rows.forEach((row: any) => {
      const expired = row.expiresAt && new Date(row.expiresAt) < new Date()
      log(
        `sub:${row.slug}`,
        expired ? "WARN" : "OK",
        `${row.slug} — Piano: ${row.plan || "N/A"}, Status: ${row.status || "N/A"}`,
        row.expiresAt ? `Scade: ${new Date(row.expiresAt).toLocaleDateString("it-IT")}` : "Nessuna scadenza"
      )
    })
  } catch (e: any) {
    log("master:subs", "WARN", `Subscription non verificabili: ${e.message}`)
  }
}

async function checkNumberSequences(pool: pg.Pool, schema: string) {
  console.log(`\n━━━ 5. SEQUENZE NUMERICHE per "${schema}" ━━━`)

  try {
    const res = await pool.query(
      `SELECT type, year, "lastNumber", prefix 
       FROM "${schema}"."NumberSequence" ORDER BY type, year DESC`
    )

    if (res.rows.length === 0) {
      log(`${schema}:sequences`, "WARN", "Nessuna sequenza numerica inizializzata")
    } else {
      res.rows.forEach((row: any) => {
        log(
          `seq:${row.type}_${row.year}`,
          "INFO",
          `${row.type} ${row.year}: ultimo numero = ${row.lastNumber}`,
          row.prefix ? `Prefisso: ${row.prefix}` : undefined
        )
      })
    }
  } catch {
    log(`${schema}:sequences`, "WARN", `Tabella NumberSequence non accessibile`)
  }
}

function printSummary() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("📊 RIEPILOGO VERIFICA INTEGRITÀ\n")

  const ok = results.filter((r) => r.status === "OK").length
  const warn = results.filter((r) => r.status === "WARN").length
  const error = results.filter((r) => r.status === "ERROR").length
  const info = results.filter((r) => r.status === "INFO").length

  console.log(`   ✅ OK:    ${ok}`)
  console.log(`   ⚠️  WARN:  ${warn}`)
  console.log(`   ❌ ERROR: ${error}`)
  console.log(`   ℹ️  INFO:  ${info}`)

  if (error > 0) {
    console.log("\n🚨 ERRORI CRITICI DA RISOLVERE:")
    results.filter((r) => r.status === "ERROR").forEach((r) => {
      console.log(`   ❌ [${r.name}] ${r.message}`)
    })
  }

  if (warn > 0) {
    console.log("\n⚠️  AVVISI:")
    results.filter((r) => r.status === "WARN").forEach((r) => {
      console.log(`   ⚠️  [${r.name}] ${r.message}`)
    })
  }

  const overallStatus = error > 0 ? "CRITICO" : warn > 0 ? "ATTENZIONE" : "SANO"
  const overallIcon = error > 0 ? "🔴" : warn > 0 ? "🟡" : "🟢"
  console.log(`\n${overallIcon} STATO COMPLESSIVO: ${overallStatus}`)
}

async function main() {
  const args = process.argv.slice(2)
  const schemaArg = args.find((a) => a.startsWith("--schema="))?.split("=")[1]
  const schemasToCheck = schemaArg ? [schemaArg] : TENANT_SCHEMAS

  console.log("🔍 FruttaGest — Verifica Integrità Database Neon")
  console.log(`   Data: ${new Date().toLocaleString("it-IT")}`)

  const masterUrl = process.env.MASTER_DATABASE_URL
  if (!masterUrl) {
    console.error("❌ MASTER_DATABASE_URL mancante")
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: masterUrl })

  // Checks generali
  await checkSchemas(pool)
  await checkPublicSchema(pool)
  await checkMasterDB(pool)

  // Checks per ogni tenant
  for (const schema of schemasToCheck) {
    await checkTablesInSchema(pool, schema)
    await checkRecordCounts(pool, schema)
    await checkForeignKeyIntegrity(pool, schema)
    await checkNumberSequences(pool, schema)
  }

  await pool.end()
  printSummary()

  // Exit code basato su errori
  const errorCount = results.filter((r) => r.status === "ERROR").length
  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("\n❌ Errore fatale:", e.message)
  process.exit(1)
})
