/**
 * Scadenzario Pagamenti
 *
 * Vista lista delle scadenze di pagamento con filtri
 * per stato, direzione (incasso/pagamento), e periodo.
 * Dati reali da fatture con scadenza.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Calendar, ArrowDownLeft, ArrowUpRight, AlertTriangle, Check, Clock, Filter, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_DIRECTION_LABELS,
} from "@/lib/constants"
import { getInvoices } from "@/lib/actions"

type DirectionFilter = "ALL" | "INCOMING" | "OUTGOING"
type StatusFilter = "ALL" | "PENDING" | "OVERDUE" | "COMPLETED"

const STATUS_BADGE_MAP: Record<string, { variant: "warning" | "destructive" | "success" | "default"; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  PENDING: { variant: "warning", icon: Clock },
  OVERDUE: { variant: "destructive", icon: AlertTriangle },
  COMPLETED: { variant: "success", icon: Check },
}

interface Deadline {
  id: string
  direction: "INCOMING" | "OUTGOING"
  entityName: string
  description: string
  amount: number
  dueDate: string
  status: "PENDING" | "OVERDUE" | "COMPLETED"
  invoiceNumber: string
}

export default function ScadenzarioPage() {
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [search, setSearch] = useState("")
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getInvoices({ pageSize: 100 })
      const parsed = result as unknown as { data: { id: string; invoiceNumber: string; dueDate: string | null; total: number; paidAmount: number; status: string; customer: { companyName: string } }[] }

      const now = new Date()
      const items: Deadline[] = parsed.data
        .filter((inv) => inv.dueDate)
        .map((inv) => {
          const isPaid = inv.status === "PAID"
          const isOverdue = !isPaid && new Date(inv.dueDate!) < now
          return {
            id: inv.id,
            direction: "INCOMING" as const,
            entityName: inv.customer.companyName,
            description: `Fattura ${inv.invoiceNumber}`,
            amount: inv.total - inv.paidAmount,
            dueDate: inv.dueDate!,
            status: isPaid ? "COMPLETED" as const : isOverdue ? "OVERDUE" as const : "PENDING" as const,
            invoiceNumber: inv.invoiceNumber,
          }
        })

      setDeadlines(items)
    } catch (err) {
      console.error("Errore caricamento scadenzario:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = deadlines.filter((d) => {
    const matchesDir = directionFilter === "ALL" || d.direction === directionFilter
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter
    const matchesSearch = d.entityName.toLowerCase().includes(search.toLowerCase()) || d.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    return matchesDir && matchesStatus && matchesSearch
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const totalIncoming = deadlines.filter((d) => d.direction === "INCOMING" && d.status !== "COMPLETED").reduce((s, d) => s + d.amount, 0)
  const totalOutgoing = deadlines.filter((d) => d.direction === "OUTGOING" && d.status !== "COMPLETED").reduce((s, d) => s + d.amount, 0)
  const totalOverdue = deadlines.filter((d) => d.status === "OVERDUE").reduce((s, d) => s + d.amount, 0)
  const overdueCount = deadlines.filter((d) => d.status === "OVERDUE").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scadenzario</h1>
          <p className="text-muted-foreground">Monitora le scadenze di incassi e pagamenti</p>
        </div>

        {/* KPI Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Da Incassare</span>
                  <ArrowDownLeft className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncoming)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Da Pagare</span>
                  <ArrowUpRight className="h-4 w-4 text-blue-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalOutgoing)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Saldo Netto</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <p className={`text-2xl font-bold ${totalIncoming - totalOutgoing >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(totalIncoming - totalOutgoing)}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Scadute</span>
                  <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.75} />
                </div>
                <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(totalOverdue)}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:max-w-xs">
            <Input icon={Filter} placeholder="Cerca per nome o fattura..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(["ALL", "INCOMING", "OUTGOING"] as DirectionFilter[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${directionFilter === dir ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {dir === "ALL" ? "Tutte" : PAYMENT_DIRECTION_LABELS[dir]}
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {(["ALL", "PENDING", "OVERDUE", "COMPLETED"] as StatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${statusFilter === st ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {st === "ALL" ? "Tutti" : st === "OVERDUE" ? "Scadute" : PAYMENT_STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Deadlines List */}
        {filtered.length === 0 ? (
          <EmptyState icon={Calendar} title="Nessuna scadenza trovata" description="Non ci sono scadenze per i filtri selezionati." />
        ) : (
          <StaggerContainer className="space-y-2">
            {filtered.map((deadline) => {
              const statusBadge = STATUS_BADGE_MAP[deadline.status] || { variant: "default" as const, icon: Clock }
              const StatusIcon = statusBadge.icon
              const isIncoming = deadline.direction === "INCOMING"

              return (
                <StaggerItem key={deadline.id}>
                  <motion.div
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-[var(--shadow-sm)] ${
                      deadline.status === "OVERDUE"
                        ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                      isIncoming
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {isIncoming ? <ArrowDownLeft className="h-5 w-5" strokeWidth={1.75} /> : <ArrowUpRight className="h-5 w-5" strokeWidth={1.75} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{deadline.entityName}</p>
                        <Badge variant={statusBadge.variant} className="text-[10px]">
                          <StatusIcon className="h-3 w-3 mr-0.5" strokeWidth={2} />
                          {deadline.status === "OVERDUE" ? "Scaduta" : PAYMENT_STATUS_LABELS[deadline.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{deadline.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-medium ${deadline.status === "OVERDUE" ? "text-red-600" : ""}`}>
                        {formatDate(deadline.dueDate)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[100px]">
                      <p className={`text-base font-bold ${isIncoming ? "text-emerald-600" : "text-foreground"}`}>
                        {isIncoming ? "+" : "-"}{formatCurrency(deadline.amount)}
                      </p>
                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  )
}
