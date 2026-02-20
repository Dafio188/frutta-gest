/**
 * Dettaglio Fattura Fornitore
 *
 * Mostra dati completi della fattura fornitore con importi,
 * pagamenti, stato e azioni (modifica, elimina).
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, FileText, Edit3, Trash2, Loader2, Factory,
  Calendar, CreditCard, Package, Plus, ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import {
  SUPPLIER_INVOICE_STATUS_LABELS,
  SUPPLIER_INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { getSupplierInvoice, deleteSupplierInvoice, createPayment } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

function getInvoiceStatus(invoice: any): string {
  if (invoice.isPaid) return "PAID"
  if (new Date(invoice.dueDate) < new Date()) return "OVERDUE"
  return "UNPAID"
}

export default function DettaglioFatturaFornitore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "BONIFICO",
    reference: "",
    notes: "",
  })

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSupplierInvoice(id)
      setInvoice(data)
    } catch {
      addToast({ type: "error", title: "Errore", description: "Fattura fornitore non trovata" })
      router.push("/acquisti/fatture")
    } finally {
      setLoading(false)
    }
  }, [id, router, addToast])

  useEffect(() => { loadInvoice() }, [loadInvoice])

  const handlePayment = async () => {
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      addToast({ type: "error", title: "Errore", description: "Inserisci un importo valido" })
      return
    }
    try {
      setPaymentLoading(true)
      await createPayment({
        direction: "OUTGOING",
        amount: Number(paymentData.amount),
        paymentDate: new Date(),
        method: paymentData.method,
        reference: paymentData.reference || null,
        notes: paymentData.notes || null,
        supplierId: invoice?.supplierId,
        supplierInvoiceId: id,
      })
      addToast({ type: "success", title: "Pagamento registrato", description: `Pagamento di ${formatCurrency(Number(paymentData.amount))} registrato` })
      setShowPaymentForm(false)
      setPaymentData({ amount: "", method: "BONIFICO", reference: "", notes: "" })
      await loadInvoice()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile registrare il pagamento" })
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questa fattura fornitore?")) return
    try {
      await deleteSupplierInvoice(id)
      addToast({ type: "success", title: "Eliminata", description: "Fattura fornitore eliminata" })
      router.push("/acquisti/fatture")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare" })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!invoice) return null

  const status = getInvoiceStatus(invoice)
  const canEdit = !invoice.isPaid
  const canDelete = !invoice.isPaid && (!invoice.payments || invoice.payments.length === 0)
  const remaining = Number(invoice.total) - Number(invoice.paidAmount)

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/acquisti/fatture">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{invoice.supplierInvoiceNumber}</h1>
                <Badge className={SUPPLIER_INVOICE_STATUS_COLORS[status] || ""}>
                  {SUPPLIER_INVOICE_STATUS_LABELS[status] || status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Fattura di {invoice.supplier?.companyName} del {formatDate(invoice.issueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/acquisti/fatture/${id}/modifica`}>
                <Button variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />Modifica
                </Button>
              </Link>
            )}
            {!invoice.isPaid && remaining > 0 && (
              <Button variant="default" size="sm" onClick={() => {
                setPaymentData(prev => ({ ...prev, amount: String(remaining.toFixed(2)) }))
                setShowPaymentForm(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />Registra Pagamento
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Elimina
              </Button>
            )}
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Articoli */}
            {invoice.items && invoice.items.length > 0 && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />Articoli
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-2 pr-4 font-medium">Prodotto</th>
                            <th className="text-right py-2 px-4 font-medium">Qtà</th>
                            <th className="text-right py-2 px-4 font-medium">Prezzo</th>
                            <th className="text-right py-2 pl-4 font-medium">Totale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item: any) => (
                            <tr key={item.id} className="border-b border-border/50 last:border-0">
                              <td className="py-3 pr-4">
                                <p className="font-medium">{item.description || item.product?.name || "—"}</p>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {formatNumber(item.quantity)} {(PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()}
                              </td>
                              <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-3 pl-4 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Importi */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />Importi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Imponibile</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA</span>
                      <span>{formatCurrency(invoice.vatAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold">Totale</span>
                      <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pagato</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Residuo</span>
                        <span className="font-medium text-amber-600">{formatCurrency(remaining)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Pagamenti */}
            {invoice.payments && invoice.payments.length > 0 && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />Pagamenti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {invoice.payments.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{formatDate(payment.paymentDate)}</p>
                            <p className="text-xs text-muted-foreground">
                              {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                              {payment.reference && ` — ${payment.reference}`}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Form Registra Pagamento — fuori da StaggerItem per essere visibile quando aggiunto dinamicamente */}
            {showPaymentForm && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="h-4 w-4" />Registra Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Importo *</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={remaining}
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                          />
                          <p className="text-xs text-muted-foreground">Residuo: {formatCurrency(remaining)}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Metodo di Pagamento</label>
                          <select
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={paymentData.method}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                          >
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Riferimento (CRO, n. assegno...)</label>
                        <Input
                          value={paymentData.reference}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                          placeholder="Es. CRO bonifico, numero assegno..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Note</label>
                        <Input
                          value={paymentData.notes}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Note opzionali..."
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)} disabled={paymentLoading}>
                          Annulla
                        </Button>
                        <Button size="sm" onClick={handlePayment} disabled={paymentLoading}>
                          {paymentLoading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</>
                          ) : (
                            <><CreditCard className="h-4 w-4 mr-2" />Conferma Pagamento</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-4 w-4" />Fornitore
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{invoice.supplier?.companyName}</p>
                  {invoice.supplier?.phone && <p className="text-muted-foreground">{invoice.supplier.phone}</p>}
                  {invoice.supplier?.email && <p className="text-muted-foreground">{invoice.supplier.email}</p>}
                  {invoice.supplier?.city && (
                    <p className="text-muted-foreground">
                      {invoice.supplier.city}{invoice.supplier.province ? ` (${invoice.supplier.province})` : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />Date
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data emissione</span>
                    <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scadenza</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {invoice.purchaseOrder && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />Ordine Collegato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N. Ordine</span>
                      <span className="font-medium">{invoice.purchaseOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stato</span>
                      <Badge variant="outline" className="text-xs">{invoice.purchaseOrder.status}</Badge>
                    </div>
                    <Link href={`/acquisti/ordini/${invoice.purchaseOrder.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <ShoppingCart className="h-4 w-4 mr-2" />Vedi Ordine
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {invoice.notes && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
