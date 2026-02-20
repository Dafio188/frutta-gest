/**
 * Lista Ordini — Portale Clienti
 *
 * Tabella ordini del cliente con filtri, paginazione e link al dettaglio.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, ShoppingCart, Plus, Loader2 } from "lucide-react"
import { getPortalOrders } from "@/lib/actions"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants"
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

const STATUS_OPTIONS = [
  { value: "", label: "Tutti gli stati" },
  { value: "RECEIVED", label: "Ricevuto" },
  { value: "CONFIRMED", label: "Confermato" },
  { value: "IN_PREPARATION", label: "In Preparazione" },
  { value: "DELIVERED", label: "Consegnato" },
  { value: "INVOICED", label: "Fatturato" },
  { value: "CANCELLED", label: "Annullato" },
]

export default function PortalOrdersPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPortalOrders({ search, status: status || undefined, page, pageSize: 20 })
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300)
    return () => clearTimeout(timer)
  }, [loadOrders])

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {/* Title */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">I Miei Ordini</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.total} ordini totali` : "Caricamento..."}
          </p>
        </div>
        <Link href="/portale/ordini/nuovo">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Ordine
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per numero ordine..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-10 rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-10 rounded-xl border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Nessun ordine trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || status ? "Prova a modificare i filtri" : "Crea il tuo primo ordine"}
            </p>
            {!search && !status && (
              <Link href="/portale/ordini/nuovo">
                <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Nuovo Ordine
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ordine</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Consegna</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Articoli</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/portale/ordini/${order.id}`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {order.items.length}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        {formatCurrency(Number(order.total))}
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
