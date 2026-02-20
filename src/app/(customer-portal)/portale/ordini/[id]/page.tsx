/**
 * Dettaglio Ordine — Portale Clienti
 *
 * Info ordine, timeline stato, tabella articoli, riepilogo.
 */

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, Truck, FileText, CheckCircle2,
  Clock, XCircle, Loader2,
} from "lucide-react"
import { getPortalOrder } from "@/lib/actions"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRODUCT_UNIT_LABELS } from "@/lib/constants"

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

const STATUS_STEPS = [
  { key: "RECEIVED", label: "Ricevuto", icon: Clock },
  { key: "CONFIRMED", label: "Confermato", icon: CheckCircle2 },
  { key: "IN_PREPARATION", label: "In Preparazione", icon: Package },
  { key: "DELIVERED", label: "Consegnato", icon: Truck },
  { key: "INVOICED", label: "Fatturato", icon: FileText },
]

export default function PortalOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortalOrder(id)
      .then(setOrder)
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

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium">Ordine non trovato</p>
        <Link href="/portale/ordini" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">
          Torna alla lista ordini
        </Link>
      </div>
    )
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status)
  const isCancelled = order.status === "CANCELLED"

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link href="/portale/ordini" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ordine {order.orderNumber}</h1>
          <p className="text-muted-foreground mt-0.5">
            Effettuato il {formatDate(order.orderDate)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </motion.div>

      {/* Status Timeline */}
      {!isCancelled && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold mb-4">Stato dell'Ordine</h2>
          <div className="flex items-center justify-between relative">
            {/* Progress bar */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
              />
            </div>
            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon
              const isCompleted = i <= currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <div key={step.key} className="relative flex flex-col items-center z-10">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-background border-muted text-muted-foreground"
                  } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"} hidden sm:block`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Cancelled notice */}
      {isCancelled && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-5 flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">Ordine Annullato</p>
            <p className="text-sm text-red-600 dark:text-red-400/80">Questo ordine è stato annullato.</p>
          </div>
        </motion.div>
      )}

      {/* Delivery info */}
      {(order.requestedDeliveryDate || order.deliveryNote) && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-5 flex gap-6">
          {order.requestedDeliveryDate && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Consegna Richiesta</p>
              <p className="font-medium">{formatDate(order.requestedDeliveryDate)}</p>
            </div>
          )}
          {order.deliveryNote && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">DDT</p>
              <p className="font-medium">{order.deliveryNote.ddtNumber}</p>
              {order.deliveryNote.deliveryDate && (
                <p className="text-xs text-muted-foreground">Consegnato il {formatDate(order.deliveryNote.deliveryDate)}</p>
              )}
            </div>
          )}
          {order.linkedInvoice && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fattura</p>
              <Link href={`/portale/fatture/${order.linkedInvoice.id}`} className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                {order.linkedInvoice.invoiceNumber}
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Items table */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold">Articoli Ordinati ({order.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prodotto</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Quantità</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">Prezzo</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Totale</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
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
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between w-48 text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatCurrency(Number(order.vatAmount))}</span>
            </div>
            <div className="flex justify-between w-48 text-base font-bold pt-1.5 border-t border-border/30">
              <span>Totale</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notes */}
      {order.notes && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card p-5">
          <h2 className="font-semibold mb-2">Note</h2>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
