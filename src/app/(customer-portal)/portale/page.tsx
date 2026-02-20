/**
 * Dashboard Portale Clienti — Panoramica
 *
 * Card riepilogo, prodotti in evidenza, ordini recenti, fatture recenti.
 */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShoppingCart, FileText, CreditCard, Truck,
  ArrowRight, Star, Package, Plus,
} from "lucide-react"
import { getPortalDashboard } from "@/lib/actions"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

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

export default function PortalDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortalDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      {/* Title */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Benvenuto</h1>
        <p className="text-muted-foreground mt-1">Panoramica del tuo account</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeUp} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={ShoppingCart}
          label="Ordini in Corso"
          value={data.activeOrdersCount}
          color="blue"
          href="/portale/ordini"
        />
        <StatsCard
          icon={FileText}
          label="Fatture da Pagare"
          value={data.unpaidInvoices.length}
          color="amber"
          href="/portale/fatture"
        />
        <StatsCard
          icon={CreditCard}
          label="Totale Dovuto"
          value={formatCurrency(data.totalOwed)}
          color="red"
          href="/portale/fatture"
        />
        <StatsCard
          icon={Truck}
          label="Prossima Consegna"
          value={data.nextDelivery?.requestedDeliveryDate
            ? formatDate(data.nextDelivery.requestedDeliveryDate)
            : "—"
          }
          color="emerald"
        />
      </motion.div>

      {/* Quick action */}
      <motion.div variants={fadeUp}>
        <Link href="/portale/ordini/nuovo">
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="h-5 w-5 mr-2" />
            Nuovo Ordine
          </Button>
        </Link>
      </motion.div>

      {/* Featured Products */}
      {data.featuredProducts.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
              Prodotti in Evidenza
            </h2>
            <Link href="/portale/catalogo" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Vedi Catalogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data.featuredProducts.map((product: any) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border/50 bg-card p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                {product.image ? (
                  <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-2xl relative">
                    <img src={product.image} alt={product.name} className="w-full h-28 object-cover" />
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-100/90 dark:bg-amber-900/80 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Star className="h-3 w-3" /> In Evidenza
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Package className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Star className="h-3 w-3" /> In Evidenza
                    </span>
                  </div>
                )}
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{product.category?.name}</p>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(Number(product.customerPrice))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {PRODUCT_UNIT_LABELS[product.unit] || product.unit}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent Orders */}
      <motion.section variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ordini Recenti</h2>
          <Link href="/portale/ordini" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            Vedi Tutti <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nessun ordine ancora</p>
            <Link href="/portale/ordini/nuovo">
              <Button variant="outline" className="mt-4">Crea il tuo primo ordine</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ordine</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Data</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Totale</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/portale/ordini/${order.id}`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{order.items.length} articoli</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {formatCurrency(Number(order.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Unpaid Invoices */}
      {data.unpaidInvoices.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fatture da Pagare</h2>
            <Link href="/portale/fatture" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Vedi Tutte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fattura</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Scadenza</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Importo</th>
                </tr>
              </thead>
              <tbody>
                {data.unpaidInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/portale/fatture/${inv.id}`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status] || ""}`}>
                        {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {formatCurrency(Number(inv.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}

function StatsCard({ icon: Icon, label, value, color, href }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  href?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }

  const Wrapper = href ? Link : "div"
  const wrapperProps = href ? { href } : {}

  return (
    <Wrapper {...wrapperProps as any}>
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-2xl font-bold mt-3">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </motion.div>
    </Wrapper>
  )
}
