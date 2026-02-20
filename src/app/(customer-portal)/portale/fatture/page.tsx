/**
 * Lista Fatture — Portale Clienti
 *
 * Tabella fatture con filtri per stato e paginazione.
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, FileText, Loader2 } from "lucide-react"
import { getPortalInvoices } from "@/lib/actions"
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
}

const STATUS_OPTIONS = [
  { value: "", label: "Tutti gli stati" },
  { value: "ISSUED", label: "Emessa" },
  { value: "SENT", label: "Inviata" },
  { value: "PAID", label: "Pagata" },
  { value: "OVERDUE", label: "Scaduta" },
]

export default function PortalInvoicesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPortalInvoices({ search, status: status || undefined, page, pageSize: 20 })
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    const timer = setTimeout(loadInvoices, 300)
    return () => clearTimeout(timer)
  }, [loadInvoices])

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {/* Title */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Le Mie Fatture</h1>
        <p className="text-muted-foreground mt-1">
          {data ? `${data.total} fatture totali` : "Caricamento..."}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca per numero fattura..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-10 rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="h-10 rounded-xl border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">Nessuna fattura trovata</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || status ? "Prova a modificare i filtri" : "Le fatture appariranno qui dopo la consegna"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fattura</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Emissione</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Scadenza</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stato</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">Pagato</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((inv: any) => {
                    const paid = Number(inv.paidAmount)
                    const total = Number(inv.total)
                    return (
                      <tr key={inv.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/portale/fatture/${inv.id}`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">{inv.items.length} articoli</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status] || ""}`}>
                            {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-muted-foreground hidden sm:table-cell">
                          {formatCurrency(paid)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {page} di {data.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(data.totalPages, page + 1))} disabled={page >= data.totalPages}>
            Successiva
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
