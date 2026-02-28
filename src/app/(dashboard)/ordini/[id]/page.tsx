/**
 * Dettaglio Ordine
 *
 * Header con numero ordine, stato, canale. Card cliente e consegna.
 * Tabella articoli con quantita, prezzo, totale.
 * Azioni di cambio stato e note.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ShoppingCart, MessageCircle, Mail, Mic, PenLine, Globe, User, MapPin, Phone,
  Package, Truck, FileText, CheckCircle2, XCircle, Clock, Printer, Loader2, Edit3, Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_CHANNEL_LABELS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants"
import { getOrder, updateOrderStatus, deleteOrder } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  AUDIO: Mic,
  MANUAL: PenLine,
  WEB: Globe,
}

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[]> = {
  RECEIVED: [
    { label: "Conferma", next: "CONFIRMED", icon: CheckCircle2 },
    { label: "Annulla", next: "CANCELLED", icon: XCircle },
  ],
  CONFIRMED: [
    { label: "In Preparazione", next: "IN_PREPARATION", icon: Package },
    { label: "Annulla", next: "CANCELLED", icon: XCircle },
  ],
  IN_PREPARATION: [
    { label: "Crea DDT", next: "CREATE_DDT", icon: Truck },
  ],
  // DELIVERED → impostato automaticamente da createDeliveryNote
  // INVOICED → impostato automaticamente da createInvoice
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  channel: string
  orderDate: string
  requestedDeliveryDate: string | null
  notes: string | null
  internalNotes: string | null
  subtotal: number
  vatAmount: number
  total: number
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
    lineTotal: number
    notes: string | null
    productName: string | null
    product: { id: string; name: string; category: { name: string } | null } | null
  }[]
  createdBy: { id: string; name: string | null; email: string } | null
  whatsappMessage: { id: string; fromPhone: string; messageBody: string; receivedAt: string } | null
  audioTranscription: { id: string; transcriptionText: string | null } | null
}

export default function OrdineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOrder(orderId)
      setOrder(data as unknown as OrderData)
    } catch (err) {
      console.error("Errore caricamento ordine:", err)
      setError("Ordine non trovato")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    // Crea DDT rimanda alla pagina di creazione DDT
    if (newStatus === "CREATE_DDT") {
      router.push(`/bolle/nuova?orderId=${order.id}`)
      return
    }

    setProcessing(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev)
      addToast({
        type: "success",
        title: "Stato aggiornato",
        description: `Ordine ${order.orderNumber} aggiornato a "${ORDER_STATUS_LABELS[newStatus]}"`,
      })
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Errore",
        description: err.message || "Impossibile aggiornare lo stato dell'ordine",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm(`Sei sicuro di voler eliminare l'ordine ${order.orderNumber}?`)) return
    setProcessing(true)
    try {
      await deleteOrder(order.id)
      addToast({ type: "success", title: "Ordine eliminato", description: `${order.orderNumber} eliminato con successo` })
      router.push("/ordini")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare l'ordine" })
    } finally {
      setProcessing(false)
    }
  }

  const canEdit = order?.status !== "INVOICED" && order?.status !== "CANCELLED"
  const canDelete = order?.status !== "INVOICED"

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Ordine non trovato</h2>
          <p className="text-sm text-muted-foreground">L'ordine richiesto non esiste o e' stato eliminato.</p>
          <Link href="/ordini">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Torna agli ordini
            </Button>
          </Link>
        </div>
      </PageTransition>
    )
  }

  const actions = STATUS_ACTIONS[order.status] || []
  const ChannelIcon = CHANNEL_ICONS[order.channel] || ShoppingCart
  const primaryContact = order.customer.contacts?.[0]

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/ordini" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChannelIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>{ORDER_CHANNEL_LABELS[order.channel] || order.channel}</span>
                  <span className="text-border">|</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/ordini/${order.id}/modifica`}>
                <Button variant="outline">
                  <Edit3 className="h-4 w-4" strokeWidth={1.75} />
                  Modifica
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => addToast({ type: "info", title: "Stampa in corso..." })}>
              <Printer className="h-4 w-4" strokeWidth={1.75} />
              Stampa
            </Button>
            {actions.map((action) => (
              <Button
                key={action.next}
                variant={action.next === "CANCELLED" ? "destructive" : "default"}
                onClick={() => handleStatusChange(action.next)}
                loading={processing}
              >
                <action.icon className="h-4 w-4" strokeWidth={1.75} />
                {action.label}
              </Button>
            ))}
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
                  Articoli ({order.items.length})
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
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-border/30 last:border-0">
                          <td className="px-4 py-3">
                            <div>
                              <span className="text-sm font-medium">{item.product?.name ?? item.productName ?? "Prodotto personalizzato"}</span>
                              {item.product?.category && (
                                <p className="text-xs text-muted-foreground">{item.product.category.name}</p>
                              )}
                              {item.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</p>}
                            </div>
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
                        <td className="px-4 py-2.5 text-right text-sm font-medium">{formatCurrency(order.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 text-right text-xs text-muted-foreground">IVA</td>
                        <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{formatCurrency(order.vatAmount)}</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">Totale</td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-primary">{formatCurrency(order.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader><CardTitle className="text-base">Note Ordine</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp Message */}
            {order.whatsappMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
                    Messaggio WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">Da: {order.whatsappMessage.fromPhone} — {formatDateTime(order.whatsappMessage.receivedAt)}</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-xl p-3">{order.whatsappMessage.messageBody}</p>
                </CardContent>
              </Card>
            )}

            {/* Audio Transcription */}
            {order.audioTranscription?.transcriptionText && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="h-5 w-5 text-purple-500" strokeWidth={1.75} />
                    Trascrizione Audio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-xl p-3">{order.audioTranscription.transcriptionText}</p>
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
                  <Link href={`/clienti/${order.customer.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {order.customer.companyName}
                  </Link>
                  {primaryContact && (
                    <p className="text-xs text-muted-foreground">{primaryContact.firstName} {primaryContact.lastName}{primaryContact.role ? ` — ${primaryContact.role}` : ""}</p>
                  )}
                </div>
                <Separator />
                {(order.customer.phone || primaryContact?.phone) && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                    <span className="text-sm">{order.customer.phone || primaryContact?.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                  <div className="text-sm">
                    <p>{order.customer.address}</p>
                    <p className="text-muted-foreground">{order.customer.postalCode} {order.customer.city} ({order.customer.province})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Consegna
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoItem label="Data Ordine" value={formatDate(order.orderDate)} />
                <InfoItem label="Data Consegna" value={order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : "Non programmata"} />
                <InfoItem label="Articoli" value={`${order.items.length} prodotti`} />
                {order.createdBy && (
                  <InfoItem label="Creato da" value={order.createdBy.name || order.createdBy.email} />
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Cronologia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <TimelineItem time={formatDateTime(order.createdAt)} label="Ordine ricevuto" active />
                  {order.status !== "RECEIVED" && order.status !== "CANCELLED" && (
                    <TimelineItem label="Ordine confermato" active />
                  )}
                  {(order.status === "IN_PREPARATION" || order.status === "DELIVERED" || order.status === "INVOICED") && (
                    <TimelineItem label="In preparazione" active />
                  )}
                  {(order.status === "DELIVERED" || order.status === "INVOICED") && (
                    <TimelineItem label="Consegnato" active />
                  )}
                  {order.status === "INVOICED" && (
                    <TimelineItem label="Fatturato" active />
                  )}
                  {order.status === "CANCELLED" && (
                    <TimelineItem label="Annullato" active />
                  )}
                </div>
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

function TimelineItem({ time, label, active }: { time?: string; label: string; active?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${active ? "bg-primary" : "bg-muted-foreground/30"}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {time && <p className="text-xs text-muted-foreground">{time}</p>}
      </div>
    </div>
  )
}
