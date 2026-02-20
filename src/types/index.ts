/**
 * TypeScript Types per FruttaGest
 *
 * Types estesi per le entità del database con relazioni incluse.
 */

import type {
  User,
  Customer,
  Supplier,
  Product,
  ProductCategory,
  Order,
  OrderItem,
  DeliveryNote,
  DeliveryNoteItem,
  Invoice,
  InvoiceItem,
  Payment,
  Contact,
  ShoppingList,
  ShoppingListItem,
  WhatsAppMessage,
  AudioTranscription,
  CompanyInfo,
  SupplierProduct,
  CreditNote,
  InvoiceDDTLink,
} from "@prisma/client"

// ============================================================
// USER
// ============================================================

export type SafeUser = Omit<User, "password">

// ============================================================
// PRODUCT
// ============================================================

export type ProductWithCategory = Product & {
  category: ProductCategory
}

export type ProductWithRelations = Product & {
  category: ProductCategory
  supplierProducts: (SupplierProduct & { supplier: Supplier })[]
}

// ============================================================
// CUSTOMER
// ============================================================

export type CustomerWithContacts = Customer & {
  contacts: Contact[]
}

export type CustomerWithRelations = Customer & {
  contacts: Contact[]
  orders: Order[]
  invoices: Invoice[]
  payments: Payment[]
}

// ============================================================
// SUPPLIER
// ============================================================

export type SupplierWithContacts = Supplier & {
  contacts: Contact[]
}

export type SupplierWithProducts = Supplier & {
  supplierProducts: (SupplierProduct & { product: Product })[]
}

// ============================================================
// ORDER
// ============================================================

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[]
  customer: Customer
}

export type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[]
  customer: Customer
  createdBy: SafeUser | null
  deliveryNote: DeliveryNote | null
  whatsappMessage: WhatsAppMessage | null
  audioTranscription: AudioTranscription | null
}

// ============================================================
// DELIVERY NOTE (DDT)
// ============================================================

export type DeliveryNoteWithItems = DeliveryNote & {
  items: (DeliveryNoteItem & { product: Product })[]
  customer: Customer
}

export type DeliveryNoteWithRelations = DeliveryNote & {
  items: (DeliveryNoteItem & { product: Product })[]
  customer: Customer
  order: Order | null
  createdBy: SafeUser | null
  invoiceLinks: (InvoiceDDTLink & { invoice: Invoice })[]
}

// ============================================================
// INVOICE
// ============================================================

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
  customer: Customer
}

export type InvoiceWithRelations = Invoice & {
  items: (InvoiceItem & { product: Product | null })[]
  customer: Customer
  createdBy: SafeUser | null
  ddtLinks: (InvoiceDDTLink & { deliveryNote: DeliveryNote })[]
  payments: Payment[]
  creditNotes: CreditNote[]
}

// ============================================================
// PAYMENT
// ============================================================

export type PaymentWithRelations = Payment & {
  customer: Customer | null
  supplier: Supplier | null
  invoice: Invoice | null
}

// ============================================================
// SHOPPING LIST
// ============================================================

export type ShoppingListWithItems = ShoppingList & {
  items: (ShoppingListItem & {
    product: Product
    supplier: Supplier | null
  })[]
}

// ============================================================
// AI PARSING
// ============================================================

export interface ParsedOrderItem {
  productName: string
  productId?: string
  quantity: number
  unit: string
  confidence: number
}

export interface ParsedOrderData {
  items: ParsedOrderItem[]
  customerName?: string
  deliveryDate?: string
  notes?: string
  rawText: string
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardKPI {
  ordiniOggi: number
  fatturatoMese: number
  fatturatoMesePrec: number
  fattureDaIncassare: number
  daPagare: number
  ordiniInAttesa: number
  ddtDaEmettere: number
  fattureScadute: number
}

export interface SalesChartData {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
  unit: string
}

export interface TopCustomer {
  customerId: string
  customerName: string
  totalOrders: number
  totalRevenue: number
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  search?: string
}
