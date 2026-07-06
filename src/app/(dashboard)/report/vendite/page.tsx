/**
 * Report Vendite
 *
 * Dashboard analitica con KPI di fatturato, grafico a barre animato,
 * selettore periodo, top 10 prodotti e top 10 clienti — dati reali dal DB.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Receipt,
  BarChart3, Crown, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getSalesReport } from "@/lib/actions"

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

interface SalesReport {
  kpis: {
    revenue: number
    revenueChange: number | null
    orders: number
    ordersChange: number | null
    avgOrder: number
    avgOrderChange: number | null
  }
  chart: { label: string; value: number }[]
  topProducts: { productId: string; productName: string; totalQuantity: number; totalRevenue: number; unit: string }[]
  topCustomers: { customerId: string; customerName: string; totalOrders: number; totalRevenue: number }[]
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="text-sm text-muted-foreground mt-2 block">— vs periodo prec.</span>
  }
  const positive = change >= 0
  return (
    <div
      className={`flex items-center gap-1 mt-2 text-sm ${
        positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
      }`}
    >
      {positive ? (
        <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <TrendingDown className="h-4 w-4" strokeWidth={1.75} />
      )}
      <span>
        {positive ? "+" : ""}
        {change}%
      </span>
      <span className="text-muted-foreground ml-1">vs periodo prec.</span>
    </div>
  )
}

export default function ReportVenditePage() {
  const [period, setPeriod] = useState<Period>("30d")
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<SalesReport | null>(null)

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getSalesReport(PERIOD_DAYS[period])
      setReport(result as unknown as SalesReport)
    } catch {} finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadReport() }, [loadReport])

  const chart = report?.chart ?? []
  const maxBarValue = Math.max(1, ...chart.map((d) => d.value))
  const hasChartData = chart.some((d) => d.value > 0)
  const showBarLabels = chart.length <= 14

  const kpis = report
    ? [
        {
          label: "Fatturato Periodo",
          value: formatCurrency(report.kpis.revenue),
          change: report.kpis.revenueChange,
          icon: Receipt,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          label: "Ordini Totali",
          value: formatNumber(report.kpis.orders),
          change: report.kpis.ordersChange,
          icon: ShoppingCart,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
          label: "Ordine Medio",
          value: formatCurrency(report.kpis.avgOrder),
          change: report.kpis.avgOrderChange,
          icon: BarChart3,
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-100 dark:bg-purple-900/30",
        },
      ]
    : []

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Report Vendite</h1>
            <p className="text-muted-foreground mt-1">Analisi del fatturato e trend di vendita</p>
          </div>

          {/* Period selector */}
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
                          <ChangeIndicator change={kpi.change} />
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

            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Andamento Fatturato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasChartData ? (
                    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                      Nessuna fattura emessa nel periodo selezionato
                    </div>
                  ) : (
                    <div className="flex items-end gap-1.5 h-64">
                      {chart.map((item, i) => {
                        const heightPercent = (item.value / maxBarValue) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                            {showBarLabels && (
                              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-full">
                                {item.value > 0 ? formatCurrency(item.value).replace("EUR", "").replace(",00", "") : ""}
                              </span>
                            )}
                            <motion.div
                              className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors cursor-pointer relative group"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(heightPercent, item.value > 0 ? 2 : 0)}%` }}
                              transition={{
                                duration: 0.6,
                                delay: i * 0.03,
                                ease: [0.23, 1, 0.32, 1] as const,
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
                                {item.label}: {formatCurrency(item.value)}
                              </div>
                            </motion.div>
                            <span className={`text-[10px] text-muted-foreground font-medium truncate max-w-full ${chart.length > 20 && i % 2 !== 0 ? "invisible" : ""}`}>
                              {item.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Products & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 Products */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                      Top 10 Prodotti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(report?.topProducts.length ?? 0) === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nessun prodotto venduto nel periodo
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {report!.topProducts.map((product, i) => (
                          <motion.div
                            key={product.productId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.04, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                i < 3
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(product.totalQuantity)} {PRODUCT_UNIT_LABELS[product.unit] ?? product.unit}
                              </p>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(product.totalRevenue)}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top 10 Customers */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.35 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
                      Top 10 Clienti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(report?.topCustomers.length ?? 0) === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nessun ordine nel periodo
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {report!.topCustomers.map((customer, i) => (
                          <motion.div
                            key={customer.customerId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.04, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                i < 3
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{customer.customerName}</p>
                              <p className="text-xs text-muted-foreground">{customer.totalOrders} ordini</p>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(customer.totalRevenue)}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
