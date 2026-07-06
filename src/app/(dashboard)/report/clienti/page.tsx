/**
 * Report Analisi Clienti
 *
 * Top clienti per fatturato, distribuzione per tipologia,
 * frequenza ordini e trend — dati reali dal DB.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users, TrendingUp, TrendingDown, UserPlus, Receipt,
  BarChart3, Crown, Loader2, MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants"
import { getCustomersReport } from "@/lib/actions"

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

const TYPE_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-gray-500",
]

interface CustomersReport {
  kpis: { activeCustomers: number; newCustomers: number; revenue: number; avgPerCustomer: number }
  typeDistribution: { type: string; customers: number; revenue: number; percentage: number }[]
  topCustomers: {
    customerId: string; companyName: string; type: string; city: string
    totalOrders: number; totalRevenue: number; avgOrder: number; trend: number | null
  }[]
}

export default function ReportClientiPage() {
  const [period, setPeriod] = useState<Period>("30d")
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<CustomersReport | null>(null)

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getCustomersReport(PERIOD_DAYS[period])
      setReport(result as unknown as CustomersReport)
    } catch {} finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadReport() }, [loadReport])

  const kpis = report
    ? [
        {
          label: "Clienti Attivi",
          value: formatNumber(report.kpis.activeCustomers),
          subtitle: "con ordini nel periodo",
          icon: Users,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
          label: "Nuovi Clienti",
          value: formatNumber(report.kpis.newCustomers),
          subtitle: "registrati nel periodo",
          icon: UserPlus,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
          label: "Fatturato Ordini",
          value: formatCurrency(report.kpis.revenue),
          subtitle: "totale ordini nel periodo",
          icon: Receipt,
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-100 dark:bg-purple-900/30",
        },
        {
          label: "Media per Cliente",
          value: formatCurrency(report.kpis.avgPerCustomer),
          subtitle: "fatturato medio",
          icon: BarChart3,
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
            <h1 className="text-2xl font-semibold tracking-tight">Analisi Clienti</h1>
            <p className="text-muted-foreground mt-1">Top clienti, tipologie e frequenza ordini</p>
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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

            {/* Type distribution */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-purple-500" strokeWidth={1.75} />
                    Fatturato per Tipologia Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(report?.typeDistribution.length ?? 0) === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Nessun ordine nel periodo selezionato
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {report!.typeDistribution.map((entry, i) => (
                        <motion.div
                          key={entry.type}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium">
                              {CUSTOMER_TYPE_LABELS[entry.type] ?? entry.type}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {entry.customers} {entry.customers === 1 ? "cliente" : "clienti"} · {formatCurrency(entry.revenue)}
                              </span>
                              <span className="text-sm font-semibold w-16 text-right">{entry.percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${TYPE_COLORS[i % TYPE_COLORS.length]}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${entry.percentage}%` }}
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

            {/* Top Customers Table */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                    Top Clienti per Fatturato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(report?.topCustomers.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nessun ordine nel periodo
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3 pl-2">#</th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Cliente</th>
                            <th className="text-left text-xs font-medium text-muted-foreground pb-3">Tipologia</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3">Ordini</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3">Ordine Medio</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3">Fatturato</th>
                            <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report!.topCustomers.map((customer, i) => (
                            <motion.tr
                              key={customer.customerId}
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
                                <Link
                                  href={`/clienti/${customer.customerId}`}
                                  className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                  {customer.companyName}
                                </Link>
                                {customer.city && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" strokeWidth={1.75} />
                                    {customer.city}
                                  </p>
                                )}
                              </td>
                              <td className="py-3">
                                <Badge variant="secondary" className="text-xs">
                                  {CUSTOMER_TYPE_LABELS[customer.type] ?? customer.type}
                                </Badge>
                              </td>
                              <td className="py-3 text-right text-sm">{customer.totalOrders}</td>
                              <td className="py-3 text-right text-sm">{formatCurrency(customer.avgOrder)}</td>
                              <td className="py-3 text-right text-sm font-semibold">
                                {formatCurrency(customer.totalRevenue)}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                {customer.trend === null ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                      customer.trend >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {customer.trend >= 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {customer.trend >= 0 ? "+" : ""}
                                    {customer.trend}%
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
