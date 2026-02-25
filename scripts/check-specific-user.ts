
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL not found in environment variables")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkUser() {
  const email = "fio.davide@gmail.com"
  console.log(`Checking for user with email: ${email}`)
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (user) {
      console.log("User found:", user)
    } else {
      console.log("User NOT found in database.")
      // List all users to see what's there
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
      })
      console.log("Available users:", allUsers)
    }
  } catch (error) {
    console.error("Error checking user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
