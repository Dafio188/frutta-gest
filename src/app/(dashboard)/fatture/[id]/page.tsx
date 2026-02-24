/**
 * Dettaglio Fattura
 *
 * Mostra intestazione con numero fattura, stato, cliente.
 * Tabella articoli con quantita, prezzo, IVA, totale.
 * Azioni di cambio stato e riepilogo pagamenti.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, FileText, User, MapPin, Phone, Mail, CreditCard,
  CheckCircle2, Clock, Send, Ban, AlertTriangle, Loader2, Truck, Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS, PRODUCT_UNIT_LABELS,
} from "@/lib/constants"
import { getInvoice, updateInvoiceStatus, deleteInvoice } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[]> = {
  DRAFT: [{ label: "Emetti", next: "ISSUED", icon: FileText }],
  ISSUED: [{ label: "Segna Inviata", next: "SENT", icon: Send }],
  SENT: [{ label: "Segna Pagata", next: "PAID", icon: CheckCircle2 }],
  OVERDUE: [{ label: "Segna Pagata", next: "PAID", icon: CheckCircle2 }],
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string | null
  subtotal: number
  vatAmount: number
  total: number
  paidAmount: number
  paymentMethod: string | null
  paymentTerms: string | null
  notes: string | null
  internalNotes: string | null
  createdAt: string
  customer: {
    id: string; companyName: string; phone: string | null; email: string | null
    address: string; city: string; province: string; postalCode: string
    contacts: { id: string; firstName: string; lastName: string; role: string | null; phone: string | null; email: string | null }[]
  }
  items: {
    id: string; description: string; quantity: number; unit: string
    unitPrice: number; costPrice: number | null; vatRate: number; lineTotal: number
    supplierId: string | null
    productId: string | null
    product: { id: string; name: string; category: { name: string } | null } | null
    supplier: { id: string; companyName: string } | null
  }[]
  ddtLinks: {
    id: string
    deliveryNote: {
      id: string; ddtNumber: string; status: string
      order: { id: string; orderNumber: string } | null
    }
  }[]
  payments: {
    id: string; amount: number; paymentDate: string; method: string; status: string; reference: string | null
  }[]
  creditNotes: { id: string; creditNoteNumber: string; total: number; status: string }[]
  createdBy: { id: string; name: string | null; email: string } | null
}

export default function FatturaDettaglioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getInvoice(id)
      setInvoice(result as unknown as InvoiceData)
    } catch (err) {
      console.error("Errore caricamento fattura:", err)
      addToast({ type: "error", title: "Errore", description: "Fattura non trovata" })
      router.push("/fatture")
    } finally {
      setLoading(false)
    }
  }, [id, router, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return
    try {
      setActionLoading(true)
      await updateInvoiceStatus(invoice.id, newStatus)
      addToast({ type: "success", title: "Stato aggiornato", description: `Fattura ${INVOICE_STATUS_LABELS[newStatus] || newStatus}` })
      loadData()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile aggiornare lo stato" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm(`Sei sicuro di voler eliminare la fattura ${invoice.invoiceNumber}?`)) return
    try {
      setActionLoading(true)
      await deleteInvoice(invoice.id)
      addToast({ type: "success", title: "Fattura eliminata", description: `${invoice.invoiceNumber} eliminata con successo` })
      router.push("/fatture")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare la fattura" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) return null

  const actions = STATUS_ACTIONS[invoice.status] || []
  const remaining = invoice.total - invoice.paidAmount
  const canDelete = invoice.status !== "PAID" && invoice.payments.length === 0

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/fatture">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                <Badge className={INVOICE_STATUS_COLORS[invoice.status]}>
                  {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {invoice.customer.companyName} — Emessa il {formatDate(invoice.issueDate)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {actions.map((action) => (
              <Button key={action.next} size="sm" onClick={() => handleStatusChange(action.next)} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <action.icon className="h-4 w-4 mr-1" strokeWidth={1.75} />}
                {action.label}
              </Button>
            ))}
            {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("CANCELLED")} disabled={actionLoading}>
                <Ban className="h-4 w-4 mr-1" strokeWidth={1.75} />Annulla
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading}>
                <Trash2 className="h-4 w-4 mr-1" strokeWidth={1.75} />Elimina
              </Button>
            )}
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Articoli</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 font-medium">Descrizione</th>
                          <th className="text-right py-2 font-medium">Qtà</th>
                          <th className="text-right py-2 font-medium">Vendita</th>
                          <th className="text-right py-2 font-medium">Costo</th>
                          <th className="text-right py-2 font-medium">Margine</th>
                          <th className="text-left py-2 font-medium">Fornitore</th>
                          <th className="text-right py-2 font-medium">IVA %</th>
                          <th className="text-right py-2 font-medium">Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => {
                          const marginPct = item.costPrice != null && item.unitPrice > 0
                            ? ((item.unitPrice - item.costPrice) / item.unitPrice) * 100
                            : null
                          return (
                            <tr key={item.id} className="border-b border-border/50">
                              <td className="py-3">
                                <p className="font-medium">{item.description}</p>
                                {item.product?.category && (
                                  <p className="text-xs text-muted-foreground">{item.product.category.name}</p>
                                )}
                              </td>
                              <td className="text-right py-3">
                                {item.quantity} {(PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()}
                              </td>
                              <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-right py-3 text-muted-foreground">
                                {item.costPrice != null ? formatCurrency(item.costPrice) : "—"}
                              </td>
                              <td className="text-right py-3">
                                {marginPct != null ? (
                                  <span className={marginPct >= 20 ? "text-emerald-600 font-medium" : marginPct >= 0 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                                    {marginPct.toFixed(1)}%
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="py-3">
                                {item.supplier ? (
                                  <Link href={`/fornitori/${item.supplier.id}`} className="text-xs text-primary hover:underline">
                                    {item.supplier.companyName}
                                  </Link>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="text-right py-3">{item.vatRate}%</td>
                              <td className="text-right py-3 font-medium">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Separator className="my-3" />
                  {(() => {
                    const itemsWithCost = invoice.items.filter((i) => i.costPrice != null)
                    const totalRevenue = itemsWithCost.reduce((s, i) => s + i.lineTotal, 0)
                    const totalCost = itemsWithCost.reduce((s, i) => s + (i.costPrice! * i.quantity), 0)
                    const totalProfit = totalRevenue - totalCost
                    const totalMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
                    const hasCostData = itemsWithCost.length > 0

                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Imponibile</span>
                          <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IVA</span>
                          <span>{formatCurrency(invoice.vatAmount)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-base font-bold">
                          <span>Totale</span>
                          <span>{formatCurrency(invoice.total)}</span>
                        </div>
                        {hasCostData && (
                          <>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-muted-foreground">
                              <span>Costo merce</span>
                              <span>{formatCurrency(totalCost)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Profitto</span>
                              <span className={totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
                                {formatCurrency(totalProfit)}
                              </span>
                            </div>
                            {totalMarginPct != null && (
                              <div className="flex justify-between font-medium">
                                <span>Margine</span>
                                <span className={totalMarginPct >= 20 ? "text-emerald-600" : totalMarginPct >= 0 ? "text-amber-600" : "text-red-600"}>
                                  {totalMarginPct.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })()}
                  {invoice.paidAmount > 0 && (
                    <div className="space-y-1 text-sm mt-2">
                      <div className="flex justify-between text-emerald-600">
                        <span>Pagato</span>
                        <span>-{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Rimanente</span>
                        <span className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* DDT Collegate */}
            {invoice.ddtLinks.length > 0 && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-4 w-4" />Bolle Collegate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {invoice.ddtLinks.map((link) => (
                        <Link key={link.id} href={`/bolle/${link.deliveryNote.id}`} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{link.deliveryNote.ddtNumber}</p>
                            {link.deliveryNote.order && (
                              <p className="text-xs text-muted-foreground">Ordine: {link.deliveryNote.order.orderNumber}</p>
                            )}
                          </div>
                          <Badge variant="secondary">{link.deliveryNote.status}</Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Pagamenti */}
            {invoice.payments.length > 0 && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />Pagamenti Registrati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {invoice.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                          <div>
                            <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(p.paymentDate)} — {PAYMENT_METHOD_LABELS[p.method] || p.method}
                            </p>
                          </div>
                          <Badge variant={p.status === "COMPLETED" ? "success" : "warning"}>
                            {p.status === "COMPLETED" ? "Completato" : "In attesa"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Note */}
            {(invoice.notes || invoice.internalNotes) && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {invoice.notes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Note fattura</p>
                        <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.internalNotes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Note interne</p>
                        <p className="text-sm whitespace-pre-wrap bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl">
                          {invoice.internalNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/clienti/${invoice.customer.id}`} className="text-sm font-medium text-primary hover:underline">
                    {invoice.customer.companyName}
                  </Link>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{invoice.customer.address}, {invoice.customer.postalCode} {invoice.customer.city} ({invoice.customer.province})</span>
                  </div>
                  {invoice.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />{invoice.customer.phone}
                    </div>
                  )}
                  {invoice.customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />{invoice.customer.email}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Payment Info */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {invoice.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metodo</span>
                      <span>{PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod}</span>
                    </div>
                  )}
                  {invoice.paymentTerms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Termini</span>
                      <span>{invoice.paymentTerms}</span>
                    </div>
                  )}
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scadenza</span>
                      <span className={invoice.status === "OVERDUE" ? "text-red-600 font-medium" : ""}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Totale</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Pagato</span>
                    <span>{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Da pagare</span>
                    <span className={remaining > 0 ? "text-red-600" : "text-emerald-600"}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Info Card */}
            <StaggerItem>
              <Card>
                <CardContent className="pt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creata il</span>
                    <span>{formatDateTime(invoice.createdAt)}</span>
                  </div>
                  {invoice.createdBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creata da</span>
                      <span>{invoice.createdBy.name || invoice.createdBy.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
