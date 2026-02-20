/**
 * Storico Pagamenti — Portale Clienti
 *
 * Lista pagamenti del cliente con importo, metodo, riferimento fattura.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CreditCard, Loader2 } from "lucide-react"
import { getPortalPayments } from "@/lib/actions"
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
}

export default function PortalPaymentsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPortalPayments({ page, pageSize: 20 })
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {/* Title */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">I Miei Pagamenti</h1>
        <p className="text-muted-foreground mt-1">
          {data ? `${data.total} pagamenti totali` : "Caricamento..."}
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Nessun pagamento trovato</p>
            <p className="text-sm text-muted-foreground mt-1">I pagamenti appariranno qui</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Metodo</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fattura</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Stato</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Riferimento</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((payment: any) => (
                    <tr key={payment.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {payment.invoice ? (
                          <Link href={`/portale/fatture/${payment.invoice.id}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            {payment.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {payment.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {page} di {data.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(data.totalPages, page + 1))} disabled={page >= data.totalPages}>
            Successiva
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
