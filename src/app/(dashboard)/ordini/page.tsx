/**
 * Lista Ordini
 *
 * Tabella ordini collegata al database con filtro per stato,
 * ricerca, badge colorati. Navigazione al dettaglio e creazione nuovo ordine.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingCart, Plus, Search, MessageCircle, Mail, Mic, PenLine, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_CHANNEL_LABELS,
} from "@/lib/constants"
import { getOrders } from "@/lib/actions"

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  AUDIO: Mic,
  MANUAL: PenLine,
  WEB: Globe,
}

const STATUS_TABS = [
  { key: "ALL", label: "Tutti" },
  { key: "RECEIVED", label: "Ricevuti" },
  { key: "CONFIRMED", label: "Confermati" },
  { key: "IN_PREPARATION", label: "In Preparazione" },
  { key: "DELIVERED", label: "Consegnati" },
  { key: "INVOICED", label: "Fatturati" },
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

interface OrderRow {
  id: string
  orderNumber: string
  status: string
  channel: string
  orderDate: string
  requestedDeliveryDate: string | null
  total: number
  customer: { id: string; companyName: string }
  items: unknown[]
}

export default function OrdiniPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getOrders({
        search,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        pageSize: 50,
        sortBy: "orderDate",
        sortOrder: "desc",
      })
      setOrders(result.data as unknown as OrderRow[])
      setTotalOrders(result.total)
    } catch (err) {
      console.error("Errore caricamento ordini:", err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // Load all orders once to compute status counts
  useEffect(() => {
    async function loadCounts() {
      try {
        const result = await getOrders({ pageSize: 1000 })
        const counts: Record<string, number> = {}
        for (const o of result.data as unknown as OrderRow[]) {
          counts[o.status] = (counts[o.status] || 0) + 1
        }
        setStatusCounts(counts)
      } catch {
        // ignore
      }
    }
    loadCounts()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ordini</h1>
            <p className="text-muted-foreground">Gestisci gli ordini dei clienti</p>
          </div>
          <Link href="/ordini/nuovo">
            <Button>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Nuovo Ordine
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              icon={Search}
              placeholder="Cerca per numero o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${statusFilter === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
                {tab.key !== "ALL" && statusCounts[tab.key] ? (
                  <span className="ml-1.5 text-[10px] opacity-75">({statusCounts[tab.key]})</span>
                ) : tab.key === "ALL" && allCount > 0 ? (
                  <span className="ml-1.5 text-[10px] opacity-75">({allCount})</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Nessun ordine trovato" description="Prova a modificare i filtri o crea un nuovo ordine." />
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Numero</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cliente</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Stato</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Canale</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Totale</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                  {orders.map((order) => {
                    const ChannelIcon = CHANNEL_ICONS[order.channel] || ShoppingCart
                    return (
                      <motion.tr
                        key={order.id}
                        variants={rowVariants}
                        onClick={() => router.push(`/ordini/${order.id}`)}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{order.orderNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{order.customer?.companyName || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm">{formatDate(order.orderDate)}</p>
                            {order.requestedDeliveryDate && (
                              <p className="text-xs text-muted-foreground">Consegna: {formatDate(order.requestedDeliveryDate)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                            <span className="text-xs text-muted-foreground">{ORDER_CHANNEL_LABELS[order.channel] || order.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold">{formatCurrency(Number(order.total))}</span>
                          <p className="text-xs text-muted-foreground">{order.items?.length || 0} articoli</p>
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
