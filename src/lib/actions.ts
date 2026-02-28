/**
 * Server Actions — FruttaGest
 *
 * File unico con tutte le server actions per operazioni CRUD,
 * dashboard, admin e impostazioni. Ogni azione verifica
 * l'autenticazione, valida gli input con Zod e logga le attivita'.
 */

"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { getNextNumber } from "@/lib/number-sequence"
import {
  customerSchema,
  supplierSchema,
  productSchema,
  orderSchema,
  deliveryNoteSchema,
  invoiceSchema,
  paymentSchema,
  companyInfoSchema,
  purchaseOrderSchema,
  supplierInvoiceSchema,
  resetPasswordSchema,
} from "@/lib/validations"
import { serialize } from "@/lib/utils"
import type { PaginationParams } from "@/types"
import { type Prisma, ProductUnit } from "@prisma/client"
import bcrypt from "bcryptjs"

// ============================================================
// HELPERS
// ============================================================

async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error("Non autorizzato")
  return session
}

async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== "ADMIN") throw new Error("Accesso riservato agli amministratori")
  return session
}

async function logActivity(
  userId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    await db.activityLog.create({
      data: { userId, action, entity, entityId, details: details ? JSON.parse(JSON.stringify(details)) : undefined },
    })
  } catch {
    // Non bloccare l'operazione se il log fallisce
    console.error("Errore nel salvataggio activity log")
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// ============================================================
// CUSTOMERS
// ============================================================

export async function getCustomers(params: PaginationParams = {}) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "companyName",
    sortOrder = "asc",
  } = params

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { vatNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}

  const [data, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: {
        contacts: true,
        _count: { select: { orders: true, invoices: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.customer.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getCustomer(id: string) {
  const session = await requireAuth()

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      contacts: true,
      orders: {
        orderBy: { orderDate: "desc" },
        take: 10,
        include: { items: { include: { product: true } } },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 10,
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 10,
      },
      customerPrices: {
        include: { product: true },
      },
      portalUser: {
        select: { id: true, email: true, isActive: true, lastLoginAt: true },
      },
    },
  })

  if (!customer) throw new Error("Cliente non trovato")
  return serialize(customer)
}

export async function createCustomer(data: unknown) {
  const session = await requireAuth()
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const code = await getNextNumber("CUSTOMER")

  const customer = await db.customer.create({
    data: {
      ...parsed.data,
      code,
      pecEmail: parsed.data.pecEmail || null,
      email: parsed.data.email || null,
    },
  })

  await logActivity(session.user.id, "CREATE_CUSTOMER", "Customer", customer.id, {
    companyName: customer.companyName,
  })

  revalidatePath("/clienti")
  return serialize(customer)
}

export async function updateCustomer(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const customer = await db.customer.update({
    where: { id },
    data: {
      ...parsed.data,
      pecEmail: parsed.data.pecEmail || null,
      email: parsed.data.email || null,
    },
  })

  await logActivity(session.user.id, "UPDATE_CUSTOMER", "Customer", customer.id, {
    companyName: customer.companyName,
  })

  revalidatePath("/clienti")
  revalidatePath(`/clienti/${id}`)
  return serialize(customer)
}

export async function deleteCustomer(id: string) {
  const session = await requireAuth()

  // Verifica che non ci siano ordini o fatture collegati
  const counts = await db.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { orders: true, invoices: true } },
    },
  })

  if (!counts) throw new Error("Cliente non trovato")

  if (counts._count.orders > 0 || counts._count.invoices > 0) {
    // Soft delete: disattiva invece di eliminare
    await db.customer.update({
      where: { id },
      data: { isActive: false },
    })

    await logActivity(session.user.id, "DEACTIVATE_CUSTOMER", "Customer", id, {
      companyName: counts.companyName,
    })
  } else {
    await db.customer.delete({ where: { id } })

    await logActivity(session.user.id, "DELETE_CUSTOMER", "Customer", id, {
      companyName: counts.companyName,
    })
  }

  revalidatePath("/clienti")
}

// ============================================================
// SUPPLIERS
// ============================================================

export async function getSuppliers(params: PaginationParams = {}) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "companyName",
    sortOrder = "asc",
  } = params

  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }
    : {}

  const [data, total] = await Promise.all([
    db.supplier.findMany({
      where,
      include: {
        contacts: true,
        _count: { select: { supplierProducts: true, purchaseOrders: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.supplier.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getSupplier(id: string) {
  const session = await requireAuth()

  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      contacts: true,
      supplierProducts: {
        include: { product: { include: { category: true } } },
      },
      purchaseOrders: {
        orderBy: { orderDate: "desc" },
        take: 10,
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 10,
      },
    },
  })

  if (!supplier) throw new Error("Fornitore non trovato")
  return serialize(supplier)
}

export async function createSupplier(data: unknown) {
  const session = await requireAuth()
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const code = await getNextNumber("SUPPLIER")

  const supplier = await db.supplier.create({
    data: {
      ...parsed.data,
      code,
      email: parsed.data.email || null,
    },
  })

  await logActivity(session.user.id, "CREATE_SUPPLIER", "Supplier", supplier.id, {
    companyName: supplier.companyName,
  })

  revalidatePath("/fornitori")
  return serialize(supplier)
}

export async function updateSupplier(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const supplier = await db.supplier.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
    },
  })

  await logActivity(session.user.id, "UPDATE_SUPPLIER", "Supplier", supplier.id, {
    companyName: supplier.companyName,
  })

  revalidatePath("/fornitori")
  revalidatePath(`/fornitori/${id}`)
  return serialize(supplier)
}

export async function deleteSupplier(id: string) {
  const session = await requireAuth()

  const counts = await db.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { purchaseOrders: true, supplierInvoices: true } },
    },
  })

  if (!counts) throw new Error("Fornitore non trovato")

  if (counts._count.purchaseOrders > 0 || counts._count.supplierInvoices > 0) {
    await db.supplier.update({
      where: { id },
      data: { isActive: false },
    })

    await logActivity(session.user.id, "DEACTIVATE_SUPPLIER", "Supplier", id, {
      companyName: counts.companyName,
    })
  } else {
    await db.supplier.delete({ where: { id } })

    await logActivity(session.user.id, "DELETE_SUPPLIER", "Supplier", id, {
      companyName: counts.companyName,
    })
  }

  revalidatePath("/fornitori")
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProducts(params: PaginationParams & { categoryId?: string; isAvailable?: boolean } = {}) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 50,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
    categoryId,
    isAvailable,
  } = params

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(isAvailable !== undefined ? { isAvailable } : {}),
  }

  const [data, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getProduct(id: string) {
  const session = await requireAuth()

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplierProducts: {
        include: { supplier: true },
      },
      customerPrices: {
        include: { customer: true },
      },
    },
  })

  if (!product) throw new Error("Prodotto non trovato")
  return serialize(product)
}

export async function getProductsByIds(ids: string[]) {
  const session = await requireAuth()

  const products = await db.product.findMany({
    where: { id: { in: ids }, isAvailable: true },
    include: { category: true },
  })

  return serialize(products)
}

export async function createProduct(data: unknown) {
  const session = await requireAuth()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const slug = slugify(parsed.data.name)

  // Verifica slug unico
  const existingSlug = await db.product.findUnique({ where: { slug } })
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

  const product = await db.product.create({
    data: {
      ...parsed.data,
      slug: finalSlug,
      defaultPrice: parsed.data.defaultPrice,
      costPrice: parsed.data.costPrice ?? null,
      vatRate: parsed.data.vatRate ?? 4,
      minOrderQuantity: parsed.data.minOrderQuantity ?? null,
    },
    include: { category: true },
  })

  await logActivity(session.user.id, "CREATE_PRODUCT", "Product", product.id, {
    name: product.name,
  })

  revalidatePath("/prodotti")
  return serialize(product)
}

export async function updateProduct(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const product = await db.product.update({
    where: { id },
    data: {
      ...parsed.data,
      defaultPrice: parsed.data.defaultPrice,
      costPrice: parsed.data.costPrice ?? null,
      vatRate: parsed.data.vatRate ?? 4,
      minOrderQuantity: parsed.data.minOrderQuantity ?? null,
    },
    include: { category: true },
  })

  await logActivity(session.user.id, "UPDATE_PRODUCT", "Product", product.id, {
    name: product.name,
  })

  revalidatePath("/prodotti")
  revalidatePath(`/prodotti/${id}`)
  return serialize(product)
}

export async function deleteProduct(id: string) {
  const session = await requireAuth()

  const product = await db.product.findUnique({
    where: { id },
    include: {
      _count: { select: { orderItems: true, invoiceItems: true } },
    },
  })

  if (!product) throw new Error("Prodotto non trovato")

  if (product._count.orderItems > 0 || product._count.invoiceItems > 0) {
    await db.product.update({
      where: { id },
      data: { isAvailable: false },
    })

    await logActivity(session.user.id, "DEACTIVATE_PRODUCT", "Product", id, {
      name: product.name,
    })
  } else {
    await db.product.delete({ where: { id } })

    await logActivity(session.user.id, "DELETE_PRODUCT", "Product", id, {
      name: product.name,
    })
  }

  revalidatePath("/prodotti")
}

export async function getCategories() {
  const session = await requireAuth()

  const categories = await db.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  })
  return serialize(categories)
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders(
  params: PaginationParams & { status?: string; customerId?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "orderDate",
    sortOrder = "desc",
    status,
    customerId,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.OrderWhereInput = {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customer: { companyName: { contains: search, mode: "insensitive" } } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          orderDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
        createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
        deliveryNote: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getOrder(id: string) {
  const session = await requireAuth()

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: { include: { contacts: true } },
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
      createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      deliveryNote: true,
      whatsappMessage: true,
      audioTranscription: true,
    },
  })

  if (!order) throw new Error("Ordine non trovato")
  return serialize(order)
}

export async function createOrder(data: unknown) {
  const session = await requireAuth()
  const parsed = orderSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const orderNumber = await getNextNumber("ORDER")

  // Calcola totali
  let subtotal = 0
  let vatAmount = 0

  const itemsData = parsed.data.items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineVat = lineTotal * (item.vatRate / 100)
    subtotal += lineTotal
    vatAmount += lineVat

    return {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      lineTotal,
      notes: item.notes ?? null,
      sortOrder: index,
    }
  })

  const total = subtotal + vatAmount

  const order = await db.order.create({
    data: {
      orderNumber,
      customerId: parsed.data.customerId,
      channel: parsed.data.channel ?? "MANUAL",
      requestedDeliveryDate: parsed.data.requestedDeliveryDate ?? null,
      notes: parsed.data.notes ?? null,
      internalNotes: parsed.data.internalNotes ?? null,
      subtotal,
      vatAmount,
      total,
      createdById: session.user.id,
      items: {
        create: itemsData,
      },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  })

  await logActivity(session.user.id, "CREATE_ORDER", "Order", order.id, {
    orderNumber: order.orderNumber,
    customer: order.customer.companyName,
    total: Number(order.total),
    itemCount: order.items.length,
  })

  revalidatePath("/ordini")
  revalidatePath("/dashboard")
  return serialize(order)
}

export async function updateOrder(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = orderSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  // Verifica che l'ordine esista e non sia gia' fatturato
  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) throw new Error("Ordine non trovato")
  if (existing.status === "INVOICED" || existing.status === "CANCELLED") {
    throw new Error("Non e' possibile modificare un ordine fatturato o annullato")
  }

  // Calcola totali
  let subtotal = 0
  let vatAmount = 0

  const itemsData = parsed.data.items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineVat = lineTotal * (item.vatRate / 100)
    subtotal += lineTotal
    vatAmount += lineVat

    return {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      lineTotal,
      notes: item.notes ?? null,
      sortOrder: index,
    }
  })

  const total = subtotal + vatAmount

  // Cancella i vecchi items e ricrea
  const order = await db.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: id } })

    return tx.order.update({
      where: { id },
      data: {
        customerId: parsed.data.customerId,
        channel: parsed.data.channel ?? "MANUAL",
        requestedDeliveryDate: parsed.data.requestedDeliveryDate ?? null,
        notes: parsed.data.notes ?? null,
        internalNotes: parsed.data.internalNotes ?? null,
        subtotal,
        vatAmount,
        total,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })
  })

  await logActivity(session.user.id, "UPDATE_ORDER", "Order", order.id, {
    orderNumber: order.orderNumber,
    total: Number(order.total),
  })

  revalidatePath("/ordini")
  revalidatePath(`/ordini/${id}`)
  revalidatePath("/dashboard")
  return serialize(order)
}

