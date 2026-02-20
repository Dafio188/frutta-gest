/**
 * Dashboard Finanziaria — Pagamenti, Scadenze, Flussi di Cassa
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  CreditCard, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  Plus, Calendar, AlertTriangle, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { getPayments } from "@/lib/actions"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

interface PaymentRow {
  id: string
  direction: string
  amount: number
  paymentDate: string
  method: string
  status: string
  reference: string | null
  customer: { companyName: string } | null
  supplier: { companyName: string } | null
  invoice: { invoiceNumber: string } | null
  supplierInvoice: { invoiceNumber: string } | null
}

export default function FinanzaPage() {
  const [loading, setLoading] = useState(true)
  const [incassi, setIncassi] = useState<PaymentRow[]>([])
  const [pagamenti, setPagamenti] = useState<PaymentRow[]>([])
  const [totalIncassi, setTotalIncassi] = useState(0)
  const [totalPagamenti, setTotalPagamenti] = useState(0)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [incassiRes, pagamentiRes] = await Promise.all([
        getPayments({ direction: "INCOMING", pageSize: 50 }),
        getPayments({ direction: "OUTGOING", pageSize: 50 }),
      ])
      const incassiData = incassiRes as unknown as { data: PaymentRow[]; total: number }
      const pagamentiData = pagamentiRes as unknown as { data: PaymentRow[]; total: number }
      setIncassi(incassiData.data)
      setPagamenti(pagamentiData.data)
      setTotalIncassi(incassiData.total)
      setTotalPagamenti(pagamentiData.total)
    } catch (err) {
      console.error("Errore caricamento pagamenti:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const sumCompleted = (items: PaymentRow[]) =>
    items.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0)

  const incassiMese = sumCompleted(incassi)
  const pagamentiMese = sumCompleted(pagamenti)
  const saldoNetto = incassiMese - pagamentiMese

  const incassiColumns: Column<PaymentRow>[] = [
    { key: "paymentDate", header: "Data", sortable: true, render: (item) => formatDate(item.paymentDate) },
    { key: "customer", header: "Cliente", sortable: true, render: (item) => item.customer?.companyName || "—" },
    { key: "invoice", header: "Fattura", render: (item) => <span className="font-mono text-xs">{item.invoice?.invoiceNumber || item.reference || "—"}</span> },
    { key: "amount", header: "Importo", className: "text-right", render: (item) => <span className="font-medium text-emerald-600">{formatCurrency(item.amount)}</span> },
    { key: "method", header: "Metodo", render: (item) => PAYMENT_METHOD_LABELS[item.method] || item.method },
    { key: "status", header: "Stato", render: (item) => <Badge variant={item.status === "COMPLETED" ? "success" : "warning"}>{PAYMENT_STATUS_LABELS[item.status] || item.status}</Badge> },
  ]

  const pagamentiColumns: Column<PaymentRow>[] = [
    { key: "paymentDate", header: "Data", sortable: true, render: (item) => formatDate(item.paymentDate) },
    { key: "supplier", header: "Fornitore", sortable: true, render: (item) => item.supplier?.companyName || "—" },
    { key: "supplierInvoice", header: "Fattura", render: (item) => <span className="font-mono text-xs">{item.supplierInvoice?.invoiceNumber || item.reference || "—"}</span> },
    { key: "amount", header: "Importo", className: "text-right", render: (item) => <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span> },
    { key: "method", header: "Metodo", render: (item) => PAYMENT_METHOD_LABELS[item.method] || item.method },
    { key: "status", header: "Stato", render: (item) => <Badge variant={item.status === "COMPLETED" ? "success" : "warning"}>{PAYMENT_STATUS_LABELS[item.status] || item.status}</Badge> },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanza</h1>
          <p className="text-sm text-muted-foreground mt-1">Pagamenti, incassi e scadenzario</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finanza/scadenzario">
            <Button variant="outline" size="sm"><Calendar className="h-4 w-4 mr-1" />Scadenzario</Button>
          </Link>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Registra Pagamento</Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Incassi", value: incassiMese, icon: ArrowDownLeft, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "Pagamenti", value: pagamentiMese, icon: ArrowUpRight, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
          { label: "Saldo Netto", value: saldoNetto, icon: saldoNetto >= 0 ? TrendingUp : TrendingDown, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Transazioni", value: totalIncassi + totalPagamenti, icon: CreditCard, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400", notCurrency: true },
        ].map((card) => (
          <motion.div key={card.label} variants={fadeUp}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {card.notCurrency ? card.value : formatCurrency(card.value)}
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs: Incassi / Pagamenti */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="incassi">
          <TabsList>
            <TabsTrigger value="incassi">Incassi da Clienti</TabsTrigger>
            <TabsTrigger value="pagamenti">Pagamenti a Fornitori</TabsTrigger>
          </TabsList>
          <TabsContent value="incassi">
            <DataTable columns={incassiColumns} data={incassi} total={totalIncassi} loading={loading} emptyIcon={CreditCard} emptyTitle="Nessun incasso" emptyDescription="Non ci sono incassi registrati." />
          </TabsContent>
          <TabsContent value="pagamenti">
            <DataTable columns={pagamentiColumns} data={pagamenti} total={totalPagamenti} loading={loading} emptyIcon={CreditCard} emptyTitle="Nessun pagamento" emptyDescription="Non ci sono pagamenti registrati." />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
