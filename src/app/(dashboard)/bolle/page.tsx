/**
 * Lista Bolle DDT (Documenti di Trasporto)
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Truck, Plus, FileDown, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { DDT_STATUS_LABELS, DDT_STATUS_COLORS } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getDeliveryNotes } from "@/lib/actions"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

interface DDTRow {
  id: string
  ddtNumber: string
  status: string
  issueDate: string
  customer: { companyName: string }
  items: unknown[]
  weight?: number | null
}

export default function BollePage() {
  const router = useRouter()
  const [data, setData] = useState<DDTRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getDeliveryNotes({ page, pageSize: 20, search })
      const parsed = result as unknown as { data: DDTRow[]; total: number }
      setData(parsed.data)
      setTotal(parsed.total)
    } catch (err) {
      console.error("Errore caricamento bolle:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns: Column<DDTRow>[] = [
    { key: "ddtNumber", header: "Numero", sortable: true, render: (item) => <span className="font-medium">{item.ddtNumber}</span> },
    { key: "customer", header: "Cliente", sortable: true, render: (item) => item.customer?.companyName || "—" },
    { key: "issueDate", header: "Data", sortable: true, render: (item) => formatDate(item.issueDate) },
    { key: "status", header: "Stato", render: (item) => <Badge className={DDT_STATUS_COLORS[item.status]}>{DDT_STATUS_LABELS[item.status]}</Badge> },
    { key: "items", header: "Articoli", render: (item) => `${item.items?.length || 0} righe` },
    {
      key: "actions", header: "", className: "w-20",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); router.push(`/bolle/${item.id}`) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); /* download PDF */ }}>
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bolle DDT</h1>
          <p className="text-sm text-muted-foreground mt-1">Documenti di trasporto</p>
        </div>
        <Link href="/bolle/nuova">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nuova DDT</Button>
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
          emptyIcon={Truck}
          emptyTitle="Nessuna bolla"
          emptyDescription="Non ci sono documenti di trasporto. Crea la prima DDT."
          onRowClick={(item) => router.push(`/bolle/${item.id}`)}
        />
      </motion.div>
    </motion.div>
  )
}
