/**
 * Admin Dashboard
 *
 * Panoramica con KPI, grafici attivita, utenti recenti
 * e log delle azioni. Accessibile solo agli amministratori.
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Users, ShoppingCart, Package, TrendingUp,
  Activity, ArrowUpRight, ArrowDownRight, Clock,
  Shield, Settings, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/constants"

const MOCK_STATS = {
  totalUsers: 12,
  activeUsers: 8,
  totalOrders: 342,
  ordersThisMonth: 48,
  totalProducts: 85,
  totalRevenue: 128450.00,
  revenueChange: 12.5,
  ordersChange: 8.2,
}

const MOCK_RECENT_USERS = [
  { id: "u1", name: "Mario Rossi", email: "mario@fruttagest.it", role: "ADMIN", lastLogin: "2025-02-12T10:30:00Z", isActive: true },
  { id: "u2", name: "Lucia Bianchi", email: "lucia@fruttagest.it", role: "OPERATOR", lastLogin: "2025-02-12T09:15:00Z", isActive: true },
  { id: "u3", name: "Giuseppe Verdi", email: "giuseppe@fruttagest.it", role: "OPERATOR", lastLogin: "2025-02-11T17:45:00Z", isActive: true },
  { id: "u4", name: "Anna Esposito", email: "anna@fruttagest.it", role: "VIEWER", lastLogin: "2025-02-10T14:00:00Z", isActive: false },
]

const MOCK_ACTIVITY_LOG = [
  { id: "a1", user: "Mario Rossi", action: "LOGIN", description: "Accesso al sistema", createdAt: "2025-02-12T10:30:00Z" },
  { id: "a2", user: "Lucia Bianchi", action: "CREATE_ORDER", description: "Creato ordine ORD-2025-0042", createdAt: "2025-02-12T09:20:00Z" },
  { id: "a3", user: "Mario Rossi", action: "UPDATE_SETTING", description: "Aggiornate impostazioni azienda", createdAt: "2025-02-12T09:00:00Z" },
  { id: "a4", user: "Giuseppe Verdi", action: "CREATE_PRODUCT", description: "Aggiunto prodotto: Kiwi Hayward", createdAt: "2025-02-11T16:30:00Z" },
  { id: "a5", user: "Lucia Bianchi", action: "UPDATE_CUSTOMER", description: "Aggiornato cliente: Hotel Vesuvio", createdAt: "2025-02-11T15:00:00Z" },
  { id: "a6", user: "Mario Rossi", action: "DELETE_USER", description: "Disattivato utente: Anna Esposito", createdAt: "2025-02-11T11:00:00Z" },
  { id: "a7", user: "Giuseppe Verdi", action: "CREATE_INVOICE", description: "Emessa fattura FT-2025-0030", createdAt: "2025-02-11T10:00:00Z" },
  { id: "a8", user: "Lucia Bianchi", action: "LOGIN", description: "Accesso al sistema", createdAt: "2025-02-11T09:00:00Z" },
]

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  CREATE_ORDER: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  CREATE_PRODUCT: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  CREATE_INVOICE: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE_SETTING: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  UPDATE_CUSTOMER: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  DELETE_USER: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

const ROLE_BADGE_VARIANT: Record<string, "default" | "info" | "warning"> = {
  ADMIN: "default",
  OPERATOR: "info",
  VIEWER: "warning",
}

export default function AdminDashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pannello Admin</h1>
            <p className="text-muted-foreground">Panoramica del sistema e gestione</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/users">
              <Button variant="outline">
                <Users className="h-4 w-4" strokeWidth={1.75} />
                Gestisci Utenti
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline">
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                Impostazioni
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Utenti Totali</span>
                  <Users className="h-4 w-4 text-blue-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{MOCK_STATS.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{MOCK_STATS.activeUsers} attivi ora</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Ordini Mese</span>
                  <ShoppingCart className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{MOCK_STATS.ordersThisMonth}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">+{MOCK_STATS.ordersChange}%</span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Prodotti</span>
                  <Package className="h-4 w-4 text-purple-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{MOCK_STATS.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-0.5">nel catalogo</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Fatturato Mese</span>
                  <TrendingUp className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(MOCK_STATS.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">+{MOCK_STATS.revenueChange}%</span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <StaggerContainer>
            <StaggerItem>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Utenti Recenti
                  </CardTitle>
                  <Link href="/admin/users">
                    <Button variant="ghost" className="text-xs">Vedi tutti</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MOCK_RECENT_USERS.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <Badge variant={ROLE_BADGE_VARIANT[user.role] || "default"} className="text-[10px]">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                          {!user.isActive && <Badge variant="destructive" className="text-[10px]">Inattivo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{formatDateTime(user.lastLogin)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Activity Log */}
          <StaggerContainer>
            <StaggerItem>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Attivita Recenti
                  </CardTitle>
                  <Link href="/admin/activity">
                    <Button variant="ghost" className="text-xs">Vedi tutto</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_ACTIVITY_LOG.slice(0, 6).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${ACTION_COLORS[log.action] || "bg-muted text-muted-foreground"}`}>
                          <Activity className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{log.user}</span>
                            <span className="text-muted-foreground"> - {log.description}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Quick Links */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StaggerItem>
            <Link href="/admin/users">
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Shield className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium text-sm">Gestione Utenti</p>
                  <p className="text-xs text-muted-foreground">Ruoli, permessi, accessi</p>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/admin/settings">
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Settings className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium text-sm">Impostazioni App</p>
                  <p className="text-xs text-muted-foreground">Configurazione sistema</p>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/admin/activity">
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <FileText className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-medium text-sm">Log Attivita</p>
                  <p className="text-xs text-muted-foreground">Audit e cronologia</p>
                </div>
              </motion.div>
            </Link>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