export async function updateOrderStatus(id: string, status: string) {
  const session = await requireAuth()

  // DELIVERED e INVOICED sono impostati solo automaticamente (DDT e Fattura)
  const validStatuses = ["RECEIVED", "CONFIRMED", "IN_PREPARATION", "CANCELLED"]
  if (!validStatuses.includes(status)) throw new Error("Stato non valido")

  // Carica ordine corrente con items per gestione magazzino
  const currentOrder = await db.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!currentOrder) throw new Error("Ordine non trovato")

  const order = await db.order.update({
    where: { id },
    data: { status: status as any },
    include: { customer: true },
  })

  // SCARICO magazzino quando ordine va IN_PREPARATION
  if (status === "IN_PREPARATION" && currentOrder.items.length > 0) {
    const itemsToProcess = currentOrder.items.filter((item) => item.productId !== null)
    
    if (itemsToProcess.length > 0) {
      await db.$transaction(
        itemsToProcess.map((item) =>
          db.stockMovement.create({
            data: {
              productId: item.productId!,
              type: "SCARICO",
            quantity: item.quantity,
            unit: item.unit,
            reason: `Prelievo per ordine ${order.orderNumber}`,
            referenceType: "ORDER",
            referenceId: order.id,
            createdById: session.user.id,
          },
        })
      )
    )
  }
}

  // CARICO compensativo se annullato dopo preparazione (ripristina stock)
  if (status === "CANCELLED" && ["IN_PREPARATION", "DELIVERED"].includes(currentOrder.status)) {
    const scarichi = await db.stockMovement.findMany({
      where: { referenceType: "ORDER", referenceId: id, type: "SCARICO" },
    })
    if (scarichi.length > 0) {
      await db.$transaction(
        scarichi.map((mov) =>
          db.stockMovement.create({
            data: {
              productId: mov.productId,
              type: "CARICO",
              quantity: mov.quantity,
              unit: mov.unit,
              reason: `Ripristino per annullamento ordine ${order.orderNumber}`,
              referenceType: "ORDER",
              referenceId: order.id,
              createdById: session.user.id,
            },
          })
        )
      )
    }
  }

  // Auto-genera lista della spesa quando ordine confermato
  if (status === "CONFIRMED" && currentOrder.requestedDeliveryDate) {
    try {
      // Usa data locale per evitare shift di timezone con toISOString()
      const d = currentOrder.requestedDeliveryDate
      const deliveryDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      console.log(`[Auto-genera lista spesa] Ordine ${order.orderNumber} confermato. Generazione lista per data: ${deliveryDate}`)
      await generateShoppingListFromOrders(deliveryDate)
    } catch (err) {
      console.error("[Auto-genera lista spesa] Fallita:", err)
    }
  }

  await logActivity(session.user.id, "UPDATE_ORDER_STATUS", "Order", order.id, {
    orderNumber: order.orderNumber,
    newStatus: status,
  })

  revalidatePath("/ordini")
  revalidatePath(`/ordini/${id}`)
  revalidatePath("/magazzino")
  revalidatePath("/lista-spesa")
  revalidatePath("/dashboard")
  return serialize(order)
}

export async function deleteOrder(id: string) {
  const session = await requireAuth()

  const order = await db.order.findUnique({
    where: { id },
    include: { deliveryNote: true },
  })

  if (!order) throw new Error("Ordine non trovato")

  if (order.status === "INVOICED") {
    throw new Error("Non e' possibile eliminare un ordine fatturato")
  }

  if (order.deliveryNote) {
    throw new Error("Non e' possibile eliminare un ordine con DDT collegato. Eliminare prima la bolla.")
  }

  // Annulla invece di eliminare se gia' confermato
  if (order.status !== "RECEIVED") {
    await db.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    await logActivity(session.user.id, "CANCEL_ORDER", "Order", id, {
      orderNumber: order.orderNumber,
    })
  } else {
    await db.order.delete({ where: { id } })

    await logActivity(session.user.id, "DELETE_ORDER", "Order", id, {
      orderNumber: order.orderNumber,
    })
  }

  revalidatePath("/ordini")
  revalidatePath("/dashboard")
}

// ============================================================
// DELIVERY NOTES (DDT)
// ============================================================

export async function getDeliveryNotes(
  params: PaginationParams & { status?: string; customerId?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "issueDate",
    sortOrder = "desc",
    status,
    customerId,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.DeliveryNoteWhereInput = {
    ...(search
      ? {
          OR: [
            { ddtNumber: { contains: search, mode: "insensitive" } },
            { customer: { companyName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          issueDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.deliveryNote.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
        order: true,
        createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
        invoiceLinks: { include: { invoice: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.deliveryNote.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getDeliveryNote(id: string) {
  const session = await requireAuth()

  const ddt = await db.deliveryNote.findUnique({
    where: { id },
    include: {
      customer: { include: { contacts: true } },
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
      order: {
        include: { items: { include: { product: true } } },
      },
      createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      invoiceLinks: { include: { invoice: true } },
    },
  })

  if (!ddt) throw new Error("Bolla di consegna non trovata")
  return serialize(ddt)
}

export async function createDeliveryNote(data: unknown) {
  const session = await requireAuth()
  const parsed = deliveryNoteSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const ddtNumber = await getNextNumber("DDT")

  // Se c'e' un orderId, copiamo gli items dall'ordine
  let itemsToCreate: {
    productId: string | null
    productName?: string | null
    quantity: number
    unit: any
    unitPrice: number
    vatRate: number
    lineTotal: number
    notes: string | null
    sortOrder: number
  }[] = []

  if (parsed.data.orderId) {
    const order = await db.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { items: { include: { product: true }, orderBy: { sortOrder: "asc" } } },
    })

    if (!order) throw new Error("Ordine non trovato")

    // Verifica che l'ordine non abbia gia' un DDT
    const existingDDT = await db.deliveryNote.findUnique({
      where: { orderId: parsed.data.orderId },
    })
    if (existingDDT) throw new Error("Questo ordine ha gia' una bolla di consegna associata")

    itemsToCreate = order.items.map((item, index) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      lineTotal: Number(item.lineTotal),
      notes: item.notes,
      sortOrder: index,
    }))
  }

  const ddt = await db.deliveryNote.create({
    data: {
      ddtNumber,
      customerId: parsed.data.customerId,
      orderId: parsed.data.orderId ?? null,
      issueDate: parsed.data.issueDate,
      transportReason: parsed.data.transportReason ?? "Vendita",
      transportedBy: parsed.data.transportedBy ?? "Mittente",
      goodsAppearance: parsed.data.goodsAppearance ?? null,
      numberOfPackages: parsed.data.numberOfPackages ?? null,
      weight: parsed.data.weight ?? null,
      deliveryNotes: parsed.data.deliveryNotes ?? null,
      createdById: session.user.id,
      items: itemsToCreate.length > 0 ? { create: itemsToCreate } : undefined,
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  })

  // Aggiorna lo stato dell'ordine collegato
  if (parsed.data.orderId) {
    await db.order.update({
      where: { id: parsed.data.orderId },
      data: { status: "DELIVERED" },
    })
  }

  // Lo SCARICO magazzino avviene gia' in fase di preparazione ordine (updateOrderStatus → IN_PREPARATION)

  await logActivity(session.user.id, "CREATE_DDT", "DeliveryNote", ddt.id, {
    ddtNumber: ddt.ddtNumber,
    customer: ddt.customer.companyName,
  })

  revalidatePath("/ddt")
  revalidatePath("/ordini")
  revalidatePath("/magazzino")
  revalidatePath("/dashboard")
  return serialize(ddt)
}

/**
 * Lookup costo e fornitore per una lista di prodotti.
 * Priorità: PO RECEIVED recente > SupplierProduct preferito > Product.costPrice
 */
async function lookupProductCostsAndSuppliers(
  productIds: string[]
): Promise<Map<string, { costPrice: number; supplierId: string | null }>> {
  const result = new Map<string, { costPrice: number; supplierId: string | null }>()
  if (productIds.length === 0) return result

  // 1. Ultimi PO RECEIVED per ogni prodotto
  const recentPOItems = await db.purchaseOrderItem.findMany({
    where: {
      productId: { in: productIds },
      purchaseOrder: { status: "RECEIVED" },
    },
    include: { purchaseOrder: { select: { supplierId: true, createdAt: true } } },
    orderBy: { purchaseOrder: { createdAt: "desc" } },
  })

  // Prendi il più recente per ogni prodotto
  for (const poi of recentPOItems) {
    if (poi.productId && !result.has(poi.productId)) {
      result.set(poi.productId, {
        costPrice: Number(poi.unitPrice),
        supplierId: poi.purchaseOrder.supplierId,
      })
    }
  }

  // 2. SupplierProduct preferiti per prodotti non ancora trovati
  const missingIds = productIds.filter((id) => !result.has(id))
  if (missingIds.length > 0) {
    const preferredSuppliers = await db.supplierProduct.findMany({
      where: { productId: { in: missingIds }, isPreferred: true },
    })
    for (const sp of preferredSuppliers) {
      if (!result.has(sp.productId)) {
        result.set(sp.productId, {
          costPrice: Number(sp.price),
          supplierId: sp.supplierId,
        })
      }
    }
  }

  // 3. Fallback a Product.costPrice per i rimanenti
  const stillMissing = productIds.filter((id) => !result.has(id))
  if (stillMissing.length > 0) {
    const products = await db.product.findMany({
      where: { id: { in: stillMissing } },
      select: { id: true, costPrice: true },
    })
    for (const p of products) {
      if (p.costPrice !== null) {
        result.set(p.id, {
          costPrice: Number(p.costPrice),
          supplierId: null,
        })
      }
    }
  }

  return result
}

export async function updateDeliveryNoteStatus(id: string, status: string) {
  const session = await requireAuth()

  const validStatuses = ["DRAFT", "ISSUED", "DELIVERED"]
  if (!validStatuses.includes(status)) throw new Error("Stato non valido")

  const ddt = await db.deliveryNote.update({
    where: { id },
    data: {
      status: status as any,
      ...(status === "DELIVERED" ? { deliveryDate: new Date() } : {}),
    },
    include: {
      customer: true,
      items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
      invoiceLinks: true,
    },
  })

  // Auto-genera fattura cliente quando DDT diventa DELIVERED
  if (status === "DELIVERED" && ddt.items.length > 0 && ddt.invoiceLinks.length === 0) {
    const invoiceNumber = await getNextNumber("INVOICE")

    // Lookup costi e fornitori per ogni prodotto
    const productIds = ddt.items.map((i) => i.productId).filter(Boolean) as string[]
    const costLookup = await lookupProductCostsAndSuppliers(productIds)

    let subtotal = 0
    let vatAmount = 0
    const invoiceItems = ddt.items.map((item, index) => {
      const lineTotal = Number(item.lineTotal)
      const lineVat = lineTotal * (Number(item.vatRate) / 100)
      subtotal += lineTotal
      vatAmount += lineVat
      const costInfo = item.productId ? costLookup.get(item.productId) : undefined
      return {
        productId: item.productId,
        description: item.product?.name ?? item.productName ?? "Prodotto personalizzato",
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        costPrice: costInfo?.costPrice ?? null,
        supplierId: costInfo?.supplierId ?? null,
        vatRate: Number(item.vatRate),
        lineTotal,
        sortOrder: index,
      }
    })

    const total = subtotal + vatAmount
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerId: ddt.customerId,
        issueDate: new Date(),
        dueDate,
        subtotal,
        vatAmount,
        total,
        notes: `Generata automaticamente da DDT ${ddt.ddtNumber}`,
        createdById: session.user.id,
        items: { create: invoiceItems },
        ddtLinks: { create: [{ deliveryNoteId: ddt.id }] },
      },
    })

    // Aggiorna ordine collegato a INVOICED
    if (ddt.orderId) {
      await db.order.update({
        where: { id: ddt.orderId },
        data: { status: "INVOICED" },
      })
    }

    await logActivity(session.user.id, "CREATE_INVOICE", "Invoice", invoice.id, {
      invoiceNumber,
      customer: ddt.customer.companyName,
      total,
      autoGenerated: true,
      fromDDT: ddt.ddtNumber,
    })
  }

  await logActivity(session.user.id, "UPDATE_DDT_STATUS", "DeliveryNote", ddt.id, {
    ddtNumber: ddt.ddtNumber,
    newStatus: status,
  })

  revalidatePath("/ddt")
  revalidatePath(`/ddt/${id}`)
  revalidatePath("/fatture")
  revalidatePath("/ordini")
  revalidatePath("/dashboard")
  return serialize(ddt)
}

export async function generateInvoiceFromDDT(ddtId: string) {
  const session = await requireAuth()

  const ddt = await db.deliveryNote.findUnique({
    where: { id: ddtId },
    include: {
      customer: true,
      items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
      invoiceLinks: true,
    },
  })

  if (!ddt) throw new Error("DDT non trovata")
  if (ddt.status !== "DELIVERED") throw new Error("La DDT deve essere consegnata per generare una fattura")
  if (ddt.invoiceLinks.length > 0) throw new Error("Questa DDT ha gia' una fattura collegata")

  const invoiceNumber = await getNextNumber("INVOICE")

  // Lookup costi e fornitori per ogni prodotto
  const productIds = ddt.items.map((i) => i.productId).filter(Boolean) as string[]
  const costLookup = await lookupProductCostsAndSuppliers(productIds)

  let subtotal = 0
  let vatAmount = 0
  const invoiceItems = ddt.items.map((item, index) => {
    const lineTotal = Number(item.lineTotal)
    const lineVat = lineTotal * (Number(item.vatRate) / 100)
    subtotal += lineTotal
    vatAmount += lineVat
    const costInfo = item.productId ? costLookup.get(item.productId) : undefined
    return {
      productId: item.productId,
      description: item.product?.name ?? item.productName ?? "Prodotto personalizzato",
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      costPrice: costInfo?.costPrice ?? null,
      supplierId: costInfo?.supplierId ?? null,
      vatRate: Number(item.vatRate),
      lineTotal,
      sortOrder: index,
    }
  })

  const total = subtotal + vatAmount
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      customerId: ddt.customerId,
      issueDate: new Date(),
      dueDate,
      subtotal,
      vatAmount,
      total,
      notes: `Generata da DDT ${ddt.ddtNumber}`,
      createdById: session.user.id,
      items: { create: invoiceItems },
      ddtLinks: { create: [{ deliveryNoteId: ddt.id }] },
    },
  })

  if (ddt.orderId) {
    await db.order.update({
      where: { id: ddt.orderId },
      data: { status: "INVOICED" },
    })
  }

  await logActivity(session.user.id, "CREATE_INVOICE", "Invoice", invoice.id, {
    invoiceNumber,
    customer: ddt.customer.companyName,
    total,
    fromDDT: ddt.ddtNumber,
  })

  revalidatePath("/fatture")
  revalidatePath("/bolle")
  revalidatePath(`/bolle/${ddtId}`)
  revalidatePath("/ordini")
  return serialize(invoice)
}

/**
 * Backfill: aggiorna costPrice e supplierId per tutte le InvoiceItem esistenti
 * che hanno un productId ma non hanno ancora costPrice/supplierId.
 */
export async function backfillInvoiceItemCosts() {
  const session = await requireAuth()

  const itemsToUpdate = await db.invoiceItem.findMany({
    where: {
      productId: { not: null },
      costPrice: null,
    },
    select: { id: true, productId: true },
  })

  if (itemsToUpdate.length === 0) return { updated: 0 }

  const productIds = [...new Set(itemsToUpdate.map((i) => i.productId!).filter(Boolean))]
  const costLookup = await lookupProductCostsAndSuppliers(productIds)

  let updated = 0
  for (const item of itemsToUpdate) {
    const costInfo = item.productId ? costLookup.get(item.productId) : undefined
    if (costInfo) {
      await db.invoiceItem.update({
        where: { id: item.id },
        data: {
          costPrice: costInfo.costPrice,
          supplierId: costInfo.supplierId,
        },
      })
      updated++
    }
  }

  await logActivity(session.user.id, "BACKFILL_COSTS", "InvoiceItem", undefined, {
    totalItems: itemsToUpdate.length,
    updated,
  })

  revalidatePath("/fatture")
  return { updated, total: itemsToUpdate.length }
}

export async function updateDeliveryNote(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = deliveryNoteSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const existing = await db.deliveryNote.findUnique({
    where: { id },
    include: { invoiceLinks: true },
  })
  if (!existing) throw new Error("DDT non trovata")
  if (existing.invoiceLinks.length > 0) {
    throw new Error("Non e' possibile modificare una DDT gia' collegata a una fattura")
  }

  // Se c'e' un orderId, ricopiamo gli items dall'ordine
  let itemsToCreate: {
    productId: string | null; productName?: string | null; quantity: number; unit: any; unitPrice: number
    vatRate: number; lineTotal: number; notes: string | null; sortOrder: number
  }[] = []

  if (parsed.data.orderId) {
    const order = await db.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { items: { include: { product: true }, orderBy: { sortOrder: "asc" } } },
    })
    if (order) {
      itemsToCreate = order.items.map((item, index) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        lineTotal: Number(item.lineTotal),
        notes: item.notes,
        sortOrder: index,
      }))
    }
  }

  const ddt = await db.$transaction(async (tx) => {
    // Cancella vecchi items e ricrea
    await tx.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } })

    return tx.deliveryNote.update({
      where: { id },
      data: {
        customerId: parsed.data.customerId,
        orderId: parsed.data.orderId ?? null,
        issueDate: parsed.data.issueDate,
        transportReason: parsed.data.transportReason ?? "Vendita",
        transportedBy: parsed.data.transportedBy ?? "Mittente",
        goodsAppearance: parsed.data.goodsAppearance ?? null,
        numberOfPackages: parsed.data.numberOfPackages ?? null,
        weight: parsed.data.weight ?? null,
        deliveryNotes: parsed.data.deliveryNotes ?? null,
        items: itemsToCreate.length > 0 ? { create: itemsToCreate } : undefined,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })
  })

  await logActivity(session.user.id, "UPDATE_DDT", "DeliveryNote", ddt.id, {
    ddtNumber: ddt.ddtNumber,
    customer: ddt.customer.companyName,
  })

  revalidatePath("/bolle")
  revalidatePath(`/bolle/${id}`)
  revalidatePath("/dashboard")
  return serialize(ddt)
}

