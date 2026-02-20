/**
 * Modifica Bolla DDT
 *
 * Form pre-compilato con dati DDT. Permette modifica dati trasporto,
 * peso, numero colli, cliente, ordine collegato.
 * Bloccata se la DDT ha già una fattura collegata.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Truck, Check, Loader2, ShoppingCart, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ORDER_STATUS_LABELS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getDeliveryNote, getCustomers, getOrders, updateDeliveryNote } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CustomerOption { id: string; companyName: string }
interface OrderOption {
  id: string; orderNumber: string; status: string; total: number
  items: { id: string; quantity: number; unit: string; product: { name: string } }[]
}

export default function ModificaBollaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ddtId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [ddtNumber, setDdtNumber] = useState("")
  const [locked, setLocked] = useState(false)
  const [lockedReason, setLockedReason] = useState("")

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [orders, setOrders] = useState<OrderOption[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [transportReason, setTransportReason] = useState("Vendita")
  const [transportedBy, setTransportedBy] = useState("Mittente")
  const [goodsAppearance, setGoodsAppearance] = useState("")
  const [numberOfPackages, setNumberOfPackages] = useState("")
  const [weight, setWeight] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadDDT = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDeliveryNote(ddtId) as unknown as any

      if (data.invoiceLinks?.length > 0) {
        setLocked(true)
        setLockedReason("Non puoi modificare una DDT già collegata a una fattura.")
      }

      setDdtNumber(data.ddtNumber)
      setSelectedCustomerId(data.customer.id)
      setSelectedOrderId(data.order?.id || "")
      setIssueDate(data.issueDate ? data.issueDate.split("T")[0] : "")
      setTransportReason(data.transportReason || "Vendita")
      setTransportedBy(data.transportedBy || "Mittente")
      setGoodsAppearance(data.goodsAppearance || "")
      setNumberOfPackages(data.numberOfPackages?.toString() || "")
      setWeight(data.weight?.toString() || "")
      setDeliveryNotes(data.deliveryNotes || "")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "DDT non trovata" })
      router.push("/bolle")
    } finally {
      setLoading(false)
    }
  }, [ddtId, router, addToast])

  useEffect(() => { loadDDT() }, [loadDDT])

  useEffect(() => {
    (async () => {
      try {
        const result = await getCustomers({ pageSize: 200 })
        const parsed = result as unknown as { data: CustomerOption[] }
        setCustomers(parsed.data)
      } catch {} finally { setLoadingCustomers(false) }
    })()
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) { setOrders([]); return }
    (async () => {
      try {
        setLoadingOrders(true)
        const result = await getOrders({ pageSize: 100, customerId: selectedCustomerId })
        const parsed = result as unknown as { data: OrderOption[] }
        setOrders(parsed.data.filter((o) => ["CONFIRMED", "IN_PREPARATION", "DELIVERED"].includes(o.status)))
      } catch {} finally { setLoadingOrders(false) }
    })()
  }, [selectedCustomerId])

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const handleSubmit = async () => {
    if (!selectedCustomerId) { addToast({ type: "error", title: "Errore", description: "Seleziona un cliente" }); return }
    try {
      setSubmitting(true)
      await updateDeliveryNote(ddtId, {
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
      addToast({ type: "success", title: "DDT aggiornata", description: `${ddtNumber} modificata con successo` })
      router.push(`/bolle/${ddtId}`)
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
          <Link href={`/bolle/${ddtId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Modifica {ddtNumber}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Modifica dati trasporto, peso, cliente e ordine</p>
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
                <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
                <CardContent>
                  {loadingCustomers ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</div>
                  ) : (
                    <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} disabled={locked}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                      <option value="">Seleziona un cliente...</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {selectedCustomerId && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />Ordine Collegato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingOrders ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</div>
                    ) : (
                      <div className="space-y-2">
                        <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} disabled={locked}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                          <option value="">Nessun ordine (DDT libera)</option>
                          {orders.map((o) => (
                            <option key={o.id} value={o.id}>{o.orderNumber} — {formatCurrency(o.total)} ({ORDER_STATUS_LABELS[o.status]})</option>
                          ))}
                        </select>
                        {selectedOrder && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Articoli dell'ordine:</p>
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

          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Dati Trasporto</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Emissione</label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={locked} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Causale Trasporto</label>
                    <Input value={transportReason} onChange={(e) => setTransportReason(e.target.value)} disabled={locked} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Trasporto a cura di</label>
                    <select value={transportedBy} onChange={(e) => setTransportedBy(e.target.value)} disabled={locked}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                      <option value="Mittente">Mittente</option>
                      <option value="Destinatario">Destinatario</option>
                      <option value="Vettore">Vettore</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Aspetto dei Beni</label>
                    <Input value={goodsAppearance} onChange={(e) => setGoodsAppearance(e.target.value)} disabled={locked} placeholder="es. Cassette" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">N. Colli</label>
                      <Input type="number" min="0" value={numberOfPackages} onChange={(e) => setNumberOfPackages(e.target.value)} disabled={locked} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Peso (kg)</label>
                      <Input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={locked} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note Consegna</label>
                    <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} disabled={locked} rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {!locked && (
              <StaggerItem>
                <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !selectedCustomerId}>
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
