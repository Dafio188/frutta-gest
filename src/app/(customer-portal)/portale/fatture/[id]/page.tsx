/**
 * Dettaglio Fattura — Portale Clienti
 *
 * Info fattura, tabella articoli, riepilogo, storico pagamenti.
 */

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, FileText, CreditCard, Loader2, Download } from "lucide-react"
import { getPortalInvoice } from "@/lib/actions"
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  PRODUCT_UNIT_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS,
} from "@/lib/constants"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
}

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortalInvoice(id)
      .then(setInvoice)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium">Fattura non trovata</p>
        <Link href="/portale/fatture" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">
          Torna alla lista fatture
        </Link>
      </div>
    )
  }

  const paid = Number(invoice.paidAmount)
  const total = Number(invoice.total)
  const remaining = total - paid

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link href="/portale/fatture" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Fattura {invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-0.5">
            Emessa il {formatDate(invoice.issueDate)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${INVOICE_STATUS_COLORS[invoice.status] || ""}`}>
          {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
        </span>
      </motion.div>

      {/* Info cards */}
      <motion.div variants={fadeUp} className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Scadenza</p>
          <p className="text-lg font-semibold">{formatDate(invoice.dueDate)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pagato</p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(paid)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rimanente</p>
          <p className={`text-lg font-semibold ${remaining > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </motion.div>

      {/* DDT links */}
      {invoice.ddtLinks?.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-5">
          <h2 className="font-semibold mb-3">Bolle di Consegna Collegate</h2>
          <div className="flex flex-wrap gap-2">
            {invoice.ddtLinks.map((link: any) => (
              <span key={link.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                {link.deliveryNote.ddtNumber}
                {link.deliveryNote.deliveryDate && (
                  <span className="text-xs text-muted-foreground">
                    ({formatDate(link.deliveryNote.deliveryDate)})
                  </span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Items table */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold">Articoli ({invoice.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prodotto</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Quantità</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">Prezzo</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">IVA</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Totale</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any) => (
                <tr key={item.id} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium">{item.product?.name || item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.product?.category?.name}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-right">
                    {Number(item.quantity)} {PRODUCT_UNIT_LABELS[item.unit] || item.unit}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-muted-foreground hidden sm:table-cell">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-muted-foreground hidden sm:table-cell">
                    {Number(item.vatRate)}%
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-right">
                    {formatCurrency(Number(item.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 border-t border-border/50 bg-muted/20">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex justify-between w-48 text-sm">
              <span className="text-muted-foreground">Subtotale</span>
              <span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between w-48 text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatCurrency(Number(invoice.vatAmount))}</span>
            </div>
            <div className="flex justify-between w-48 text-base font-bold pt-1.5 border-t border-border/30">
              <span>Totale</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payments history */}
      {invoice.payments?.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" strokeWidth={1.75} />
              Pagamenti Ricevuti
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Metodo</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Stato</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Importo</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p: any) => (
                <tr key={p.id} className="border-b border-border/30 last:border-0">
                  <td className="px-5 py-3 text-sm">{formatDate(p.paymentDate)}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{PAYMENT_STATUS_LABELS[p.status] || p.status}</td>
                  <td className="px-5 py-3 text-sm font-medium text-right">{formatCurrency(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-5">
          <h2 className="font-semibold mb-2">Note</h2>
          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
