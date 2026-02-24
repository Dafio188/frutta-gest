
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const userEmail = "astrocassano@gmail.com"
  console.log(`🔍 Linking user ${userEmail} to a new Customer entity...`)

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    console.error("❌ User not found!")
    process.exit(1)
  }

  if (user.customerId) {
    console.log("✅ User already linked to customer:", user.customerId)
    return
  }

  // Create Customer
  const customer = await prisma.customer.create({
    data: {
      companyName: "Fiore Frutta",
      email: user.email,
      address: "Via Test 123",
      city: "Roma",
      province: "RM",
      postalCode: "00100",
      code: "CUST-FIORE",
      type: "ALTRO",
      paymentMethod: "BONIFICO",
      paymentTermsDays: 30,
    }
  })

  console.log("✅ Created Customer:", customer.companyName, customer.id)

  // Link User to Customer
  await prisma.user.update({
    where: { id: user.id },
    data: { customerId: customer.id }
  })

  console.log("✅ Linked User to Customer successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
