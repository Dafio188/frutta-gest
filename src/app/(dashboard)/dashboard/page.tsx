/**
 * Dashboard Principale — KPI operativi, grafici, attivita recente
 *
 * Vista d'insieme dell'attivita ortofrutticola con card animate,
 * grafico vendite, top prodotti/clienti e attivita recente.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShoppingCart, FileText, CreditCard, AlertTriangle,
  TrendingUp, TrendingDown, Package, Users, Truck,
  Plus, ArrowRight, Clock, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getDashboardKPIs, getRecentActivity } from "@/lib/actions"
import type { DashboardKPI } from "@/types"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])
  return <>{prefix}{display.toLocaleString("it-IT")}{suffix}</>
}

const kpiCards = [
  { key: "ordiniOggi", label: "Ordini Oggi", icon: ShoppingCart, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", href: "/ordini" },
  { key: "fatturatoMese", label: "Fatturato Mese", icon: TrendingUp, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", currency: true, href: "/report/vendite" },
  { key: "fattureDaIncassare", label: "Da Incassare", icon: CreditCard, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400", currency: true, href: "/finanza" },
  { key: "fattureScadute", label: "Fatture Scadute", icon: AlertTriangle, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400", href: "/fatture" },
]

interface ActivityItem {
  id: string
  action: string
  entity?: string | null
  details?: Record<string, unknown> | null
  createdAt: string
  user?: { id: string; name: string | null; email: string } | null
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPI | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [kpiData, activityData] = await Promise.all([
        getDashboardKPIs(),
        getRecentActivity(10),
      ])
      setKpis(kpiData as unknown as DashboardKPI)
      setActivities(activityData as unknown as ActivityItem[])
    } catch (err) {
      console.error("Errore caricamento dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const fatturatoChange = kpis
    ? kpis.fatturatoMesePrec > 0
      ? ((kpis.fatturatoMese - kpis.fatturatoMesePrec) / kpis.fatturatoMesePrec * 100).toFixed(1)
      : "0"
    : "0"

  const getActivityIcon = (action: string) => {
    if (action.includes("ORDER")) return { icon: ShoppingCart, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" }
    if (action.includes("DELIVERY") || action.includes("DDT")) return { icon: Truck, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" }
    if (action.includes("INVOICE") || action.includes("PAYMENT")) return { icon: CreditCard, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" }
    if (action.includes("CUSTOMER")) return { icon: Users, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" }
    return { icon: Package, color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" }
  }

  const formatActivityAction = (activity: ActivityItem) => {
    const details = activity.details as Record<string, unknown> | null
    const action = activity.action
    if (action === "CREATE_ORDER") return `Nuovo ordine ${details?.orderNumber || ""} creato`
    if (action === "UPDATE_ORDER_STATUS") return `Ordine ${details?.orderNumber || ""} aggiornato a ${details?.newStatus || ""}`
    if (action === "CREATE_CUSTOMER") return `Nuovo cliente ${details?.companyName || ""} registrato`
    if (action === "UPDATE_CUSTOMER") return `Cliente ${details?.companyName || ""} aggiornato`
    if (action === "CREATE_INVOICE") return `Fattura ${details?.invoiceNumber || ""} creata`
    if (action === "CREATE_DELIVERY_NOTE") return `DDT ${details?.ddtNumber || ""} creata`
    return action.replace(/_/g, " ").toLowerCase()
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "ora"
    if (minutes < 60) return `${minutes} min fa`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`
    const days = Math.floor(hours / 24)
    return `${days} ${days === 1 ? "giorno" : "giorni"} fa`
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panoramica della tua attivita — {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ordini/nuovo">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuovo Ordine
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <motion.div key={kpi.key} variants={fadeUp}>
            <Link href={kpi.href}>
              <Card className="hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      {loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <p className="text-2xl font-bold tracking-tight">
                          {kpi.currency ? (
                            <AnimatedCounter value={(kpis as any)?.[kpi.key] || 0} prefix="€ " />
                          ) : (
                            <AnimatedCounter value={(kpis as any)?.[kpi.key] || 0} />
                          )}
                        </p>
                      )}
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  </div>
                  {kpi.key === "fatturatoMese" && kpis && (
                    <div className="flex items-center gap-1 mt-2">
                      {Number(fatturatoChange) >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${Number(fatturatoChange) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fatturatoChange}% vs mese precedente
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Ordini in attesa", value: kpis?.ordiniInAttesa || 0, icon: ShoppingCart, href: "/ordini", color: "text-blue-600" },
                { label: "DDT da emettere", value: kpis?.ddtDaEmettere || 0, icon: Truck, href: "/bolle", color: "text-purple-600" },
                { label: "Fatture scadute", value: kpis?.fattureScadute || 0, icon: FileText, href: "/fatture", color: "text-red-600" },
                { label: "Da pagare", value: kpis?.daPagare || 0, icon: CreditCard, href: "/finanza", currency: true, color: "text-amber-600" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                    <action.icon className={`h-5 w-5 ${action.color}`} strokeWidth={1.75} />
                    <span className="text-lg font-bold">
                      {loading ? "—" : action.currency ? formatCurrency(action.value) : action.value}
                    </span>
                    <span className="text-xs text-muted-foreground text-center">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Attivita Recente</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Ultimo aggiornamento: ora
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nessuna attivita recente</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const { icon: ActivityIcon, color } = getActivityIcon(activity.action)
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${color}`}>
                        <ActivityIcon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{formatActivityAction(activity)}</p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(activity.createdAt)}
                          {activity.user?.name && ` — ${activity.user.name}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
