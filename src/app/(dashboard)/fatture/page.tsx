/**
 * Lista Fatture
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, Plus, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getInvoices } from "@/lib/actions"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

interface InvoiceRow {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string | null
  total: number
  paidAmount: number
  customer: { companyName: string }
}

export default function FatturePage() {
  const router = useRouter()
  const [data, setData] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getInvoices({ page, pageSize: 20, search })
      const parsed = result as unknown as { data: InvoiceRow[]; total: number }
      setData(parsed.data)
      setTotal(parsed.total)
    } catch (err) {
      console.error("Errore caricamento fatture:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns: Column<InvoiceRow>[] = [
    { key: "invoiceNumber", header: "Numero", sortable: true, render: (item) => <span className="font-medium">{item.invoiceNumber}</span> },
    { key: "customer", header: "Cliente", sortable: true, render: (item) => item.customer?.companyName || "—" },
    { key: "issueDate", header: "Data Emissione", sortable: true, render: (item) => formatDate(item.issueDate) },
    { key: "dueDate", header: "Scadenza", sortable: true, render: (item) => item.dueDate ? formatDate(item.dueDate) : "—" },
    { key: "status", header: "Stato", render: (item) => <Badge className={INVOICE_STATUS_COLORS[item.status]}>{INVOICE_STATUS_LABELS[item.status]}</Badge> },
    { key: "total", header: "Importo", sortable: true, className: "text-right", render: (item) => <span className="font-medium">{formatCurrency(item.total)}</span> },
    { key: "paidAmount", header: "Pagato", className: "text-right", render: (item) => formatCurrency(item.paidAmount) },
    {
      key: "actions", header: "", className: "w-20",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); router.push(`/fatture/${item.id}`) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fatture</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestione fatturazione clienti</p>
        </div>
        <Link href="/fatture/nuova">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nuova Fattura</Button>
        </Link>
      </motion.div>

      <motion.div variants={fadeUp}>
        <DataTable
          columns={columns}
          data={data}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Cerca per numero o cliente..."
          loading={loading}
          emptyIcon={FileText}
          emptyTitle="Nessuna fattura"
          emptyDescription="Non ci sono fatture. Crea la prima fattura."
          onRowClick={(item) => router.push(`/fatture/${item.id}`)}
        />
      </motion.div>
    </motion.div>
  )
}
