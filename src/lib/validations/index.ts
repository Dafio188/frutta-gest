/**
 * Schemi di Validazione Zod
 *
 * Validazioni centralizzate per tutti i form e le API di FruttaGest.
 * Messaggi di errore in italiano.
 */

import { z } from "zod"

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  password: z
    .string()
    .min(8, "La password deve avere almeno 8 caratteri")
    .regex(/[A-Z]/, "Deve contenere almeno una lettera maiuscola")
    .regex(/[0-9]/, "Deve contenere almeno un numero")
    .regex(/[^A-Za-z0-9]/, "Deve contenere almeno un carattere speciale"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email non valida"),
})

// ============================================================
// PRODOTTI
// ============================================================

export const productSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  categoryId: z.string().min(1, "Seleziona una categoria"),
  unit: z.enum(["KG", "G", "PEZZI", "CASSETTA", "MAZZO", "GRAPPOLO", "VASETTO", "SACCHETTO"]),
  defaultPrice: z.coerce.number().min(0.01, "Il prezzo deve essere maggiore di 0"),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  vatRate: z.coerce.number().min(0).max(100).default(4),
  isAvailable: z.boolean().default(true),
  seasonalFrom: z.coerce.number().min(1).max(12).optional().nullable(),
  seasonalTo: z.coerce.number().min(1).max(12).optional().nullable(),
  description: z.string().optional().nullable(),
  minOrderQuantity: z.coerce.number().min(0).optional().nullable(),
})

// ============================================================
// CLIENTI
// ============================================================

export const customerSchema = z.object({
  companyName: z.string().min(2, "La ragione sociale deve avere almeno 2 caratteri"),
  type: z.enum(["RISTORANTE", "SUPERMERCATO", "BAR", "HOTEL", "MENSA", "GASTRONOMIA", "ALTRO"]),
  vatNumber: z.string().optional().nullable(),
  fiscalCode: z.string().optional().nullable(),
  sdiCode: z.string().optional().nullable(),
  pecEmail: z.string().email("PEC non valida").optional().nullable().or(z.literal("")),
  address: z.string().min(3, "Inserisci l'indirizzo"),
  city: z.string().min(2, "Inserisci la città"),
  province: z.string().length(2, "Inserisci la sigla provincia (2 lettere)"),
  postalCode: z.string().length(5, "Il CAP deve essere di 5 cifre"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email non valida").optional().nullable().or(z.literal("")),
  deliveryZone: z.string().optional().nullable(),
  preferredDeliveryTime: z.string().optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
  paymentMethod: z.enum(["CONTANTI", "BONIFICO", "ASSEGNO", "RIBA", "CARTA"]).default("BONIFICO"),
  paymentTermsDays: z.coerce.number().min(0).default(30),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const contactSchema = z.object({
  firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  role: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email("Email non valida").optional().nullable().or(z.literal("")),
  isPrimary: z.boolean().default(false),
})

// ============================================================
// FORNITORI
// ============================================================

export const supplierSchema = z.object({
  companyName: z.string().min(2, "La ragione sociale deve avere almeno 2 caratteri"),
  vatNumber: z.string().optional().nullable(),
  fiscalCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email non valida").optional().nullable().or(z.literal("")),
  paymentMethod: z.enum(["CONTANTI", "BONIFICO", "ASSEGNO", "RIBA", "CARTA"]).default("BONIFICO"),
  paymentTermsDays: z.coerce.number().min(0).default(30),
  notes: z.string().optional().nullable(),
})

// ============================================================
// ORDINI
// ============================================================

export const orderItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0.001, "La quantità deve essere maggiore di 0"),
  unit: z.enum(["KG", "G", "PEZZI", "CASSETTA", "MAZZO", "GRAPPOLO", "VASETTO", "SACCHETTO"]),
  unitPrice: z.coerce.number().min(0, "Il prezzo non può essere negativo"),
  vatRate: z.coerce.number().default(4),
  notes: z.string().optional().nullable(),
}).refine((data) => data.productId || data.productName, {
  message: "Seleziona un prodotto o inserisci un nome",
  path: ["productId"],
})

