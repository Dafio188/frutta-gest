/**
 * Report Vendite
 *
 * Dashboard analitica con KPI di fatturato, grafico a barre animato,
 * selettore periodo, top 10 prodotti e top 10 clienti.
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Receipt,
  BarChart3, Crown,
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

// Mock data per il grafico mensile
const MOCK_MONTHLY_DATA = [
  { label: "Gen", value: 12400 },
  { label: "Feb", value: 18200 },
  { label: "Mar", value: 15600 },
  { label: "Apr", value: 22100 },
  { label: "Mag", value: 19800 },
  { label: "Giu", value: 24500 },
  { label: "Lug", value: 21300 },
  { label: "Ago", value: 16700 },
  { label: "Set", value: 23900 },
  { label: "Ott", value: 27100 },
  { label: "Nov", value: 25400 },
  { label: "Dic", value: 29800 },
]

const MOCK_TOP_PRODUCTS = [
  { name: "Pomodori San Marzano", quantity: 1240, revenue: 3720, unit: "Kg" },
  { name: "Mele Golden", quantity: 980, revenue: 2940, unit: "Kg" },
  { name: "Zucchine", quantity: 860, revenue: 2150, unit: "Kg" },
  { name: "Arance Tarocco", quantity: 750, revenue: 1875, unit: "Kg" },
  { name: "Lattuga Romana", quantity: 620, revenue: 1240, unit: "Pz" },
  { name: "Peperoni Rossi", quantity: 580, revenue: 1740, unit: "Kg" },
  { name: "Basilico Fresco", quantity: 540, revenue: 1620, unit: "Mazzo" },
  { name: "Limoni Amalfi", quantity: 480, revenue: 1440, unit: "Kg" },
  { name: "Carote", quantity: 420, revenue: 840, unit: "Kg" },
  { name: "Melanzane", quantity: 380, revenue: 950, unit: "Kg" },
]

const MOCK_TOP_CUSTOMERS = [
  { name: "Ristorante Da Mario", orders: 45, revenue: 12500 },
  { name: "Trattoria Il Borgo", orders: 38, revenue: 10200 },
  { name: "Hotel Villa Rosa", orders: 32, revenue: 9800 },
  { name: "Pizzeria Napoletana", orders: 28, revenue: 7600 },
  { name: "Bar Centrale", orders: 25, revenue: 5400 },
  { name: "Mensa Universitaria", orders: 22, revenue: 8900 },
  { name: "Gastronomia Sapori", orders: 20, revenue: 6100 },
  { name: "Ristorante La Pergola", orders: 18, revenue: 5800 },
  { name: "Supermercato FreshMart", orders: 15, revenue: 4200 },
  { name: "Hotel Belvedere", orders: 12, revenue: 3900 },
]

export default function ReportVenditePage() {
  const [period, setPeriod] = useState<Period>("30d")

  const maxBarValue = Math.max(...MOCK_MONTHLY_DATA.map((d) => d.value))

  const kpis = [
    {
      label: "Fatturato Periodo",
      value: formatCurrency(45230.5),
      change: 12.5,
      positive: true,
      icon: Receipt,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Ordini Totali",
      value: "156",
      change: 8.2,
      positive: true,
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Scontrino Medio",
      value: formatCurrency(290.0),
      change: -3.1,
      positive: false,
      icon: BarChart3,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ]

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
                      <div
                        className={`flex items-center gap-1 mt-2 text-sm ${
                          kpi.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                        }`}
                      >
                        {kpi.positive ? (
                          <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                          <TrendingDown className="h-4 w-4" strokeWidth={1.75} />
                        )}
                        <span>
                          {kpi.positive ? "+" : ""}
                          {kpi.change}%
                        </span>
                        <span className="text-muted-foreground ml-1">vs periodo prec.</span>
                      </div>
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
                Andamento Fatturato Mensile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-64">
                {MOCK_MONTHLY_DATA.map((item, i) => {
                  const heightPercent = (item.value / maxBarValue) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {formatCurrency(item.value).replace("EUR", "").replace(",00", "")}
                      </span>
                      <motion.div
                        className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors cursor-pointer relative group"
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{
                          duration: 0.6,
                          delay: i * 0.05,
                          ease: [0.23, 1, 0.32, 1] as const,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                          {formatCurrency(item.value)}
                        </div>
                      </motion.div>
                      <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                    </div>
                  )
                })}
              </div>
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
                <div className="space-y-3">
                  {MOCK_TOP_PRODUCTS.map((product, i) => (
                    <motion.div
                      key={i}
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
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} {product.unit}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(product.revenue)}</span>
                    </motion.div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {MOCK_TOP_CUSTOMERS.map((customer, i) => (
                    <motion.div
                      key={i}
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
                        <p className="text-sm font-medium truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.orders} ordini</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(customer.revenue)}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
