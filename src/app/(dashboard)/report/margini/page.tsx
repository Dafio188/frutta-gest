/**
 * Report Margini di Profitto
 *
 * Analisi margini per prodotto con dati reali.
 * Confronto prezzo acquisto vs vendita, margine percentuale.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  PieChart, TrendingUp, TrendingDown, DollarSign,
  Percent, CheckCircle2, BarChart3, Loader2, Package,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getMarginReport } from "@/lib/actions"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
  },
}

interface ProductMargin {
  id: string
  name: string
  category: string
  unit: string
  avgSellPrice: number
  avgCostPrice: number
  totalSoldQty: number
  totalRevenue: number
  totalCost: number
  profit: number
  marginPercent: number
}

interface Summary {
  totalSales: number
  totalPurchases: number
  overallProfit: number
  overallMargin: number
  productCount: number
}

export default function ReportMarginiPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductMargin[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sortBy, setSortBy] = useState<"revenue" | "margin" | "profit">("revenue")

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getMarginReport()
      const parsed = result as unknown as { productMargins: ProductMargin[]; summary: Summary }
      setProducts(parsed.productMargins)
      setSummary(parsed.summary)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadReport() }, [loadReport])

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue
    if (sortBy === "margin") return b.marginPercent - a.marginPercent
    return b.profit - a.profit
  })

  const bestMargin = products.length > 0
    ? products.reduce((best, p) => p.marginPercent > best.marginPercent ? p : best, products[0])
    : null

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Margini di Profitto</h1>
          <p className="text-muted-foreground mt-1">Confronto costo acquisto vs vendita per prodotto</p>
        </div>

        {/* KPI Cards */}
        {summary && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendite Totali</p>
                      <p className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(summary.totalSales)}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Acquisti Totali</p>
                      <p className="text-2xl font-bold mt-1 tracking-tight">{formatCurrency(summary.totalPurchases)}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={1.75} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Profitto Lordo</p>
                      <p className={`text-2xl font-bold mt-1 tracking-tight ${summary.overallProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(summary.overallProfit)}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Margine Medio</p>
                      <p className="text-2xl font-bold mt-1 tracking-tight">{summary.overallMargin.toFixed(1)}%</p>
                      {bestMargin && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Migliore: {bestMargin.name} ({bestMargin.marginPercent.toFixed(1)}%)
                        </p>
                      )}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordina per:</span>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {([
              { key: "revenue" as const, label: "Ricavi" },
              { key: "margin" as const, label: "Margine" },
              { key: "profit" as const, label: "Profitto" },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  sortBy === s.key
                    ? "bg-background text-foreground shadow-[var(--shadow-xs)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product margin table */}
        {sortedProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Nessun dato di vendita o acquisto disponibile</p>
              <p className="text-xs text-muted-foreground mt-1">I margini verranno calcolati quando ci saranno fatture e ordini fornitore</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prodotto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">P. Acquisto</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">P. Vendita</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Venduto</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ricavi</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Profitto</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Margine</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                  {sortedProducts.map((product) => (
                    <motion.tr
                      key={product.id}
                      variants={itemVariants}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                        {product.avgCostPrice > 0 ? formatCurrency(product.avgCostPrice) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(product.avgSellPrice)}</td>
                      <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                        {product.totalSoldQty > 0
                          ? `${product.totalSoldQty.toFixed(product.unit === "PEZZI" ? 0 : 2)} ${(PRODUCT_UNIT_LABELS[product.unit] || product.unit).toLowerCase()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(product.totalRevenue)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={product.profit >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                          {formatCurrency(product.profit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className={
                          product.marginPercent >= 30
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : product.marginPercent >= 15
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }>
                          {product.marginPercent.toFixed(1)}%
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
