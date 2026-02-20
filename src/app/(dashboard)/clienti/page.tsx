/**
 * Pagina Lista Clienti
 *
 * DataTable con colonne: Nome, Tipo, Citta, Telefono, Ordini, Azioni.
 * Ricerca per ragione sociale, badge per tipo cliente,
 * click su riga per navigare al dettaglio.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building2, Plus, Phone, MapPin, Eye, Loader2,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants"
import { getCustomers } from "@/lib/actions"

interface CustomerRow {
  id: string
  companyName: string
  type: string
  city: string
  province: string
  phone: string | null
  email: string | null
  _count?: { orders: number }
}

const CUSTOMER_TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "info" | "success" | "warning"> = {
  RISTORANTE: "default",
  SUPERMERCATO: "info",
  BAR: "warning",
  HOTEL: "success",
  MENSA: "secondary",
  GASTRONOMIA: "warning",
  ALTRO: "secondary",
}

export default function ClientiPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("companyName")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCustomers({ search, sortBy, sortOrder, page, pageSize: 20 })
      setCustomers(result.data as unknown as CustomerRow[])
      setTotal(result.total)
    } catch (err) {
      console.error("Errore caricamento clienti:", err)
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, sortOrder, page])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const columns: Column<CustomerRow>[] = [
    {
      key: "companyName",
      header: "Nome",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-medium text-sm">{item.companyName}</p>
            {item.email && (
              <p className="text-xs text-muted-foreground">{item.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (item) => (
        <Badge variant={CUSTOMER_TYPE_BADGE_VARIANT[item.type] || "secondary"}>
          {CUSTOMER_TYPE_LABELS[item.type] || item.type}
        </Badge>
      ),
    },
    {
      key: "city",
      header: "Citta",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>{item.city} ({item.province})</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telefono",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm">
          {item.phone ? (
            <>
              <Phone className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
              <span>{item.phone}</span>
            </>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </div>
      ),
    },
    {
      key: "orders",
      header: "Ordini",
      className: "text-center",
      render: (item) => (
        <Badge variant="secondary">
          {item._count?.orders ?? 0}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/clienti/${item.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clienti</h1>
            <p className="text-muted-foreground">
              Gestisci l'anagrafica dei tuoi clienti
            </p>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as const, delay: 0.1 }}
        >
          <div className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-6">
              <DataTable
                columns={columns}
                data={customers}
                total={total}
                page={page}
                pageSize={20}
                onPageChange={setPage}
                onSort={(key, order) => {
                  setSortBy(key)
                  setSortOrder(order)
                }}
                onSearch={setSearch}
                searchPlaceholder="Cerca cliente per nome..."
                emptyIcon={Building2}
                emptyTitle="Nessun cliente trovato"
                emptyDescription="Inizia aggiungendo il tuo primo cliente."
                onRowClick={(item) => router.push(`/clienti/${item.id}`)}
                actions={
                  <Link href="/clienti/nuovo">
                    <Button>
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                      Nuovo Cliente
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