export async function deleteDeliveryNote(id: string) {
  const session = await requireAuth()

  const ddt = await db.deliveryNote.findUnique({
    where: { id },
    include: { invoiceLinks: true },
  })
  if (!ddt) throw new Error("DDT non trovata")
  if (ddt.invoiceLinks.length > 0) {
    throw new Error("Non e' possibile eliminare una DDT collegata a una fattura. Eliminare prima la fattura.")
  }

  // Ripristina lo stato dell'ordine collegato
  if (ddt.orderId) {
    await db.order.update({
      where: { id: ddt.orderId },
      data: { status: "CONFIRMED" },
    })
  }

  // Rimuovi i movimenti di scarico collegati a questa DDT
  await db.stockMovement.deleteMany({
    where: { referenceType: "DELIVERY_NOTE", referenceId: id },
  })

  await db.deliveryNoteItem.deleteMany({ where: { deliveryNoteId: id } })
  await db.deliveryNote.delete({ where: { id } })

  await logActivity(session.user.id, "DELETE_DDT", "DeliveryNote", id, {
    ddtNumber: ddt.ddtNumber,
  })

  revalidatePath("/bolle")
  revalidatePath("/ordini")
  revalidatePath("/magazzino")
  revalidatePath("/dashboard")
}

// ============================================================
// INVOICES
// ============================================================

export async function getInvoices(
  params: PaginationParams & { status?: string; customerId?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "issueDate",
    sortOrder = "desc",
    status,
    customerId,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.InvoiceWhereInput = {
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            { customer: { companyName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          issueDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        ddtLinks: { include: { deliveryNote: true } },
        payments: true,
        createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.invoice.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getInvoice(id: string) {
  const session = await requireAuth()

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: { include: { contacts: true } },
      items: {
        include: {
          product: { include: { category: true } },
          supplier: { select: { id: true, companyName: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      ddtLinks: {
        include: {
          deliveryNote: {
            include: {
              items: { include: { product: true } },
              order: true,
            },
          },
        },
      },
      payments: true,
      creditNotes: true,
      createdBy: { select: { id: true, name: true, email: true, image: true, role: true } },
    },
  })

  if (!invoice) throw new Error("Fattura non trovata")
  return serialize(invoice)
}

export async function createInvoice(data: unknown) {
  const session = await requireAuth()
  const parsed = invoiceSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const invoiceNumber = await getNextNumber("INVOICE")

  // Recupera tutte le DDT selezionate e raccogli gli items
  const ddts = await db.deliveryNote.findMany({
    where: { id: { in: parsed.data.ddtIds } },
    include: { items: { include: { product: true }, orderBy: { sortOrder: "asc" } } },
  })

  if (ddts.length !== parsed.data.ddtIds.length) {
    throw new Error("Una o piu' bolle selezionate non sono state trovate")
  }

  // Verifica che le DDT non siano gia' fatturate
  for (const ddt of ddts) {
    const existingLink = await db.invoiceDDTLink.findFirst({
      where: { deliveryNoteId: ddt.id },
    })
    if (existingLink) {
      throw new Error(`La bolla ${ddt.ddtNumber} e' gia' collegata a una fattura`)
    }
  }

  // Aggrega gli items dalle DDT
  let subtotal = 0
  let vatAmount = 0
  let sortIndex = 0

  const invoiceItems: {
    productId: string | null
    description: string
    quantity: number
    unit: any
    unitPrice: number
    vatRate: number
    lineTotal: number
    sortOrder: number
  }[] = []

  for (const ddt of ddts) {
    for (const item of ddt.items) {
      const lineTotal = Number(item.lineTotal)
      const lineVat = lineTotal * (Number(item.vatRate) / 100)
      subtotal += lineTotal
      vatAmount += lineVat

      invoiceItems.push({
        productId: item.productId,
        description: item.product?.name ?? item.productName ?? "Prodotto personalizzato",
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        lineTotal,
        sortOrder: sortIndex++,
      })
    }
  }

  const total = subtotal + vatAmount

  const invoice = await db.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: parsed.data.customerId,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        subtotal,
        vatAmount,
        total,
        paymentMethod: parsed.data.paymentMethod ?? null,
        paymentTerms: parsed.data.paymentTerms ?? null,
        notes: parsed.data.notes ?? null,
        internalNotes: parsed.data.internalNotes ?? null,
        createdById: session.user.id,
        items: {
          create: invoiceItems,
        },
        ddtLinks: {
          create: parsed.data.ddtIds.map((ddtId) => ({
            deliveryNoteId: ddtId,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        ddtLinks: true,
      },
    })

    // Aggiorna lo stato degli ordini collegati alle DDT
    for (const ddt of ddts) {
      if (ddt.orderId) {
        await tx.order.update({
          where: { id: ddt.orderId },
          data: { status: "INVOICED" },
        })
      }
    }

    return inv
  })

  await logActivity(session.user.id, "CREATE_INVOICE", "Invoice", invoice.id, {
    invoiceNumber: invoice.invoiceNumber,
    customer: invoice.customer.companyName,
    total: Number(invoice.total),
    ddtCount: parsed.data.ddtIds.length,
  })

  revalidatePath("/fatture")
  revalidatePath("/ddt")
  revalidatePath("/ordini")
  revalidatePath("/dashboard")
  return serialize(invoice)
}

export async function updateInvoiceStatus(id: string, status: string) {
  const session = await requireAuth()

  const validStatuses = ["DRAFT", "ISSUED", "SENT", "PAID", "OVERDUE", "CANCELLED"]
  if (!validStatuses.includes(status)) throw new Error("Stato non valido")

  const invoice = await db.invoice.update({
    where: { id },
    data: { status: status as any },
    include: { customer: true },
  })

  await logActivity(session.user.id, "UPDATE_INVOICE_STATUS", "Invoice", invoice.id, {
    invoiceNumber: invoice.invoiceNumber,
    newStatus: status,
  })

  revalidatePath("/fatture")
  revalidatePath(`/fatture/${id}`)
  revalidatePath("/dashboard")
  return serialize(invoice)
}

export async function deleteInvoice(id: string) {
  const session = await requireAuth()

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { payments: true, ddtLinks: { include: { deliveryNote: true } } },
  })
  if (!invoice) throw new Error("Fattura non trovata")
  if (invoice.status === "PAID") {
    throw new Error("Non e' possibile eliminare una fattura gia' pagata")
  }
  if (invoice.payments.length > 0) {
    throw new Error("Non e' possibile eliminare una fattura con pagamenti registrati. Eliminare prima i pagamenti.")
  }

  await db.$transaction(async (tx) => {
    // Ripristina stato ordini collegati alle DDT
    for (const link of invoice.ddtLinks) {
      if (link.deliveryNote.orderId) {
        await tx.order.update({
          where: { id: link.deliveryNote.orderId },
          data: { status: "DELIVERED" },
        })
      }
    }

    // Rimuovi link DDT-Fattura
    await tx.invoiceDDTLink.deleteMany({ where: { invoiceId: id } })
    // Rimuovi items fattura
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
    // Elimina fattura
    await tx.invoice.delete({ where: { id } })
  })

  await logActivity(session.user.id, "DELETE_INVOICE", "Invoice", id, {
    invoiceNumber: invoice.invoiceNumber,
  })

  revalidatePath("/fatture")
  revalidatePath("/bolle")
  revalidatePath("/ordini")
  revalidatePath("/dashboard")
}

// ============================================================
// PAYMENTS
// ============================================================

export async function getPayments(
  params: PaginationParams & { direction?: string; customerId?: string; supplierId?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "paymentDate",
    sortOrder = "desc",
    direction,
    customerId,
    supplierId,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.PaymentWhereInput = {
    ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
            { customer: { companyName: { contains: search, mode: "insensitive" } } },
            { supplier: { companyName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(direction ? { direction: direction as any } : {}),
    ...(customerId ? { customerId } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(dateFrom || dateTo
      ? {
          paymentDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        customer: true,
        supplier: true,
        invoice: true,
        supplierInvoice: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.payment.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function createPayment(data: unknown) {
  const session = await requireAuth()
  const parsed = paymentSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const payment = await db.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        direction: parsed.data.direction as any,
        amount: parsed.data.amount,
        paymentDate: parsed.data.paymentDate,
        method: parsed.data.method as any,
        reference: parsed.data.reference ?? null,
        notes: parsed.data.notes ?? null,
        customerId: parsed.data.customerId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        invoiceId: parsed.data.invoiceId ?? null,
        supplierInvoiceId: parsed.data.supplierInvoiceId ?? null,
        status: "COMPLETED",
      },
      include: {
        customer: true,
        supplier: true,
        invoice: true,
      },
    })

    // Se collegato a una fattura cliente, aggiorna il paidAmount
    if (p.invoiceId) {
      const invoice = await tx.invoice.findUnique({ where: { id: p.invoiceId } })
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + parsed.data.amount
        const isPaid = newPaidAmount >= Number(invoice.total)

        await tx.invoice.update({
          where: { id: p.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: isPaid ? "PAID" : invoice.status,
          },
        })
      }
    }

    // Se collegato a una fattura fornitore, aggiorna il paidAmount
    if (p.supplierInvoiceId) {
      const supplierInvoice = await tx.supplierInvoice.findUnique({
        where: { id: p.supplierInvoiceId },
      })
      if (supplierInvoice) {
        const newPaidAmount = Number(supplierInvoice.paidAmount) + parsed.data.amount
        const isPaid = newPaidAmount >= Number(supplierInvoice.total)

        await tx.supplierInvoice.update({
          where: { id: p.supplierInvoiceId },
          data: {
            paidAmount: newPaidAmount,
            isPaid,
          },
        })
      }
    }

    return p
  })

  await logActivity(session.user.id, "CREATE_PAYMENT", "Payment", payment.id, {
    direction: payment.direction,
    amount: Number(payment.amount),
    method: payment.method,
    customer: payment.customer?.companyName,
    supplier: payment.supplier?.companyName,
  })

  revalidatePath("/pagamenti")
  revalidatePath("/fatture")
  revalidatePath("/acquisti/fatture")
  revalidatePath("/dashboard")
  return serialize(payment)
}

export async function deletePayment(id: string) {
  const session = await requireAuth()

  const payment = await db.payment.findUnique({
    where: { id },
    include: { invoice: true, supplierInvoice: true },
  })

  if (!payment) throw new Error("Pagamento non trovato")

  await db.$transaction(async (tx) => {
    // Ripristina l'importo pagato sulla fattura cliente
    if (payment.invoiceId && payment.invoice) {
      const newPaidAmount = Math.max(0, Number(payment.invoice.paidAmount) - Number(payment.amount))
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newPaidAmount < Number(payment.invoice.total) ? "ISSUED" : "PAID",
        },
      })
    }

    // Ripristina l'importo pagato sulla fattura fornitore
    if (payment.supplierInvoiceId && payment.supplierInvoice) {
      const newPaidAmount = Math.max(0, Number(payment.supplierInvoice.paidAmount) - Number(payment.amount))
      await tx.supplierInvoice.update({
        where: { id: payment.supplierInvoiceId },
        data: {
          paidAmount: newPaidAmount,
          isPaid: newPaidAmount >= Number(payment.supplierInvoice.total),
        },
      })
    }

    await tx.payment.delete({ where: { id } })
  })

  await logActivity(session.user.id, "DELETE_PAYMENT", "Payment", id, {
    amount: Number(payment.amount),
    direction: payment.direction,
  })

  revalidatePath("/pagamenti")
  revalidatePath("/fatture")
  revalidatePath("/dashboard")
}

// ============================================================
// SHOPPING LIST
// ============================================================

export async function getShoppingLists(params: PaginationParams & { status?: string } = {}) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "date",
    sortOrder = "desc",
    status,
  } = params

  const where: Prisma.ShoppingListWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(search
      ? {
          OR: [
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.shoppingList.findMany({
      where,
      include: {
        items: {
          include: {
            product: { include: { category: true } },
            supplier: true,
            // Include customer for client view
            customer: true,
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.shoppingList.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getShoppingList(id: string) {
  const session = await requireAuth()

  const list = await db.shoppingList.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { include: { category: true } },
          supplier: true,
          customer: true,
        },
      },
    },
  })

  if (!list) throw new Error("Lista della spesa non trovata")
  return serialize(list)
}

export async function createShoppingList(data: {
  date: string
  notes?: string
  items: {
    productId: string
    totalQuantity: number
    unit: string
    supplierId?: string
    supplierPrice?: number
    notes?: string
  }[]
}) {
  const session = await requireAuth()

  const listDate = new Date(data.date)

  // Verifica se esiste gia' una lista per questa data
  const existing = await db.shoppingList.findUnique({
    where: { date: listDate },
  })
  if (existing) {
    throw new Error("Esiste gia' una lista della spesa per questa data")
  }

  const list = await db.shoppingList.create({
    data: {
      date: listDate,
      notes: data.notes ?? null,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          totalQuantity: item.totalQuantity,
          unit: item.unit as any,
          supplierId: item.supplierId ?? null,
          supplierPrice: item.supplierPrice ?? null,
          notes: item.notes ?? null,
        })),
      },
    },
    include: {
      items: { include: { product: true, supplier: true } },
    },
  })

  await logActivity(session.user.id, "CREATE_SHOPPING_LIST", "ShoppingList", list.id, {
    date: data.date,
    itemCount: data.items.length,
  })

  revalidatePath("/lista-spesa")
  return serialize(list)
}

