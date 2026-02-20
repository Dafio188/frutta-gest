/**
 * Pagina Lista Fornitori
 *
 * DataTable con colonne: Nome, Citta, Telefono, Email, Azioni.
 * Ricerca per ragione sociale, click su riga per dettaglio.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Factory, Plus, Phone, Mail, MapPin, Eye, Loader2 } from "lucide-react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/animations/page-transition"
import { getSuppliers } from "@/lib/actions"

interface SupplierRow {
  id: string
  companyName: string
  city: string | null
  province: string | null
  phone: string | null
  email: string | null
}

export default function FornitoriPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getSuppliers({ search, page, pageSize: 20 })
      setSuppliers(result.data as unknown as SupplierRow[])
      setTotal(result.total)
    } catch (err) {
      console.error("Errore caricamento fornitori:", err)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  const columns: Column<SupplierRow>[] = [
    {
      key: "companyName",
      header: "Nome",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Factory className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="font-medium text-sm">{item.companyName}</p>
        </div>
      ),
    },
    {
      key: "city",
      header: "Citta",
      sortable: true,
      render: (item) =>
        item.city ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{item.city}{item.province ? ` (${item.province})` : ""}</span>
          </div>
        ) : <span className="text-muted-foreground">--</span>,
    },
    {
      key: "phone",
      header: "Telefono",
      render: (item) =>
        item.phone ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            <span>{item.phone}</span>
          </div>
        ) : <span className="text-muted-foreground">--</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (item) =>
        item.email ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
            <span className="truncate max-w-[200px]">{item.email}</span>
          </div>
        ) : <span className="text-muted-foreground">--</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (item) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Link href={`/fornitori/${item.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fornitori</h1>
            <p className="text-muted-foreground">Gestisci l'anagrafica dei tuoi fornitori</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.1 }}
        >
          <div className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-6">
              <DataTable
                columns={columns}
                data={suppliers}
                total={total}
                page={page}
                pageSize={20}
                onPageChange={setPage}
                onSearch={setSearch}
                searchPlaceholder="Cerca fornitore per nome..."
                emptyIcon={Factory}
                emptyTitle="Nessun fornitore trovato"
                emptyDescription="Inizia aggiungendo il tuo primo fornitore."
                onRowClick={(item) => router.push(`/fornitori/${item.id}`)}
                actions={
                  <Link href="/fornitori/nuovo">
                    <Button>
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                      Nuovo Fornitore
                    </Button>
                  </Link>
                }
              />
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
