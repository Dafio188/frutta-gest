/**
 * Pagina Nuovo Ordine
 *
 * Form completo per creazione ordine manuale.
 * Include: selezione cliente con combobox ricerca da DB,
 * aggiunta prodotti con combobox, quantità, prezzi, totali automatici.
 * Collegato a createOrder server action.
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, ShoppingCart,
  User, Calendar, MessageSquare, Save, CheckCircle2,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { getCustomers, getProducts, createOrder, getProductsByIds } from "@/lib/actions"
import { SmartOrderImport } from "@/components/orders/smart-order-import"
import { ParsedOrderData } from "@/types"

function generateTempId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

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

export default function NuovoOrdinePage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItemDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Data from DB
  const [customerOptions, setCustomerOptions] = useState<ComboboxOption[]>([])
  const [productOptions, setProductOptions] = useState<ComboboxOption[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Load customers and products on mount
  useEffect(() => {
    loadCustomers()
    loadProducts()
  }, [])

  const loadCustomers = async (search = "") => {
    setLoadingCustomers(true)
    try {
      const result = await getCustomers({ search, pageSize: 100, sortBy: "companyName" })
      setCustomerOptions(
        result.data.map((c: any) => ({
          value: c.id,
          label: c.companyName,
          subtitle: `${c.code} — ${c.city || ""} ${c.phone || ""}`.trim(),
          meta: c,
        }))
      )
    } catch {
      // silently fail
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadProducts = async (search = "") => {
    setLoadingProducts(true)
    try {
      const result = await getProducts({ search, pageSize: 200, isAvailable: true })
      setProductOptions(
        result.data.map((p: any) => ({
          value: p.id,
          label: p.name,
          subtitle: `${p.category?.name || ""} — ${formatCurrency(Number(p.defaultPrice))}/${PRODUCT_UNIT_LABELS[p.unit as keyof typeof PRODUCT_UNIT_LABELS] || p.unit}`,
          meta: p,
        }))
      )
    } catch {
      // silently fail
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleImport = async (data: ParsedOrderData) => {
    // 1. Delivery Date
    if (data.deliveryDate) {
      setDeliveryDate(data.deliveryDate)
    }

    // 2. Notes
    if (data.notes) {
      setNotes((prev) => (prev ? `${prev}\n${data.notes}` : data.notes!))
    }

    // 3. Products
    const itemIds = data.items
      .map((i) => i.productId)
      .filter((id): id is string => !!id)

    // Current known products map
    const productMap = new Map(productOptions.map((o) => [o.value, o.meta]))

    // Find missing IDs
    const missingIds = itemIds.filter((id) => !productMap.has(id))

    if (missingIds.length > 0) {
      try {
        const newProducts = await getProductsByIds(missingIds)
        // Add to map
        newProducts.forEach((p: any) => {
          productMap.set(p.id, p)
        })
        // Update options for UI
        const newOptions = newProducts.map((p: any) => ({
          value: p.id,
          label: p.name,
          subtitle: `${p.category?.name || ""} — ${formatCurrency(Number(p.defaultPrice))}/${PRODUCT_UNIT_LABELS[p.unit as keyof typeof PRODUCT_UNIT_LABELS] || p.unit}`,
          meta: p,
        }))
        setProductOptions((prev) => [...prev, ...newOptions])
      } catch (err) {
        console.error("Failed to fetch imported products", err)
      }
    }

    // Create items
    const newItems: OrderItemDraft[] = data.items.map((item) => {
      const product = item.productId ? productMap.get(item.productId) : undefined

      return {
        id: generateTempId(),
        productId: item.productId || "",
        productName: product ? product.name : (item.productName || item.productId || "Prodotto sconosciuto"),
        quantity: item.quantity || 1,
        unit: product ? product.unit : (item.unit || "KG"),
        unitPrice: product ? Number(product.defaultPrice) : 0,
        vatRate: product ? Number(product.vatRate) : 4,
        notes: "",
      }
    })

    setItems((prev) => [...prev, ...newItems])
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateTempId(),
        productId: "",
        productName: "",
        quantity: 1,
        unit: "KG",
        unitPrice: 0,
        vatRate: 4,
        notes: "",
      },
    ])
  }

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleProductSelect = (itemId: string, productValue: string, option: ComboboxOption | null) => {
    // Clear selection
    if (!productValue) {
      setItems(items.map((item) =>
        item.id === itemId
          ? { ...item, productId: "", productName: "", unitPrice: 0 }
          : item
      ))
      return
    }

    // Custom product (no meta)
    if (!option?.meta) {
      setItems(items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: productValue, // Keep value for Combobox display
              productName: productValue,
              unitPrice: 0,
              // Keep other fields default
            }
          : item
      ))
      return
    }

    // DB Product
    const product = option.meta
    setItems(items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            productId: product.id,
            productName: product.name,
            unit: product.unit,
            unitPrice: Number(product.defaultPrice) || 0,
            vatRate: Number(product.vatRate) || 4,
          }
        : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const vatAmount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate) / 100,
    0
  )
  const total = subtotal + vatAmount

  const handleSubmit = async () => {
    setSubmitError("")
    setIsSubmitting(true)

    try {
      const orderData = {
        customerId,
        channel: "MANUAL" as const,
        requestedDeliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes: notes || null,
        items: items.map((item) => {
          const isCustom = !productOptions.some(p => p.value === item.productId)
          return {
            productId: isCustom ? null : item.productId,
            productName: item.productName || item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            notes: item.notes || null,
          }
        }),
      }

      await createOrder(orderData)
      setSubmitSuccess(true)
      setTimeout(() => router.push("/ordini"), 1500)
    } catch (err: any) {
      setSubmitError(err.message || "Errore durante la creazione dell'ordine")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = customerId && items.length > 0 && items.every((i) => i.productId) && !isSubmitting

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/ordini"
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuovo Ordine</h1>
            <p className="text-muted-foreground">Crea un nuovo ordine manuale</p>
          </div>
        </div>
        <SmartOrderImport onImport={handleImport} />
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Ordine creato con successo! Reindirizzamento...
          </p>
        </div>
      )}

      {/* Cliente e info ordine */}
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
            onSearchChange={(q) => loadCustomers(q)}
          />
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              <Calendar className="inline h-4 w-4 mr-1" strokeWidth={1.75} />
              Data Consegna Richiesta *
            </label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
        </div>
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
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none"
          />
        </div>
      </div>

      {/* Prodotti */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" strokeWidth={1.75} />
            Prodotti ({items.length})
          </h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Aggiungi Prodotto
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" strokeWidth={1.75} />
            <p>Nessun prodotto aggiunto</p>
            <p className="text-sm mt-1">Clicca &quot;Aggiungi Prodotto&quot; per iniziare</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header - hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Prodotto</div>
              <div className="col-span-2">Quantità</div>
              <div className="col-span-1">U.M.</div>
              <div className="col-span-2">Prezzo €</div>
              <div className="col-span-2 text-right">Totale</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-muted/30 border border-border/50"
              >
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
                    allowCustom={true}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Quantità</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">U.M.</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  >
                    {Object.entries(PRODUCT_UNIT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Prezzo €</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
                <div className="md:col-span-2 text-right font-medium text-sm">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Totale</label>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
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

          {submitError && (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Save className="h-4 w-4" strokeWidth={1.75} />
            {isSubmitting ? "Salvataggio..." : "Crea Ordine"}
          </button>
        </div>
      </div>
    </div>
  )
}
