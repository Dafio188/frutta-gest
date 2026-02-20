/**
 * Nuova Fattura — Creazione fattura da bolle DDT
 *
 * Seleziona cliente, poi le bolle non fatturate di quel cliente.
 * Gli articoli vengono aggregati automaticamente dalle bolle.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, FileText, Plus, Truck, Loader2, Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PAYMENT_METHOD_LABELS, DDT_STATUS_LABELS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getCustomers, getDeliveryNotes, createInvoice } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CustomerOption { id: string; companyName: string }
interface DDTOption {
  id: string; ddtNumber: string; status: string; issueDate: string
  customer: { companyName: string }
  items: { id: string; quantity: number; unit: string; unitPrice: number; lineTotal: number; vatRate: number; product: { name: string } }[]
}

export default function NuovaFatturaPage() {
  const router = useRouter()
  const { addToast } = useUIStore()

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [ddts, setDdts] = useState<DDTOption[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedDDTIds, setSelectedDDTIds] = useState<string[]>([])
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingDDTs, setLoadingDDTs] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const result = await getCustomers({ pageSize: 200 })
        const parsed = result as unknown as { data: CustomerOption[] }
        setCustomers(parsed.data)
      } catch (err) {
        console.error("Errore caricamento clienti:", err)
      } finally {
        setLoadingCustomers(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) { setDdts([]); return }
    (async () => {
      try {
        setLoadingDDTs(true)
        setSelectedDDTIds([])
        const result = await getDeliveryNotes({ pageSize: 100, customerId: selectedCustomerId })
        const parsed = result as unknown as { data: DDTOption[] }
        // Show only DDTs that are ISSUED or DELIVERED (not DRAFT, not already invoiced)
        setDdts(parsed.data.filter((d) => d.status === "ISSUED" || d.status === "DELIVERED"))
      } catch (err) {
        console.error("Errore caricamento bolle:", err)
      } finally {
        setLoadingDDTs(false)
      }
    })()
  }, [selectedCustomerId])

  const toggleDDT = (id: string) => {
    setSelectedDDTIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const selectedDDTs = ddts.filter((d) => selectedDDTIds.includes(d.id))
  const allItems = selectedDDTs.flatMap((d) => d.items)
  const subtotal = allItems.reduce((s, i) => s + (i.lineTotal || 0), 0)
  const vatAmount = allItems.reduce((s, i) => s + (i.lineTotal || 0) * ((i.vatRate || 0) / 100), 0)
  const total = subtotal + vatAmount

  const handleSubmit = async () => {
    if (!selectedCustomerId) { addToast({ type: "error", title: "Errore", description: "Seleziona un cliente" }); return }
    if (selectedDDTIds.length === 0) { addToast({ type: "error", title: "Errore", description: "Seleziona almeno una bolla" }); return }
    if (!dueDate) { addToast({ type: "error", title: "Errore", description: "Inserisci la data di scadenza" }); return }

    try {
      setSubmitting(true)
      await createInvoice({
        customerId: selectedCustomerId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        paymentMethod: paymentMethod || null,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        internalNotes: internalNotes || null,
        ddtIds: selectedDDTIds,
      })
      addToast({ type: "success", title: "Fattura creata", description: "La fattura e' stata creata con successo" })
      router.push("/fatture")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile creare la fattura" })
    } finally {
      setSubmitting(false)
    }
  }

  // Default due date: 30 days from issue
  useEffect(() => {
    if (issueDate && !dueDate) {
      const d = new Date(issueDate)
      d.setDate(d.getDate() + 30)
      setDueDate(d.toISOString().split("T")[0])
    }
  }, [issueDate])

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/fatture">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuova Fattura</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Crea una fattura selezionando le bolle DDT</p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCustomers ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />Caricamento clienti...
                    </div>
                  ) : (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Seleziona un cliente...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Bolle DDT */}
            {selectedCustomerId && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4" />Bolle da Fatturare
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingDDTs ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />Caricamento bolle...
                      </div>
                    ) : ddts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nessuna bolla disponibile per questo cliente.</p>
                    ) : (
                      <div className="space-y-2">
                        {ddts.map((ddt) => (
                          <div
                            key={ddt.id}
                            onClick={() => toggleDDT(ddt.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedDDTIds.includes(ddt.id)
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:bg-muted/30"
                            }`}
                          >
                            <Checkbox checked={selectedDDTIds.includes(ddt.id)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{ddt.ddtNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(ddt.issueDate)} — {ddt.items.length} articoli
                              </p>
                            </div>
                            <Badge variant="secondary">{DDT_STATUS_LABELS[ddt.status] || ddt.status}</Badge>
                            <span className="text-sm font-medium">
                              {formatCurrency(ddt.items.reduce((s, i) => s + (i.lineTotal || 0), 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Preview articoli */}
            {selectedDDTIds.length > 0 && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Articoli Fattura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 font-medium">Prodotto</th>
                            <th className="text-right py-2 font-medium">Qtà</th>
                            <th className="text-right py-2 font-medium">Prezzo</th>
                            <th className="text-right py-2 font-medium">IVA %</th>
                            <th className="text-right py-2 font-medium">Totale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allItems.map((item, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2">{item.product?.name || "—"}</td>
                              <td className="text-right py-2">{item.quantity} {(PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()}</td>
                              <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-right py-2">{item.vatRate}%</td>
                              <td className="text-right py-2 font-medium">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-1 text-sm text-right">
                      <p>Imponibile: <span className="font-medium">{formatCurrency(subtotal)}</span></p>
                      <p>IVA: <span className="font-medium">{formatCurrency(vatAmount)}</span></p>
                      <p className="text-base font-bold">Totale: {formatCurrency(total)}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dettagli Fattura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Scadenza</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Metodo Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Nessuno</option>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Termini Pagamento</label>
                    <Input placeholder="es. 30 giorni" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Note visibili in fattura..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note Interne</label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Note solo per uso interno..."
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || selectedDDTIds.length === 0}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Crea Fattura
              </Button>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
