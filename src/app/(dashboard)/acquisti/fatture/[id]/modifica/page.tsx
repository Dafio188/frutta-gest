/**
 * Modifica Fattura Fornitore
 *
 * Form pre-compilato per modificare una fattura fornitore.
 * Bloccata se gia' pagata.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Loader2, Check, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { getSupplierInvoice, getSuppliers, updateSupplierInvoice } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface SupplierOption { id: string; companyName: string }

export default function ModificaFatturaFornitore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [lockedReason, setLockedReason] = useState("")

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [subtotal, setSubtotal] = useState("")
  const [vatAmount, setVatAmount] = useState("")
  const [notes, setNotes] = useState("")

  const totalNum = (parseFloat(subtotal) || 0) + (parseFloat(vatAmount) || 0)

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSupplierInvoice(id) as unknown as any

      if (data.isPaid) {
        setLocked(true)
        setLockedReason("Non puoi modificare una fattura gia' pagata.")
      }

      setInvoiceNumber(data.supplierInvoiceNumber)
      setSelectedSupplierId(data.supplierId)
      setIssueDate(data.issueDate ? data.issueDate.split("T")[0] : "")
      setDueDate(data.dueDate ? data.dueDate.split("T")[0] : "")
      setSubtotal(data.subtotal?.toString() || "")
      setVatAmount(data.vatAmount?.toString() || "")
      setNotes(data.notes || "")
    } catch {
      addToast({ type: "error", title: "Errore", description: "Fattura fornitore non trovata" })
      router.push("/acquisti/fatture")
    } finally {
      setLoading(false)
    }
  }, [id, router, addToast])

  useEffect(() => { loadInvoice() }, [loadInvoice])

  useEffect(() => {
    (async () => {
      try {
        const result = await getSuppliers({ pageSize: 200 })
        const parsed = result as unknown as { data: SupplierOption[] }
        setSuppliers(parsed.data)
      } catch {} finally { setLoadingSuppliers(false) }
    })()
  }, [])

  const handleSubmit = async () => {
    if (!invoiceNumber || !selectedSupplierId) {
      addToast({ type: "error", title: "Errore", description: "Compila tutti i campi obbligatori" })
      return
    }

    try {
      setSubmitting(true)
      await updateSupplierInvoice(id, {
        supplierInvoiceNumber: invoiceNumber,
        supplierId: selectedSupplierId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: parseFloat(subtotal) || 0,
        vatAmount: parseFloat(vatAmount) || 0,
        total: totalNum,
        notes: notes || null,
      })
      addToast({ type: "success", title: "Fattura aggiornata", description: `${invoiceNumber} modificata con successo` })
      router.push(`/acquisti/fatture/${id}`)
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile salvare le modifiche" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/acquisti/fatture/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Modifica {invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Modifica dati della fattura fornitore</p>
          </div>
        </div>

        {locked && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{lockedReason}</p>
          </div>
        )}

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                        disabled={locked}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="">Seleziona un fornitore...</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Numero Fattura</label>
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} disabled={locked} />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

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
                        onChange={(e) => setSubtotal(e.target.value)}
                        disabled={locked}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">IVA</label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={vatAmount}
                        onChange={(e) => setVatAmount(e.target.value)}
                        disabled={locked}
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

          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Date</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={locked} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Scadenza</label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={locked} />
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
                    disabled={locked}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
                  />
                </CardContent>
              </Card>
            </StaggerItem>

            {!locked && (
              <StaggerItem>
                <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !selectedSupplierId || !invoiceNumber}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Salva Modifiche
                </Button>
              </StaggerItem>
            )}
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
