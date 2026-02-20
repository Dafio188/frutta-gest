/**
 * Admin Activity Log — Log Attivita
 *
 * Pagina di audit trail per l'amministratore.
 * Mostra la cronologia di tutte le azioni degli utenti nel sistema,
 * con filtri per tipo azione, ricerca e intervallo date.
 * Design macOS premium con animazioni staggerate.
 */

"use client"

import { useState, useMemo } from "react"
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
  Trash2,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType =
  | "LOGIN"
  | "CREATE_ORDER"
  | "UPDATE_CUSTOMER"
  | "CREATE_PRODUCT"
  | "CREATE_INVOICE"
  | "CREATE_DDT"
  | "UPDATE_SETTING"
  | "DELETE_USER"
  | "CREATE_PAYMENT"
  | "UPDATE_ORDER_STATUS"

interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: ActionType
  entity: string
  entityId: string
  details: Record<string, unknown>
  createdAt: string
}

// ---------------------------------------------------------------------------
// Mock Data — 20 activity log entries
// ---------------------------------------------------------------------------

const activityLogs: ActivityLogEntry[] = [
  {
    id: "log-001",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "LOGIN",
    entity: "Session",
    entityId: "sess-101",
    details: { ip: "192.168.1.10", browser: "Chrome 120" },
    createdAt: "2026-02-13T08:15:00",
  },
  {
    id: "log-002",
    userId: "usr-002",
    userName: "Laura Bianchi",
    userEmail: "laura.bianchi@fruttagest.it",
    action: "CREATE_ORDER",
    entity: "Ordine",
    entityId: "ord-450",
    details: { cliente: "Supermercati Roma SRL", totale: 2450.0 },
    createdAt: "2026-02-13T08:42:00",
  },
  {
    id: "log-003",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "UPDATE_CUSTOMER",
    entity: "Cliente",
    entityId: "cli-032",
    details: { campo: "indirizzo", vecchio: "Via Roma 10", nuovo: "Via Roma 12" },
    createdAt: "2026-02-13T09:05:00",
  },
  {
    id: "log-004",
    userId: "usr-003",
    userName: "Giuseppe Verdi",
    userEmail: "giuseppe.verdi@fruttagest.it",
    action: "CREATE_PRODUCT",
    entity: "Prodotto",
    entityId: "prod-128",
    details: { nome: "Mele Golden Bio", categoria: "Frutta" },
    createdAt: "2026-02-13T09:30:00",
  },
  {
    id: "log-005",
    userId: "usr-002",
    userName: "Laura Bianchi",
    userEmail: "laura.bianchi@fruttagest.it",
    action: "CREATE_INVOICE",
    entity: "Fattura",
    entityId: "fat-890",
    details: { numero: "FAT-2026-00890", importo: 3200.5 },
    createdAt: "2026-02-13T10:12:00",
  },
  {
    id: "log-006",
    userId: "usr-004",
    userName: "Anna Conte",
    userEmail: "anna.conte@fruttagest.it",
    action: "CREATE_DDT",
    entity: "DDT",
    entityId: "ddt-345",
    details: { numero: "DDT-2026-00345", destinazione: "Milano" },
    createdAt: "2026-02-13T10:45:00",
  },
  {
    id: "log-007",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "UPDATE_SETTING",
    entity: "Impostazione",
    entityId: "set-iva",
    details: { chiave: "aliquota_iva_default", vecchio: "22%", nuovo: "10%" },
    createdAt: "2026-02-13T11:00:00",
  },
  {
    id: "log-008",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "DELETE_USER",
    entity: "Utente",
    entityId: "usr-099",
    details: { utente_eliminato: "test@example.com", motivo: "Account di test" },
    createdAt: "2026-02-13T11:30:00",
  },
  {
    id: "log-009",
    userId: "usr-002",
    userName: "Laura Bianchi",
    userEmail: "laura.bianchi@fruttagest.it",
    action: "CREATE_PAYMENT",
    entity: "Pagamento",
    entityId: "pag-201",
    details: { fattura: "FAT-2026-00890", importo: 3200.5, metodo: "Bonifico" },
    createdAt: "2026-02-13T12:15:00",
  },
  {
    id: "log-010",
    userId: "usr-003",
    userName: "Giuseppe Verdi",
    userEmail: "giuseppe.verdi@fruttagest.it",
    action: "UPDATE_ORDER_STATUS",
    entity: "Ordine",
    entityId: "ord-448",
    details: { vecchio_stato: "In preparazione", nuovo_stato: "Spedito" },
    createdAt: "2026-02-13T13:00:00",
  },
  {
    id: "log-011",
    userId: "usr-004",
    userName: "Anna Conte",
    userEmail: "anna.conte@fruttagest.it",
    action: "LOGIN",
    entity: "Session",
    entityId: "sess-102",
    details: { ip: "192.168.1.25", browser: "Safari 17" },
    createdAt: "2026-02-12T07:50:00",
  },
  {
    id: "log-012",
    userId: "usr-003",
    userName: "Giuseppe Verdi",
    userEmail: "giuseppe.verdi@fruttagest.it",
    action: "CREATE_ORDER",
    entity: "Ordine",
    entityId: "ord-449",
    details: { cliente: "Ristorante Da Luigi", totale: 890.0 },
    createdAt: "2026-02-12T09:20:00",
  },
  {
    id: "log-013",
    userId: "usr-002",
    userName: "Laura Bianchi",
    userEmail: "laura.bianchi@fruttagest.it",
    action: "CREATE_PRODUCT",
    entity: "Prodotto",
    entityId: "prod-129",
    details: { nome: "Arance Tarocco", categoria: "Agrumi" },
    createdAt: "2026-02-12T10:10:00",
  },
  {
    id: "log-014",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "UPDATE_CUSTOMER",
    entity: "Cliente",
    entityId: "cli-045",
    details: { campo: "telefono", vecchio: "06-1234567", nuovo: "06-7654321" },
    createdAt: "2026-02-12T11:40:00",
  },
  {
    id: "log-015",
    userId: "usr-004",
    userName: "Anna Conte",
    userEmail: "anna.conte@fruttagest.it",
    action: "CREATE_INVOICE",
    entity: "Fattura",
    entityId: "fat-891",
    details: { numero: "FAT-2026-00891", importo: 1580.0 },
    createdAt: "2026-02-12T14:05:00",
  },
  {
    id: "log-016",
    userId: "usr-003",
    userName: "Giuseppe Verdi",
    userEmail: "giuseppe.verdi@fruttagest.it",
    action: "CREATE_DDT",
    entity: "DDT",
    entityId: "ddt-346",
    details: { numero: "DDT-2026-00346", destinazione: "Napoli" },
    createdAt: "2026-02-11T08:30:00",
  },
  {
    id: "log-017",
    userId: "usr-002",
    userName: "Laura Bianchi",
    userEmail: "laura.bianchi@fruttagest.it",
    action: "LOGIN",
    entity: "Session",
    entityId: "sess-100",
    details: { ip: "192.168.1.15", browser: "Firefox 122" },
    createdAt: "2026-02-11T08:00:00",
  },
  {
    id: "log-018",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "CREATE_PAYMENT",
    entity: "Pagamento",
    entityId: "pag-200",
    details: { fattura: "FAT-2026-00885", importo: 4500.0, metodo: "Assegno" },
    createdAt: "2026-02-11T10:20:00",
  },
  {
    id: "log-019",
    userId: "usr-004",
    userName: "Anna Conte",
    userEmail: "anna.conte@fruttagest.it",
    action: "UPDATE_ORDER_STATUS",
    entity: "Ordine",
    entityId: "ord-445",
    details: { vecchio_stato: "Confermato", nuovo_stato: "In preparazione" },
    createdAt: "2026-02-10T15:30:00",
  },
  {
    id: "log-020",
    userId: "usr-001",
    userName: "Marco Rossi",
    userEmail: "marco.rossi@fruttagest.it",
    action: "UPDATE_SETTING",
    entity: "Impostazione",
    entityId: "set-email",
    details: { chiave: "email_mittente", vecchio: "info@fruttagest.it", nuovo: "noreply@fruttagest.it" },
    createdAt: "2026-02-10T09:00:00",
  },
]

