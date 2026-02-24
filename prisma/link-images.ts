
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🖼️  Inizio collegamento immagini ai prodotti...")

  const productsDir = path.join(process.cwd(), "public", "images", "products")
  
  if (!fs.existsSync(productsDir)) {
    console.error("❌ Cartella immagini non trovata:", productsDir)
    process.exit(1)
  }

  const files = fs.readdirSync(productsDir)
  const products = await prisma.product.findMany()

  console.log(`📦 Trovati ${products.length} prodotti e ${files.length} immagini.`)

  let updatedCount = 0

  for (const product of products) {
    // Strategia di matching:
    // 1. Cerca match esatto (slug.ext)
    // 2. Cerca file che inizia con slug + "-" (es. slug-1kg.ext)
    
    // Filtra file immagini
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    let matchedFile = files.find(file => {
        const ext = path.extname(file).toLowerCase()
        if (!validExtensions.includes(ext)) return false
        
        const nameWithoutExt = path.basename(file, ext)
        return nameWithoutExt === product.slug
    })

    if (!matchedFile) {
        matchedFile = files.find(file => {
            const ext = path.extname(file).toLowerCase()
            if (!validExtensions.includes(ext)) return false
            
            const nameWithoutExt = path.basename(file, ext)
            return nameWithoutExt.startsWith(product.slug + "-") || nameWithoutExt.startsWith(product.slug + "_")
        })
    }

    if (matchedFile) {
      const imagePath = `/images/products/${matchedFile}`
      
      // Aggiorna solo se diverso o se null
      if (product.image !== imagePath) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: imagePath },
        })
        console.log(`✅ Collegato: ${product.slug} -> ${matchedFile}`)
        updatedCount++
      }
    } else {
      // console.log(`⚠️  Nessuna immagine trovata per: ${product.slug}`)
    }
  }

  console.log(`\n🎉 Operazione completata! ${updatedCount} prodotti aggiornati.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
