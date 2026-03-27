import { PrismaClient, OrderStatus, ProductUnit } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Mock of generateShoppingListFromOrders from actions.ts
// I will copy the logic here to test it isolated
async function generateShoppingListFromOrders(date: string) {
  // Simulate session
  const session = { user: { id: "test-user-id" } }
  
  console.log(`[Test] Generating shopping list for ${date}`)

  const [year, month, day] = date.split("-").map(Number)
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
  const targetDate = startOfDay

  console.log(`[Test] Date range (local): ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`)

  const orders = await prisma.order.findMany({
    where: {
      requestedDeliveryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["CONFIRMED", "IN_PREPARATION"],
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              supplierProducts: {
                where: { isPreferred: true },
                include: { supplier: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  console.log(`[Test] Found ${orders.length} orders`)
  orders.forEach(o => {
      console.log(`[Test] Order ${o.orderNumber}: requestedDeliveryDate=${o.requestedDeliveryDate?.toISOString()} (Raw: ${o.requestedDeliveryDate})`)
  })

  if (orders.length === 0) {
    return { error: "Nessun ordine confermato trovato per questa data" }
  }

  const listItems = []
  for (const order of orders) {
    for (const item of order.items) {
      const defaultSupplier = item.product?.supplierProducts[0]?.supplierId ?? null
      const defaultPrice = item.product?.supplierProducts[0]?.price ?? null

      listItems.push({
        productId: item.productId,
        productName: item.productName || item.product?.name,
        customerId: order.customerId,
        isInMaxiList: false,
        totalQuantity: Number(item.quantity),
        availableStock: 0,
        netQuantity: Number(item.quantity),
        unit: item.unit, // Cast removed for TS
        supplierId: defaultSupplier,
        supplierPrice: defaultPrice ? Number(defaultPrice) : null,
        notes: item.notes,
      })
    }
  }

  console.log(`[Test] Prepared ${listItems.length} items`)

  const existingList = await prisma.shoppingList.findUnique({
    where: { date: targetDate },
  })

  if (existingList) {
    console.log(`[Test] Updating existing list ${existingList.id}`)
    await prisma.shoppingListItem.deleteMany({
      where: { shoppingListId: existingList.id },
    })
    const list = await prisma.shoppingList.update({
      where: { id: existingList.id },
      data: {
        notes: `Generata automaticamente da ${orders.length} ordini`,
        items: { create: listItems },
      },
      include: {
        items: { include: { product: true, supplier: true, customer: true } },
      },
    })
    return list
  }

  console.log(`[Test] Creating new list`)
  const list = await prisma.shoppingList.create({
    data: {
      date: targetDate,
      notes: `Generata automaticamente da ${orders.length} ordini`,
      items: { create: listItems },
    },
    include: {
      items: { include: { product: true, supplier: true, customer: true } },
    },
  })
  
  return list
}

async function main() {
  try {
    // 1. Get or Create Customer
    let customer = await prisma.customer.findFirst()
    if (!customer) {
        console.log("Creating test customer")
        customer = await prisma.customer.create({
            data: {
                companyName: "Test Customer",
                code: "CUST001",
                address: "Via Test 1",
                city: "Test City",
                province: "TC",
                postalCode: "00000",
                type: "RISTORANTE"
            }
        })
    }

    // 2. Get or Create Product
    let product = await prisma.product.findFirst()
    if (!product) {
        console.log("Creating test product")
        // Need category
        let category = await prisma.productCategory.findFirst()
        if (!category) {
            category = await prisma.productCategory.create({
                data: { name: "Test Cat", slug: "test-cat", type: "FRUTTA" }
            })
        }
        product = await prisma.product.create({
            data: {
                name: "Test Product",
                slug: "test-product",
                categoryId: category.id,
                defaultPrice: 1.50
            }
        })
    }

    // 3. Create Order for 2099-01-01 (Local)
    // We set it to 23:30 UTC of the previous day (2098-12-31)
    // If the local range is 2099-01-01, it SHOULD find it if local.
    // If the UTC range is 2099-01-01, it should NOT find it.
    const deliveryDate = new Date("2098-12-31T23:30:00.000Z") 
    
    const order = await prisma.order.create({
        data: {
            orderNumber: `ORD-${Date.now()}`,
            customerId: customer.id,
            status: "RECEIVED",
            requestedDeliveryDate: deliveryDate,
            items: {
                create: {
                    productId: product.id,
                    quantity: 10,
                    unit: ProductUnit.KG,
                    unitPrice: 1.50,
                    lineTotal: 15.00,
                    productName: product.name
                }
            }
        }
    })

    console.log(`Order created: ${order.id}`)

    // 4. Update Status to CONFIRMED
    console.log("Updating status to CONFIRMED...")
    
    // Simulate updateOrderStatus logic part that calls generation
    // Force generation for 2099-01-01
    const deliveryDateStr = "2099-01-01" 
    
    // Update order status first, because generateShoppingListFromOrders searches for CONFIRMED orders
    await prisma.order.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" }
    })

    console.log(`Triggering generation for ${deliveryDateStr}`)
    await generateShoppingListFromOrders(deliveryDateStr)

    console.log("Success!")

  } catch (error) {
    console.error("CRITICAL ERROR:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
