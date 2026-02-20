/**
 * Nuovo Ordine Fornitore
 *
 * Form per creare un ordine fornitore con selezione fornitore,
 * articoli dal catalogo, quantita' e prezzo di acquisto.
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, Loader2, Check, ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { getSuppliers, getProducts, createPurchaseOrder } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface SupplierOption { id: string; companyName: string }
interface ProductOption { id: string; name: string; unit: string; costPrice: number | null; defaultPrice: number }
interface OrderItem {
  productId: string
  quantity: string
  unit: string
  unitPrice: string
}

export default function NuovoOrdineFornitore() {
  const router = useRouter()
  const { addToast } = useUIStore()

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", quantity: "", unit: "KG", unitPrice: "" },
  ])

  useEffect(() => {
    (async () => {
      try {
        const result = await getSuppliers({ pageSize: 200 })
        const parsed = result as unknown as { data: SupplierOption[] }
        setSuppliers(parsed.data)
      } catch {} finally { setLoadingSuppliers(false) }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const result = await getProducts({ pageSize: 500 })
        const parsed = result as unknown as { data: ProductOption[] }
        setProducts(parsed.data)
      } catch {} finally { setLoadingProducts(false) }
    })()
  }, [])

  const addItem = () => {
    setItems([...items, { productId: "", quantity: "", unit: "KG", unitPrice: "" }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "productId") {
      const product = products.find((p) => p.id === value)
      if (product) {
        updated[index].unit = product.unit
        updated[index].unitPrice = (product.costPrice ?? product.defaultPrice ?? 0).toString()
      }
    }

    setItems(updated)
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      addToast({ type: "error", title: "Errore", description: "Seleziona un fornitore" })
      return
    }

    const validItems = items.filter((i) => i.productId && parseFloat(i.quantity) > 0)
    if (validItems.length === 0) {
      addToast({ type: "error", title: "Errore", description: "Aggiungi almeno un articolo" })
      return
    }

    try {
      setSubmitting(true)
      await createPurchaseOrder({
        supplierId: selectedSupplierId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          unitPrice: parseFloat(i.unitPrice),
        })),
      })
      addToast({ type: "success", title: "Ordine creato", description: "Ordine fornitore creato con successo" })
      router.push("/acquisti")
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile creare l'ordine" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/acquisti">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuovo Ordine Fornitore</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Crea un ordine di acquisto per un fornitore</p>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Fornitore */}
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Fornitore</CardTitle></CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Articoli */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />Articoli
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />Aggiungi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProducts ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Caricamento prodotti...</div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-xs text-muted-foreground mb-1 block">Prodotto</label>
                              <select
                                value={item.productId}
                                onChange={(e) => updateItem(index, "productId", e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="">Seleziona...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Qtà ({PRODUCT_UNIT_LABELS[item.unit] || item.unit})</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Prezzo unitario</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mt-5 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(index)}
                            disabled={items.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex justify-end pt-2 text-sm">
                        <span className="text-muted-foreground mr-3">Subtotale:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StaggerItem>
              <Card>
                <CardHeader><CardTitle className="text-base">Dettagli Ordine</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Consegna Prevista</label>
                    <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting || !selectedSupplierId}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Crea Ordine
              </Button>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