// ---------------------------------------------------------------------------
// Action helpers
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<ActionType, string> = {
  LOGIN: "Accesso effettuato",
  CREATE_ORDER: "Ordine creato",
  UPDATE_CUSTOMER: "Cliente aggiornato",
  CREATE_PRODUCT: "Prodotto creato",
  CREATE_INVOICE: "Fattura creata",
  CREATE_DDT: "DDT creato",
  UPDATE_SETTING: "Impostazione modificata",
  DELETE_USER: "Utente eliminato",
  CREATE_PAYMENT: "Pagamento registrato",
  UPDATE_ORDER_STATUS: "Stato ordine aggiornato",
}

const ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tutte le azioni" },
  { value: "LOGIN", label: "Accessi" },
  { value: "CREATE_ORDER", label: "Creazione ordini" },
  { value: "UPDATE_CUSTOMER", label: "Aggiornamento clienti" },
  { value: "CREATE_PRODUCT", label: "Creazione prodotti" },
  { value: "CREATE_INVOICE", label: "Creazione fatture" },
  { value: "CREATE_DDT", label: "Creazione DDT" },
  { value: "UPDATE_SETTING", label: "Modifiche impostazioni" },
  { value: "DELETE_USER", label: "Eliminazione utenti" },
  { value: "CREATE_PAYMENT", label: "Registrazione pagamenti" },
  { value: "UPDATE_ORDER_STATUS", label: "Aggiornamento stato ordini" },
]

