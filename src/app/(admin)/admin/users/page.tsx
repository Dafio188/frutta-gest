/**
 * Gestione Utenti — Admin Panel
 *
 * Pagina di amministrazione per la gestione completa degli utenti.
 * Mostra statistiche riepilogative, tabella con ricerca e filtri,
 * e azioni rapide per ogni utente (modifica ruolo, attiva/disattiva, elimina).
 */

"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Shield,
  Search,
  UserPlus,
  MoreHorizontal,
  Check,
  X,
  Mail,
} from "lucide-react"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import { ROLE_LABELS } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils"

// ── Tipi ──────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  role: "ADMIN" | "OPERATOR" | "VIEWER" | "CUSTOMER"
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  emailVerified: string | null
  _count: {
    orders: number
    activityLogs: number
  }
}
const ROLE_BADGE_VARIANT: Record<string, "default" | "info" | "warning"> = {
  ADMIN: "default",
  OPERATOR: "info",
  VIEWER: "warning",
  CUSTOMER: "info",
}

// ── Componente Pagina ─────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/admin/users")
        if (!res.ok) {
          setUsers([])
          return
        }
        const data = await res.json()
        setUsers(data.users || [])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      ROLE_LABELS[user.role]?.toLowerCase().includes(q)
    )
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    operators: users.filter((u) => u.role === "OPERATOR").length,
  }

  const handleChangeRole = async (user: AdminUser, newRole: AdminUser["role"]) => {
    if (user.role === newRole) {
      setActionMenuOpen(null)
      return
    }

    setUpdatingUserId(user.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      })

      if (!res.ok) {
        setUpdatingUserId(null)
        setActionMenuOpen(null)
        return
      }

      const data = await res.json()
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)))
      }
    } finally {
      setUpdatingUserId(null)
      setActionMenuOpen(null)
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    setUpdatingUserId(user.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      })

      if (!res.ok) {
        setUpdatingUserId(null)
        setActionMenuOpen(null)
        return
      }

      const data = await res.json()
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)))
      }
    } finally {
      setUpdatingUserId(null)
      setActionMenuOpen(null)
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Utente",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" strokeWidth={1.75} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Ruolo",
      sortable: true,
      render: (user) => (
        <Badge variant={ROLE_BADGE_VARIANT[user.role] || "default"} className="text-[11px]">
          {ROLE_LABELS[user.role]}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Stato",
      render: (user) => (
        <Badge
          variant={user.isActive ? "success" : "destructive"}
          className="text-[11px] gap-1"
        >
          {user.isActive ? (
            <>
              <Check className="h-3 w-3" strokeWidth={1.75} />
              Attivo
            </>
          ) : (
            <>
              <X className="h-3 w-3" strokeWidth={1.75} />
              Inattivo
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "lastLoginAt",
      header: "Ultimo accesso",
      sortable: true,
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Mai"}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Ordini",
      className: "text-center",
      render: (user) => (
        <span className="text-sm font-medium">{user._count.orders}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (user) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)
            }}
            disabled={updatingUserId === user.id}
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          {actionMenuOpen === user.id && (
            <div
              className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-border/50 bg-card p-1.5 shadow-[var(--shadow-lg)] animate-in fade-in-0 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                <button
                  key={roleKey}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/80 transition-colors"
                  onClick={() =>
                    handleChangeRole(user, roleKey as AdminUser["role"])
                  }
                  disabled={updatingUserId === user.id}
                >
                  <Shield className="h-4 w-4" strokeWidth={1.75} />
                  {label}
                </button>
              ))}
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/80 transition-colors"
                onClick={() => handleToggleActive(user)}
                disabled={updatingUserId === user.id}
              >
                {user.isActive ? (
                  <>
                    <X className="h-4 w-4" strokeWidth={1.75} />
                    Disattiva
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                    Attiva
                  </>
                )}
              </button>
              <div className="my-1 h-px bg-border/50" />
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestione Utenti</h1>
            <p className="text-muted-foreground">
              Gestisci gli utenti, i ruoli e i permessi di accesso
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4" strokeWidth={1.75} />
            Nuovo Utente
          </Button>
        </div>

        {/* Statistiche riepilogative */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Totale Utenti
                  </span>
                  <Users className="h-4 w-4 text-blue-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">utenti registrati</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Attivi</span>
                  <Check className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  su {stats.total} totali
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Amministratori
                  </span>
                  <Shield className="h-4 w-4 text-purple-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-xs text-muted-foreground mt-0.5">accesso completo</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Operatori
                  </span>
                  <Users className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold">{stats.operators}</p>
                <p className="text-xs text-muted-foreground mt-0.5">gestione ordini</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Tabella utenti */}
        <StaggerContainer>
          <StaggerItem>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Elenco Utenti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable<AdminUser>
                  columns={columns}
                  data={filteredUsers}
                  total={filteredUsers.length}
                  searchPlaceholder="Cerca per nome, email o ruolo..."
                  onSearch={setSearchQuery}
                  emptyIcon={Users}
                  emptyTitle="Nessun utente trovato"
                  emptyDescription="Non ci sono utenti corrispondenti ai criteri di ricerca."
                />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
