/**
 * Nuova Nota di Credito — Storno totale o parziale di una fattura
 *
 * Seleziona una fattura emessa/inviata/pagata con residuo accreditabile,
 * inserisci imponibile, IVA e motivo. Supporta il prefill via ?invoiceId=.
 */

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, FileMinus, FileText, Loader2, Check, Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants"
import { getCreditableInvoices, createCreditNote } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CreditableInvoice {
  id: string
  invoiceNumber: string
  issueDate: string
  subtotal: number
  vatAmount: number
  total: number
  status: string
  customer: { id: string; companyName: string }
  credited: number
  creditable: number
}

function NuovaNotaCreditoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useUIStore()
  const prefillInvoiceId = searchParams.get("invoiceId") ?? ""

  const [invoices, setInvoices] = useState<CreditableInvoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(prefillInvoiceId)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [vatAmount, setVatAmount] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Carica fatture accreditabili (con debounce sulla ricerca)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoadingInvoices(true)
        const result = await getCreditableInvoices(invoiceSearch)
        setInvoices(result as unknown as CreditableInvoice[])
      } catch (err) {
        console.error("Errore caricamento fatture:", err)
      } finally {
        setLoadingInvoices(false)
      }
    }, invoiceSearch ? 400 : 0)
    return () => clearTimeout(timer)
  }, [invoiceSearch])

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) ?? null

  // Suggerisce l'IVA in proporzione al rapporto IVA/imponibile della fattura
  const suggestVat = (amountValue: string, invoice: CreditableInvoice | null) => {
    const parsed = parseFloat(amountValue)
    if (!invoice || isNaN(parsed) || parsed <= 0 || invoice.subtotal <= 0) return ""
    return (Math.round(parsed * (invoice.vatAmount / invoice.subtotal) * 100) / 100).toString()
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setVatAmount(suggestVat(value, selectedInvoice))
  }

  const handleSelectInvoice = (invoice: CreditableInvoice) => {
    setSelectedInvoiceId(invoice.id)
    // Ricalcola il suggerimento IVA con la nuova fattura
    if (amount) setVatAmount(suggestVat(amount, invoice))
  }

  // Compila per uno storno totale del residuo accreditabile
  const handleFullCredit = () => {
    if (!selectedInvoice) return
    const ratio = selectedInvoice.total > 0 ? selectedInvoice.creditable / selectedInvoice.total : 0
    const fullAmount = Math.round(selectedInvoice.subtotal * ratio * 100) / 100
    const fullVat = Math.round((selectedInvoice.creditable - fullAmount) * 100) / 100
    setAmount(fullAmount.toString())
    setVatAmount(fullVat.toString())
  }

  const parsedAmount = parseFloat(amount) || 0
  const parsedVat = parseFloat(vatAmount) || 0
  const total = Math.round((parsedAmount + parsedVat) * 100) / 100
  const exceedsCreditable = selectedInvoice !== null && total > selectedInvoice.creditable + 0.005

  const handleSubmit = async () => {
    if (!selectedInvoiceId) { addToast({ type: "error", title: "Errore", description: "Seleziona una fattura" }); return }
    if (parsedAmount <= 0) { addToast({ type: "error", title: "Errore", description: "Inserisci un imponibile maggiore di 0" }); return }
    if (reason.trim().length < 3) { addToast({ type: "error", title: "Errore", description: "Inserisci il motivo della nota di credito" }); return }
    if (exceedsCreditable) { addToast({ type: "error", title: "Errore", description: "L'importo supera il residuo accreditabile della fattura" }); return }

    try {
      setSubmitting(true)
      await createCreditNote({
        invoiceId: selectedInvoiceId,
        issueDate: new Date(issueDate),
        amount: parsedAmount,
        vatAmount: parsedVat,
        reason: reason.trim(),
      })
      addToast({ type: "success", title: "Nota di credito creata", description: "La nota di credito è stata emessa con successo" })
      router.push("/note-credito")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: (err as Error)?.message || "Impossibile creare la nota di credito" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/note-credito">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuova Nota di Credito</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Storno totale o parziale di una fattura emessa</p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fattura */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />Fattura da Stornare
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    icon={Search}
                    placeholder="Cerca per numero fattura o cliente..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                  />
                  {loadingInvoices ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />Caricamento fatture...
                    </div>
                  ) : invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Nessuna fattura accreditabile trovata. Le note di credito si possono emettere solo su fatture emesse, inviate, pagate o scadute con residuo disponibile.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          onClick={() => handleSelectInvoice(invoice)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedInvoiceId === invoice.id
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:bg-muted/30"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                              selectedInvoiceId === invoice.id ? "border-primary" : "border-muted-foreground/40"
                            }`}
                          >
                            {selectedInvoiceId === invoice.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {invoice.customer.companyName} — {formatDate(invoice.issueDate)}
                            </p>
                          </div>
                          <Badge className={INVOICE_STATUS_COLORS[invoice.status]}>
                            {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(invoice.total)}</p>
                            {invoice.credited > 0 && (
                              <p className="text-xs text-muted-foreground">
                                residuo {formatCurrency(invoice.creditable)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Importi */}
            {selectedInvoice && (
              <StaggerItem>
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileMinus className="h-4 w-4" />Importi da Accreditare
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleFullCredit}>
                      Storno Totale
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Imponibile (€)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">IVA (€)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={vatAmount}
                          onChange={(e) => setVatAmount(e.target.value)}
                          placeholder="0.00"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Suggerita in proporzione all&apos;IVA della fattura, modificabile
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Totale fattura</span>
                        <span>{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                      {selectedInvoice.credited > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Già accreditato</span>
                          <span>-{formatCurrency(selectedInvoice.credited)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Residuo accreditabile</span>
                        <span>{formatCurrency(selectedInvoice.creditable)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-bold">
                        <span>Totale nota di credito</span>
                        <span className={exceedsCreditable ? "text-red-600" : "text-foreground"}>
                          -{formatCurrency(total)}
                        </span>
                      </div>
                      {exceedsCreditable && (
                        <p className="text-xs text-red-600 mt-1">
                          L&apos;importo supera il residuo accreditabile della fattura
                        </p>
                      )}
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
                  <CardTitle className="text-base">Dettagli Nota di Credito</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo *</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="es. Reso merce, errore di fatturazione, sconto concordato..."
                    />
                  </div>
                  {selectedInvoice && (
                    <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Cliente</p>
                      <p className="font-medium">{selectedInvoice.customer.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ricavato automaticamente dalla fattura selezionata
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !selectedInvoiceId || parsedAmount <= 0 || exceedsCreditable}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Emetti Nota di Credito
              </Button>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}

export default function NuovaNotaCreditoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NuovaNotaCreditoForm />
    </Suspense>
  )
}