function getActionColor(action: ActionType): string {
  if (action === "LOGIN") return "blue"
  if (action.startsWith("CREATE_")) return "emerald"
  if (action.startsWith("UPDATE_")) return "amber"
  if (action.startsWith("DELETE_")) return "red"
  return "gray"
}

function getActionBadgeVariant(action: ActionType) {
  const color = getActionColor(action)
  if (color === "blue") return "info" as const
  if (color === "emerald") return "success" as const
  if (color === "amber") return "warning" as const
  if (color === "red") return "destructive" as const
  return "secondary" as const
}

function getActionIcon(action: ActionType) {
  if (action === "LOGIN") return User
  if (action === "CREATE_ORDER" || action === "UPDATE_ORDER_STATUS") return ShoppingCart
  if (action === "CREATE_PRODUCT") return Package
  if (action === "CREATE_INVOICE" || action === "CREATE_DDT") return FileText
  if (action === "CREATE_PAYMENT") return CreditCard
  if (action === "UPDATE_SETTING") return SettingsIcon
  if (action === "DELETE_USER") return Shield
  if (action === "UPDATE_CUSTOMER") return User
  return Activity
}

function getActionIconColor(action: ActionType): string {
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

function getActionDescription(entry: ActivityLogEntry): string {
  const d = entry.details as Record<string, unknown>
  switch (entry.action) {
    case "LOGIN":
      return `ha effettuato l'accesso da ${d.browser ?? "browser sconosciuto"}`
    case "CREATE_ORDER":
      return `ha creato un ordine per ${d.cliente ?? "cliente"} — ${d.totale ? `\u20ac${d.totale}` : ""}`
    case "UPDATE_CUSTOMER":
      return `ha aggiornato il campo "${d.campo}" del cliente ${entry.entityId}`
    case "CREATE_PRODUCT":
      return `ha aggiunto il prodotto "${d.nome}" (${d.categoria})`
    case "CREATE_INVOICE":
      return `ha emesso la fattura ${d.numero} — ${d.importo ? `\u20ac${d.importo}` : ""}`
    case "CREATE_DDT":
      return `ha creato il DDT ${d.numero} per ${d.destinazione}`
    case "UPDATE_SETTING":
      return `ha modificato "${d.chiave}": ${d.vecchio} \u2192 ${d.nuovo}`
    case "DELETE_USER":
      return `ha eliminato l'utente ${d.utente_eliminato} (${d.motivo})`
    case "CREATE_PAYMENT":
      return `ha registrato un pagamento di \u20ac${d.importo} via ${d.metodo}`
    case "UPDATE_ORDER_STATUS":
      return `ha aggiornato lo stato dell'ordine: ${d.vecchio_stato} \u2192 ${d.nuovo_stato}`
    default:
      return ACTION_LABELS[entry.action]
  }
}

// ---------------------------------------------------------------------------
// Helpers for summary cards
// ---------------------------------------------------------------------------

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return d >= weekAgo && d <= now
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 8

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ---- Computed summary ----
  const todayCount = activityLogs.filter((l) => isToday(l.createdAt)).length
  const weekCount = activityLogs.filter((l) => isThisWeek(l.createdAt)).length
  const activeUsersToday = new Set(
    activityLogs.filter((l) => isToday(l.createdAt)).map((l) => l.userId)
  ).size

  const mostFrequentAction = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const log of activityLogs) {
      counts[log.action] = (counts[log.action] || 0) + 1
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted.length > 0 ? ACTION_LABELS[sorted[0][0] as ActionType] : "-"
  }, [])

  // ---- Filtered data ----
  const filteredLogs = useMemo(() => {
    let result = [...activityLogs]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          ACTION_LABELS[l.action].toLowerCase().includes(q)
      )
    }

    // Action type filter
    if (actionFilter !== "ALL") {
      result = result.filter((l) => l.action === actionFilter)
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter((l) => new Date(l.createdAt) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((l) => new Date(l.createdAt) <= to)
    }

    // Sort by newest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return result
  }, [searchQuery, actionFilter, dateFrom, dateTo])

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE))
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  // Fake refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Fake CSV export
  const handleExportCSV = () => {
    const header = "ID,Utente,Email,Azione,Entita,Data\n"
    const rows = filteredLogs
      .map(
        (l) =>
          `${l.id},${l.userName},${l.userEmail},${l.action},${l.entity},${l.createdAt}`
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "activity-log.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

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
              disabled={isRefreshing}
              loading={isRefreshing}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
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
                <div className="text-2xl font-bold">{todayCount}</div>
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
                <div className="text-2xl font-bold">{weekCount}</div>
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
                <div className="text-2xl font-bold">{activeUsersToday}</div>
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
                <div className="text-lg font-bold leading-tight">{mostFrequentAction}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  su {activityLogs.length} azioni totali
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
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                />
              </div>
              <div className="w-full sm:w-52">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Tipo azione
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                >
                  {ACTION_FILTER_OPTIONS.map((opt) => (
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
                  onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
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
                  onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
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
                {filteredLogs.length} {filteredLogs.length === 1 ? "risultato" : "risultati"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedLogs.length === 0 ? (
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

                {paginatedLogs.map((entry) => {
                  const ActionIcon = getActionIcon(entry.action)
                  const iconColor = getActionIconColor(entry.action)

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
                                {getUserInitials(entry.userName)}
                              </div>
                              <span className="font-medium text-sm text-foreground truncate">
                                {entry.userName}
                              </span>
                              <Badge variant={getActionBadgeVariant(entry.action)} className="shrink-0">
                                {ACTION_LABELS[entry.action]}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" strokeWidth={1.75} />
                              {formatDateTime(entry.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {getActionDescription(entry)}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/70">
                            <span>
                              {entry.entity} #{entry.entityId}
                            </span>
                            <span className="text-border">|</span>
                            <span>{entry.userEmail}</span>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}

            {/* ---- Pagination ---- */}
            {totalPages > 1 && (
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
