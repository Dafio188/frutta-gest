/**
 * Modifica Ordine
 *
 * Form pre-compilato con i dati dell'ordine esistente.
 * Permette modifica cliente, data consegna, note, articoli (aggiunta/rimozione/modifica qty/prezzo).
 * Blocca modifica se ordine INVOICED o CANCELLED.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, ShoppingCart,
  User, Calendar, MessageSquare, Save, Loader2, AlertTriangle,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { getOrder, getCustomers, getProducts, updateOrder } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface OrderItemDraft {
  id: string
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  notes: string
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  channel: string
  requestedDeliveryDate: string | null
  notes: string | null
  internalNotes: string | null
  customer: { id: string; companyName: string }
  items: {
    id: string; quantity: number; unit: string; unitPrice: number; vatRate: number
    lineTotal: number; notes: string | null
    product: { id: string; name: string; category: { name: string } | null }
  }[]
}

export default function ModificaOrdinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [loading, setLoading] = useState(true)
  const [orderNumber, setOrderNumber] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [channel, setChannel] = useState("MANUAL")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedReason, setLockedReason] = useState("")

  const [customerOptions, setCustomerOptions] = useState<ComboboxOption[]>([])
  const [productOptions, setProductOptions] = useState<ComboboxOption[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getOrder(orderId) as unknown as OrderData

      if (data.status === "INVOICED" || data.status === "CANCELLED") {
        setLocked(true)
        setLockedReason(data.status === "INVOICED"
          ? "Non puoi modificare un ordine già fatturato."
          : "Non puoi modificare un ordine annullato.")
      }

      setOrderNumber(data.orderNumber)
      setCustomerId(data.customer.id)
      setChannel(data.channel)
      setDeliveryDate(data.requestedDeliveryDate ? data.requestedDeliveryDate.split("T")[0] : "")
      setNotes(data.notes || "")
      setInternalNotes(data.internalNotes || "")
      setItems(data.items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        notes: item.notes || "",
      })))
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Ordine non trovato" })
      router.push("/ordini")
    } finally {
      setLoading(false)
    }
  }, [orderId, router, addToast])

  useEffect(() => { loadOrder() }, [loadOrder])

  useEffect(() => {
    (async () => {
      try {
        const result = await getCustomers({ pageSize: 100, sortBy: "companyName" })
        setCustomerOptions(result.data.map((c: any) => ({
          value: c.id, label: c.companyName,
          subtitle: `${c.code} — ${c.city || ""} ${c.phone || ""}`.trim(), meta: c,
        })))
      } catch {} finally { setLoadingCustomers(false) }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const result = await getProducts({ pageSize: 200, isAvailable: true })
        setProductOptions(result.data.map((p: any) => ({
          value: p.id, label: p.name,
          subtitle: `${p.category?.name || ""} — ${formatCurrency(Number(p.defaultPrice))}/${PRODUCT_UNIT_LABELS[p.unit as keyof typeof PRODUCT_UNIT_LABELS] || p.unit}`,
          meta: p,
        })))
      } catch {} finally { setLoadingProducts(false) }
    })()
  }, [])

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(), productId: "", productName: "",
      quantity: 1, unit: "KG", unitPrice: 0, vatRate: 4, notes: "",
    }])
  }

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleProductSelect = (itemId: string, productValue: string, option: ComboboxOption | null) => {
    if (!option?.meta) {
      setItems(items.map((item) => item.id === itemId ? { ...item, productId: "", productName: "", unitPrice: 0 } : item))
      return
    }
    const product = option.meta
    setItems(items.map((item) => item.id === itemId ? {
      ...item, productId: product.id, productName: product.name,
      unit: product.unit, unitPrice: Number(product.defaultPrice) || 0,
      vatRate: Number(product.vatRate) || 4,
    } : item))
  }

  const removeItem = (id: string) => setItems(items.filter((item) => item.id !== id))

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vatAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate) / 100, 0)
  const total = subtotal + vatAmount

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await updateOrder(orderId, {
        customerId,
        channel,
        requestedDeliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes: notes || null,
        internalNotes: internalNotes || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          notes: item.notes || null,
        })),
      })
      addToast({ type: "success", title: "Ordine aggiornato", description: `${orderNumber} modificato con successo` })
      router.push(`/ordini/${orderId}`)
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile salvare le modifiche" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = customerId && items.length > 0 && items.every((i) => i.productId) && !isSubmitting && !locked

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/ordini/${orderId}`} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modifica {orderNumber}</h1>
          <p className="text-muted-foreground">Modifica articoli, quantità, prezzi e note</p>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{lockedReason}</p>
        </div>
      )}

      {/* Cliente e info */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Informazioni Ordine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Combobox
            label="Cliente *"
            options={customerOptions}
            value={customerId}
            onValueChange={(val) => setCustomerId(val)}
            placeholder="Seleziona cliente..."
            searchPlaceholder="Cerca per nome, codice, città..."
            emptyMessage="Nessun cliente trovato"
            loading={loadingCustomers}
            disabled={locked}
          />
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              <Calendar className="inline h-4 w-4 mr-1" strokeWidth={1.75} />
              Data Consegna Richiesta
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={locked}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all disabled:opacity-50"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              <MessageSquare className="inline h-4 w-4 mr-1" strokeWidth={1.75} />
              Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note per l'ordine..."
              rows={2}
              disabled={locked}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Note Interne</label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Note interne (non visibili al cliente)..."
              rows={2}
              disabled={locked}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Prodotti */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" strokeWidth={1.75} />
            Prodotti ({items.length})
          </h3>
          {!locked && (
            <button onClick={addItem} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Aggiungi Prodotto
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" strokeWidth={1.75} />
            <p>Nessun prodotto</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Prodotto</div>
              <div className="col-span-2">Quantità</div>
              <div className="col-span-1">U.M.</div>
              <div className="col-span-2">Prezzo €</div>
              <div className="col-span-2 text-right">Totale</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="md:col-span-4">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Prodotto</label>
                  <Combobox
                    options={productOptions}
                    value={item.productId}
                    onValueChange={(val, opt) => handleProductSelect(item.id, val, opt)}
                    placeholder="Seleziona prodotto..."
                    searchPlaceholder="Cerca prodotto..."
                    emptyMessage="Nessun prodotto trovato"
                    loading={loadingProducts}
                    disabled={locked}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Quantità</label>
                  <input
                    type="number" step="0.1" min="0" value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    disabled={locked}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">U.M.</label>
                  <select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} disabled={locked}
                    className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50">
                    {Object.entries(PRODUCT_UNIT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Prezzo €</label>
                  <input
                    type="number" step="0.01" min="0" value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    disabled={locked}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="md:col-span-2 text-right font-medium text-sm">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>
                <div className="md:col-span-1 flex justify-end">
                  {!locked && (
                    <button onClick={() => removeItem(item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totali e submit */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex-1" />
        <div className="w-full sm:w-72 space-y-4">
          <div className="glass-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Imponibile</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-medium">{formatCurrency(vatAmount)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Totale</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {!locked && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={1.75} />}
              {isSubmitting ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
