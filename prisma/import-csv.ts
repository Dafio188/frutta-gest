/**
 * Import Prodotti da CSV — FruttaGest
 *
 * Legge import-prodotti.csv e lo carica nel DB tenant.
 * Abbina automaticamente le immagini dalla cartella /images/products/.
 *
 * Uso: DATABASE_URL="postgresql://..." npx tsx prisma/import-csv.ts
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// Mappa category name → slug (usato nel DB)
const CATEGORY_MAP: Record<string, string> = {
  "frutta": "frutta",
  "verdura": "verdura",
  "ortaggi": "ortaggi",
  "erbe aromatiche": "erbe-aromatiche",
  "frutta esotica": "frutta-esotica",
  "frutta secca": "frutta-secca",
  "spezie": "spezie",
}

// Normalizza il nome del prodotto in slug per cercare l'immagine
function toImageSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// Cerca l'immagine migliore nella cartella products
function findImage(productName: string, availableImages: string[]): string | null {
  const slug = toImageSlug(productName)
  
  // Prova match esatto
  const exact = availableImages.find(f => {
    const fileSlug = f.replace(/\.(jpg|jpeg|png|webp)$/i, "")
    return fileSlug === slug
  })
  if (exact) return `/images/products/${exact}`

  // Prova match parziale (il nome del prodotto è contenuto nel filename)
  const partial = availableImages.find(f => {
    const fileSlug = f.replace(/\.(jpg|jpeg|png|webp)$/i, "")
    return fileSlug.startsWith(slug.split("-")[0]) && 
           slug.split("-").every(part => part.length < 3 || fileSlug.includes(part))
  })
  if (partial) return `/images/products/${partial}`

  // Prova con la prima parola del nome
  const firstWord = slug.split("-")[0]
  const byFirstWord = availableImages.find(f => f.startsWith(firstWord))
  if (byFirstWord) return `/images/products/${byFirstWord}`

  return null
}

async function main() {
  console.log("📂 Lettura CSV...")
  const csvPath = path.join(process.cwd(), "import-prodotti.csv")
  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n").filter(l => l.trim())
  
  // Header: name,category,unit,defaultPrice,costPrice,vatRate,isAvailable,description,minOrderQuantity
  const [header, ...rows] = lines

  // Leggi le immagini disponibili
  const imgDir = path.join(process.cwd(), "public", "images", "products")
  const availableImages = fs.readdirSync(imgDir)
  console.log(`🖼️  ${availableImages.length} immagini disponibili`)

  // Recupera o crea categorie
  const categoryCache: Record<string, string> = {}
  
  const getCategoryId = async (catName: string): Promise<string | null> => {
    const key = catName.toLowerCase().trim()
    if (categoryCache[key]) return categoryCache[key]
    
    const slug = CATEGORY_MAP[key]
    if (!slug) {
      console.warn(`⚠️  Categoria non mappata: "${catName}" — skip`)
      return null
    }
    
    const cat = await prisma.productCategory.findUnique({ where: { slug } })
    if (!cat) {
      console.warn(`⚠️  Categoria "${slug}" non trovata nel DB — esegui prima il seed`)
      return null
    }
    categoryCache[key] = cat.id
    return cat.id
  }

  let imported = 0
  let skipped = 0
  let withImage = 0

  for (const row of rows) {
    if (!row.trim()) continue
    
    // Parse CSV (gestisce campi tra virgolette)
    const cols = row.match(/(".*?"|[^",\r\n]+|(?<=,)(?=,)|(?<=,)$)/g) || []
    const clean = (s: string) => s?.replace(/^"|"$/g, "").trim() || ""
    
    const name = clean(cols[0])
    const category = clean(cols[1])
    const unit = clean(cols[2]) || "KG"
    const defaultPrice = parseFloat(clean(cols[3])) || 0
    const costPrice = clean(cols[4]) ? parseFloat(clean(cols[4])) : null
    const vatRate = parseFloat(clean(cols[5])) || 4
    const isAvailable = clean(cols[6]) === "true"

    if (!name || !category) { skipped++; continue }

    const categoryId = await getCategoryId(category)
    if (!categoryId) { skipped++; continue }

    // Genera slug dal nome
    const slug = toImageSlug(name)
    
    // Cerca immagine
    const image = findImage(name, availableImages)
    if (image) withImage++

    try {
      await prisma.product.upsert({
        where: { slug },
        update: {
          name,
          categoryId,
          unit: unit as any,
          defaultPrice,
          costPrice,
          vatRate,
          isAvailable,
          image,
        },
        create: {
          name,
          slug,
          categoryId,
          unit: unit as any,
          defaultPrice,
          costPrice: costPrice ?? undefined,
          vatRate,
          isAvailable,
          image,
        },
      })
      imported++
      if (imported % 50 === 0) console.log(`  ✅ ${imported} prodotti importati...`)
    } catch (err: any) {
      console.warn(`  ⚠️  Skip "${name}": ${err.message?.substring(0, 80)}`)
      skipped++
    }
  }

  console.log("")
  console.log(`🎉 Import completato!`)
  console.log(`   ✅ Importati: ${imported}`)
  console.log(`   🖼️  Con immagine: ${withImage}`)
  console.log(`   ⚠️  Saltati: ${skipped}`)
}

main()
  .catch(e => { console.error("❌ Errore:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
