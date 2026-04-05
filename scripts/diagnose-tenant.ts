/**
 * Diagnostica: verifica schema e dati del tenant simonefruit
 */

import "dotenv/config"
import pg from "pg"

async function main() {
  const masterUrl = process.env.MASTER_DATABASE_URL
  if (!masterUrl) { console.error("❌ MASTER_DATABASE_URL mancante"); process.exit(1) }

  const masterPool = new pg.Pool({ connectionString: masterUrl })

  // 1. Trova org e dbUrl
  const orgResult = await masterPool.query(
    `SELECT id, name, slug, "dbUrl" FROM master."Organization" WHERE slug = $1`,
    ["simonefruit"]
  )

  if (!orgResult.rows.length) {
    console.error("❌ Tenant simonefruit non trovato")
    await masterPool.end(); return
  }

  const org = orgResult.rows[0]
  console.log(`\n✅ Org trovata: ${org.name} (${org.slug})`)
  console.log(`   dbUrl: ${org.dbUrl}`)
  await masterPool.end()

  // 2. Connetti al DB del tenant
  const tenantPool = new pg.Pool({ connectionString: org.dbUrl })

  // 3. Lista tutti gli schemi disponibili
  const schemas = await tenantPool.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name`
  )
  console.log("\n📁 Schemi disponibili nel DB:")
  schemas.rows.forEach((r: any) => console.log(`   - ${r.schema_name}`))

  // 4. Estrai schema name dall'URL
  const schemaMatch = org.dbUrl.match(/schema=([^&]+)/)
  const schemaFromUrl = schemaMatch ? schemaMatch[1] : null
  const optionsMatch = org.dbUrl.match(/search_path%3D([^&]+)|search_path=([^&]+)/)
  const schemaFromOptions = optionsMatch ? (optionsMatch[1] || optionsMatch[2]) : null
  
  console.log(`\n🔍 Schema nell'URL (schema=): ${schemaFromUrl || 'NON TROVATO'}`)
  console.log(`🔍 Schema nell'URL (search_path): ${schemaFromOptions || 'NON TROVATO'}`)
  const resolvedSchema = schemaFromUrl || schemaFromOptions || org.slug
  console.log(`   → Schema usato: "${resolvedSchema}"`)

  // 5. Conta i customer nello schema corretto
  try {
    const customers = await tenantPool.query(
      `SELECT COUNT(*) FROM "${resolvedSchema}"."Customer"`
    )
    console.log(`\n👥 Customer in "${resolvedSchema}"."Customer": ${customers.rows[0].count}`)
  } catch (e: any) {
    console.error(`\n❌ Errore tabella Customer in "${resolvedSchema}": ${e.message}`)
  }

  // 6. Cerca Customer in tutti gli schemi
  for (const schema of schemas.rows) {
    const s = schema.schema_name
    try {
      const r = await tenantPool.query(`SELECT COUNT(*) FROM "${s}"."Customer"`)
      if (Number(r.rows[0].count) > 0) {
        console.log(`\n⚠️  Customer trovati: ${r.rows[0].count} nello schema "${s}"!`)
        const rows = await tenantPool.query(`SELECT id, "companyName", code FROM "${s}"."Customer" LIMIT 5`)
        rows.rows.forEach((c: any) => console.log(`   - ${c.companyName} (${c.code})`))
      }
    } catch {}
  }

  // 7. Conta User
  try {
    const users = await tenantPool.query(
      `SELECT name, email, role FROM "${resolvedSchema}"."User"`
    )
    console.log(`\n👤 User in "${resolvedSchema}"."User": ${users.rows.length}`)
    users.rows.forEach((u: any) => console.log(`   - ${u.name} <${u.email}> [${u.role}]`))
  } catch (e: any) {
    console.error(`❌ Errore tabella User: ${e.message}`)
  }

  await tenantPool.end()
  console.log("\n✅ Diagnostica completata")
}

main().catch((e) => {
  console.error("❌ Errore:", e.message)
  process.exit(1)
})
