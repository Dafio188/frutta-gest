/**
 * Admin Activity Log — Log Attivita
 *
 * Pagina di audit trail per l'amministratore.
 * Mostra la cronologia di tutte le azioni degli utenti nel sistema (dati reali dal DB),
 * con filtri per tipo azione, ricerca e intervallo date.
 * Design macOS premium con animazioni staggerate.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  Clock,
  User,
  FileText,
  ShoppingCart,
  Package,
  CreditCard,
  Settings as SettingsIcon,
  Shield,
  Loader2,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { getActivityLogs, getActivityStats } from "@/lib/actions"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityLogEntry {
  id: string
  userId: string | null
  action: string
  entity: string | null
  entityId: string | null
  details: Record<string, unknown> | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

interface ActivityStats {
  actionsToday: number
  actionsWeek: number
  activeUsersToday: number
  mostFrequentAction: string | null
  totalActions: number
  availableActions: string[]
}

// ---------------------------------------------------------------------------
// Action helpers
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Accesso effettuato",
  CREATE_ORDER: "Ordine creato",
  UPDATE_ORDER: "Ordine aggiornato",
  UPDATE_ORDER_STATUS: "Stato ordine aggiornato",
  CANCEL_ORDER: "Ordine annullato",
  DELETE_ORDER: "Ordine eliminato",
  CREATE_CUSTOMER: "Cliente creato",
  UPDATE_CUSTOMER: "Cliente aggiornato",
  DELETE_CUSTOMER: "Cliente eliminato",
  DEACTIVATE_CUSTOMER: "Cliente disattivato",
  CREATE_SUPPLIER: "Fornitore creato",
  UPDATE_SUPPLIER: "Fornitore aggiornato",
  DELETE_SUPPLIER: "Fornitore eliminato",
  DEACTIVATE_SUPPLIER: "Fornitore disattivato",
  CREATE_PRODUCT: "Prodotto creato",
  UPDATE_PRODUCT: "Prodotto aggiornato",
  DELETE_PRODUCT: "Prodotto eliminato",
  DEACTIVATE_PRODUCT: "Prodotto disattivato",
  TOGGLE_FEATURED_PRODUCT: "Prodotto in evidenza",
  SYNC_PRODUCTS: "Sincronizzazione prodotti",
  CREATE_INVOICE: "Fattura creata",
  UPDATE_INVOICE_STATUS: "Stato fattura aggiornato",
  DELETE_INVOICE: "Fattura eliminata",
  CREATE_DDT: "DDT creato",
  UPDATE_DDT: "DDT aggiornato",
  UPDATE_DDT_STATUS: "Stato DDT aggiornato",
  DELETE_DDT: "DDT eliminato",
  CREATE_PAYMENT: "Pagamento registrato",
  DELETE_PAYMENT: "Pagamento eliminato",
  CREATE_PURCHASE_ORDER: "Ordine acquisto creato",
  UPDATE_PURCHASE_ORDER: "Ordine acquisto aggiornato",
  UPDATE_PURCHASE_ORDER_STATUS: "Stato ordine acquisto aggiornato",
  DELETE_PURCHASE_ORDER: "Ordine acquisto eliminato",
  CREATE_SUPPLIER_INVOICE: "Fattura fornitore creata",
  UPDATE_SUPPLIER_INVOICE: "Fattura fornitore aggiornata",
  DELETE_SUPPLIER_INVOICE: "Fattura fornitore eliminata",
  CREATE_SHOPPING_LIST: "Lista spesa creata",
  GENERATE_SHOPPING_LIST: "Lista spesa generata",
  UPDATE_SHOPPING_LIST_STATUS: "Stato lista spesa aggiornato",
  DELETE_SHOPPING_LIST: "Lista spesa eliminata",
  CREATE_PO_FROM_SHOPPING_LIST: "Ordini acquisto da lista spesa",
  CREATE_STOCK_MOVEMENT: "Movimento magazzino",
  BULK_STOCK_MOVEMENT: "Movimenti magazzino multipli",
  UPDATE_USER_ROLE: "Ruolo utente aggiornato",
  ACTIVATE_USER: "Utente attivato",
  DEACTIVATE_USER: "Utente disattivato",
  DELETE_USER: "Utente eliminato",
  CREATE_PORTAL_USER: "Utente portale creato",
  UPDATE_APP_SETTING: "Impostazione modificata",
  UPDATE_COMPANY_INFO: "Dati azienda aggiornati",
  BACKFILL_COSTS: "Backfill costi fatture",
}

function getActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  )
}

function getActionColor(action: string): string {
  if (action === "LOGIN") return "blue"
  if (action.startsWith("CREATE_") || action.startsWith("GENERATE_") || action === "ACTIVATE_USER") return "emerald"
  if (action.startsWith("UPDATE_") || action.startsWith("TOGGLE_") || action.startsWith("SYNC_")) return "amber"
  if (action.startsWith("DELETE_") || action.startsWith("DEACTIVATE_") || action.startsWith("CANCEL_")) return "red"
  return "gray"
}

function getActionBadgeVariant(action: string) {
  const color = getActionColor(action)
  if (color === "blue") return "info" as const
  if (color === "emerald") return "success" as const
  if (color === "amber") return "warning" as const
  if (color === "red") return "destructive" as const
  return "secondary" as const
}

function getActionIcon(action: string) {
  if (action === "LOGIN") return User
  if (action.includes("ORDER") || action.includes("SHOPPING")) return ShoppingCart
  if (action.includes("PRODUCT") || action.includes("STOCK")) return Package
  if (action.includes("INVOICE") || action.includes("DDT")) return FileText
  if (action.includes("PAYMENT")) return CreditCard
  if (action.includes("SETTING") || action.includes("COMPANY")) return SettingsIcon
  if (action.includes("USER") || action.includes("ROLE")) return Shield
  if (action.includes("CUSTOMER") || action.includes("SUPPLIER")) return User
  return Activity
}

function getActionIconColor(action: string): string {
  const color = getActionColor(action)
  if (color === "blue") return "text-blue-500 bg-blue-50 dark:bg-blue-950/40"
  if (color === "emerald") return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
  if (color === "amber") return "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
  if (color === "red") return "text-red-500 bg-red-50 dark:bg-red-950/40"
  return "text-gray-500 bg-gray-50 dark:bg-gray-950/40"
}

function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Descrizione leggibile dei dettagli del log (chiave: valore, prime 3 voci) */
function getDetailsDescription(entry: ActivityLogEntry): string {
  if (!entry.details || typeof entry.details !== "object") return ""
  const parts = Object.entries(entry.details)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 3)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`)
  return parts.join(" · ")
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminActivityPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<ActivityStats | null>(null)

  // Debounce ricerca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const loadStats = useCallback(async () => {
    try {
      const result = await getActivityStats()
      setStats(result as unknown as ActivityStats)
    } catch {}
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getActivityLogs({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        search,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      const parsed = result as unknown as { data: ActivityLogEntry[]; total: number; totalPages: number }
      setLogs(parsed.data)
      setTotal(parsed.total)
      setTotalPages(Math.max(1, parsed.totalPages))
    } catch {} finally {
      setLoading(false)
    }
  }, [currentPage, search, actionFilter, dateFrom, dateTo])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadLogs() }, [loadLogs])

  const handleRefresh = () => {
    loadStats()
    loadLogs()
  }

  // Esporta in CSV i log con i filtri correnti (fino a 1000 righe)
  const handleExportCSV = async () => {
    try {
      const result = await getActivityLogs({
        page: 1,
        pageSize: 1000,
        search,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      const parsed = result as unknown as { data: ActivityLogEntry[] }
      const header = "ID,Utente,Email,Azione,Entita,Data\n"
      const rows = parsed.data
        .map(
          (l) =>
            `${l.id},${l.user?.name ?? ""},${l.user?.email ?? ""},${l.action},${l.entity ?? ""},${l.createdAt}`
        )
        .join("\n")
      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "activity-log.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const actionFilterOptions = [
    { value: "ALL", label: "Tutte le azioni" },
    ...(stats?.availableActions ?? []).map((a) => ({ value: a, label: getActionLabel(a) })),
  ]

  const pageNumbers = (() => {
    // Mostra al massimo 5 numeri di pagina centrati sulla corrente
    const maxButtons = 5
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    const end = Math.min(totalPages, start + maxButtons - 1)
    start = Math.max(1, end - maxButtons + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  // ---- Render ----

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Log Attivita
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Audit trail e cronologia delle azioni
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
              Aggiorna
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
              Esporta CSV
            </Button>
          </div>
        </div>

        {/* ---- Summary Cards ---- */}
        <StaggerContainer className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Azioni Oggi
                </CardTitle>
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-500" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.actionsToday ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  registrate nelle ultime 24h
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Azioni Settimana
                </CardTitle>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.actionsWeek ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  negli ultimi 7 giorni
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utenti Attivi Oggi
                </CardTitle>
                <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeUsersToday ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  utenti con almeno 1 azione
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Azione piu frequente
                </CardTitle>
                <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-violet-500" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold leading-tight">
                  {stats?.mostFrequentAction ? getActionLabel(stats.mostFrequentAction) : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  su {stats?.totalActions ?? 0} azioni totali
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* ---- Filters ---- */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Cerca per utente, email, entita..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-52">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Tipo azione
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1) }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                >
                  {actionFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Data da
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Data a
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- Activity Timeline ---- */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" strokeWidth={1.75} />
                Cronologia Attivita
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {total} {total === 1 ? "risultato" : "risultati"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.75} />
                <p className="text-sm text-muted-foreground">
                  Nessuna attivita trovata con i filtri selezionati
                </p>
              </div>
            ) : (
              <StaggerContainer className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />

                {logs.map((entry) => {
                  const ActionIcon = getActionIcon(entry.action)
                  const iconColor = getActionIconColor(entry.action)
                  const userName = entry.user?.name ?? entry.user?.email ?? "Sistema"
                  const detailsText = getDetailsDescription(entry)

                  return (
                    <StaggerItem key={entry.id}>
                      <div className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Icon */}
                        <div
                          className={`relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl ${iconColor}`}
                        >
                          <ActionIcon className="h-5 w-5" strokeWidth={1.75} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* User avatar (initials) */}
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                {getUserInitials(userName)}
                              </div>
                              <span className="font-medium text-sm text-foreground truncate">
                                {userName}
                              </span>
                              <Badge variant={getActionBadgeVariant(entry.action)} className="shrink-0">
                                {getActionLabel(entry.action)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" strokeWidth={1.75} />
                              {formatDateTime(entry.createdAt)}
                            </span>
                          </div>
                          {detailsText && (
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed break-words">
                              {detailsText}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/70">
                            {entry.entity && (
                              <span>
                                {entry.entity}{entry.entityId ? ` #${entry.entityId.slice(-8)}` : ""}
                              </span>
                            )}
                            {entry.entity && entry.user?.email && <span className="text-border">|</span>}
                            {entry.user?.email && <span>{entry.user.email}</span>}
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}

            {/* ---- Pagination ---- */}
            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Pagina {currentPage} di {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Precedente
                  </Button>
                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Successiva
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