export async function generateShoppingListFromOrders(date: string) {
  const session = await requireAuth()

  // Usa la data come stringa locale (YYYY-MM-DD) per evitare problemi di timezone
  const [year, month, day] = date.split("-").map(Number)
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
  const targetDate = startOfDay

  // Trova tutti gli ordini confermati per la data di consegna richiesta
  const orders = await db.order.findMany({
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

  if (orders.length === 0) {
    return { error: "Nessun ordine confermato trovato per questa data" }
  }

  // Prepara items separati per cliente (non aggregati)
  const listItems = []

  for (const order of orders) {
    for (const item of order.items) {
      const defaultSupplier = item.product?.supplierProducts[0]?.supplierId ?? null
      const defaultPrice = item.product?.supplierProducts[0]?.price ?? null

      listItems.push({
        productId: item.productId,
        productName: item.productName || item.product?.name,
        customerId: order.customerId,
        isInMaxiList: false, // Default: nella card cliente
        totalQuantity: Number(item.quantity),
        availableStock: 0, // Stock calcolato dinamicamente o in fase di merge
        netQuantity: Number(item.quantity),
        unit: item.unit as any,
        supplierId: defaultSupplier,
        supplierPrice: defaultPrice ? Number(defaultPrice) : null,
        notes: item.notes,
      })
    }
  }

  // Verifica se esiste gia' una lista per questa data
  const existingList = await db.shoppingList.findUnique({
    where: { date: targetDate },
  })

  if (existingList) {
    // Aggiorna la lista esistente: elimina vecchi items e ricrea
    await db.shoppingListItem.deleteMany({
      where: { shoppingListId: existingList.id },
    })

    const list = await db.shoppingList.update({
      where: { id: existingList.id },
      data: {
        notes: `Generata automaticamente da ${orders.length} ordini`,
        items: { create: listItems },
      },
      include: {
        items: { include: { product: true, supplier: true, customer: true } },
      },
    })

    await logActivity(session.user.id, "REGENERATE_SHOPPING_LIST", "ShoppingList", list.id, {
      date,
      orderCount: orders.length,
      itemCount: listItems.length,
    })

    revalidatePath("/lista-spesa")
    return serialize(list)
  }

  // Crea nuova lista
  const list = await db.shoppingList.create({
    data: {
      date: targetDate,
      notes: `Generata automaticamente da ${orders.length} ordini`,
      items: { create: listItems },
    },
    include: {
      items: { include: { product: true, supplier: true, customer: true } },
    },
  })

  await logActivity(session.user.id, "GENERATE_SHOPPING_LIST", "ShoppingList", list.id, {
    date,
    orderCount: orders.length,
    itemCount: listItems.length,
  })

  revalidatePath("/lista-spesa")
  return serialize(list)
}

export async function toggleShoppingListItemMaxiList(itemId: string, isInMaxiList: boolean) {
  const session = await requireAuth()
  
  const item = await db.shoppingListItem.update({
    where: { id: itemId },
    data: { isInMaxiList },
    include: { customer: true, product: true }
  })

  revalidatePath("/lista-spesa")
  return serialize(item)
}

export async function bulkToggleMaxiList(itemIds: string[], isInMaxiList: boolean) {
  const session = await requireAuth()

  const result = await db.shoppingListItem.updateMany({
    where: { id: { in: itemIds } },
    data: { isInMaxiList }
  })

  revalidatePath("/lista-spesa")
  return serialize({ count: result.count })
}

export async function mergeShoppingListItems(targetItemId: string, sourceItemIds: string[]) {
  const session = await requireAuth()

  const targetItem = await db.shoppingListItem.findUnique({ where: { id: targetItemId } })
  if (!targetItem) throw new Error("Item target non trovato")

  const sourceItems = await db.shoppingListItem.findMany({ where: { id: { in: sourceItemIds } } })
  if (sourceItems.length === 0) throw new Error("Items sorgente non trovati")

  // Calcola somma quantità
  let totalQty = Number(targetItem.totalQuantity)
  let notes = targetItem.notes ? [targetItem.notes] : []

  for (const source of sourceItems) {
    totalQty += Number(source.totalQuantity)
    if (source.notes) notes.push(source.notes)
  }

  // Aggiorna target
  const updated = await db.shoppingListItem.update({
    where: { id: targetItemId },
    data: {
      totalQuantity: totalQty,
      netQuantity: totalQty, // Assumiamo net = total per ora
      notes: notes.join("; "),
      isInMaxiList: true, // Forziamo in maxi list
    }
  })

  // Elimina source
  await db.shoppingListItem.deleteMany({
    where: { id: { in: sourceItemIds } }
  })

  revalidatePath("/lista-spesa")
  return serialize(updated)
}

export async function updateShoppingListItem(itemId: string, data: { isOrdered?: boolean; totalQuantity?: number; supplierId?: string | null; supplierPrice?: number | null; notes?: string }) {
  const session = await requireAuth()

  const item = await db.shoppingListItem.update({
    where: { id: itemId },
    data: {
      ...(data.isOrdered !== undefined ? { isOrdered: data.isOrdered } : {}),
      ...(data.totalQuantity !== undefined ? { totalQuantity: data.totalQuantity } : {}),
      ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
      ...(data.supplierPrice !== undefined ? { supplierPrice: data.supplierPrice } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  })

  revalidatePath("/lista-spesa")
  return serialize(item)
}

export async function updateShoppingListStatus(id: string, status: string) {
  const session = await requireAuth()

  const validStatuses = ["DRAFT", "FINALIZED", "ORDERED", "RECEIVED"]
  if (!validStatuses.includes(status)) throw new Error("Stato non valido")

  const list = await db.shoppingList.update({
    where: { id },
    data: { status: status as any },
  })

  await logActivity(session.user.id, "UPDATE_SHOPPING_LIST_STATUS", "ShoppingList", list.id, {
    newStatus: status,
  })

  revalidatePath("/lista-spesa")
  return serialize(list)
}

export async function deleteShoppingList(id: string) {
  const session = await requireAuth()

  await db.shoppingListItem.deleteMany({ where: { shoppingListId: id } })
  await db.shoppingList.delete({ where: { id } })

  await logActivity(session.user.id, "DELETE_SHOPPING_LIST", "ShoppingList", id, {})

  revalidatePath("/lista-spesa")
}

export async function createPurchaseOrdersFromShoppingList(shoppingListId: string) {
  const session = await requireAuth()

  const list = await db.shoppingList.findUnique({
    where: { id: shoppingListId },
    include: {
      items: {
        include: { product: true, supplier: true },
      },
    },
  })

  if (!list) throw new Error("Lista della spesa non trovata")

  // Filtra items con fornitore assegnato
  const itemsWithSupplier = list.items.filter((item) => item.supplierId)
  if (itemsWithSupplier.length === 0) {
    throw new Error("Nessun articolo ha un fornitore assegnato. Assegna i fornitori prima di generare gli ordini.")
  }

  // Raggruppa per fornitore
  const bySupplier = new Map<string, typeof itemsWithSupplier>()
  for (const item of itemsWithSupplier) {
    const existing = bySupplier.get(item.supplierId!) || []
    existing.push(item)
    bySupplier.set(item.supplierId!, existing)
  }

  const createdPOs: string[] = []

  const listDateObj = list.date instanceof Date ? list.date : new Date(list.date)
  const listDateStr = listDateObj.toLocaleDateString("it-IT")

  for (const [supplierId, items] of bySupplier) {
    const poNumber = await getNextNumber("PURCHASE_ORDER")

    let subtotal = 0
    const itemsData = items
      .filter((item) => Number(item.netQuantity) > 0) // Escludi prodotti coperti da magazzino
      .map((item) => {
        const unitPrice = item.supplierPrice ? Number(item.supplierPrice) : 0
        const qty = Number(item.netQuantity) > 0 ? Number(item.netQuantity) : Number(item.totalQuantity)
        const lineTotal = qty * unitPrice
        subtotal += lineTotal
        return {
          productId: item.productId,
          productName: item.productName || item.product?.name,
          quantity: qty,
          unit: item.unit,
          unitPrice,
          lineTotal,
        }
      })

    // Se tutti i prodotti di questo fornitore sono coperti da magazzino, salta
    if (itemsData.length === 0) continue

    const vatAmount = subtotal * 0.04
    const total = subtotal + vatAmount

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        expectedDate: listDateObj,
        notes: `Generato da lista spesa del ${listDateStr}`,
        subtotal,
        vatAmount,
        total,
        items: { create: itemsData },
      },
    })

    createdPOs.push(po.poNumber)

    // Segna items come ordinati
    await db.$transaction(
      items.map((item) =>
        db.shoppingListItem.update({
          where: { id: item.id },
          data: { isOrdered: true },
        })
      )
    )
  }

  // Aggiorna status lista a ORDERED
  await db.shoppingList.update({
    where: { id: shoppingListId },
    data: { status: "ORDERED" },
  })

  await logActivity(session.user.id, "CREATE_PO_FROM_SHOPPING_LIST", "ShoppingList", shoppingListId, {
    poCount: createdPOs.length,
    poNumbers: createdPOs,
  })

  const itemsWithoutSupplier = list.items.filter((item) => !item.supplierId)

  revalidatePath("/lista-spesa")
  revalidatePath("/acquisti")
  revalidatePath("/dashboard")

  return {
    createdCount: createdPOs.length,
    poNumbers: createdPOs,
    skippedCount: itemsWithoutSupplier.length,
  }
}

// ============================================================
// PURCHASE ORDERS (Ordini Fornitore)
// ============================================================

export async function getPurchaseOrders(
  params: PaginationParams & { status?: string; supplierId?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "orderDate",
    sortOrder = "desc",
    status,
    supplierId,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.PurchaseOrderWhereInput = {
    ...(search
      ? {
          OR: [
            { poNumber: { contains: search, mode: "insensitive" } },
            { supplier: { companyName: { contains: search, mode: "insensitive" } } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(dateFrom || dateTo
      ? {
          orderDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { purchaseOrder: false } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.purchaseOrder.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getPurchaseOrder(id: string) {
  const session = await requireAuth()

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      supplierInvoice: true,
      items: {
        include: {
          purchaseOrder: false,
        },
      },
    },
  })

  if (!po) throw new Error("Ordine fornitore non trovato")

  // Load product info for each item
  const productIds = po.items
    .map((i) => i.productId)
    .filter((id): id is string => id !== null)

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  })
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const itemsWithProducts = po.items.map((item) => ({
    ...item,
    product: item.productId ? (productMap[item.productId] || null) : null,
  }))

  return serialize({ ...po, items: itemsWithProducts })
}

export async function createPurchaseOrder(data: unknown) {
  const session = await requireAuth()
  const parsed = purchaseOrderSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const poNumber = await getNextNumber("PURCHASE_ORDER")

  let subtotal = 0
  const itemsData = parsed.data.items.map((item) => {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice)
    subtotal += lineTotal
    return {
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lineTotal,
    }
  })

  const vatAmount = subtotal * 0.04
  const total = subtotal + vatAmount

  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: parsed.data.supplierId,
      expectedDate: parsed.data.expectedDate ?? null,
      notes: parsed.data.notes ?? null,
      subtotal,
      vatAmount,
      total,
      items: { create: itemsData },
    },
    include: {
      supplier: true,
      items: true,
    },
  })

  await logActivity(session.user.id, "CREATE_PURCHASE_ORDER", "PurchaseOrder", po.id, {
    poNumber: po.poNumber,
    supplier: po.supplier.companyName,
    total: Number(po.total),
  })

  revalidatePath("/acquisti")
  revalidatePath("/dashboard")
  return serialize(po)
}

export async function updatePurchaseOrder(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = purchaseOrderSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const existing = await db.purchaseOrder.findUnique({
    where: { id },
    include: { supplierInvoice: true },
  })
  if (!existing) throw new Error("Ordine fornitore non trovato")
  if (existing.status === "CANCELLED") {
    throw new Error("Non e' possibile modificare un ordine annullato")
  }

  let subtotal = 0
  const itemsData = parsed.data.items.map((item) => {
    const lineTotal = Number(item.quantity) * Number(item.unitPrice)
    subtotal += lineTotal
    return {
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lineTotal,
    }
  })

  const vatAmount = subtotal * 0.04
  const total = subtotal + vatAmount

  const po = await db.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })

    return tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: parsed.data.supplierId,
        expectedDate: parsed.data.expectedDate ?? null,
        notes: parsed.data.notes ?? null,
        subtotal,
        vatAmount,
        total,
        items: { create: itemsData },
      },
      include: {
        supplier: true,
        items: true,
      },
    })
  })

  // Se PO era RECEIVED, aggiorna CARICO e fattura collegata
  if (existing.status === "RECEIVED") {
    // Rimuovi vecchi CARICO e ricrea con nuovi items
    await db.stockMovement.deleteMany({
      where: { referenceType: "PURCHASE_ORDER", referenceId: id },
    })
    await db.$transaction(
      itemsData.map((item) =>
        db.stockMovement.create({
          data: {
            productId: item.productId,
            type: "CARICO",
            quantity: item.quantity,
            unit: item.unit,
            reason: `Carico da ${po.poNumber} (aggiornato)`,
            referenceType: "PURCHASE_ORDER",
            referenceId: po.id,
            createdById: session.user.id,
          },
        })
      )
    )

    // Aggiorna fattura fornitore collegata
    if (existing.supplierInvoice) {
      await db.supplierInvoice.update({
        where: { id: existing.supplierInvoice.id },
        data: { subtotal, vatAmount, total },
      })
    }

    revalidatePath("/magazzino")
    revalidatePath("/acquisti/fatture")
  }

  await logActivity(session.user.id, "UPDATE_PURCHASE_ORDER", "PurchaseOrder", po.id, {
    poNumber: po.poNumber,
    total: Number(po.total),
  })

  revalidatePath("/acquisti")
  revalidatePath(`/acquisti/${id}`)
  revalidatePath("/dashboard")
  return serialize(po)
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const session = await requireAuth()

  const validStatuses = ["DRAFT", "SENT", "RECEIVED", "CANCELLED"]
  if (!validStatuses.includes(status)) throw new Error("Stato non valido")

  const po = await db.purchaseOrder.update({
    where: { id },
    data: { status: status as any },
    include: { supplier: true, items: { include: { product: true } } },
  })

  // Quando merce ricevuta: CARICO magazzino + auto fattura fornitore
  if (status === "RECEIVED" && po.items.length > 0) {
    // 1. CARICO automatico magazzino
    const itemsWithProduct = po.items.filter((item) => item.productId !== null)
    
    if (itemsWithProduct.length > 0) {
      await db.$transaction(
        itemsWithProduct.map((item) =>
          db.stockMovement.create({
            data: {
              productId: item.productId!,
              type: "CARICO",
              quantity: item.quantity,
              unit: item.unit,
              reason: `Carico da ${po.poNumber}`,
              referenceType: "PURCHASE_ORDER",
              referenceId: po.id,
              createdById: session.user.id,
            },
          })
        )
      )
    }

    // 2. Auto-crea fattura fornitore collegata con items
    const invoiceNumber = await getNextNumber("SUPPLIER_INVOICE")
    const issueDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoiceItems = po.items.map((item, index) => ({
      productId: item.productId,
      description: item.productName || item.product?.name || "Articolo",
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: 4,
      lineTotal: item.lineTotal,
      sortOrder: index,
    }))

    await db.supplierInvoice.create({
      data: {
        supplierInvoiceNumber: invoiceNumber,
        supplierId: po.supplierId,
        purchaseOrderId: po.id,
        issueDate,
        dueDate,
        subtotal: po.subtotal,
        vatAmount: po.vatAmount,
        total: po.total,
        notes: `Generata automaticamente da ${po.poNumber}`,
        items: { create: invoiceItems },
      },
    })

    revalidatePath("/magazzino")
    revalidatePath("/acquisti/fatture")
  }

  await logActivity(session.user.id, "UPDATE_PURCHASE_ORDER_STATUS", "PurchaseOrder", po.id, {
    poNumber: po.poNumber,
    newStatus: status,
  })

  revalidatePath("/acquisti")
  revalidatePath(`/acquisti/${id}`)
  revalidatePath("/dashboard")
  return serialize(po)
}

