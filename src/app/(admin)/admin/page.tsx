/**
 * Admin Dashboard — Pannello Amministratore Tenant
 *
 * Accessibile solo dagli Admin del tenant (NON dal SuperAdmin).
 * Mostra panoramica sistema, utenti, log attività e link rapidi — dati reali dal DB.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users, ShoppingCart, Package, TrendingUp,
  Activity, Shield, Settings, FileText, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/constants"
import { getAdminStats, getUsers, getRecentActivity } from "@/lib/actions"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  ordersThisMonth: number
  ordersChange: number | null
  totalProducts: number
  totalRevenue: number
  revenueChange: number | null
}

interface RecentUser {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
}

interface RecentLog {
  id: string
  action: string
  entity: string | null
  createdAt: string
  user: { name: string | null; email: string } | null
}

function prettifyAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsResult, usersResult, logsResult] = await Promise.all([
        getAdminStats(),
        getUsers({ page: 1, pageSize: 5 }),
        getRecentActivity(5),
      ])
      setStats(statsResult as unknown as AdminStats)
      setRecentUsers((usersResult as unknown as { data: RecentUser[] }).data)
      setRecentLogs(logsResult as unknown as RecentLog[])
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const kpiCards = stats
    ? [
        {
          label: "Utenti Piattaforma",
          value: stats.totalUsers.toString(),
          sub: `${stats.activeUsers} attivi`,
          icon: Users,
          color: "text-blue-500",
        },
        {
          label: "Ordini Mese",
          value: stats.ordersThisMonth.toString(),
          sub: stats.ordersChange !== null
            ? `${stats.ordersChange >= 0 ? "+" : ""}${stats.ordersChange}% vs mese scorso`
            : stats.ordersThisMonth > 0 ? "questo mese" : "Nessun ordine",
          icon: ShoppingCart,
          color: "text-emerald-500",
        },
        {
          label: "Prodotti Catalogo",
          value: stats.totalProducts.toString(),
          sub: "nel catalogo attivo",
          icon: Package,
          color: "text-purple-500",
        },
        {
          label: "Fatturato Mese",
          value: formatCurrency(stats.totalRevenue),
          sub: stats.revenueChange !== null
            ? `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}% vs mese scorso`
            : "questo mese",
          icon: TrendingUp,
          color: "text-amber-500",
        },
      ]
    : []

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pannello Admin</h1>
            <p className="text-muted-foreground">Gestione sistema e utenti della tua piattaforma</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4" strokeWidth={1.75} />
                Gestisci Utenti
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map(({ label, value, sub, icon: Icon, color }) => (
                <StaggerItem key={label}>
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                      </div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Utenti recenti e Log attività */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Utenti Recenti
                  </CardTitle>
                  <Link href="/admin/users">
                    <Button variant="ghost" size="sm" className="text-xs">Vedi tutti</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentUsers.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                      <p className="text-sm text-muted-foreground">Nessun utente recente</p>
                      <Link href="/admin/users">
                        <Button variant="outline" size="sm" className="mt-3">Gestisci Utenti</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Badge variant={user.isActive ? "success" : "secondary"} className="text-xs shrink-0">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Log Attività
                  </CardTitle>
                  <Link href="/admin/activity">
                    <Button variant="ghost" size="sm" className="text-xs">Vedi tutto</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentLogs.length === 0 ? (
                    <div className="py-8 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                      <p className="text-sm text-muted-foreground">Nessun log disponibile</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {prettifyAction(log.action)}
                              {log.entity ? ` — ${log.entity}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {log.user?.name ?? log.user?.email ?? "Sistema"} · {formatDateTime(log.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accesso rapido — solo sezioni admin */}
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  href: "/admin/users",
                  label: "Gestione Utenti",
                  sub: "Ruoli, permessi e accessi",
                  icon: Shield,
                  bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                },
                {
                  href: "/admin/settings",
                  label: "Impostazioni App",
                  sub: "Configurazione piattaforma",
                  icon: Settings,
                  bg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                },
                {
                  href: "/admin/activity",
                  label: "Log Attività",
                  sub: "Audit e cronologia azioni",
                  icon: FileText,
                  bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                },
              ].map(({ href, label, sub, icon: Icon, bg }) => (
                <StaggerItem key={href}>
                  <Link href={href}>
                    <motion.div
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${bg}`}>
                        <Icon className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                    </motion.div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

      </div>
    </PageTransition>
  )
}
