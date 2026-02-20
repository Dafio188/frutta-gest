/**
 * Nuova Fattura Fornitore
 *
 * Form per registrare una fattura ricevuta da un fornitore.
 * Inserimento manuale di numero fattura, importi, date.
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Loader2, Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { getSuppliers, createSupplierInvoice } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface SupplierOption { id: string; companyName: string }

export default function NuovaFatturaFornitore() {
  const router = useRouter()
  const { addToast } = useUIStore()

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [subtotal, setSubtotal] = useState("")
  const [vatAmount, setVatAmount] = useState("")
  const [notes, setNotes] = useState("")

  const totalNum = (parseFloat(subtotal) || 0) + (parseFloat(vatAmount) || 0)

  useEffect(() => {
    (async () => {
      try {
        const result = await getSuppliers({ pageSize: 200 })
        const parsed = result as unknown as { data: SupplierOption[] }
        setSuppliers(parsed.data)
      } catch {} finally { setLoadingSuppliers(false) }
    })()
  }, [])

  // Auto-calculate due date 30 days from issue
  useEffect(() => {
    if (issueDate && !dueDate) {
      const d = new Date(issueDate)
      d.setDate(d.getDate() + 30)
      setDueDate(d.toISOString().split("T")[0])
    }
  }, [issueDate, dueDate])

  // Auto-calculate IVA at 4%
  useEffect(() => {
    if (subtotal && !vatAmount) {
      const sub = parseFloat(subtotal)
      if (sub > 0) setVatAmount((sub * 0.04).toFixed(2))
    }
  }, [subtotal, vatAmount])

  const handleSubmit = async () => {
    if (!invoiceNumber) {
      addToast({ type: "error", title: "Errore", description: "Inserisci il numero fattura" })
      return
    }
    if (!selectedSupplierId) {
      addToast({ type: "error", title: "Errore", description: "Seleziona un fornitore" })
      return
    }
    if (!subtotal || parseFloat(subtotal) <= 0) {
      addToast({ type: "error", title: "Errore", description: "Inserisci l'imponibile" })
      return
    }

    try {
      setSubmitting(true)
      await createSupplierInvoice({
        supplierInvoiceNumber: invoiceNumber,
        supplierId: selectedSupplierId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: parseFloat(subtotal) || 0,
        vatAmount: parseFloat(vatAmount) || 0,
        total: totalNum,
        notes: notes || null,
      })
      addToast({ type: "success", title: "Fattura registrata", description: `Fattura ${invoiceNumber} registrata con successo` })
      router.push("/acquisti/fatture")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile registrare la fattura" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/acquisti/fatture">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registra Fattura Fornitore</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Registra una fattura ricevuta da un fornitore</p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Fornitore e numero */}
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Dati Fattura</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Fornitore</label>
                    {loadingSuppliers ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</div>
                    ) : (
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Seleziona un fornitore...</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Numero Fattura</label>
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="es. FT-2026-001" />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Importi */}
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Importi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Imponibile</label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={subtotal}
                        onChange={(e) => { setSubtotal(e.target.value); setVatAmount("") }}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">IVA</label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={vatAmount}
                        onChange={(e) => setVatAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-semibold">Totale</span>
                    <span className="font-bold text-lg">&euro; {totalNum.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Date</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Scadenza</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Note aggiuntive..."
                  />
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !selectedSupplierId || !invoiceNumber}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Registra Fattura
              </Button>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
