/**
 * Report Analisi Prodotti
 *
 * Prodotti più venduti, distribuzione per categoria,
 * trend quantità e stagionalità — dati reali dal DB.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Package, TrendingUp, TrendingDown, BarChart3,
  Apple, Leaf, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getProductsReport } from "@/lib/actions"

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

type Period = "7d" | "30d" | "90d" | "1y"

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7gg",
  "30d": "30gg",
  "90d": "90gg",
  "1y": "1 anno",
}

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
}

// Palette ciclica per categorie (barre distribuzione + trend)
const CATEGORY_COLORS = [
  "bg-red-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-pink-500",
]

interface ProductsReport {
  totals: { quantity: number; revenue: number; categories: number }
  categories: { name: string; quantity: number; revenue: number; percentage: number }[]
  monthlyTrend: { categories: string[]; months: { label: string; values: Record<string, number> }[] }
  topProducts: { name: string; category: string; quantity: number; revenue: number; unit: string; trend: number | null }[]
}

export default function ReportProdottiPage() {
  const [period, setPeriod] = useState<Period>("30d")
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<ProductsReport | null>(null)

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getProductsReport(PERIOD_DAYS[period])
      setReport(result as unknown as ProductsReport)
    } catch {} finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadReport() }, [loadReport])

  const categories = report?.categories ?? []
  const trendCategories = report?.monthlyTrend.categories ?? []
  const trendMonths = report?.monthlyTrend.months ?? []
  const maxMonthlyValue = Math.max(
    1,
    ...trendMonths.map((m) => trendCategories.reduce((sum, c) => sum + (m.values[c] ?? 0), 0))
  )
  const hasTrendData = trendMonths.some((m) =>
    trendCategories.some((c) => (m.values[c] ?? 0) > 0)
  )

  const kpis = report
    ? [
        {
          label: "Quantità Venduta",
          value: formatNumber(report.totals.quantity),
          subtitle: "unità totali nel periodo",
          icon: Package,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
          label: "Fatturato Prodotti",
          value: formatCurrency(report.totals.revenue),
          subtitle: "ricavo totale nel periodo",
          icon: BarChart3,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          label: "Categorie Attive",
          value: report.totals.categories.toString(),
          subtitle: "con vendite nel periodo",
          icon: Apple,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-900/30",
        },
      ]
    : []

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analisi Prodotti</h1>
            <p className="text-muted-foreground mt-1">Prodotti più venduti, categorie e trend</p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  period === key
                    ? "bg-background text-foreground shadow-[var(--shadow-xs)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {kpis.map((kpi, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{kpi.label}</p>
                          <p className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} strokeWidth={1.75} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Distribution by Category + Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Leaf className="h-5 w-5 text-green-500" strokeWidth={1.75} />
                      Distribuzione per Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categories.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Nessuna vendita nel periodo selezionato
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {categories.map((cat, i) => (
                          <motion.div
                            key={cat.name}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium">{cat.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(cat.revenue)}
                                </span>
                                <span className="text-sm font-semibold w-16 text-right">{cat.percentage}%</span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.percentage}%` }}
                                transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.23, 1, 0.32, 1] as const }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Monthly Trend Stacked Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.25 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      Trend Ultimi 6 Mesi (Top Categorie)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!hasTrendData ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Nessuna vendita negli ultimi 6 mesi
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                          {trendCategories.map((cat, i) => (
                            <div key={cat} className="flex items-center gap-1.5">
                              <div className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
                              <span className="text-xs text-muted-foreground">{cat}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-end gap-1.5 h-52">
                          {trendMonths.map((item, i) => {
                            const total = trendCategories.reduce((sum, c) => sum + (item.values[c] ?? 0), 0)
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <div
                                  className="w-full flex flex-col-reverse items-stretch"
                                  style={{ height: `${(total / maxMonthlyValue) * 100}%` }}
                                >
                                  {trendCategories.map((cat, ci) => {
                                    const value = item.values[cat] ?? 0
                                    if (total === 0) return null
                                    return (
                                      <motion.div
                                        key={cat}
                                        className={`w-full opacity-80 hover:opacity-100 transition-opacity ${CATEGORY_COLORS[ci % CATEGORY_COLORS.length]} first:rounded-b-md last:rounded-t-md`}
                                        initial={{ flex: 0 }}
                                        animate={{ flex: value }}
                                        transition={{ duration: 0.5, delay: 0.05 * ci + i * 0.04, ease: [0.23, 1, 0.32, 1] as const }}
                                        title={`${cat}: ${formatCurrency(value)}`}
                                      />
                                    )
                                  })}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Top Products Table */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
                    Classifica Prodotti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(report?.topProducts.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nessun prodotto venduto nel periodo
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pl-2">#</th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Prodotto</th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Categoria</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3">Quantità</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3">Ricavo</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report!.topProducts.map((product, i) => (
                            <motion.tr
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35 + i * 0.03, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
                              className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                            >
                              <td className="py-3 pl-2">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                                    i < 3
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="text-sm font-medium">{product.name}</span>
                              </td>
                              <td className="py-3">
                                <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                              </td>
                              <td className="py-3 text-right text-sm">
                                {formatNumber(product.quantity)} {PRODUCT_UNIT_LABELS[product.unit] ?? product.unit}
                              </td>
                              <td className="py-3 text-right text-sm font-semibold">
                                {formatCurrency(product.revenue)}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                {product.trend === null ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                      product.trend >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {product.trend >= 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {product.trend >= 0 ? "+" : ""}
                                    {product.trend}%
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
