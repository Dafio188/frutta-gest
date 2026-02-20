/**
 * Dettaglio Bolla DDT (Documento di Trasporto)
 *
 * Mostra intestazione con numero DDT, stato, cliente.
 * Tabella articoli con quantita, peso, prezzo.
 * Azioni di cambio stato e stampa.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Truck, User, MapPin, Phone, Package, FileText,
  CheckCircle2, Clock, Printer, Loader2, ShoppingCart, Weight, Hash, Edit3, Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { DDT_STATUS_LABELS, DDT_STATUS_COLORS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getDeliveryNote, updateDeliveryNoteStatus, deleteDeliveryNote, generateInvoiceFromDDT } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[]> = {
  DRAFT: [
    { label: "Emetti", next: "ISSUED", icon: FileText },
  ],
  ISSUED: [
    { label: "Segna Consegnata", next: "DELIVERED", icon: CheckCircle2 },
  ],
}

interface DDTData {
  id: string
  ddtNumber: string
  status: string
  issueDate: string
  deliveryDate: string | null
  transportReason: string | null
  transportedBy: string | null
  goodsAppearance: string | null
  numberOfPackages: number | null
  weight: number | null
  deliveryNotes: string | null
  createdAt: string
  customer: {
    id: string
    companyName: string
    phone: string | null
    email: string | null
    address: string
    city: string
    province: string
    postalCode: string
    contacts: { id: string; firstName: string; lastName: string; role: string | null; phone: string | null }[]
  }
  items: {
    id: string
    quantity: number
    unit: string
    unitPrice: number
    vatRate: number
    lineTotal: number
    notes: string | null
    product: { id: string; name: string; category: { name: string } | null }
  }[]
  order: {
    id: string
    orderNumber: string
    status: string
    items: { id: string; quantity: number; product: { name: string } }[]
  } | null
  createdBy: { id: string; name: string | null; email: string } | null
  invoiceLinks: { id: string; invoice: { id: string; invoiceNumber: string; status: string } }[]
}

export default function BollaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ddtId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [ddt, setDdt] = useState<DDTData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const loadDDT = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDeliveryNote(ddtId)
      setDdt(data as unknown as DDTData)
    } catch (err) {
      console.error("Errore caricamento DDT:", err)
      setError("Bolla non trovata")
    } finally {
      setLoading(false)
    }
  }, [ddtId])

  useEffect(() => {
    loadDDT()
  }, [loadDDT])

  const handleStatusChange = async (newStatus: string) => {
    if (!ddt) return
    setProcessing(true)
    try {
      await updateDeliveryNoteStatus(ddt.id, newStatus)
      addToast({
        type: "success",
        title: "Stato aggiornato",
        description: `DDT ${ddt.ddtNumber} aggiornata a "${DDT_STATUS_LABELS[newStatus]}"`,
      })
      // Ricarica dati completi (include invoiceLinks aggiornati dopo auto-fattura)
      loadDDT()
    } catch (err) {
      addToast({
        type: "error",
        title: "Errore",
        description: "Impossibile aggiornare lo stato della bolla",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!ddt) return
    if (!confirm(`Sei sicuro di voler eliminare la DDT ${ddt.ddtNumber}?`)) return
    setProcessing(true)
    try {
      await deleteDeliveryNote(ddt.id)
      addToast({ type: "success", title: "DDT eliminata", description: `${ddt.ddtNumber} eliminata con successo` })
      router.push("/bolle")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare la DDT" })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !ddt) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Truck className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Bolla non trovata</h2>
          <p className="text-sm text-muted-foreground">La bolla richiesta non esiste o e' stata eliminata.</p>
          <Link href="/bolle">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Torna alle bolle
            </Button>
          </Link>
        </div>
      </PageTransition>
    )
  }

  const actions = STATUS_ACTIONS[ddt.status] || []
  const canEdit = ddt.invoiceLinks.length === 0
  const canDelete = ddt.invoiceLinks.length === 0
  const primaryContact = ddt.customer.contacts?.[0]
  const subtotal = ddt.items.reduce((sum, item) => sum + item.lineTotal, 0)
  const vatTotal = ddt.items.reduce((sum, item) => sum + item.lineTotal * item.vatRate / 100, 0)
  const grandTotal = subtotal + vatTotal

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/bolle" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <Truck className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{ddt.ddtNumber}</h1>
                  <Badge className={DDT_STATUS_COLORS[ddt.status]}>
                    {DDT_STATUS_LABELS[ddt.status] || ddt.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Emessa il {formatDate(ddt.issueDate)}
                  {ddt.deliveryDate && ` — Consegnata il ${formatDate(ddt.deliveryDate)}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/bolle/${ddt.id}/modifica`}>
                <Button variant="outline">
                  <Edit3 className="h-4 w-4" strokeWidth={1.75} />
                  Modifica
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => addToast({ type: "info", title: "Stampa in corso..." })}>
              <Printer className="h-4 w-4" strokeWidth={1.75} />
              Stampa DDT
            </Button>
            {actions.map((action) => (
              <Button
                key={action.next}
                onClick={() => handleStatusChange(action.next)}
                loading={processing}
              >
                <action.icon className="h-4 w-4" strokeWidth={1.75} />
                {action.label}
              </Button>
            ))}
            {ddt.status === "DELIVERED" && ddt.invoiceLinks.length === 0 && (
              <Button
                onClick={async () => {
                  setProcessing(true)
                  try {
                    const result = await generateInvoiceFromDDT(ddt.id) as unknown as { id: string; invoiceNumber: string }
                    addToast({ type: "success", title: "Fattura generata", description: `Fattura ${result.invoiceNumber} creata dalla DDT ${ddt.ddtNumber}` })
                    loadDDT()
                  } catch (err: any) {
                    addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile generare la fattura" })
                  } finally {
                    setProcessing(false)
                  }
                }}
                loading={processing}
              >
                <FileText className="h-4 w-4" strokeWidth={1.75} />
                Genera Fattura
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete} loading={processing}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Elimina
              </Button>
            )}
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <StaggerItem className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Articoli ({ddt.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Prodotto</th>
                        <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">Quantita</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Prezzo Unit.</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ddt.items.map((item) => (
                        <tr key={item.id} className="border-b border-border/30 last:border-0">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{item.product?.name || "—"}</span>
                            {item.product?.category && (
                              <p className="text-xs text-muted-foreground">{item.product.category.name}</p>
                            )}
                            {item.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm">{item.quantity} {PRODUCT_UNIT_LABELS[item.unit] || item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium">{formatCurrency(item.lineTotal)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border/50">
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs text-muted-foreground">Subtotale</td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium">{formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs text-muted-foreground">IVA</td>
                        <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{formatCurrency(vatTotal)}</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">Totale</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-primary">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Transport Info */}
            {(ddt.transportReason || ddt.transportedBy || ddt.goodsAppearance || ddt.numberOfPackages || ddt.weight) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Dati Trasporto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ddt.transportReason && (
                      <InfoItem label="Causale" value={ddt.transportReason} />
                    )}
                    {ddt.transportedBy && (
                      <InfoItem label="Trasporto a cura" value={ddt.transportedBy} />
                    )}
                    {ddt.goodsAppearance && (
                      <InfoItem label="Aspetto dei beni" value={ddt.goodsAppearance} />
                    )}
                    {ddt.numberOfPackages != null && (
                      <InfoItem label="N. Colli" value={String(ddt.numberOfPackages)} />
                    )}
                    {ddt.weight != null && (
                      <InfoItem label="Peso (kg)" value={String(ddt.weight)} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Notes */}
            {ddt.deliveryNotes && (
              <Card>
                <CardHeader><CardTitle className="text-base">Note Consegna</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ddt.deliveryNotes}</p>
                </CardContent>
              </Card>
            )}
          </StaggerItem>

          {/* Sidebar */}
          <StaggerItem className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Link href={`/clienti/${ddt.customer.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {ddt.customer.companyName}
                  </Link>
                  {primaryContact && (
                    <p className="text-xs text-muted-foreground">{primaryContact.firstName} {primaryContact.lastName}{primaryContact.role ? ` — ${primaryContact.role}` : ""}</p>
                  )}
                </div>
                <Separator />
                {(ddt.customer.phone || primaryContact?.phone) && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                    <span className="text-sm">{ddt.customer.phone || primaryContact?.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                  <div className="text-sm">
                    <p>{ddt.customer.address}</p>
                    <p className="text-muted-foreground">{ddt.customer.postalCode} {ddt.customer.city} ({ddt.customer.province})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked Order */}
            {ddt.order && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingCart className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Ordine Collegato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/ordini/${ddt.order.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {ddt.order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">{ddt.order.items.length} articoli</p>
                </CardContent>
              </Card>
            )}

            {/* Linked Invoices */}
            {ddt.invoiceLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Fatture Collegate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ddt.invoiceLinks.map((link) => (
                    <Link key={link.id} href={`/fatture/${link.invoice.id}`} className="block text-sm font-medium hover:text-primary transition-colors">
                      {link.invoice.invoiceNumber}
                      <span className="text-xs text-muted-foreground ml-2">{link.invoice.status}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Informazioni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoItem label="Data Emissione" value={formatDate(ddt.issueDate)} />
                {ddt.deliveryDate && <InfoItem label="Data Consegna" value={formatDate(ddt.deliveryDate)} />}
                <InfoItem label="Articoli" value={`${ddt.items.length} prodotti`} />
                {ddt.createdBy && (
                  <InfoItem label="Creato da" value={ddt.createdBy.name || ddt.createdBy.email} />
                )}
                <InfoItem label="Creato il" value={formatDateTime(ddt.createdAt)} />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
