/**
 * Lista Note di Credito
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileMinus, Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getCreditNotes } from "@/lib/actions"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

interface CreditNoteRow {
  id: string
  creditNoteNumber: string
  issueDate: string
  amount: number
  vatAmount: number
  total: number
  reason: string
  customer: { id: string; companyName: string }
  invoice: { id: string; invoiceNumber: string }
}

export default function NoteCreditoPage() {
  const router = useRouter()
  const [data, setData] = useState<CreditNoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getCreditNotes({ page, pageSize: 20, search })
      const parsed = result as unknown as { data: CreditNoteRow[]; total: number }
      setData(parsed.data)
      setTotal(parsed.total)
    } catch (err) {
      console.error("Errore caricamento note di credito:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns: Column<CreditNoteRow>[] = [
    { key: "creditNoteNumber", header: "Numero", sortable: true, render: (item) => <span className="font-medium">{item.creditNoteNumber}</span> },
    { key: "customer", header: "Cliente", render: (item) => item.customer?.companyName || "—" },
    {
      key: "invoice", header: "Fattura",
      render: (item) => (
        <Link
          href={`/fatture/${item.invoice.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline"
        >
          {item.invoice.invoiceNumber}
        </Link>
      ),
    },
    { key: "issueDate", header: "Data Emissione", sortable: true, render: (item) => formatDate(item.issueDate) },
    {
      key: "reason", header: "Motivo",
      render: (item) => (
        <span className="text-muted-foreground block max-w-[240px] truncate" title={item.reason}>
          {item.reason}
        </span>
      ),
    },
    { key: "amount", header: "Imponibile", className: "text-right", render: (item) => formatCurrency(item.amount) },
    { key: "total", header: "Totale", sortable: true, className: "text-right", render: (item) => <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(item.total)}</span> },
    {
      key: "actions", header: "", className: "w-12",
      render: (item) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); router.push(`/note-credito/${item.id}`) }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Note di Credito</h1>
          <p className="text-sm text-muted-foreground mt-1">Storni e rettifiche su fatture emesse</p>
        </div>
        <Link href="/note-credito/nuova">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nuova Nota di Credito</Button>
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
          searchPlaceholder="Cerca per numero, fattura o cliente..."
          loading={loading}
          emptyIcon={FileMinus}
          emptyTitle="Nessuna nota di credito"
          emptyDescription="Non ci sono note di credito. Creane una da una fattura emessa."
          onRowClick={(item) => router.push(`/note-credito/${item.id}`)}
        />
      </motion.div>
    </motion.div>
  )
}
