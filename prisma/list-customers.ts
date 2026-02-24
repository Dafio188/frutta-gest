
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🔍 Listing all Customers...")

  const customers = await prisma.customer.findMany()
  
  console.log(`Found ${customers.length} customers:`)
  for (const c of customers) {
    console.log(`- ${c.companyName} (ID: ${c.id}, Email: ${c.email})`)
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
