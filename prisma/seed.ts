/**
 * Seed Database — FruttaGest
 *
 * Popola il database con dati realistici per sviluppo e demo.
 * Esegui con: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { hash } from "bcryptjs"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Inizio seeding database FruttaGest...")

  // ============================================================
  // UTENTI
  // ============================================================
  const adminPassword = await hash("Admin2026!", 10)
  const userPassword = await hash("Operatore2026!", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@fruttagest.it" },
    update: {},
    create: {
      name: "Mario Rossi",
      email: "admin@fruttagest.it",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  const operator1 = await prisma.user.upsert({
    where: { email: "lucia@fruttagest.it" },
    update: {},
    create: {
      name: "Lucia Bianchi",
      email: "lucia@fruttagest.it",
      password: userPassword,
      role: "OPERATOR",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  const operator2 = await prisma.user.upsert({
    where: { email: "giuseppe@fruttagest.it" },
    update: {},
    create: {
      name: "Giuseppe Verdi",
      email: "giuseppe@fruttagest.it",
      password: userPassword,
      role: "OPERATOR",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  const viewer = await prisma.user.upsert({
    where: { email: "anna@fruttagest.it" },
    update: {},
    create: {
      name: "Anna Esposito",
      email: "anna@fruttagest.it",
      password: userPassword,
      role: "VIEWER",
      isActive: true,
      emailVerified: new Date(),
    },
  })

  console.log("✅ Utenti creati")

  // ============================================================
  // INFO AZIENDA
  // ============================================================
  await prisma.companyInfo.upsert({
    where: { id: "company-info-1" },
    update: {},
    create: {
      id: "company-info-1",
      companyName: "Ortofrutticola Rossi S.r.l.",
      vatNumber: "IT01234567890",
      fiscalCode: "01234567890",
      address: "Via del Mercato 42",
      city: "Napoli",
      province: "NA",
      postalCode: "80100",
      phone: "+39 081 123 4567",
      email: "info@fruttagest.it",
      pecEmail: "ortofrutticola.rossi@pec.it",
      sdiCode: "M5UXCR1",
      bankName: "Banca Intesa Sanpaolo",
      bankIban: "IT60X0542811101000000123456",
    },
  })

  console.log("✅ Info azienda create")

  // ============================================================
  // CATEGORIE PRODOTTI
  // ============================================================
  const categories = await Promise.all([
    prisma.productCategory.upsert({
      where: { slug: "frutta" },
      update: {},
      create: { name: "Frutta", slug: "frutta", type: "FRUTTA", sortOrder: 1 },
    }),
    prisma.productCategory.upsert({
      where: { slug: "verdura" },
      update: {},
      create: { name: "Verdura", slug: "verdura", type: "VERDURA", sortOrder: 2 },
    }),
    prisma.productCategory.upsert({
      where: { slug: "ortaggi" },
      update: {},
      create: { name: "Ortaggi", slug: "ortaggi", type: "ORTAGGI", sortOrder: 3 },
    }),
    prisma.productCategory.upsert({
      where: { slug: "erbe-aromatiche" },
      update: {},
      create: { name: "Erbe Aromatiche", slug: "erbe-aromatiche", type: "ERBE_AROMATICHE", sortOrder: 4 },
    }),
    prisma.productCategory.upsert({
      where: { slug: "frutta-esotica" },
      update: {},
      create: { name: "Frutta Esotica", slug: "frutta-esotica", type: "FRUTTA_ESOTICA", sortOrder: 5 },
    }),
    prisma.productCategory.upsert({
      where: { slug: "frutta-secca" },
      update: {},
      create: { name: "Frutta Secca", slug: "frutta-secca", type: "FRUTTA_SECCA", sortOrder: 6 },
    }),
  ])

  const [catFrutta, catVerdura, catOrtaggi, catErbe, catEsotica, catSecca] = categories

  console.log("✅ Categorie create")

  // ============================================================
  // CATEGORIE AGGIUNTIVE
  // ============================================================
  const catSpezie = await prisma.productCategory.upsert({
    where: { slug: "spezie" },
    update: {},
    create: { name: "Spezie", slug: "spezie", type: "SPEZIE", sortOrder: 7 },
  })

  console.log("✅ Categorie aggiuntive create")

  // ============================================================
  // PRODOTTI (80+ prodotti realistici)
  // ============================================================
  const productData: { name: string; slug: string; catId: string; unit: string; price: number; cost: number; sku: string; sf?: number; st?: number }[] = [
    // === FRUTTA (20 prodotti) ===
    { name: "Mele Golden", slug: "mele-golden", catId: catFrutta.id, unit: "KG", price: 2.50, cost: 1.80, sku: "FRU-001" },
    { name: "Mele Fuji", slug: "mele-fuji", catId: catFrutta.id, unit: "KG", price: 2.80, cost: 1.90, sku: "FRU-002" },
    { name: "Mele Annurca", slug: "mele-annurca", catId: catFrutta.id, unit: "KG", price: 3.50, cost: 2.40, sku: "FRU-003" },
    { name: "Arance Tarocco", slug: "arance-tarocco", catId: catFrutta.id, unit: "KG", price: 2.80, cost: 1.90, sku: "FRU-004", sf: 11, st: 4 },
    { name: "Arance Navel", slug: "arance-navel", catId: catFrutta.id, unit: "KG", price: 2.50, cost: 1.70, sku: "FRU-005", sf: 11, st: 4 },
    { name: "Limoni di Amalfi", slug: "limoni-amalfi", catId: catFrutta.id, unit: "KG", price: 3.50, cost: 2.50, sku: "FRU-006" },
    { name: "Limoni Verdelli", slug: "limoni-verdelli", catId: catFrutta.id, unit: "KG", price: 3.00, cost: 2.10, sku: "FRU-007", sf: 6, st: 9 },
    { name: "Pere Abate", slug: "pere-abate", catId: catFrutta.id, unit: "KG", price: 3.20, cost: 2.20, sku: "FRU-008" },
    { name: "Pere Williams", slug: "pere-williams", catId: catFrutta.id, unit: "KG", price: 3.00, cost: 2.00, sku: "FRU-009", sf: 8, st: 10 },
    { name: "Fragole", slug: "fragole", catId: catFrutta.id, unit: "KG", price: 6.00, cost: 4.00, sku: "FRU-010", sf: 3, st: 6 },
    { name: "Banane", slug: "banane", catId: catFrutta.id, unit: "KG", price: 1.80, cost: 1.10, sku: "FRU-011" },
    { name: "Uva Italia", slug: "uva-italia", catId: catFrutta.id, unit: "KG", price: 3.50, cost: 2.30, sku: "FRU-012", sf: 7, st: 10 },
    { name: "Uva Nera", slug: "uva-nera", catId: catFrutta.id, unit: "KG", price: 3.80, cost: 2.50, sku: "FRU-013", sf: 8, st: 10 },
    { name: "Pesche Gialle", slug: "pesche-gialle", catId: catFrutta.id, unit: "KG", price: 3.50, cost: 2.30, sku: "FRU-014", sf: 6, st: 9 },
    { name: "Pesche Noci", slug: "pesche-noci", catId: catFrutta.id, unit: "KG", price: 3.80, cost: 2.50, sku: "FRU-015", sf: 6, st: 9 },
    { name: "Albicocche", slug: "albicocche", catId: catFrutta.id, unit: "KG", price: 4.50, cost: 3.00, sku: "FRU-016", sf: 6, st: 7 },
    { name: "Ciliegie", slug: "ciliegie", catId: catFrutta.id, unit: "KG", price: 8.00, cost: 5.50, sku: "FRU-017", sf: 5, st: 7 },
    { name: "Kiwi", slug: "kiwi", catId: catFrutta.id, unit: "KG", price: 3.00, cost: 2.00, sku: "FRU-018" },
    { name: "Mandarini", slug: "mandarini", catId: catFrutta.id, unit: "KG", price: 2.80, cost: 1.80, sku: "FRU-019", sf: 11, st: 3 },
    { name: "Clementine", slug: "clementine", catId: catFrutta.id, unit: "KG", price: 3.00, cost: 2.00, sku: "FRU-020", sf: 11, st: 2 },

    // === VERDURA (15 prodotti) ===
    { name: "Pomodori San Marzano", slug: "pomodori-san-marzano", catId: catVerdura.id, unit: "KG", price: 3.00, cost: 2.00, sku: "VER-001" },
    { name: "Pomodori Ciliegino", slug: "pomodori-ciliegino", catId: catVerdura.id, unit: "KG", price: 4.00, cost: 2.80, sku: "VER-002" },
    { name: "Pomodori Cuore di Bue", slug: "pomodori-cuore-di-bue", catId: catVerdura.id, unit: "KG", price: 4.50, cost: 3.00, sku: "VER-003", sf: 6, st: 9 },
    { name: "Insalata Gentile", slug: "insalata-gentile", catId: catVerdura.id, unit: "PEZZI", price: 1.50, cost: 0.90, sku: "VER-004" },
    { name: "Lattuga Romana", slug: "lattuga-romana", catId: catVerdura.id, unit: "PEZZI", price: 1.80, cost: 1.00, sku: "VER-005" },
    { name: "Lattuga Iceberg", slug: "lattuga-iceberg", catId: catVerdura.id, unit: "PEZZI", price: 1.60, cost: 0.90, sku: "VER-006" },
    { name: "Rucola", slug: "rucola", catId: catVerdura.id, unit: "MAZZO", price: 1.80, cost: 1.00, sku: "VER-007" },
    { name: "Spinaci", slug: "spinaci", catId: catVerdura.id, unit: "KG", price: 4.50, cost: 3.00, sku: "VER-008" },
    { name: "Zucchine", slug: "zucchine", catId: catVerdura.id, unit: "KG", price: 2.80, cost: 1.80, sku: "VER-009" },
    { name: "Zucchine Romanesche", slug: "zucchine-romanesche", catId: catVerdura.id, unit: "KG", price: 3.50, cost: 2.30, sku: "VER-010" },
    { name: "Cavolo Nero", slug: "cavolo-nero", catId: catVerdura.id, unit: "KG", price: 3.00, cost: 1.80, sku: "VER-011", sf: 10, st: 3 },
    { name: "Broccoli", slug: "broccoli", catId: catVerdura.id, unit: "KG", price: 2.80, cost: 1.70, sku: "VER-012" },
    { name: "Cavolfiore", slug: "cavolfiore", catId: catVerdura.id, unit: "PEZZI", price: 2.50, cost: 1.50, sku: "VER-013" },
    { name: "Radicchio Trevigiano", slug: "radicchio-trevigiano", catId: catVerdura.id, unit: "KG", price: 5.00, cost: 3.20, sku: "VER-014", sf: 11, st: 3 },
    { name: "Carciofi", slug: "carciofi", catId: catVerdura.id, unit: "PEZZI", price: 1.20, cost: 0.70, sku: "VER-015", sf: 10, st: 4 },

    // === ORTAGGI (15 prodotti) ===
    { name: "Peperoni Rossi", slug: "peperoni-rossi", catId: catOrtaggi.id, unit: "KG", price: 3.50, cost: 2.30, sku: "ORT-001" },
    { name: "Peperoni Gialli", slug: "peperoni-gialli", catId: catOrtaggi.id, unit: "KG", price: 3.50, cost: 2.30, sku: "ORT-002" },
    { name: "Peperoni Verdi", slug: "peperoni-verdi", catId: catOrtaggi.id, unit: "KG", price: 2.80, cost: 1.80, sku: "ORT-003" },
    { name: "Melanzane", slug: "melanzane", catId: catOrtaggi.id, unit: "KG", price: 2.50, cost: 1.70, sku: "ORT-004" },
    { name: "Carote", slug: "carote", catId: catOrtaggi.id, unit: "KG", price: 1.80, cost: 1.00, sku: "ORT-005" },
    { name: "Patate", slug: "patate", catId: catOrtaggi.id, unit: "KG", price: 1.20, cost: 0.70, sku: "ORT-006" },
    { name: "Patate Novelle", slug: "patate-novelle", catId: catOrtaggi.id, unit: "KG", price: 2.00, cost: 1.20, sku: "ORT-007", sf: 4, st: 7 },
    { name: "Cipolle Dorate", slug: "cipolle-dorate", catId: catOrtaggi.id, unit: "KG", price: 1.50, cost: 0.80, sku: "ORT-008" },
    { name: "Cipolle Rosse Tropea", slug: "cipolle-rosse-tropea", catId: catOrtaggi.id, unit: "KG", price: 2.50, cost: 1.50, sku: "ORT-009" },
    { name: "Aglio Bianco", slug: "aglio-bianco", catId: catOrtaggi.id, unit: "KG", price: 8.00, cost: 5.00, sku: "ORT-010" },
    { name: "Sedano", slug: "sedano", catId: catOrtaggi.id, unit: "PEZZI", price: 1.50, cost: 0.80, sku: "ORT-011" },
    { name: "Finocchi", slug: "finocchi", catId: catOrtaggi.id, unit: "PEZZI", price: 2.00, cost: 1.20, sku: "ORT-012" },
    { name: "Cetrioli", slug: "cetrioli", catId: catOrtaggi.id, unit: "KG", price: 2.00, cost: 1.20, sku: "ORT-013" },
    { name: "Fagiolini", slug: "fagiolini", catId: catOrtaggi.id, unit: "KG", price: 4.00, cost: 2.60, sku: "ORT-014", sf: 5, st: 9 },
    { name: "Zucca", slug: "zucca", catId: catOrtaggi.id, unit: "KG", price: 2.00, cost: 1.20, sku: "ORT-015", sf: 9, st: 12 },

    // === ERBE AROMATICHE (10 prodotti) ===
    { name: "Basilico Fresco", slug: "basilico-fresco", catId: catErbe.id, unit: "MAZZO", price: 1.50, cost: 0.80, sku: "ERB-001" },
    { name: "Prezzemolo", slug: "prezzemolo", catId: catErbe.id, unit: "MAZZO", price: 1.00, cost: 0.50, sku: "ERB-002" },
    { name: "Rosmarino", slug: "rosmarino", catId: catErbe.id, unit: "MAZZO", price: 1.20, cost: 0.60, sku: "ERB-003" },
    { name: "Salvia", slug: "salvia", catId: catErbe.id, unit: "MAZZO", price: 1.20, cost: 0.60, sku: "ERB-004" },
    { name: "Timo", slug: "timo", catId: catErbe.id, unit: "MAZZO", price: 1.50, cost: 0.70, sku: "ERB-005" },
    { name: "Menta Fresca", slug: "menta-fresca", catId: catErbe.id, unit: "MAZZO", price: 1.50, cost: 0.70, sku: "ERB-006" },
    { name: "Origano Fresco", slug: "origano-fresco", catId: catErbe.id, unit: "MAZZO", price: 1.30, cost: 0.60, sku: "ERB-007" },
    { name: "Erba Cipollina", slug: "erba-cipollina", catId: catErbe.id, unit: "MAZZO", price: 1.80, cost: 0.90, sku: "ERB-008" },
    { name: "Alloro", slug: "alloro", catId: catErbe.id, unit: "MAZZO", price: 1.00, cost: 0.40, sku: "ERB-009" },
    { name: "Coriandolo", slug: "coriandolo", catId: catErbe.id, unit: "MAZZO", price: 2.00, cost: 1.00, sku: "ERB-010" },

    // === FRUTTA ESOTICA (10 prodotti) ===
    { name: "Avocado", slug: "avocado", catId: catEsotica.id, unit: "PEZZI", price: 2.50, cost: 1.60, sku: "ESO-001" },
    { name: "Mango", slug: "mango", catId: catEsotica.id, unit: "PEZZI", price: 3.50, cost: 2.20, sku: "ESO-002" },
    { name: "Papaya", slug: "papaya", catId: catEsotica.id, unit: "PEZZI", price: 4.00, cost: 2.50, sku: "ESO-003" },
    { name: "Ananas", slug: "ananas", catId: catEsotica.id, unit: "PEZZI", price: 3.00, cost: 1.80, sku: "ESO-004" },
    { name: "Cocco", slug: "cocco", catId: catEsotica.id, unit: "PEZZI", price: 3.50, cost: 2.00, sku: "ESO-005" },
    { name: "Passion Fruit", slug: "passion-fruit", catId: catEsotica.id, unit: "KG", price: 12.00, cost: 8.00, sku: "ESO-006" },
    { name: "Lime", slug: "lime", catId: catEsotica.id, unit: "KG", price: 6.00, cost: 4.00, sku: "ESO-007" },
    { name: "Melograno", slug: "melograno", catId: catEsotica.id, unit: "PEZZI", price: 2.50, cost: 1.50, sku: "ESO-008", sf: 10, st: 1 },
    { name: "Fichi d'India", slug: "fichi-india", catId: catEsotica.id, unit: "KG", price: 5.00, cost: 3.00, sku: "ESO-009", sf: 8, st: 10 },
    { name: "Litchi", slug: "litchi", catId: catEsotica.id, unit: "KG", price: 10.00, cost: 7.00, sku: "ESO-010" },

    // === FRUTTA SECCA (8 prodotti) ===
    { name: "Noci", slug: "noci", catId: catSecca.id, unit: "KG", price: 12.00, cost: 8.00, sku: "SEC-001" },
    { name: "Mandorle", slug: "mandorle", catId: catSecca.id, unit: "KG", price: 14.00, cost: 9.50, sku: "SEC-002" },
    { name: "Nocciole", slug: "nocciole", catId: catSecca.id, unit: "KG", price: 15.00, cost: 10.00, sku: "SEC-003" },
    { name: "Pistacchi", slug: "pistacchi", catId: catSecca.id, unit: "KG", price: 22.00, cost: 15.00, sku: "SEC-004" },
    { name: "Pinoli", slug: "pinoli", catId: catSecca.id, unit: "KG", price: 45.00, cost: 32.00, sku: "SEC-005" },
    { name: "Castagne", slug: "castagne", catId: catSecca.id, unit: "KG", price: 6.00, cost: 3.80, sku: "SEC-006", sf: 10, st: 12 },
    { name: "Datteri", slug: "datteri", catId: catSecca.id, unit: "KG", price: 8.00, cost: 5.00, sku: "SEC-007" },
    { name: "Fichi Secchi", slug: "fichi-secchi", catId: catSecca.id, unit: "KG", price: 10.00, cost: 6.50, sku: "SEC-008" },

    // === SPEZIE (5 prodotti) ===
    { name: "Peperoncino Fresco", slug: "peperoncino-fresco", catId: catSpezie.id, unit: "KG", price: 8.00, cost: 5.00, sku: "SPE-001" },
    { name: "Zenzero Fresco", slug: "zenzero-fresco", catId: catSpezie.id, unit: "KG", price: 6.00, cost: 3.50, sku: "SPE-002" },
    { name: "Curcuma Fresca", slug: "curcuma-fresca", catId: catSpezie.id, unit: "KG", price: 8.00, cost: 5.00, sku: "SPE-003" },
    { name: "Rafano", slug: "rafano", catId: catSpezie.id, unit: "KG", price: 6.00, cost: 3.50, sku: "SPE-004" },
    { name: "Pepe Rosa in Grani", slug: "pepe-rosa", catId: catSpezie.id, unit: "KG", price: 35.00, cost: 22.00, sku: "SPE-005" },
  ]

  const products: any[] = []
  for (const p of productData) {
    // Try upsert, if fails due to SKU conflict, update existing first
    try {
      const prod = await prisma.product.upsert({
        where: { slug: p.slug },
        update: { name: p.name, categoryId: p.catId, unit: p.unit as any, defaultPrice: p.price, costPrice: p.cost, sku: p.sku, seasonalFrom: p.sf ?? null, seasonalTo: p.st ?? null },
        create: { name: p.name, slug: p.slug, categoryId: p.catId, unit: p.unit as any, defaultPrice: p.price, costPrice: p.cost, vatRate: 4, sku: p.sku, seasonalFrom: p.sf ?? null, seasonalTo: p.st ?? null },
      })
      products.push(prod)
    } catch (err: any) {
      if (err.code === "P2002") {
        // SKU conflict: clear SKU from conflicting product, then retry
        await prisma.product.updateMany({ where: { sku: p.sku }, data: { sku: null } })
        const prod = await prisma.product.upsert({
          where: { slug: p.slug },
          update: { name: p.name, categoryId: p.catId, unit: p.unit as any, defaultPrice: p.price, costPrice: p.cost, sku: p.sku, seasonalFrom: p.sf ?? null, seasonalTo: p.st ?? null },
          create: { name: p.name, slug: p.slug, categoryId: p.catId, unit: p.unit as any, defaultPrice: p.price, costPrice: p.cost, vatRate: 4, sku: p.sku, seasonalFrom: p.sf ?? null, seasonalTo: p.st ?? null },
        })
        products.push(prod)
      } else {
        throw err
      }
    }
  }

  console.log(`✅ ${products.length} prodotti creati`)

  // ============================================================
  // FORNITORI
  // ============================================================
  const supplier1 = await prisma.supplier.upsert({
    where: { code: "FOR-2026-0001" },
    update: {},
    create: {
      code: "FOR-2026-0001",
      companyName: "Mercato Generale Napoli",
      vatNumber: "IT09876543210",
      address: "Corso Novara 10",
      city: "Napoli",
      province: "NA",
      postalCode: "80142",
      phone: "+39 081 987 6543",
      email: "ordini@mercatogenerale.it",
      paymentMethod: "BONIFICO",
      paymentTermsDays: 30,
    },
  })

  const supplier2 = await prisma.supplier.upsert({
    where: { code: "FOR-2026-0002" },
    update: {},
    create: {
      code: "FOR-2026-0002",
      companyName: "Azienda Agricola Verde Bio",
      vatNumber: "IT11223344556",
      address: "Via Campagna 5",
      city: "Caserta",
      province: "CE",
      postalCode: "81100",
      phone: "+39 0823 456 789",
      email: "info@verdebio.it",
      paymentMethod: "BONIFICO",
      paymentTermsDays: 60,
    },
  })

  const supplier3 = await prisma.supplier.upsert({
    where: { code: "FOR-2026-0003" },
    update: {},
    create: {
      code: "FOR-2026-0003",
      companyName: "Cooperativa Agrumi del Sud",
      vatNumber: "IT55667788990",
      address: "Contrada Aranceto 12",
      city: "Catania",
      province: "CT",
      postalCode: "95100",
      phone: "+39 095 321 6547",
      email: "vendite@agrumisud.it",
      paymentMethod: "RIBA",
      paymentTermsDays: 30,
    },
  })

  console.log("✅ Fornitori creati")

  // ============================================================
  // RELAZIONI FORNITORE-PRODOTTO
  // ============================================================
  const productsBySlug = new Map(products.map((p: any) => [p.slug, p]))

  // Helper per creare SupplierProduct
  const sp = async (suppId: string, slug: string, price: number, preferred: boolean, lead: number = 1, minQty: number = 1) => {
    const prod = productsBySlug.get(slug)
    if (!prod) return
    await prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId: suppId, productId: prod.id } },
      update: { price, isPreferred: preferred, leadTimeDays: lead, minOrderQty: minQty },
      create: { supplierId: suppId, productId: prod.id, price, isPreferred: preferred, leadTimeDays: lead, minOrderQty: minQty },
    })
  }

  // Mercato Generale Napoli — fornitore generalista (frutta, verdura, ortaggi)
  await Promise.all([
    sp(supplier1.id, "mele-golden", 1.70, true), sp(supplier1.id, "mele-fuji", 1.85, true),
    sp(supplier1.id, "banane", 1.00, true), sp(supplier1.id, "kiwi", 1.90, true),
    sp(supplier1.id, "pere-abate", 2.10, true), sp(supplier1.id, "pere-williams", 1.90, true),
    sp(supplier1.id, "fragole", 3.80, true, 1, 5), sp(supplier1.id, "pesche-gialle", 2.20, true, 1, 3),
    sp(supplier1.id, "pesche-noci", 2.40, true, 1, 3), sp(supplier1.id, "albicocche", 2.90, true, 1, 3),
    sp(supplier1.id, "ciliegie", 5.20, true, 1, 2), sp(supplier1.id, "uva-italia", 2.20, true),
    sp(supplier1.id, "uva-nera", 2.40, true),
    sp(supplier1.id, "pomodori-san-marzano", 1.90, true, 1, 5), sp(supplier1.id, "pomodori-ciliegino", 2.70, true, 1, 3),
    sp(supplier1.id, "insalata-gentile", 0.85, true), sp(supplier1.id, "lattuga-romana", 0.95, true),
    sp(supplier1.id, "lattuga-iceberg", 0.85, true), sp(supplier1.id, "spinaci", 2.80, true, 1, 3),
    sp(supplier1.id, "zucchine", 1.70, true), sp(supplier1.id, "broccoli", 1.60, true),
    sp(supplier1.id, "cavolfiore", 1.40, true),
    sp(supplier1.id, "peperoni-rossi", 2.20, true), sp(supplier1.id, "peperoni-gialli", 2.20, true),
    sp(supplier1.id, "peperoni-verdi", 1.70, true), sp(supplier1.id, "melanzane", 1.60, true),
    sp(supplier1.id, "carote", 0.90, true), sp(supplier1.id, "patate", 0.65, true),
    sp(supplier1.id, "cipolle-dorate", 0.75, true), sp(supplier1.id, "sedano", 0.75, true),
    sp(supplier1.id, "finocchi", 1.10, true), sp(supplier1.id, "cetrioli", 1.10, true),
    sp(supplier1.id, "fagiolini", 2.50, true, 1, 3), sp(supplier1.id, "zucca", 1.10, true),
  ])

  // Verde Bio — biologico, erbe, verdure premium
  await Promise.all([
    sp(supplier2.id, "basilico-fresco", 0.70, true), sp(supplier2.id, "prezzemolo", 0.45, true),
    sp(supplier2.id, "rosmarino", 0.55, true), sp(supplier2.id, "salvia", 0.55, true),
    sp(supplier2.id, "timo", 0.65, true), sp(supplier2.id, "menta-fresca", 0.65, true),
    sp(supplier2.id, "origano-fresco", 0.55, true), sp(supplier2.id, "erba-cipollina", 0.80, true),
    sp(supplier2.id, "alloro", 0.35, true), sp(supplier2.id, "coriandolo", 0.90, true),
    sp(supplier2.id, "rucola", 0.90, true), sp(supplier2.id, "radicchio-trevigiano", 3.00, true),
    sp(supplier2.id, "cavolo-nero", 1.70, true), sp(supplier2.id, "carciofi", 0.65, true),
    sp(supplier2.id, "pomodori-cuore-di-bue", 2.80, true),
    sp(supplier2.id, "zucchine-romanesche", 2.10, true),
    sp(supplier2.id, "spinaci", 2.90, false, 2, 3),
    sp(supplier2.id, "peperoncino-fresco", 4.80, true), sp(supplier2.id, "zenzero-fresco", 3.20, true),
    sp(supplier2.id, "curcuma-fresca", 4.80, true), sp(supplier2.id, "rafano", 3.20, true),
    sp(supplier2.id, "pepe-rosa", 20.00, true, 3, 1),
  ])

  // Cooperativa Agrumi del Sud — agrumi e frutta esotica/secca
  await Promise.all([
    sp(supplier3.id, "arance-tarocco", 1.70, true, 2, 10), sp(supplier3.id, "arance-navel", 1.50, true, 2, 10),
    sp(supplier3.id, "limoni-amalfi", 2.30, true, 2, 10), sp(supplier3.id, "limoni-verdelli", 1.90, true, 2, 5),
    sp(supplier3.id, "mandarini", 1.70, true, 2, 10), sp(supplier3.id, "clementine", 1.80, true, 2, 10),
    sp(supplier3.id, "mele-annurca", 2.20, true, 2, 5),
    sp(supplier3.id, "avocado", 1.50, true, 3), sp(supplier3.id, "mango", 2.00, true, 3),
    sp(supplier3.id, "papaya", 2.30, true, 3), sp(supplier3.id, "ananas", 1.60, true, 3),
    sp(supplier3.id, "cocco", 1.80, true, 3), sp(supplier3.id, "passion-fruit", 7.50, true, 3),
    sp(supplier3.id, "lime", 3.80, true, 2), sp(supplier3.id, "melograno", 1.40, true, 2),
    sp(supplier3.id, "fichi-india", 2.80, true, 2), sp(supplier3.id, "litchi", 6.50, true, 4),
    sp(supplier3.id, "noci", 7.50, true, 3, 5), sp(supplier3.id, "mandorle", 9.00, true, 3, 5),
    sp(supplier3.id, "nocciole", 9.50, true, 3, 5), sp(supplier3.id, "pistacchi", 14.00, true, 3, 5),
    sp(supplier3.id, "pinoli", 30.00, true, 5, 1), sp(supplier3.id, "castagne", 3.50, true, 2, 5),
    sp(supplier3.id, "datteri", 4.50, true, 3, 3), sp(supplier3.id, "fichi-secchi", 6.00, true, 3, 3),
  ])

  console.log("✅ Relazioni fornitore-prodotto create")

  // ============================================================
  // CLIENTI
  // ============================================================
  const clients = await Promise.all([
    prisma.customer.upsert({
      where: { code: "CLI-2026-0001" },
      update: {},
      create: {
        code: "CLI-2026-0001",
        companyName: "Ristorante Da Mario",
        type: "RISTORANTE",
        vatNumber: "IT12345678901",
        address: "Via Toledo 120",
        city: "Napoli",
        province: "NA",
        postalCode: "80134",
        phone: "+39 081 555 1234",
        email: "ordini@damario.it",
        deliveryZone: "Centro Storico",
        preferredDeliveryTime: "07:00-09:00",
        paymentMethod: "BONIFICO",
        paymentTermsDays: 30,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0002" },
      update: {},
      create: {
        code: "CLI-2026-0002",
        companyName: "Trattoria Il Borgo",
        type: "RISTORANTE",
        vatNumber: "IT23456789012",
        address: "Piazza del Gesù 15",
        city: "Napoli",
        province: "NA",
        postalCode: "80134",
        phone: "+39 081 555 5678",
        email: "cucina@ilborgo.it",
        deliveryZone: "Centro Storico",
        preferredDeliveryTime: "06:30-08:00",
        paymentMethod: "CONTANTI",
        paymentTermsDays: 0,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0003" },
      update: {},
      create: {
        code: "CLI-2026-0003",
        companyName: "Hotel Villa Rosa",
        type: "HOTEL",
        vatNumber: "IT34567890123",
        address: "Corso Vittorio Emanuele 200",
        city: "Napoli",
        province: "NA",
        postalCode: "80121",
        phone: "+39 081 555 9012",
        email: "cucina@villarosa.it",
        deliveryZone: "Vomero",
        preferredDeliveryTime: "07:00-10:00",
        paymentMethod: "BONIFICO",
        paymentTermsDays: 60,
        creditLimit: 15000,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0004" },
      update: {},
      create: {
        code: "CLI-2026-0004",
        companyName: "Pizzeria Napoletana Sorbillo",
        type: "RISTORANTE",
        vatNumber: "IT45678901234",
        address: "Via dei Tribunali 32",
        city: "Napoli",
        province: "NA",
        postalCode: "80138",
        phone: "+39 081 555 3456",
        email: "ordini@sorbillo.it",
        deliveryZone: "Centro Storico",
        preferredDeliveryTime: "08:00-10:00",
        paymentMethod: "RIBA",
        paymentTermsDays: 30,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0005" },
      update: {},
      create: {
        code: "CLI-2026-0005",
        companyName: "Supermercato FreshMart",
        type: "SUPERMERCATO",
        vatNumber: "IT56789012345",
        address: "Via Riviera di Chiaia 88",
        city: "Napoli",
        province: "NA",
        postalCode: "80121",
        phone: "+39 081 555 7890",
        email: "acquisti@freshmart.it",
        deliveryZone: "Chiaia",
        preferredDeliveryTime: "06:00-08:00",
        paymentMethod: "BONIFICO",
        paymentTermsDays: 30,
        creditLimit: 25000,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0006" },
      update: {},
      create: {
        code: "CLI-2026-0006",
        companyName: "Bar Centrale",
        type: "BAR",
        vatNumber: "IT67890123456",
        address: "Piazza Dante 22",
        city: "Napoli",
        province: "NA",
        postalCode: "80135",
        phone: "+39 081 555 2345",
        email: "bar.centrale@email.it",
        deliveryZone: "Centro",
        preferredDeliveryTime: "07:00-09:00",
        paymentMethod: "CONTANTI",
        paymentTermsDays: 0,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0007" },
      update: {},
      create: {
        code: "CLI-2026-0007",
        companyName: "Mensa Universitaria Federico II",
        type: "MENSA",
        vatNumber: "IT78901234567",
        address: "Via Claudio 21",
        city: "Napoli",
        province: "NA",
        postalCode: "80125",
        phone: "+39 081 555 6789",
        email: "approvvigionamento@unina.it",
        deliveryZone: "Fuorigrotta",
        preferredDeliveryTime: "06:00-07:00",
        paymentMethod: "BONIFICO",
        paymentTermsDays: 60,
        creditLimit: 50000,
      },
    }),
    prisma.customer.upsert({
      where: { code: "CLI-2026-0008" },
      update: {},
      create: {
        code: "CLI-2026-0008",
        companyName: "Gastronomia Sapori del Sud",
        type: "GASTRONOMIA",
        vatNumber: "IT89012345678",
        address: "Via Spaccanapoli 45",
        city: "Napoli",
        province: "NA",
        postalCode: "80134",
        phone: "+39 081 555 4567",
        email: "info@saporidelsud.it",
        deliveryZone: "Centro Storico",
        preferredDeliveryTime: "07:30-09:30",
        paymentMethod: "CARTA",
        paymentTermsDays: 15,
      },
    }),
  ])

  console.log(`✅ ${clients.length} clienti creati`)

  // ============================================================
  // CONTATTI CLIENTI
  // ============================================================
  await Promise.all([
    prisma.contact.create({
      data: { firstName: "Mario", lastName: "De Luca", role: "Titolare", phone: "+39 333 111 2222", email: "mario@damario.it", isPrimary: true, customerId: clients[0].id },
    }),
    prisma.contact.create({
      data: { firstName: "Anna", lastName: "Russo", role: "Chef", phone: "+39 333 222 3333", email: "anna@ilborgo.it", isPrimary: true, customerId: clients[1].id },
    }),
    prisma.contact.create({
      data: { firstName: "Francesco", lastName: "Esposito", role: "Direttore F&B", phone: "+39 333 333 4444", email: "francesco@villarosa.it", isPrimary: true, customerId: clients[2].id },
    }),
    prisma.contact.create({
      data: { firstName: "Roberto", lastName: "Sorbillo", role: "Titolare", phone: "+39 333 444 5555", isPrimary: true, customerId: clients[3].id },
    }),
    prisma.contact.create({
      data: { firstName: "Laura", lastName: "Marchetti", role: "Responsabile Acquisti", phone: "+39 333 555 6666", email: "laura@freshmart.it", isPrimary: true, customerId: clients[4].id },
    }),
  ])

  console.log("✅ Contatti creati")

  // ============================================================
  // SEQUENZE NUMERI
  // ============================================================
  await prisma.numberSequence.upsert({
    where: { type_year: { type: "ORDER_2026", year: 2026 } },
    update: {},
    create: { type: "ORDER_2026", year: 2026, lastNumber: 5, prefix: "ORD" },
  })
  await prisma.numberSequence.upsert({
    where: { type_year: { type: "DDT_2026", year: 2026 } },
    update: {},
    create: { type: "DDT_2026", year: 2026, lastNumber: 3, prefix: "DDT" },
  })
  await prisma.numberSequence.upsert({
    where: { type_year: { type: "INVOICE_2026", year: 2026 } },
    update: {},
    create: { type: "INVOICE_2026", year: 2026, lastNumber: 2, prefix: "FT" },
  })
  await prisma.numberSequence.upsert({
    where: { type_year: { type: "CUSTOMER_2026", year: 2026 } },
    update: {},
    create: { type: "CUSTOMER_2026", year: 2026, lastNumber: 8, prefix: "CLI" },
  })
  await prisma.numberSequence.upsert({
    where: { type_year: { type: "SUPPLIER_2026", year: 2026 } },
    update: {},
    create: { type: "SUPPLIER_2026", year: 2026, lastNumber: 3, prefix: "FOR" },
  })

  console.log("✅ Sequenze numeri create")

  // ============================================================
  // APP SETTINGS
  // ============================================================
  const settings = [
    { key: "app.name", value: "FruttaGest", category: "general", description: "Nome dell'applicazione" },
    { key: "app.description", value: "Gestionale vendite ortofrutticole", category: "general", description: "Descrizione applicazione" },
    { key: "auth.registration_enabled", value: true, category: "auth", description: "Registrazione pubblica abilitata" },
    { key: "auth.google_enabled", value: true, category: "auth", description: "Login con Google abilitato" },
    { key: "auth.max_login_attempts", value: 5, category: "auth", description: "Numero massimo tentativi di login" },
    { key: "auth.session_duration_days", value: 30, category: "auth", description: "Durata sessione in giorni" },
    { key: "maintenance.enabled", value: false, category: "maintenance", description: "Modalità manutenzione" },
    { key: "maintenance.message", value: "Il sistema è in manutenzione. Torneremo presto!", category: "maintenance", description: "Messaggio manutenzione" },
  ]

  for (const setting of settings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value as any,
        category: setting.category,
        description: setting.description,
      },
    })
  }

  console.log("✅ Impostazioni app create")

  // ============================================================
  // PREFERENZE UTENTI
  // ============================================================
  await prisma.userPreferences.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, theme: "SYSTEM", language: "it", notifications: true },
  })

  console.log("✅ Preferenze utenti create")

  // ============================================================
  // LOG ATTIVITA
  // ============================================================
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: "SEED_DATABASE", entity: "System", details: { message: "Database popolato con dati demo" } },
      { userId: admin.id, action: "LOGIN", entity: "User", entityId: admin.id },
    ],
  })

  console.log("✅ Activity log inizializzato")

  console.log("")
  console.log("🎉 Seeding completato!")
  console.log("")
  console.log("📋 Credenziali di accesso:")
  console.log("   Admin:     admin@fruttagest.it / Admin2026!")
  console.log("   Operatore: lucia@fruttagest.it / Operatore2026!")
  console.log("   Operatore: giuseppe@fruttagest.it / Operatore2026!")
  console.log("   Viewer:    anna@fruttagest.it / Operatore2026!")
  console.log("")
}

main()
  .catch((e) => {
    console.error("❌ Errore durante il seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
