
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function formatName(filename: string): string {
  // Rimuove estensione
  const name = filename.replace(/\.[^/.]+$/, "")
  // Sostituisce trattini con spazi e capitalizza
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

async function main() {
  const imagesDir = path.join(process.cwd(), "public", "images", "products")
  
  if (!fs.existsSync(imagesDir)) {
    console.error(`Directory non trovata: ${imagesDir}`)
    return
  }

  const files = fs.readdirSync(imagesDir)
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp"]
  
  // Trova o crea categoria "DA CATALOGARE"
  let defaultCategory = await prisma.productCategory.findFirst({
    where: { name: "DA CATALOGARE" }
  })

  if (!defaultCategory) {
    console.log("Creazione categoria 'DA CATALOGARE'...")
    defaultCategory = await prisma.productCategory.create({
      data: {
        name: "DA CATALOGARE",
        slug: "da-catalogare",
        sortOrder: 999,
        type: "DA_CATALOGARE" as any
      }
    })
  }

  console.log(`Inizio scansione di ${files.length} file...`)
  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!validExtensions.includes(ext)) {
      continue
    }

    const name = formatName(file)
    const slug = slugify(name)
    const imagePath = `/images/products/${file}`

    // Cerca prodotto esistente per slug o immagine
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: slug },
          { image: imagePath }
        ]
      }
    })

    if (existingProduct) {
      // Aggiorna immagine se mancante o diversa
      if (existingProduct.image !== imagePath) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: { image: imagePath }
        })
        updatedCount++
        console.log(`Aggiornato immagine per: ${existingProduct.name}`)
      } else {
        skippedCount++
      }
    } else {
      // Crea nuovo prodotto
      // Gestione collisione slug
      let finalSlug = slug
      let counter = 1
      while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`
        counter++
      }

      await prisma.product.create({
        data: {
          name: name,
          slug: finalSlug,
          description: "Generato automaticamente da immagine",
          image: imagePath,
          categoryId: defaultCategory.id,
          unit: "PEZZI", // Default
          vatRate: 4,
          isAvailable: true,
          // Prezzi a 0 o null come da schema
          defaultPrice: 0, 
        }
      })
      createdCount++
      console.log(`Creato nuovo prodotto: ${name}`)
    }
  }

  console.log("\n--- RIEPILOGO ---")
  console.log(`Prodotti creati: ${createdCount}`)
  console.log(`Prodotti aggiornati: ${updatedCount}`)
  console.log(`Prodotti invariati: ${skippedCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
