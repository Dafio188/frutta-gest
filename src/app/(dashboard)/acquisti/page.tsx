/**
 * Lista Ordini Fornitore
 *
 * Tabella ordini fornitore con filtro per stato,
 * ricerca, badge colorati. Navigazione al dettaglio e creazione nuovo ordine.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingCart, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from "@/lib/constants"
import { getPurchaseOrders } from "@/lib/actions"

const STATUS_TABS = [
  { key: "ALL", label: "Tutti" },
  { key: "DRAFT", label: "Bozze" },
  { key: "SENT", label: "Inviati" },
  { key: "RECEIVED", label: "Ricevuti" },
  { key: "CANCELLED", label: "Annullati" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
}

export default function AcquistiPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getPurchaseOrders({
        page,
        pageSize: 20,
        search,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      })
      const parsed = result as unknown as { data: any[]; total: number; totalPages: number }
      setOrders(parsed.data)
      setTotal(parsed.total)
      setTotalPages(parsed.totalPages)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ordini Fornitore</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} ordini fornitore totali
            </p>
          </div>
          <Link href="/acquisti/nuovo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Ordine
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per numero, fornitore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {statusFilter === tab.key && (
                  <motion.div
                    layoutId="po-status-tab"
                    className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun ordine fornitore"
            description="Crea il tuo primo ordine fornitore per iniziare a gestire gli acquisti."
            action={
              <Link href="/acquisti/nuovo">
                <Button><Plus className="h-4 w-4 mr-2" />Nuovo Ordine</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Numero</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fornitore</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Consegna</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Totale</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                    {orders.map((order) => (
                      <motion.tr
                        key={order.id}
                        variants={rowVariants}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/acquisti/${order.id}`} className="font-medium text-sm text-primary hover:underline">
                            {order.poNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.supplier?.companyName || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(order.orderDate)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {order.expectedDate ? formatDate(order.expectedDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={PURCHASE_ORDER_STATUS_COLORS[order.status] || ""}>
                            {PURCHASE_ORDER_STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(order.total)}</td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {page} di {totalPages} ({total} risultati)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Precedente
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Successiva
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
