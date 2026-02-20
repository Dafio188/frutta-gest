/**
 * Lista Fatture Fornitore
 *
 * Tabella fatture fornitore con filtro pagato/non pagato,
 * ricerca, badge colorati. Navigazione al dettaglio e registrazione.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { FileText, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  SUPPLIER_INVOICE_STATUS_LABELS,
  SUPPLIER_INVOICE_STATUS_COLORS,
} from "@/lib/constants"
import { getSupplierInvoices } from "@/lib/actions"

const STATUS_TABS = [
  { key: "ALL", label: "Tutte" },
  { key: "false", label: "Da Pagare" },
  { key: "true", label: "Pagate" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
}

function getInvoiceStatus(invoice: any): string {
  if (invoice.isPaid) return "PAID"
  if (new Date(invoice.dueDate) < new Date()) return "OVERDUE"
  return "UNPAID"
}

export default function FattureFornitore() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [paidFilter, setPaidFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getSupplierInvoices({
        page,
        pageSize: 20,
        search,
        isPaid: paidFilter !== "ALL" ? paidFilter : undefined,
      })
      const parsed = result as unknown as { data: any[]; total: number; totalPages: number }
      setInvoices(parsed.data)
      setTotal(parsed.total)
      setTotalPages(parsed.totalPages)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [page, search, paidFilter])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  useEffect(() => { setPage(1) }, [search, paidFilter])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fatture Fornitore</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} fatture fornitore totali
            </p>
          </div>
          <Link href="/acquisti/fatture/nuova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registra Fattura
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per numero, fornitore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPaidFilter(tab.key)}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  paidFilter === tab.key
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {paidFilter === tab.key && (
                  <motion.div
                    layoutId="si-status-tab"
                    className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nessuna fattura fornitore"
            description="Registra la tua prima fattura fornitore."
            action={
              <Link href="/acquisti/fatture/nuova">
                <Button><Plus className="h-4 w-4 mr-2" />Registra Fattura</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Numero</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fornitore</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Scadenza</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Totale</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagato</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                    {invoices.map((invoice) => {
                      const status = getInvoiceStatus(invoice)
                      return (
                        <motion.tr
                          key={invoice.id}
                          variants={rowVariants}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <Link href={`/acquisti/fatture/${invoice.id}`} className="font-medium text-sm text-primary hover:underline">
                              {invoice.supplierInvoiceNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm">{invoice.supplier?.companyName || "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                          <td className="px-4 py-3">
                            <Badge className={SUPPLIER_INVOICE_STATUS_COLORS[status] || ""}>
                              {SUPPLIER_INVOICE_STATUS_LABELS[status] || status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(invoice.total)}</td>
                          <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatCurrency(invoice.paidAmount)}</td>
                        </motion.tr>
                      )
                    })}
                  </motion.tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {page} di {totalPages} ({total} risultati)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Precedente
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Successiva
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