export async function deletePurchaseOrder(id: string) {
  const session = await requireAuth()

  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: { supplierInvoice: { include: { payments: true } } },
  })
  if (!po) throw new Error("Ordine fornitore non trovato")

  // Se RECEIVED: undo CARICO + elimina fattura collegata
  if (po.status === "RECEIVED") {
    // Verifica che la fattura non abbia pagamenti
    if (po.supplierInvoice?.payments && po.supplierInvoice.payments.length > 0) {
      throw new Error("Non e' possibile eliminare: la fattura collegata ha pagamenti registrati")
    }

    // Elimina movimenti CARICO collegati
    await db.stockMovement.deleteMany({
      where: { referenceType: "PURCHASE_ORDER", referenceId: id },
    })

    // Elimina fattura fornitore collegata
    if (po.supplierInvoice) {
      await db.supplierInvoice.delete({ where: { id: po.supplierInvoice.id } })
    }
  }

  // Elimina items e PO
  await db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
  await db.purchaseOrder.delete({ where: { id } })

  await logActivity(session.user.id, "DELETE_PURCHASE_ORDER", "PurchaseOrder", id, {
    poNumber: po.poNumber,
    hadCaricoUndo: po.status === "RECEIVED",
  })

  revalidatePath("/acquisti")
  revalidatePath("/acquisti/fatture")
  revalidatePath("/magazzino")
  revalidatePath("/dashboard")
}

// ============================================================
// SUPPLIER INVOICES (Fatture Fornitore)
// ============================================================

