/**
 * Nuovo Ordine — Portale Clienti
 *
 * Form per creare un ordine con selettore prodotti, quantità,
 * data consegna e riepilogo totale.
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search, Package, Plus, Minus, Trash2, ShoppingCart, Calendar, Loader2, ArrowLeft,
} from "lucide-react"
import { getPortalProducts, createPortalOrder } from "@/lib/actions"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CartItem {
  productId: string
  name: string
  unit: string
  unitPrice: number
  vatRate: number
  quantity: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

export default function NewPortalOrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryDate, setDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getPortalProducts({ pageSize: 200, search })
      .then((res) => setProducts(res.data || []))
      .catch(console.error)
      .finally(() => setProductsLoading(false))
  }, [search])

  const addToCart = (product: any) => {
    const existing = cart.find((c) => c.productId === product.id)
    if (existing) {
      setCart(cart.map((c) =>
        c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitPrice: Number(product.customerPrice),
        vatRate: Number(product.vatRate),
        quantity: 1,
      }])
    }
  }

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.productId !== productId))
    } else {
      setCart(cart.map((c) =>
        c.productId === productId ? { ...c, quantity: qty } : c
      ))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((c) => c.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const vatAmount = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100), 0)
  const total = subtotal + vatAmount

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError("Aggiungi almeno un prodotto all'ordine")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await createPortalOrder({
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity, unit: c.unit })),
        requestedDeliveryDate: deliveryDate || undefined,
        notes: notes || undefined,
      })
      router.push("/portale/ordini")
    } catch (err: any) {
      setError(err.message || "Errore nella creazione dell'ordine")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link href="/portale/ordini" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuovo Ordine</h1>
          <p className="text-muted-foreground mt-0.5">Seleziona i prodotti e la quantità desiderata</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Product selector (3/5) */}
        <motion.div variants={fadeUp} className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="font-semibold mb-3">Seleziona Prodotti</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca prodotti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-1.5">
                {products.map((product) => {
                  const inCart = cart.find((c) => c.productId === product.id)
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                        inCart ? "bg-emerald-500/5 border border-emerald-500/20" : "hover:bg-muted/50 border border-transparent"
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(product.customerPrice))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          / {PRODUCT_UNIT_LABELS[product.unit] || product.unit}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Cart / Summary (2/5) */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
          {/* Cart items */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              Carrello ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Clicca su un prodotto per aggiungerlo
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unitPrice)} / {PRODUCT_UNIT_LABELS[item.unit] || item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border/50 hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-14 h-7 text-center text-sm rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        step="0.5"
                        min="0"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border/50 hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery & Notes */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data Consegna Richiesta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Note per la consegna..."
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="font-semibold mb-3">Riepilogo</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotale</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border/30">
                <span>Totale</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive mt-3">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Invio in corso..." : "Invia Ordine"}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
