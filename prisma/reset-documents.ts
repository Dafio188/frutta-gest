/**
 * Reset Documenti — FruttaGest
 *
 * Azzera DDT, Fatture (clienti e fornitori), Pagamenti, Ordini Fornitore,
 * Liste Spesa, Movimenti Magazzino e Ordini.
 * Mantiene: Utenti, Clienti, Fornitori, Prodotti, Categorie, Settings.
 *
 * Esegui con: npx tsx prisma/reset-documents.ts
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import "dotenv/config"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🗑️  Inizio reset documenti FruttaGest...")
  console.log("")

  // Ordine di eliminazione rispettando le foreign key

  // 1. Pagamenti (riferiscono Invoice e SupplierInvoice)
  const payments = await prisma.payment.deleteMany()
  console.log(`   ✅ Pagamenti eliminati: ${payments.count}`)

  // 2. Note di credito
  const creditNotes = await prisma.creditNote.deleteMany()
  console.log(`   ✅ Note di credito eliminate: ${creditNotes.count}`)

  // 3. InvoiceItem (CASCADE da Invoice, ma puliamo prima)
  const invoiceItems = await prisma.invoiceItem.deleteMany()
  console.log(`   ✅ Righe fattura cliente eliminate: ${invoiceItems.count}`)

  // 4. InvoiceDDTLink
  const invoiceDDTLinks = await prisma.invoiceDDTLink.deleteMany()
  console.log(`   ✅ Link fattura-DDT eliminati: ${invoiceDDTLinks.count}`)

  // 5. Fatture clienti
  const invoices = await prisma.invoice.deleteMany()
  console.log(`   ✅ Fatture clienti eliminate: ${invoices.count}`)

  // 6. DeliveryNoteItem
  const ddtItems = await prisma.deliveryNoteItem.deleteMany()
  console.log(`   ✅ Righe DDT eliminate: ${ddtItems.count}`)

  // 7. DDT
  const ddts = await prisma.deliveryNote.deleteMany()
  console.log(`   ✅ DDT eliminati: ${ddts.count}`)

  // 8. SupplierInvoiceItem
  const siItems = await prisma.supplierInvoiceItem.deleteMany()
  console.log(`   ✅ Righe fattura fornitore eliminate: ${siItems.count}`)

  // 9. Fatture fornitore
  const supplierInvoices = await prisma.supplierInvoice.deleteMany()
  console.log(`   ✅ Fatture fornitore eliminate: ${supplierInvoices.count}`)

  // 10. PurchaseOrderItem
  const poItems = await prisma.purchaseOrderItem.deleteMany()
  console.log(`   ✅ Righe ordini fornitore eliminate: ${poItems.count}`)

  // 11. Ordini fornitore
  const pos = await prisma.purchaseOrder.deleteMany()
  console.log(`   ✅ Ordini fornitore eliminati: ${pos.count}`)

  // 12. ShoppingListItem
  const slItems = await prisma.shoppingListItem.deleteMany()
  console.log(`   ✅ Righe lista spesa eliminate: ${slItems.count}`)

  // 13. Liste spesa
  const sls = await prisma.shoppingList.deleteMany()
  console.log(`   ✅ Liste spesa eliminate: ${sls.count}`)

  // 14. Movimenti magazzino
  const movements = await prisma.stockMovement.deleteMany()
  console.log(`   ✅ Movimenti magazzino eliminati: ${movements.count}`)

  // 15. OrderItem
  const orderItems = await prisma.orderItem.deleteMany()
  console.log(`   ✅ Righe ordini eliminate: ${orderItems.count}`)

  // 16. Ordini
  const orders = await prisma.order.deleteMany()
  console.log(`   ✅ Ordini eliminati: ${orders.count}`)

  // 17. Reset sequenze numeri a 0
  await prisma.numberSequence.updateMany({
    data: { lastNumber: 0 },
  })
  console.log(`   ✅ Sequenze numeri azzerate`)

  // 18. Pulizia activity log relativi ai documenti
  const logs = await prisma.activityLog.deleteMany({
    where: {
      action: {
        in: [
          "CREATE_ORDER", "UPDATE_ORDER", "DELETE_ORDER",
          "CREATE_DDT", "UPDATE_DDT", "DELETE_DDT",
          "CREATE_INVOICE", "UPDATE_INVOICE", "DELETE_INVOICE",
          "CREATE_PAYMENT", "UPDATE_PAYMENT",
          "CREATE_SUPPLIER_INVOICE", "UPDATE_SUPPLIER_INVOICE", "DELETE_SUPPLIER_INVOICE",
          "CREATE_PURCHASE_ORDER", "UPDATE_PURCHASE_ORDER", "DELETE_PURCHASE_ORDER",
          "CREATE_PO_FROM_SHOPPING_LIST", "GENERATE_SHOPPING_LIST", "REGENERATE_SHOPPING_LIST",
          "CREATE_SHOPPING_LIST", "UPDATE_SHOPPING_LIST_STATUS", "DELETE_SHOPPING_LIST",
          "CREATE_STOCK_MOVEMENT",
        ],
      },
    },
  })
  console.log(`   ✅ Log attività documenti eliminati: ${logs.count}`)

  console.log("")
  console.log("🎉 Reset completato!")
  console.log("")
  console.log("📋 Dati mantenuti:")
  console.log("   - Utenti e preferenze")
  console.log("   - Clienti e contatti")
  console.log("   - Fornitori e contatti")
  console.log("   - Prodotti e categorie")
  console.log("   - Relazioni fornitore-prodotto")
  console.log("   - Impostazioni app")
  console.log("")
  console.log("📋 Dati azzerati:")
  console.log("   - Ordini clienti")
  console.log("   - DDT")
  console.log("   - Fatture clienti e fornitori")
  console.log("   - Pagamenti")
  console.log("   - Ordini fornitore")
  console.log("   - Liste della spesa")
  console.log("   - Movimenti magazzino")
  console.log("   - Sequenze numeri (ripartono da 1)")
}

main()
  .catch((e) => {
    console.error("❌ Errore durante il reset:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