export async function getSupplierInvoices(
  params: PaginationParams & { supplierId?: string; isPaid?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "issueDate",
    sortOrder = "desc",
    supplierId,
    isPaid,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.SupplierInvoiceWhereInput = {
    ...(search
      ? {
          OR: [
            { supplierInvoiceNumber: { contains: search, mode: "insensitive" } },
            { supplier: { companyName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(isPaid !== undefined && isPaid !== "" ? { isPaid: isPaid === "true" } : {}),
    ...(dateFrom || dateTo
      ? {
          issueDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.supplierInvoice.findMany({
      where,
      include: {
        supplier: true,
        payments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.supplierInvoice.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getSupplierInvoice(id: string) {
  const session = await requireAuth()

  const invoice = await db.supplierInvoice.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
      payments: { orderBy: { paymentDate: "desc" } },
      purchaseOrder: true,
    },
  })

  if (!invoice) throw new Error("Fattura fornitore non trovata")
  return serialize(invoice)
}

export async function createSupplierInvoice(data: unknown) {
  const session = await requireAuth()
  const parsed = supplierInvoiceSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const invoice = await db.supplierInvoice.create({
    data: {
      supplierInvoiceNumber: parsed.data.supplierInvoiceNumber,
      supplierId: parsed.data.supplierId,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      subtotal: parsed.data.subtotal,
      vatAmount: parsed.data.vatAmount,
      total: parsed.data.total,
      notes: parsed.data.notes ?? null,
    },
    include: { supplier: true },
  })

  await logActivity(session.user.id, "CREATE_SUPPLIER_INVOICE", "SupplierInvoice", invoice.id, {
    invoiceNumber: invoice.supplierInvoiceNumber,
    supplier: invoice.supplier.companyName,
    total: Number(invoice.total),
  })

  revalidatePath("/acquisti/fatture")
  revalidatePath("/dashboard")
  return serialize(invoice)
}

export async function updateSupplierInvoice(id: string, data: unknown) {
  const session = await requireAuth()
  const parsed = supplierInvoiceSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const existing = await db.supplierInvoice.findUnique({ where: { id } })
  if (!existing) throw new Error("Fattura fornitore non trovata")
  if (existing.isPaid) throw new Error("Non e' possibile modificare una fattura gia' pagata")

  const invoice = await db.supplierInvoice.update({
    where: { id },
    data: {
      supplierInvoiceNumber: parsed.data.supplierInvoiceNumber,
      supplierId: parsed.data.supplierId,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      subtotal: parsed.data.subtotal,
      vatAmount: parsed.data.vatAmount,
      total: parsed.data.total,
      notes: parsed.data.notes ?? null,
    },
    include: { supplier: true },
  })

  await logActivity(session.user.id, "UPDATE_SUPPLIER_INVOICE", "SupplierInvoice", invoice.id, {
    invoiceNumber: invoice.supplierInvoiceNumber,
    total: Number(invoice.total),
  })

  revalidatePath("/acquisti/fatture")
  revalidatePath(`/acquisti/fatture/${id}`)
  revalidatePath("/dashboard")
  return serialize(invoice)
}

export async function deleteSupplierInvoice(id: string) {
  const session = await requireAuth()

  const invoice = await db.supplierInvoice.findUnique({
    where: { id },
    include: { payments: true },
  })

  if (!invoice) throw new Error("Fattura fornitore non trovata")
  if (invoice.isPaid) throw new Error("Non e' possibile eliminare una fattura gia' pagata")
  if (invoice.payments.length > 0) throw new Error("Non e' possibile eliminare una fattura con pagamenti collegati")

  await db.supplierInvoice.delete({ where: { id } })

  await logActivity(session.user.id, "DELETE_SUPPLIER_INVOICE", "SupplierInvoice", id, {
    invoiceNumber: invoice.supplierInvoiceNumber,
  })

  revalidatePath("/acquisti/fatture")
  revalidatePath("/dashboard")
}

// ============================================================
// MAGAZZINO (Stock Movements)
// ============================================================

export async function getStockSummary(params: PaginationParams = {}) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 50,
    search = "",
  } = params

  // Get all products with aggregated stock
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { category: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {}

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        stockMovements: {
          select: { type: true, quantity: true },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ])

  // Calculate current stock for each product
  const data = products.map((product) => {
    let stock = 0
    for (const m of product.stockMovements) {
      const qty = Number(m.quantity)
      if (m.type === "CARICO" || m.type === "RETTIFICA_POS") {
        stock += qty
      } else {
        stock -= qty
      }
    }

    return {
      id: product.id,
      name: product.name,
      unit: product.unit,
      category: product.category?.name || "",
      currentStock: stock,
      costPrice: Number(product.costPrice ?? 0),
      defaultPrice: Number(product.defaultPrice),
      isAvailable: product.isAvailable,
    }
  })

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getStockMovements(
  params: PaginationParams & { productId?: string; type?: string; dateFrom?: string; dateTo?: string } = {}
) {
  const session = await requireAuth()

  const {
    page = 1,
    pageSize = 30,
    productId,
    type,
    dateFrom,
    dateTo,
  } = params

  const where: Prisma.StockMovementWhereInput = {
    ...(productId ? { productId } : {}),
    ...(type ? { type: type as any } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      include: {
        product: { include: { category: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.stockMovement.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function createStockMovement(data: {
  productId: string
  type: string
  quantity: number
  unit: string
  reason?: string | null
  referenceType?: string | null
  referenceId?: string | null
}) {
  const session = await requireAuth()

  const validTypes = ["CARICO", "SCARICO", "RETTIFICA_POS", "RETTIFICA_NEG", "SCARTO"]
  if (!validTypes.includes(data.type)) throw new Error("Tipo movimento non valido")
  if (!data.productId) throw new Error("Seleziona un prodotto")
  if (!data.quantity || data.quantity <= 0) throw new Error("La quantita' deve essere maggiore di 0")

  const movement = await db.stockMovement.create({
    data: {
      productId: data.productId,
      type: data.type as any,
      quantity: data.quantity,
      unit: data.unit as any,
      reason: data.reason ?? null,
      referenceType: data.referenceType ?? "MANUAL",
      referenceId: data.referenceId ?? null,
      createdById: session.user.id,
    },
    include: {
      product: true,
    },
  })

  await logActivity(session.user.id, "CREATE_STOCK_MOVEMENT", "StockMovement", movement.id, {
    product: movement.product.name,
    type: movement.type,
    quantity: Number(movement.quantity),
  })

  revalidatePath("/magazzino")
  return serialize(movement)
}

/**
 * Scheda completa prodotto magazzino: giacenza, fornitori, acquisti, movimenti recenti
 */
export async function getProductWarehouseDetail(productId: string) {
  const session = await requireAuth()

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      supplierProducts: {
        include: { supplier: { select: { id: true, companyName: true, phone: true, email: true } } },
        orderBy: { isPreferred: "desc" },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          createdBy: { select: { name: true } },
        },
      },
      purchaseOrderItems: {
        orderBy: { purchaseOrder: { orderDate: "desc" } },
        take: 15,
        include: {
          purchaseOrder: {
            include: {
              supplier: { select: { id: true, companyName: true } },
            },
          },
        },
      },
    },
  })

  if (!product) throw new Error("Prodotto non trovato")

  // Calcola giacenza
  let currentStock = 0
  let totalIn = 0
  let totalOut = 0
  const allMovements = await db.stockMovement.findMany({
    where: { productId },
    select: { type: true, quantity: true },
  })
  for (const m of allMovements) {
    const qty = Number(m.quantity)
    if (m.type === "CARICO" || m.type === "RETTIFICA_POS") {
      currentStock += qty
      totalIn += qty
    } else {
      currentStock -= qty
      totalOut += qty
    }
  }

  // Statistiche acquisti
  const purchaseStats = product.purchaseOrderItems.reduce(
    (acc, item) => {
      acc.totalQuantity += Number(item.quantity)
      acc.totalSpent += Number(item.lineTotal)
      const price = Number(item.unitPrice)
      if (price < acc.minPrice) acc.minPrice = price
      if (price > acc.maxPrice) acc.maxPrice = price
      acc.prices.push(price)
      return acc
    },
    { totalQuantity: 0, totalSpent: 0, minPrice: Infinity, maxPrice: 0, prices: [] as number[] }
  )

  const avgPrice = purchaseStats.prices.length > 0
    ? purchaseStats.prices.reduce((a, b) => a + b, 0) / purchaseStats.prices.length
    : 0

  return serialize({
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      category: product.category?.name || "",
      costPrice: Number(product.costPrice ?? 0),
      defaultPrice: Number(product.defaultPrice),
      vatRate: Number(product.vatRate),
      isAvailable: product.isAvailable,
      image: product.image,
    },
    stock: {
      current: currentStock,
      totalIn,
      totalOut,
      value: currentStock * Number(product.costPrice ?? 0),
    },
    suppliers: product.supplierProducts.map((sp) => ({
      id: sp.supplier.id,
      companyName: sp.supplier.companyName,
      phone: sp.supplier.phone,
      email: sp.supplier.email,
      price: Number(sp.price),
      isPreferred: sp.isPreferred,
      leadTimeDays: sp.leadTimeDays,
      minOrderQty: sp.minOrderQty ? Number(sp.minOrderQty) : null,
    })),
    purchases: product.purchaseOrderItems.map((poi) => ({
      id: poi.purchaseOrder.id,
      poNumber: poi.purchaseOrder.poNumber,
      supplier: poi.purchaseOrder.supplier.companyName,
      supplierId: poi.purchaseOrder.supplier.id,
      orderDate: poi.purchaseOrder.orderDate,
      status: poi.purchaseOrder.status,
      quantity: Number(poi.quantity),
      unitPrice: Number(poi.unitPrice),
      lineTotal: Number(poi.lineTotal),
      unit: poi.unit,
    })),
    purchaseStats: {
      totalQuantity: purchaseStats.totalQuantity,
      totalSpent: purchaseStats.totalSpent,
      avgPrice,
      minPrice: purchaseStats.minPrice === Infinity ? 0 : purchaseStats.minPrice,
      maxPrice: purchaseStats.maxPrice,
      orderCount: product.purchaseOrderItems.length,
    },
    recentMovements: product.stockMovements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: Number(m.quantity),
      unit: m.unit,
      reason: m.reason,
      referenceType: m.referenceType,
      createdAt: m.createdAt,
      createdBy: m.createdBy?.name || null,
    })),
  })
}

export async function bulkCreateStockMovements(items: Array<{
  productId: string
  type: string
  quantity: number
  unit: string
  reason?: string | null
  referenceType?: string | null
  referenceId?: string | null
}>) {
  const session = await requireAuth()

  const movements = await db.$transaction(
    items.map((item) =>
      db.stockMovement.create({
        data: {
          productId: item.productId,
          type: item.type as any,
          quantity: item.quantity,
          unit: item.unit as any,
          reason: item.reason ?? null,
          referenceType: item.referenceType ?? "MANUAL",
          referenceId: item.referenceId ?? null,
          createdById: session.user.id,
        },
      })
    )
  )

  await logActivity(session.user.id, "BULK_STOCK_MOVEMENT", "StockMovement", undefined, {
    count: movements.length,
    type: items[0]?.type,
  })

  revalidatePath("/magazzino")
  return serialize(movements)
}

// ============================================================
// REPORT ACQUISTI / MARGINI
// ============================================================

export async function getMarginReport() {
  const session = await requireAuth()

  // Get all products with sales (invoice items) and purchase costs
  const products = await db.product.findMany({
    include: {
      category: true,
      invoiceItems: {
        select: { quantity: true, unitPrice: true, lineTotal: true },
      },
      orderItems: {
        select: { quantity: true, unitPrice: true, lineTotal: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // Get purchase order items for cost data
  const poItems = await db.purchaseOrderItem.findMany({
    where: {
      purchaseOrder: { status: "RECEIVED" },
    },
    select: { productId: true, quantity: true, unitPrice: true, lineTotal: true },
  })

  // Build purchase cost map
  const purchaseCostMap: Record<string, { totalCost: number; totalQty: number }> = {}
  for (const item of poItems) {
    if (!item.productId) continue
    if (!purchaseCostMap[item.productId]) {
      purchaseCostMap[item.productId] = { totalCost: 0, totalQty: 0 }
    }
    purchaseCostMap[item.productId].totalCost += Number(item.lineTotal)
    purchaseCostMap[item.productId].totalQty += Number(item.quantity)
  }

  // Build product margin data
  const productMargins = products
    .map((product) => {
      const totalRevenue = product.invoiceItems.reduce((sum, i) => sum + Number(i.lineTotal), 0)
      const totalSoldQty = product.invoiceItems.reduce((sum, i) => sum + Number(i.quantity), 0)
      const avgSellPrice = totalSoldQty > 0 ? totalRevenue / totalSoldQty : Number(product.defaultPrice)

      const purchaseData = purchaseCostMap[product.id]
      const avgCostPrice = purchaseData && purchaseData.totalQty > 0
        ? purchaseData.totalCost / purchaseData.totalQty
        : Number(product.costPrice ?? 0)

      const totalCost = totalSoldQty * avgCostPrice
      const profit = totalRevenue - totalCost
      const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        category: product.category?.name || "",
        unit: product.unit,
        avgSellPrice,
        avgCostPrice,
        totalSoldQty,
        totalRevenue,
        totalCost,
        profit,
        marginPercent,
      }
    })
    .filter((p) => p.totalSoldQty > 0 || p.avgCostPrice > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Get supplier invoice totals
  const supplierInvoiceTotal = await db.supplierInvoice.aggregate({
    _sum: { total: true },
  })

  // Get customer invoice totals
  const customerInvoiceTotal = await db.invoice.aggregate({
    _sum: { total: true },
    where: { status: { not: "CANCELLED" } },
  })

  const totalPurchases = Number(supplierInvoiceTotal._sum.total ?? 0)
  const totalSales = Number(customerInvoiceTotal._sum.total ?? 0)
  const overallProfit = totalSales - totalPurchases
  const overallMargin = totalSales > 0 ? (overallProfit / totalSales) * 100 : 0

  return serialize({
    productMargins,
    summary: {
      totalSales,
      totalPurchases,
      overallProfit,
      overallMargin,
      productCount: productMargins.length,
    },
  })
}

// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardKPIs() {
  const session = await requireAuth()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [
    ordiniOggi,
    fattureMese,
    fattureMesePrec,
    fattureDaIncassare,
    fornitoreDaPagare,
    ordiniInAttesa,
    ddtDaEmettere,
    fattureScadute,
  ] = await Promise.all([
    // Ordini di oggi
    db.order.count({
      where: {
        orderDate: { gte: startOfDay, lte: endOfDay },
        status: { not: "CANCELLED" },
      },
    }),

    // Fatturato del mese corrente
    db.invoice.aggregate({
      _sum: { total: true },
      where: {
        issueDate: { gte: startOfMonth },
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
    }),

    // Fatturato del mese precedente
    db.invoice.aggregate({
      _sum: { total: true },
      where: {
        issueDate: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
    }),

    // Fatture da incassare (emesse ma non pagate)
    db.invoice.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ["ISSUED", "SENT", "OVERDUE"] },
      },
    }),

    // Fatture fornitori da pagare
    db.supplierInvoice.aggregate({
      _sum: { total: true },
      where: { isPaid: false },
    }),

    // Ordini in attesa (ricevuti + confermati)
    db.order.count({
      where: {
        status: { in: ["RECEIVED", "CONFIRMED"] },
      },
    }),

    // Ordini consegnati senza DDT
    db.order.count({
      where: {
        status: { in: ["CONFIRMED", "IN_PREPARATION"] },
        deliveryNote: null,
      },
    }),

    // Fatture scadute
    db.invoice.count({
      where: {
        status: "OVERDUE",
      },
    }),
  ])

  // Calcola anche le fatture che dovrebbero essere scadute ma ancora in stato ISSUED/SENT
  const overdueInvoices = await db.invoice.updateMany({
    where: {
      status: { in: ["ISSUED", "SENT"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  })

  const result = {
    ordiniOggi,
    fatturatoMese: Number(fattureMese._sum.total ?? 0),
    fatturatoMesePrec: Number(fattureMesePrec._sum.total ?? 0),
    fattureDaIncassare: Number(fattureDaIncassare._sum.total ?? 0),
    daPagare: Number(fornitoreDaPagare._sum.total ?? 0),
    ordiniInAttesa,
    ddtDaEmettere,
    fattureScadute: fattureScadute + overdueInvoices.count,
  }

  return serialize(result)
}

export async function getSalesChart(days: number = 30) {
  const session = await requireAuth()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const invoices = await db.invoice.findMany({
    where: {
      issueDate: { gte: startDate },
      status: { notIn: ["CANCELLED", "DRAFT"] },
    },
    select: {
      issueDate: true,
      total: true,
    },
    orderBy: { issueDate: "asc" },
  })

  const orders = await db.order.findMany({
    where: {
      orderDate: { gte: startDate },
      status: { not: "CANCELLED" },
    },
    select: {
      orderDate: true,
    },
    orderBy: { orderDate: "asc" },
  })

  // Raggruppa per giorno
  const chartMap = new Map<string, { revenue: number; orders: number }>()

  // Inizializza tutti i giorni
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split("T")[0]
    chartMap.set(key, { revenue: 0, orders: 0 })
  }

  for (const inv of invoices) {
    const key = inv.issueDate.toISOString().split("T")[0]
    const entry = chartMap.get(key)
    if (entry) {
      entry.revenue += Number(inv.total)
    }
  }

  for (const ord of orders) {
    const key = ord.orderDate.toISOString().split("T")[0]
    const entry = chartMap.get(key)
    if (entry) {
      entry.orders += 1
    }
  }

  return Array.from(chartMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}  // getSalesChart already returns plain numbers

export async function getTopProducts(limit: number = 10) {
  const session = await requireAuth()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const items = await db.orderItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      lineTotal: true,
    },
    where: {
      order: {
        orderDate: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    },
    orderBy: {
      _sum: { lineTotal: "desc" },
    },
    take: limit,
  })

  // Recupera i dettagli dei prodotti
  const productIds = items
    .map((i) => i.productId)
    .filter((id): id is string => id !== null)

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: true },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  return items.map((item) => {
    if (!item.productId) {
      return {
        productId: "custom",
        productName: "Prodotti Personalizzati",
        totalQuantity: Number(item._sum.quantity ?? 0),
        totalRevenue: Number(item._sum.lineTotal ?? 0),
        unit: "PZ",
      }
    }
    const product = productMap.get(item.productId)
    return {
      productId: item.productId,
      productName: product?.name ?? "Sconosciuto",
      totalQuantity: Number(item._sum.quantity ?? 0),
      totalRevenue: Number(item._sum.lineTotal ?? 0),
      unit: product?.unit ?? "KG",
    }
  })
}

export async function getTopCustomers(limit: number = 10) {
  const session = await requireAuth()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const ordersByCustomer = await db.order.groupBy({
    by: ["customerId"],
    _count: { id: true },
    _sum: { total: true },
    where: {
      orderDate: { gte: startOfMonth },
      status: { not: "CANCELLED" },
    },
    orderBy: {
      _sum: { total: "desc" },
    },
    take: limit,
  })

  const customerIds = ordersByCustomer.map((o) => o.customerId)
  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, companyName: true },
  })

  const customerMap = new Map(customers.map((c) => [c.id, c]))

  return ordersByCustomer.map((entry) => {
    const customer = customerMap.get(entry.customerId)
    return {
      customerId: entry.customerId,
      customerName: customer?.companyName ?? "Sconosciuto",
      totalOrders: entry._count.id,
      totalRevenue: Number(entry._sum.total ?? 0),
    }
  })
}

export async function getRecentActivity(limit: number = 20) {
  const session = await requireAuth()

  const logs = await db.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })
  return serialize(logs)
}

// ============================================================
// ADMIN
// ============================================================

export async function getUsers(params: PaginationParams & { role?: string; isActive?: boolean } = {}) {
  const session = await requireAdmin()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    role,
    isActive,
  } = params

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role ? { role: role as any } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        _count: { select: { orders: true, activityLogs: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function updateUserRole(id: string, role: string) {
  const session = await requireAdmin()

  const validRoles = ["ADMIN", "OPERATOR", "VIEWER"]
  if (!validRoles.includes(role)) throw new Error("Ruolo non valido")

  // Non permettere all'admin di rimuovere il proprio ruolo admin
  if (id === session.user.id && role !== "ADMIN") {
    throw new Error("Non puoi rimuovere il tuo ruolo di amministratore")
  }

  const user = await db.user.update({
    where: { id },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  })

  await logActivity(session.user.id, "UPDATE_USER_ROLE", "User", user.id, {
    email: user.email,
    newRole: role,
  })

  revalidatePath("/admin/utenti")
  return serialize(user)
}

export async function toggleUserActive(id: string) {
  const session = await requireAdmin()

  // Non permettere all'admin di disattivarsi
  if (id === session.user.id) {
    throw new Error("Non puoi disattivare il tuo account")
  }

  const user = await db.user.findUnique({ where: { id } })
  if (!user) throw new Error("Utente non trovato")

  const updated = await db.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, isActive: true },
  })

  await logActivity(session.user.id, updated.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER", "User", updated.id, {
    email: updated.email,
  })

  revalidatePath("/admin/utenti")
  return serialize(updated)
}

export async function getActivityLogs(
  params: PaginationParams & { userId?: string; action?: string; entity?: string } = {}
) {
  const session = await requireAdmin()

  const {
    page = 1,
    pageSize = 50,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    userId,
    action,
    entity,
  } = params

  const where: Prisma.ActivityLogWhereInput = {
    ...(search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" } },
            { entity: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
  }

  const [data, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getAppSettings() {
  const session = await requireAdmin()

  const settings = await db.appSettings.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  })
  return serialize(settings)
}

export async function updateAppSetting(key: string, value: unknown) {
  const session = await requireAdmin()

  const setting = await db.appSettings.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any, category: "general" },
  })

  await logActivity(session.user.id, "UPDATE_APP_SETTING", "AppSettings", setting.id, {
    key,
    value,
  })

  revalidatePath("/admin/impostazioni")
  return serialize(setting)
}

// ============================================================
// SETTINGS
// ============================================================

export async function getCompanyInfo() {
  const session = await requireAuth()

  const info = await db.companyInfo.findFirst()
  return serialize(info)
}

export async function updateCompanyInfo(data: unknown) {
  const session = await requireAuth()
  const parsed = companyInfoSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  // Upsert: aggiorna se esiste, altrimenti crea
  const existing = await db.companyInfo.findFirst()

  let info
  if (existing) {
    info = await db.companyInfo.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        pecEmail: parsed.data.pecEmail || null,
      },
    })
  } else {
    info = await db.companyInfo.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        pecEmail: parsed.data.pecEmail || null,
      },
    })
  }

  await logActivity(session.user.id, "UPDATE_COMPANY_INFO", "CompanyInfo", info.id, {
    companyName: info.companyName,
  })

  revalidatePath("/impostazioni")
  revalidatePath("/ddt")
  revalidatePath("/fatture")
  return serialize(info)
}

