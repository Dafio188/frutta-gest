/**
 * Nuova Bolla DDT — Creazione documento di trasporto da ordine
 *
 * Seleziona cliente e opzionalmente un ordine.
 * Se viene selezionato un ordine, gli articoli vengono copiati.
 */

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Truck, Check, Loader2, ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ORDER_STATUS_LABELS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getCustomers, getOrders, getOrder, createDeliveryNote } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CustomerOption { id: string; companyName: string }
interface OrderOption {
  id: string; orderNumber: string; status: string; total: number; requestedDeliveryDate: string | null
  items: { id: string; quantity: number; unit: string; unitPrice: number; lineTotal: number; product: { name: string } }[]
}

export default function NuovaBollaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NuovaBollaContent />
    </Suspense>
  )
}

function NuovaBollaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetOrderId = searchParams.get("orderId")
  const { addToast } = useUIStore()

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [orders, setOrders] = useState<OrderOption[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [transportReason, setTransportReason] = useState("Vendita")
  const [transportedBy, setTransportedBy] = useState("Mittente")
  const [goodsAppearance, setGoodsAppearance] = useState("")
  const [numberOfPackages, setNumberOfPackages] = useState("")
  const [weight, setWeight] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [presetLoaded, setPresetLoaded] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const result = await getCustomers({ pageSize: 200 })
        const parsed = result as unknown as { data: CustomerOption[] }
        setCustomers(parsed.data)

        // Se arriva da un ordine, pre-seleziona cliente e ordine
        if (presetOrderId && !presetLoaded) {
          try {
            const orderData = await getOrder(presetOrderId) as unknown as { customerId: string }
            setSelectedCustomerId(orderData.customerId)
            setPresetLoaded(true)
          } catch {}
        }
      } catch (err) {
        console.error("Errore caricamento clienti:", err)
      } finally {
        setLoadingCustomers(false)
      }
    })()
  }, [presetOrderId, presetLoaded])

  useEffect(() => {
    if (!selectedCustomerId) { setOrders([]); setSelectedOrderId(""); return }
    (async () => {
      try {
        setLoadingOrders(true)
        setSelectedOrderId("")
        const result = await getOrders({ pageSize: 100, customerId: selectedCustomerId })
        const parsed = result as unknown as { data: OrderOption[] }
        // Solo ordini confermati/in preparazione senza DDT
        const available = parsed.data.filter((o) => ["CONFIRMED", "IN_PREPARATION"].includes(o.status))
        setOrders(available)
        // Pre-seleziona ordine se arriva da query param
        if (presetOrderId && available.some((o) => o.id === presetOrderId)) {
          setSelectedOrderId(presetOrderId)
        }
      } catch (err) {
        console.error("Errore caricamento ordini:", err)
      } finally {
        setLoadingOrders(false)
      }
    })()
  }, [selectedCustomerId])

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const handleSubmit = async () => {
    if (!selectedCustomerId) { addToast({ type: "error", title: "Errore", description: "Seleziona un cliente" }); return }

    try {
      setSubmitting(true)
      await createDeliveryNote({
        customerId: selectedCustomerId,
        orderId: selectedOrderId || null,
        issueDate: new Date(issueDate),
        transportReason,
        transportedBy,
        goodsAppearance: goodsAppearance || null,
        numberOfPackages: numberOfPackages ? Number(numberOfPackages) : null,
        weight: weight ? Number(weight) : null,
        deliveryNotes: deliveryNotes || null,
      })
      addToast({ type: "success", title: "DDT creata", description: "La bolla e' stata creata con successo" })
      router.push("/bolle")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile creare la bolla" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/bolle">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuova DDT</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Crea un nuovo documento di trasporto</p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
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

            {/* Ordine collegato */}
            {selectedCustomerId && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />Ordine da Associare
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />Caricamento ordini...
                      </div>
                    ) : orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nessun ordine confermato disponibile per questo cliente.</p>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={selectedOrderId}
                          onChange={(e) => setSelectedOrderId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Nessun ordine (DDT libera)</option>
                          {orders.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.orderNumber} — {formatCurrency(o.total)} ({ORDER_STATUS_LABELS[o.status] || o.status})
                            </option>
                          ))}
                        </select>
                        {selectedOrder && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Articoli dell'ordine (verranno copiati nella DDT):</p>
                            {selectedOrder.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                                <span>{item.product?.name || "—"}</span>
                                <span className="font-medium">{item.quantity} {(PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            )}
          </div>

          {/* Sidebar - Dati Trasporto */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dati Trasporto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Causale Trasporto</label>
                    <Input value={transportReason} onChange={(e) => setTransportReason(e.target.value)} placeholder="Vendita" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Trasporto a cura di</label>
                    <select
                      value={transportedBy}
                      onChange={(e) => setTransportedBy(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Mittente">Mittente</option>
                      <option value="Destinatario">Destinatario</option>
                      <option value="Vettore">Vettore</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Aspetto dei Beni</label>
                    <Input value={goodsAppearance} onChange={(e) => setGoodsAppearance(e.target.value)} placeholder="es. Cassette" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">N. Colli</label>
                      <Input type="number" min="0" value={numberOfPackages} onChange={(e) => setNumberOfPackages(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                      <Input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note Consegna</label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Note per la consegna..."
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !selectedCustomerId}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Crea DDT
              </Button>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
