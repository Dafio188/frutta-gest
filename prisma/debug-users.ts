
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🔍 Checking Users and Customers...")

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { customer: true }
  })

  console.log(`Found ${users.length} users with role CUSTOMER:`)
  for (const u of users) {
    console.log(`- User: ${u.email} (ID: ${u.id})`)
    console.log(`  Name: ${u.name}`)
    console.log(`  Role: ${u.role}`)
    console.log(`  CustomerId: ${u.customerId}`)
    if (u.customer) {
      console.log(`  -> Linked Customer: ${u.customer.companyName} (ID: ${u.customer.id})`)
    } else {
      console.log(`  -> ⚠️ NO LINKED CUSTOMER FOUND in DB relation (customerId might be invalid or null)`)
    }
  }

  const allCustomers = await prisma.customer.findMany()
  console.log(`\nTotal Customers in DB: ${allCustomers.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