export async function getUserPreferences() {
  const session = await requireAuth()

  let prefs = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
  })

  if (!prefs) {
    prefs = await db.userPreferences.create({
      data: { userId: session.user.id },
    })
  }

  return serialize(prefs)
}

export async function updateUserPreferences(data: {
  theme?: string
  language?: string
  notifications?: boolean
}) {
  const session = await requireAuth()

  const prefs = await db.userPreferences.upsert({
    where: { userId: session.user.id },
    update: {
      ...(data.theme ? { theme: data.theme as any } : {}),
      ...(data.language ? { language: data.language } : {}),
      ...(data.notifications !== undefined ? { notifications: data.notifications } : {}),
    },
    create: {
      userId: session.user.id,
      theme: (data.theme as any) ?? "SYSTEM",
      language: data.language ?? "it",
      notifications: data.notifications ?? true,
    },
  })

  revalidatePath("/impostazioni")
  return serialize(prefs)
}

// ============================================================
// PORTALE CLIENTI
// ============================================================

async function requireCustomer() {
  const session = await requireAuth()
  if (session.user.role !== "CUSTOMER" || !session.user.customerId) {
    throw new Error("Accesso riservato ai clienti")
  }
  return { session, customerId: session.user.customerId }
}

export async function getPortalDashboard() {
  const { customerId } = await requireCustomer()

  const now = new Date()

  const [recentOrders, unpaidInvoices, totalDue, featuredProducts, nextDelivery] = await Promise.all([
    // Ultimi 5 ordini
    db.order.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      orderBy: { orderDate: "desc" },
      take: 5,
    }),

    // Fatture non pagate
    db.invoice.findMany({
      where: { customerId, status: { in: ["ISSUED", "SENT", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),

    // Totale da pagare
    db.invoice.aggregate({
      where: { customerId, status: { in: ["ISSUED", "SENT", "OVERDUE"] } },
      _sum: { total: true, paidAmount: true },
    }),

    // Prodotti in evidenza
    db.product.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gte: now } },
        ],
      },
      include: {
        category: true,
        customerPrices: { where: { customerId }, take: 1 },
      },
      take: 8,
    }),

    // Prossima consegna prevista
    db.order.findFirst({
      where: {
        customerId,
        status: { in: ["CONFIRMED", "IN_PREPARATION"] },
        requestedDeliveryDate: { gte: now },
      },
      orderBy: { requestedDeliveryDate: "asc" },
    }),
  ])

  const totalOwed = Number(totalDue._sum.total ?? 0) - Number(totalDue._sum.paidAmount ?? 0)

  // Conteggi per le card
  const activeOrdersCount = await db.order.count({
    where: { customerId, status: { in: ["RECEIVED", "CONFIRMED", "IN_PREPARATION"] } },
  })

  return serialize({
    recentOrders,
    unpaidInvoices,
    totalOwed,
    activeOrdersCount,
    featuredProducts: featuredProducts.map((p) => ({
      ...p,
      customerPrice: p.customerPrices[0]?.price ?? p.defaultPrice,
    })),
    nextDelivery,
  })
}

