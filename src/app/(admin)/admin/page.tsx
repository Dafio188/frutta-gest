/**
 * Admin Dashboard — Pannello Amministratore Tenant
 *
 * Accessibile solo dagli Admin del tenant (NON dal SuperAdmin).
 * Mostra panoramica sistema, utenti, log attività e link rapidi.
 */

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users, ShoppingCart, Package, TrendingUp,
  Activity, ArrowUpRight, Shield, Settings, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency } from "@/lib/utils"

// TODO: Sostituire con dati reali via Server Action
const MOCK_STATS = {
  totalUsers: 0,
  activeUsers: 0,
  ordersThisMonth: 0,
  ordersChange: 0,
  totalProducts: 0,
  totalRevenue: 0,
  revenueChange: 0,
}

export default function AdminDashboardPage() {
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

        {/* KPI Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Utenti Piattaforma",
              value: MOCK_STATS.totalUsers,
              sub: `${MOCK_STATS.activeUsers} attivi`,
              icon: Users,
              color: "text-blue-500",
            },
            {
              label: "Ordini Mese",
              value: MOCK_STATS.ordersThisMonth,
              sub: MOCK_STATS.ordersChange > 0 ? `+${MOCK_STATS.ordersChange}% vs mese scorso` : "Nessun ordine",
              icon: ShoppingCart,
              color: "text-emerald-500",
            },
            {
              label: "Prodotti Catalogo",
              value: MOCK_STATS.totalProducts,
              sub: "nel catalogo attivo",
              icon: Package,
              color: "text-purple-500",
            },
            {
              label: "Fatturato Mese",
              value: formatCurrency(MOCK_STATS.totalRevenue),
              sub: MOCK_STATS.revenueChange > 0 ? `+${MOCK_STATS.revenueChange}%` : "Dati non disponibili",
              icon: TrendingUp,
              color: "text-amber-500",
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
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

        {/* Attività recente e Utenti — placholder vuoti pronti per integrazione DB */}
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
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">Nessun utente recente</p>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="mt-3">Gestisci Utenti</Button>
                </Link>
              </div>
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
              <div className="py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">Nessun log disponibile</p>
              </div>
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

      </div>
    </PageTransition>
  )
}
