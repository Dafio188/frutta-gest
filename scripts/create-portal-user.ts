/**
 * Script: Crea utente portale cliente
 *
 * Cerca il cliente nel DB del tenant e crea un utente CUSTOMER.
 * Usa query SQL raw per il Master DB (evita dipendenza dal client generato).
 *
 * Uso:
 *   npx tsx scripts/create-portal-user.ts
 *
 * Configura le variabili qui sotto prima di eseguire.
 */

import "dotenv/config"
import pg from "pg"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

// ─── Configurazione ─────────────────────────────────────────────
const TENANT_SLUG          = "simonefruit"
const CUSTOMER_NAME_SEARCH = "astrocassano"   // ricerca case-insensitive
const PORTAL_EMAIL         = "astrocassano@test.it"
const PORTAL_PASSWORD      = "Test1234!"
// ─────────────────────────────────────────────────────────────────

async function main() {
  const masterUrl = process.env.MASTER_DATABASE_URL
  if (!masterUrl) {
    console.error("❌ MASTER_DATABASE_URL non trovata nel .env")
    process.exit(1)
  }

  // 1. Connessione diretta (SQL raw) al Master DB per trovare la org
  const masterPool = new pg.Pool({ connectionString: masterUrl })

  const orgResult = await masterPool.query(
    `SELECT id, name, slug, "dbUrl" FROM master."Organization" WHERE slug = $1 LIMIT 1`,
    [TENANT_SLUG]
  )

  if (orgResult.rows.length === 0) {
    console.error(`❌ Tenant "${TENANT_SLUG}" non trovato nel Master DB`)

    const allOrgs = await masterPool.query(
      `SELECT slug, name FROM master."Organization" ORDER BY "createdAt" DESC LIMIT 10`
    )
    console.log("\n📋 Tenant disponibili:")
    allOrgs.rows.forEach((r: any) => console.log(`   - ${r.slug}: ${r.name}`))
    await masterPool.end()
    process.exit(1)
  }

  const org = orgResult.rows[0]
  console.log(`✅ Tenant: ${org.name} (${org.slug})`)
  await masterPool.end()

  // 2. Connessione al DB tenant tramite PrismaClient + PrismaPg
  const dbUrl: string = org.dbUrl
  const schemaMatch = dbUrl.match(/schema=([^&]+)/)
  const schemaName  = schemaMatch ? schemaMatch[1] : org.slug

  const tenantPool = new pg.Pool({ connectionString: dbUrl })
  tenantPool.on("connect", (client: any) => {
    client.query(`SET search_path TO "${schemaName}"`)
  })

  const adapter  = new PrismaPg(tenantPool as any)
  const tenantDb = new PrismaClient({ adapter } as any) as any

  // 3. Trova il cliente
  const customers = await tenantDb.customer.findMany({
    where: { companyName: { contains: CUSTOMER_NAME_SEARCH, mode: "insensitive" } },
    include: { portalUser: true },
    take: 5,
  })

  if (customers.length === 0) {
    console.error(`\n❌ Nessun cliente trovato con nome contenente: "${CUSTOMER_NAME_SEARCH}"`)

    const all = await tenantDb.customer.findMany({
      take: 10,
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    })
    console.log("\n📋 Clienti disponibili nel tenant:")
    all.forEach((c: any) => console.log(`   - ${c.companyName}`))
    await tenantDb.$disconnect()
    await tenantPool.end()
    process.exit(1)
  }

  const customer = customers[0]
  console.log(`✅ Cliente: ${customer.companyName} (ID: ${customer.id})`)

  // 4. Controlla se ha già un portale
  if (customer.portalUser) {
    console.log(`\nℹ️  Il cliente ha già un utente portale:`)
    console.log(`   Email:  ${customer.portalUser.email}`)
    console.log(`   Role:   ${customer.portalUser.role}`)
    console.log(`   Attivo: ${customer.portalUser.isActive}`)
    await tenantDb.$disconnect()
    await tenantPool.end()
    process.exit(0)
  }

  // 5. Verifica email libera
  const existing = await tenantDb.user.findUnique({ where: { email: PORTAL_EMAIL } })
  if (existing) {
    console.error(`\n❌ Email "${PORTAL_EMAIL}" già in uso da: ${existing.name} (${existing.role})`)
    await tenantDb.$disconnect()
    await tenantPool.end()
    process.exit(1)
  }

  // 6. Crea utente CUSTOMER
  const hashed = await bcrypt.hash(PORTAL_PASSWORD, 10)

  const user = await tenantDb.user.create({
    data: {
      name:       customer.companyName,
      email:      PORTAL_EMAIL,
      password:   hashed,
      role:       "CUSTOMER",
      customerId: customer.id,
      isActive:   true,
    },
  })

  console.log(`\n🎉 Utente portale creato!`)
  console.log(`   Nome:     ${user.name}`)
  console.log(`   Email:    ${user.email}`)
  console.log(`   Password: ${PORTAL_PASSWORD}`)
  console.log(`   Role:     ${user.role}`)
  console.log(`\n🔗 Login (in incognito): http://localhost:3650/login?tenant=${TENANT_SLUG}`)
  console.log(`   Poi vai su: /portale/ordini/nuovo`)

  await tenantDb.$disconnect()
  await tenantPool.end()
}

main().catch((e) => {
  console.error("\n❌ Errore fatale:", e.message)
  process.exit(1)
})