export async function getPortalProducts(
  params: PaginationParams & { categoryId?: string } = {}
) {
  const { customerId } = await requireCustomer()

  const {
    page = 1,
    pageSize = 50,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
    categoryId,
  } = params

  const where: Prisma.ProductWhereInput = {
    isAvailable: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
  }

  const [data, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        customerPrices: { where: { customerId }, take: 1 },
      },
      orderBy: [
        { isFeatured: "desc" },
        { [sortBy]: sortOrder },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
    db.productCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ])

  const now = new Date()
  const products = data.map((p) => ({
    ...p,
    customerPrice: p.customerPrices[0]?.price ?? p.defaultPrice,
    isFeaturedActive: p.isFeatured && (!p.featuredUntil || p.featuredUntil >= now),
  }))

  return serialize({
    data: products,
    categories,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getPortalProductsByIds(ids: string[]) {
  const { customerId } = await requireCustomer()

  const [products, customerPrices] = await Promise.all([
    db.product.findMany({ where: { id: { in: ids }, isAvailable: true } }),
    db.customerProductPrice.findMany({
      where: { customerId, productId: { in: ids } },
    }),
  ])

  const priceMap = new Map(customerPrices.map((cp) => [cp.productId, Number(cp.price)]))

  return serialize(products.map((p) => ({
    ...p,
    customerPrice: priceMap.get(p.id) ?? Number(p.defaultPrice),
  })))
}

export async function createPortalOrder(data: {
  items: Array<{ productId?: string; productName?: string; quantity: number; unit: string }>
  requestedDeliveryDate?: string
  notes?: string
}) {
  const { session, customerId } = await requireCustomer()

  if (!data.items || data.items.length === 0) {
    throw new Error("L'ordine deve contenere almeno un articolo")
  }

  const orderNumber = await getNextNumber("ORDER")

  // Recupera prodotti e prezzi personalizzati
  const productIds = data.items
    .map((i) => i.productId)
    .filter((id): id is string => !!id)

  const [products, customerPrices] = await Promise.all([
    db.product.findMany({ where: { id: { in: productIds }, isAvailable: true } }),
    db.customerProductPrice.findMany({
      where: { customerId, productId: { in: productIds } },
    }),
  ])

  const priceMap = new Map(customerPrices.map((cp) => [cp.productId, cp.price]))
  const productMap = new Map(products.map((p) => [p.id, p]))

  let subtotal = 0
  let vatAmount = 0

  const itemsData = data.items.map((item, index) => {
    let unitPrice = 0
    let vatRate = 0
    let productName = item.productName || "Prodotto personalizzato"

    if (item.productId) {
      const product = productMap.get(item.productId)
      if (product) {
        unitPrice = Number(priceMap.get(item.productId) ?? product.defaultPrice)
        vatRate = Number(product.vatRate)
        productName = product.name
      }
    }
    
    const lineTotal = item.quantity * unitPrice
    const lineVat = lineTotal * (vatRate / 100)
    subtotal += lineTotal
    vatAmount += lineVat

    return {
      productId: item.productId ?? null,
      productName: productName,
      quantity: item.quantity,
      unit: item.unit as any,
      unitPrice,
      vatRate,
      lineTotal,
      sortOrder: index,
    }
  })

  const total = subtotal + vatAmount

  const order = await db.order.create({
    data: {
      orderNumber,
      customerId,
      channel: "WEB",
      status: "RECEIVED",
      requestedDeliveryDate: data.requestedDeliveryDate ? new Date(data.requestedDeliveryDate) : null,
      notes: data.notes ?? null,
      subtotal,
      vatAmount,
      total,
      createdById: session.user.id,
      items: { create: itemsData },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  })

  await logActivity(session.user.id, "CREATE_ORDER", "Order", order.id, {
    orderNumber: order.orderNumber,
    customer: order.customer.companyName,
    total: Number(order.total),
    itemCount: order.items.length,
    channel: "WEB",
  })

  // Invia email di conferma al cliente
  if (order.customer.email) {
    const emailSubject = `Conferma Ordine #${order.orderNumber} - FruttaGest`
    const emailText = `Gentile cliente, il tuo ordine #${order.orderNumber} è stato ricevuto con successo.\n\nTotale: €${Number(order.total).toFixed(2)}\n\nPuoi visualizzare i dettagli del tuo ordine nella tua area riservata.\n\nGrazie per aver scelto FruttaGest.`
    const emailHtml = `
      <h1>Ordine Ricevuto</h1>
      <p>Gentile cliente,</p>
      <p>Il tuo ordine <strong>#${order.orderNumber}</strong> è stato ricevuto con successo.</p>
      <p><strong>Totale:</strong> €${Number(order.total).toFixed(2)}</p>
      <p>Puoi visualizzare i dettagli del tuo ordine nella tua area riservata.</p>
      <br/>
      <p>Grazie per aver scelto FruttaGest.</p>
    `

    // Non bloccare la risposta se l'invio email fallisce, ma logga l'errore
    sendEmail({
      to: order.customer.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }).catch((error) => console.error("Errore invio email ordine:", error))
  }

  revalidatePath("/portale/ordini")
  revalidatePath("/portale")
  revalidatePath("/ordini")
  revalidatePath("/dashboard")
  return serialize(order)
}

export async function getPortalOrders(
  params: PaginationParams & { status?: string } = {}
) {
  const { customerId } = await requireCustomer()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "orderDate",
    sortOrder = "desc",
    status,
  } = params

  const where: Prisma.OrderWhereInput = {
    customerId,
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  }

  const [data, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
        deliveryNote: { select: { id: true, ddtNumber: true, status: true, deliveryDate: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getPortalOrder(id: string) {
  const { customerId } = await requireCustomer()

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
      deliveryNote: {
        select: { id: true, ddtNumber: true, status: true, deliveryDate: true, issueDate: true },
      },
    },
  })

  if (!order) throw new Error("Ordine non trovato")
  if (order.customerId !== customerId) throw new Error("Accesso non autorizzato")

  // Verifica se esiste fattura collegata
  const invoice = order.deliveryNote
    ? await db.invoiceDDTLink.findFirst({
        where: { deliveryNoteId: order.deliveryNote.id },
        include: { invoice: { select: { id: true, invoiceNumber: true, status: true, total: true } } },
      })
    : null

  return serialize({ ...order, linkedInvoice: invoice?.invoice ?? null })
}

export async function getPortalInvoices(
  params: PaginationParams & { status?: string } = {}
) {
  const { customerId } = await requireCustomer()

  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "issueDate",
    sortOrder = "desc",
    status,
  } = params

  const where: Prisma.InvoiceWhereInput = {
    customerId,
    status: status ? (status as any) : { not: "DRAFT" },
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: {
        items: true,
        payments: { select: { id: true, amount: true, paymentDate: true, method: true, status: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.invoice.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function getPortalInvoice(id: string) {
  const { customerId } = await requireCustomer()

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { sortOrder: "asc" },
      },
      payments: true,
      ddtLinks: {
        include: { deliveryNote: { select: { id: true, ddtNumber: true, deliveryDate: true } } },
      },
    },
  })

  if (!invoice) throw new Error("Fattura non trovata")
  if (invoice.customerId !== customerId) throw new Error("Accesso non autorizzato")

  return serialize(invoice)
}

export async function getPortalPayments(
  params: PaginationParams = {}
) {
  const { customerId } = await requireCustomer()

  const {
    page = 1,
    pageSize = 20,
    sortBy = "paymentDate",
    sortOrder = "desc",
  } = params

  const where: Prisma.PaymentWhereInput = {
    customerId,
    direction: "INCOMING",
  }

  const [data, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        invoice: { select: { id: true, invoiceNumber: true, total: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.payment.count({ where }),
  ])

  return serialize({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

// ============================================================
// ADMIN — GESTIONE PORTALE CLIENTI
// ============================================================

export async function createCustomerPortalUser(
  customerId: string,
  email: string,
  password: string
) {
  const session = await requireAdmin()

  // Verifica che il cliente esista e non abbia gia' un utente portale
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { portalUser: true },
  })

  if (!customer) throw new Error("Cliente non trovato")
  if (customer.portalUser) throw new Error("Questo cliente ha gia' un accesso al portale")

  // Verifica che l'email non sia gia' in uso
  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) throw new Error("Questa email e' gia' in uso")

  const bcrypt = await import("bcryptjs")
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: {
      name: customer.companyName,
      email,
      password: hashedPassword,
      role: "CUSTOMER",
      customerId,
      isActive: true,
    },
  })

  await logActivity(session.user.id, "CREATE_PORTAL_USER", "User", user.id, {
    customerName: customer.companyName,
    customerId,
    portalEmail: email,
  })

  revalidatePath(`/clienti/${customerId}`)
  return serialize(user)
}

export async function toggleCustomerPortalAccess(customerId: string, active: boolean) {
  const session = await requireAdmin()

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { portalUser: true },
  })

  if (!customer) throw new Error("Cliente non trovato")
  if (!customer.portalUser) throw new Error("Questo cliente non ha un accesso al portale")

  await db.user.update({
    where: { id: customer.portalUser.id },
    data: { isActive: active },
  })

  await logActivity(session.user.id, active ? "ENABLE_PORTAL_USER" : "DISABLE_PORTAL_USER", "User", customer.portalUser.id, {
    customerName: customer.companyName,
  })

  revalidatePath(`/clienti/${customerId}`)
}

export async function toggleProductFeatured(productId: string) {
  const session = await requireAdmin()

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("Prodotto non trovato")

  const updated = await db.product.update({
    where: { id: productId },
    data: {
      isFeatured: !product.isFeatured,
      featuredUntil: !product.isFeatured ? null : null,
    },
  })

  await logActivity(session.user.id, "TOGGLE_FEATURED_PRODUCT", "Product", productId, {
    productName: product.name,
    isFeatured: updated.isFeatured,
  })

  revalidatePath("/catalogo")
  revalidatePath(`/catalogo/${productId}`)
  revalidatePath("/portale")
  revalidatePath("/portale/catalogo")
  return serialize(updated)
}

export async function scanAndSyncProducts() {
  const session = await requireAuth()
  const fs = await import("fs")
  const path = await import("path")
  const fsPromises = fs.promises

  const productsDir = path.join(process.cwd(), "public", "images", "products")
  
  try {
    await fsPromises.access(productsDir)
  } catch {
    return { error: "Cartella immagini non trovata" }
  }

  const files = await fsPromises.readdir(productsDir)
  const products = await db.product.findMany()
  const categories = await db.productCategory.findMany()

  // Ensure at least one category exists
  let defaultCategoryId = categories[0]?.id
  if (!defaultCategoryId) {
    const newCat = await db.productCategory.create({
      data: {
        name: "DA CATALOGARE",
        slug: "da-catalogare",
        type: "FRUTTA", // Default type
        description: "Prodotti importati automaticamente",
      }
    })
    defaultCategoryId = newCat.id
  }

  let updatedCount = 0
  let createdCount = 0
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]

  // Helper to slugify name
  const nameToSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/-+/g, '-')
  }

  // Helper to guess unit
  const guessUnit = (filename: string): ProductUnit => {
    const lower = filename.toLowerCase()
    if (lower.includes("pz") || lower.includes("pezzo") || lower.includes("pezzi")) return "PEZZI"
    if (lower.includes("mazzo") || lower.includes("mazzi") || lower.includes("mz")) return "MAZZO"
    if (lower.includes("vaschetta") || lower.includes("vasetto")) return "VASETTO"
    if (lower.includes("cassetta") || lower.includes("cassa")) return "CASSETTA"
    if (lower.includes("grappolo")) return "GRAPPOLO"
    if (lower.includes("sacchetto") || lower.includes("busta")) return "SACCHETTO"
    if (lower.match(/\d+gr/) || lower.match(/\d+g\b/)) return "PEZZI" // Usually fixed weight packs are sold as pieces
    return "KG"
  }

  // Helper to format name from filename
  const filenameToName = (filename: string) => {
    const nameWithoutExt = path.basename(filename, path.extname(filename))
    // Replace hyphens/underscores with spaces
    let name = nameWithoutExt.replace(/[-_]/g, " ")
    // Remove "dup1", "dup2" etc suffix if present
    name = name.replace(/\sdup\d+$/, "")
    // Capitalize words
    return name.replace(/\b\w/g, l => l.toUpperCase())
  }

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!validExtensions.includes(ext)) continue

    const productName = filenameToName(file)
    const productSlug = nameToSlug(productName)
    const imagePath = `/images/products/${file}`
    
    // Find existing product by slug or by exact image match
    let existingProduct = products.find(p => p.slug === productSlug || p.image === imagePath)

    // Try finding by name if slug doesn't match (fuzzy)
    if (!existingProduct) {
       existingProduct = products.find(p => nameToSlug(p.name) === productSlug)
    }

    if (existingProduct) {
      // Update image if missing or different
      if (existingProduct.image !== imagePath) {
        await db.product.update({
          where: { id: existingProduct.id },
          data: { image: imagePath },
        })
        updatedCount++
      }
    } else {
      // CREATE NEW PRODUCT
      const unit = guessUnit(file)
      
      // Ensure slug is unique in DB (though we checked memory, DB is authority)
      let uniqueSlug = productSlug
      let counter = 1
      while (await db.product.count({ where: { slug: uniqueSlug } }) > 0) {
        uniqueSlug = `${productSlug}-${counter}`
        counter++
      }

      await db.product.create({
        data: {
          name: productName,
          slug: uniqueSlug,
          categoryId: defaultCategoryId,
          unit: unit,
          defaultPrice: 0,
          vatRate: 4,
          isAvailable: true,
          image: imagePath,
        }
      })
      createdCount++
    }
  }
  
  if (updatedCount > 0 || createdCount > 0) {
    await logActivity(session.user.id, "SYNC_PRODUCTS", "Product", "batch", {
      updated: updatedCount,
      created: createdCount
    })
    revalidatePath("/catalogo")
    revalidatePath("/portale/catalogo")
    revalidatePath("/prodotti")
  }

  return { success: true, updated: updatedCount, created: createdCount }
}

export async function resetPassword(rawEmail: string) {
  const email = rawEmail.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email } })
  
  // Return success even if user not found to prevent enumeration
  if (!user) {
    return { success: true }
  }

  const token = randomUUID()
  const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

  // Delete existing tokens
  await db.verificationToken.deleteMany({
    where: { identifier: email }
  })

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const resetLink = `${baseUrl}/reset-password?token=${token}`

  const emailSubject = "Reimposta la tua password - FruttaGest"
  const emailText = `Hai richiesto di reimpostare la tua password.\n\nClicca sul seguente link per procedere:\n${resetLink}\n\nSe non hai richiesto tu questa operazione, ignora questa email.`
  const emailHtml = `
    <h1>Reimposta Password</h1>
    <p>Hai richiesto di reimpostare la tua password.</p>
    <p>Clicca sul pulsante qui sotto per procedere:</p>
    <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reimposta Password</a>
    <p style="font-size: 12px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br/>${resetLink}</p>
    <br/>
    <p>Se non hai richiesto tu questa operazione, ignora questa email.</p>
  `

  try {
    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    })
  } catch (error) {
    console.error("[resetPassword] Errore invio email:", error)
  }

  return { success: true }
}

export async function updatePassword(data: unknown) {
  const parsed = resetPasswordSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => e.message).join(", "))

  const { token, password } = parsed.data

  const existingToken = await db.verificationToken.findUnique({
    where: { token },
  })

  if (!existingToken) {
    throw new Error("Token non valido")
  }

  if (new Date() > existingToken.expires) {
    await db.verificationToken.delete({ where: { token } })
    throw new Error("Token scaduto")
  }

  const existingUser = await db.user.findUnique({
    where: { email: existingToken.identifier },
  })

  if (!existingUser) {
    throw new Error("Utente non trovato")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  })

  await db.verificationToken.delete({
    where: { token },
  })

  return { success: true }
}
