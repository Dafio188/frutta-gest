/**
 * Report Analisi Prodotti
 *
 * Prodotti più venduti, distribuzione per categoria,
 * trend quantità e stagionalità.
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Package, TrendingUp, TrendingDown, BarChart3,
  Apple, Carrot, Leaf, ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency } from "@/lib/utils"

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

const MOCK_CATEGORIES = [
  { name: "Frutta", quantity: 3450, revenue: 9975, color: "bg-red-500", percentage: 32 },
  { name: "Verdura", quantity: 2860, revenue: 7722, color: "bg-green-500", percentage: 26 },
  { name: "Ortaggi", quantity: 2230, revenue: 5352, color: "bg-orange-500", percentage: 21 },
  { name: "Erbe Aromatiche", quantity: 1160, revenue: 3596, color: "bg-emerald-500", percentage: 11 },
  { name: "Frutta Esotica", quantity: 680, revenue: 2380, color: "bg-purple-500", percentage: 6 },
  { name: "Frutta Secca", quantity: 420, revenue: 5040, color: "bg-amber-500", percentage: 4 },
]

const MOCK_TOP_PRODUCTS = [
  { name: "Pomodori San Marzano", category: "Verdura", quantity: 1240, revenue: 3720, unit: "Kg", trend: 15.2 },
  { name: "Mele Golden", category: "Frutta", quantity: 980, revenue: 2450, unit: "Kg", trend: 8.5 },
  { name: "Zucchine", category: "Verdura", quantity: 860, revenue: 2408, unit: "Kg", trend: -3.2 },
  { name: "Arance Tarocco", category: "Frutta", quantity: 750, revenue: 2100, unit: "Kg", trend: 22.1 },
  { name: "Lattuga Romana", category: "Verdura", quantity: 620, revenue: 1116, unit: "Pz", trend: 1.8 },
  { name: "Peperoni Rossi", category: "Ortaggi", quantity: 580, revenue: 2030, unit: "Kg", trend: -5.4 },
  { name: "Basilico Fresco", category: "Erbe", quantity: 540, revenue: 810, unit: "Mazzo", trend: 12.0 },
  { name: "Limoni di Amalfi", category: "Frutta", quantity: 480, revenue: 1680, unit: "Kg", trend: 6.7 },
  { name: "Carote", category: "Ortaggi", quantity: 420, revenue: 756, unit: "Kg", trend: -1.3 },
  { name: "Noci", category: "Frutta Secca", quantity: 380, revenue: 4560, unit: "Kg", trend: 18.9 },
]

const MOCK_MONTHLY_TREND = [
  { label: "Gen", frutta: 3200, verdura: 2800, ortaggi: 1900 },
  { label: "Feb", frutta: 3500, verdura: 2600, ortaggi: 2100 },
  { label: "Mar", frutta: 3100, verdura: 3200, ortaggi: 2400 },
  { label: "Apr", frutta: 2800, verdura: 3800, ortaggi: 2900 },
  { label: "Mag", frutta: 3600, verdura: 3500, ortaggi: 2600 },
  { label: "Giu", frutta: 4200, verdura: 3100, ortaggi: 2200 },
  { label: "Lug", frutta: 4800, verdura: 2700, ortaggi: 1800 },
  { label: "Ago", frutta: 4500, verdura: 2400, ortaggi: 1600 },
  { label: "Set", frutta: 3800, verdura: 3300, ortaggi: 2500 },
  { label: "Ott", frutta: 3400, verdura: 3600, ortaggi: 2800 },
  { label: "Nov", frutta: 3000, verdura: 3400, ortaggi: 2600 },
  { label: "Dic", frutta: 3300, verdura: 2900, ortaggi: 2300 },
]

export default function ReportProdottiPage() {
  const [period, setPeriod] = useState<Period>("30d")

  const totalProducts = MOCK_CATEGORIES.reduce((sum, c) => sum + c.quantity, 0)
  const totalRevenue = MOCK_CATEGORIES.reduce((sum, c) => sum + c.revenue, 0)
  const maxMonthlyValue = Math.max(
    ...MOCK_MONTHLY_TREND.map((m) => m.frutta + m.verdura + m.ortaggi)
  )

  const kpis = [
    {
      label: "Prodotti Venduti",
      value: totalProducts.toLocaleString("it-IT"),
      subtitle: "unità totali",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Fatturato Prodotti",
      value: formatCurrency(totalRevenue),
      subtitle: "ricavo totale",
      icon: BarChart3,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Categorie Attive",
      value: MOCK_CATEGORIES.length.toString(),
      subtitle: "su catalogo",
      icon: Apple,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
  ]

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Leaf className="h-5 w-5 text-green-500" strokeWidth={1.75} />
                  Distribuzione per Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_CATEGORIES.map((cat, i) => (
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
                            {cat.quantity.toLocaleString("it-IT")} unità
                          </span>
                          <span className="text-sm font-semibold w-16 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${cat.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.23, 1, 0.32, 1] as const }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Trend Stacked Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Trend Mensile per Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Frutta</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Verdura</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground">Ortaggi</span>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-52">
                  {MOCK_MONTHLY_TREND.map((item, i) => {
                    const total = item.frutta + item.verdura + item.ortaggi
                    const fruttaH = (item.frutta / maxMonthlyValue) * 100
                    const verduraH = (item.verdura / maxMonthlyValue) * 100
                    const ortaggiH = (item.ortaggi / maxMonthlyValue) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex flex-col items-stretch" style={{ height: `${((total / maxMonthlyValue) * 100)}%` }}>
                          <motion.div
                            className="w-full rounded-t-md bg-red-500/80"
                            initial={{ height: 0 }}
                            animate={{ flex: fruttaH }}
                            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] as const }}
                          />
                          <motion.div
                            className="w-full bg-green-500/80"
                            initial={{ height: 0 }}
                            animate={{ flex: verduraH }}
                            transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: [0.23, 1, 0.32, 1] as const }}
                          />
                          <motion.div
                            className="w-full rounded-b-md bg-orange-500/80"
                            initial={{ height: 0 }}
                            animate={{ flex: ortaggiH }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.04, ease: [0.23, 1, 0.32, 1] as const }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
                      </div>
                    )
                  })}
                </div>
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
                    {MOCK_TOP_PRODUCTS.map((product, i) => (
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
                          {product.quantity.toLocaleString("it-IT")} {product.unit}
                        </td>
                        <td className="py-3 text-right text-sm font-semibold">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="py-3 pr-2 text-right">
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
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
