
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
  const name = filename.replace(/\.[^/.]+$/, "")
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
  
  console.log(`Analisi di ${files.length} file...`)
  
  const missingProducts: string[] = []
  const slugCollisions: string[] = []

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!validExtensions.includes(ext)) continue

    const name = formatName(file)
    const slug = slugify(name)
    const imagePath = `/images/products/${file}`

    // Check by Image Path
    const byImage = await prisma.product.findFirst({
      where: { image: imagePath }
    })

    // Check by Slug
    const bySlug = await prisma.product.findUnique({
      where: { slug }
    })

    if (!byImage && !bySlug) {
      missingProducts.push(file)
    } else if (!byImage && bySlug) {
        // Slug exists but image doesn't match?
        // Check if this product has a DIFFERENT image
        if (bySlug.image !== imagePath) {
            slugCollisions.push(`${file} (Slug '${slug}' exists on product '${bySlug.name}' with image '${bySlug.image}')`)
        }
    }
  }

  console.log("\n--- RISULTATI ---")
  console.log(`File totali: ${files.length}`)
  console.log(`Prodotti mancanti (nessun match per slug o immagine): ${missingProducts.length}`)
  
  if (missingProducts.length > 0) {
    console.log("File senza prodotto:")
    missingProducts.forEach(f => console.log(`- ${f}`))
  }

  if (slugCollisions.length > 0) {
      console.log("\nPossibili collisioni (Slug esiste ma immagine diversa):")
      slugCollisions.forEach(c => console.log(`- ${c}`))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
