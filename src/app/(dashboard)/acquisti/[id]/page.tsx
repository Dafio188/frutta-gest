/**
 * Dettaglio Ordine Fornitore
 *
 * Mostra dati completi dell'ordine fornitore con articoli,
 * totali, stato e azioni (modifica, elimina, cambio stato).
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ShoppingCart, Edit3, Trash2, Loader2, Factory,
  Package, Calendar, Send, CheckCircle, XCircle, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
  PRODUCT_UNIT_LABELS,
} from "@/lib/constants"
import { getPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

export default function DettaglioOrdineFornitore({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPurchaseOrder(id)
      setOrder(data)
    } catch {
      addToast({ type: "error", title: "Errore", description: "Ordine fornitore non trovato" })
      router.push("/acquisti")
    } finally {
      setLoading(false)
    }
  }, [id, router, addToast])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePurchaseOrderStatus(id, newStatus)
      addToast({ type: "success", title: "Stato aggiornato", description: `Ordine aggiornato a "${PURCHASE_ORDER_STATUS_LABELS[newStatus]}"` })
      loadOrder()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile aggiornare lo stato" })
    }
  }

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo ordine fornitore?")) return
    try {
      await deletePurchaseOrder(id)
      addToast({ type: "success", title: "Eliminato", description: "Ordine fornitore eliminato" })
      router.push("/acquisti")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare" })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!order) return null

  const canEdit = order.status !== "CANCELLED"
  const canDelete = true

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/acquisti">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{order.poNumber}</h1>
                <Badge className={PURCHASE_ORDER_STATUS_COLORS[order.status] || ""}>
                  {PURCHASE_ORDER_STATUS_LABELS[order.status] || order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ordine a {order.supplier?.companyName} del {formatDate(order.orderDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/acquisti/${id}/modifica`}>
                <Button variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />Modifica
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Elimina
              </Button>
            )}
          </div>
        </div>

        {/* Status actions */}
        {order.status !== "CANCELLED" && (
          <div className="flex flex-wrap gap-2">
            {order.status === "DRAFT" && (
              <Button size="sm" onClick={() => handleStatusChange("SENT")}>
                <Send className="h-4 w-4 mr-2" />Segna come Inviato
              </Button>
            )}
            {order.status === "SENT" && (
              <Button size="sm" onClick={() => handleStatusChange("RECEIVED")}>
                <CheckCircle className="h-4 w-4 mr-2" />Merce Ricevuta
              </Button>
            )}
            {order.status !== "RECEIVED" && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleStatusChange("CANCELLED")}>
                <XCircle className="h-4 w-4 mr-2" />Annulla
              </Button>
            )}
          </div>
        )}

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articoli */}
          <div className="lg:col-span-2">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />Articoli Ordinati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left pb-2 text-xs font-medium text-muted-foreground uppercase">Prodotto</th>
                          <th className="text-right pb-2 text-xs font-medium text-muted-foreground uppercase">Qtà</th>
                          <th className="text-right pb-2 text-xs font-medium text-muted-foreground uppercase">Prezzo</th>
                          <th className="text-right pb-2 text-xs font-medium text-muted-foreground uppercase">Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item: any) => (
                          <tr key={item.id} className="border-b border-border/30 last:border-0">
                            <td className="py-3 text-sm">
                              <p className="font-medium">{item.product?.name || "Prodotto"}</p>
                              {item.product?.category?.name && (
                                <p className="text-xs text-muted-foreground">{item.product.category.name}</p>
                              )}
                            </td>
                            <td className="py-3 text-sm text-right">
                              {item.quantity} {(PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()}
                            </td>
                            <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border">
                          <td colSpan={3} className="pt-3 text-sm text-right text-muted-foreground">Subtotale</td>
                          <td className="pt-3 text-sm text-right font-medium">{formatCurrency(order.subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-1 text-sm text-right text-muted-foreground">IVA</td>
                          <td className="py-1 text-sm text-right">{formatCurrency(order.vatAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-2 text-right font-semibold">Totale</td>
                          <td className="py-2 text-right font-bold text-lg">{formatCurrency(order.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>

          {/* Sidebar info */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-4 w-4" />Fornitore
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{order.supplier?.companyName}</p>
                  {order.supplier?.phone && <p className="text-muted-foreground">{order.supplier.phone}</p>}
                  {order.supplier?.email && <p className="text-muted-foreground">{order.supplier.email}</p>}
                  {order.supplier?.city && (
                    <p className="text-muted-foreground">
                      {order.supplier.city}{order.supplier.province ? ` (${order.supplier.province})` : ""}
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
                    <span className="text-muted-foreground">Data ordine</span>
                    <span className="font-medium">{formatDate(order.orderDate)}</span>
                  </div>
                  {order.expectedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consegna prevista</span>
                      <span className="font-medium">{formatDate(order.expectedDate)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {order.notes && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {order.supplierInvoice && (
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />Fattura Fornitore
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numero</span>
                      <span className="font-medium">{order.supplierInvoice.supplierInvoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Totale</span>
                      <span className="font-medium">{formatCurrency(order.supplierInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stato</span>
                      <Badge className={order.supplierInvoice.isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {order.supplierInvoice.isPaid ? "Pagata" : "Da Pagare"}
                      </Badge>
                    </div>
                    <Link href={`/acquisti/fatture/${order.supplierInvoice.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <FileText className="h-4 w-4 mr-2" />Vai alla Fattura
                      </Button>
                    </Link>
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