export const orderSchema = z.object({
  customerId: z.string().min(1, "Seleziona un cliente"),
  channel: z.enum(["WHATSAPP", "EMAIL", "AUDIO", "MANUAL", "WEB"]).default("MANUAL"),
  requestedDeliveryDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Aggiungi almeno un prodotto"),
})

// ============================================================
// BOLLE DI CONSEGNA (DDT)
// ============================================================

export const deliveryNoteSchema = z.object({
  customerId: z.string().min(1, "Seleziona un cliente"),
  orderId: z.string().optional().nullable(),
  issueDate: z.coerce.date().default(() => new Date()),
  transportReason: z.string().default("Vendita"),
  transportedBy: z.string().default("Mittente"),
  goodsAppearance: z.string().optional().nullable(),
  numberOfPackages: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().min(0).optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
})

// ============================================================
// FATTURE
// ============================================================

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Seleziona un cliente"),
  issueDate: z.coerce.date().default(() => new Date()),
  dueDate: z.coerce.date(),
  paymentMethod: z.enum(["CONTANTI", "BONIFICO", "ASSEGNO", "RIBA", "CARTA"]).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  ddtIds: z.array(z.string()).min(1, "Seleziona almeno una bolla"),
})

// ============================================================
// PAGAMENTI
// ============================================================

export const paymentSchema = z.object({
  direction: z.enum(["INCOMING", "OUTGOING"]),
  amount: z.coerce.number().min(0.01, "L'importo deve essere maggiore di 0"),
  paymentDate: z.coerce.date(),
  method: z.enum(["CONTANTI", "BONIFICO", "ASSEGNO", "RIBA", "CARTA"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  supplierInvoiceId: z.string().optional().nullable(),
})

// ============================================================
// COMPANY INFO
// ============================================================

export const companyInfoSchema = z.object({
  companyName: z.string().min(2, "Inserisci la ragione sociale"),
  vatNumber: z.string().min(11, "P.IVA deve avere almeno 11 caratteri"),
  fiscalCode: z.string().min(11, "Codice Fiscale deve avere almeno 11 caratteri"),
  address: z.string().min(3, "Inserisci l'indirizzo"),
  city: z.string().min(2, "Inserisci la città"),
  province: z.string().length(2, "Sigla provincia (2 lettere)"),
  postalCode: z.string().length(5, "Il CAP deve essere di 5 cifre"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email non valida").optional().nullable().or(z.literal("")),
  pecEmail: z.string().email("PEC non valida").optional().nullable().or(z.literal("")),
  sdiCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankIban: z.string().optional().nullable(),
  bankBic: z.string().optional().nullable(),
})

// ============================================================
// ORDINI FORNITORE
// ============================================================

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Seleziona un fornitore"),
  expectedDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1, "Seleziona un prodotto"),
    quantity: z.coerce.number().positive("La quantità deve essere positiva"),
    unit: z.enum(["KG", "G", "PEZZI", "CASSETTA", "MAZZO", "GRAPPOLO", "VASETTO", "SACCHETTO"]),
    unitPrice: z.coerce.number().min(0, "Il prezzo non può essere negativo"),
  })).min(1, "Aggiungi almeno un prodotto"),
})

// ============================================================
// FATTURE FORNITORE
// ============================================================

export const supplierInvoiceSchema = z.object({
  supplierInvoiceNumber: z.string().min(1, "Inserisci il numero fattura"),
  supplierId: z.string().min(1, "Seleziona un fornitore"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  subtotal: z.coerce.number().min(0),
  vatAmount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
})

// ============================================================
// TYPES DERIVATI
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type DeliveryNoteInput = z.infer<typeof deliveryNoteSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type CompanyInfoInput = z.infer<typeof companyInfoSchema>
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>
export type SupplierInvoiceInput = z.infer<typeof supplierInvoiceSchema>
