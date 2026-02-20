/**
 * Magazzino — Giacenze, Movimenti e Scheda Prodotto
 *
 * Vista delle giacenze correnti per prodotto con ricerca,
 * possibilita' di registrare carico/scarico/rettifica manuale,
 * storico movimenti, e scheda dettagliata per prodotto con
 * fornitori, acquisti, margini e movimenti.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Warehouse, Search, Loader2, Plus, ArrowUpCircle, ArrowDownCircle,
  Package, History, FileSearch, Factory, TrendingUp, TrendingDown,
  ShoppingCart, Star, Phone, Mail, ExternalLink, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  PRODUCT_UNIT_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_COLORS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from "@/lib/constants"
import {
  getStockSummary, getStockMovements, getProducts,
  createStockMovement, getProductWarehouseDetail,
} from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
}

interface StockItem {
  id: string
  name: string
  unit: string
  category: string
  currentStock: number
  costPrice: number
  defaultPrice: number
  isAvailable: boolean
}

interface ProductOption { id: string; name: string; unit: string }

export default function MagazzinoPage() {
  const { addToast } = useUIStore()

  const [stocks, setStocks] = useState<StockItem[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"giacenze" | "movimenti" | "nuovo" | "scheda">("giacenze")

  // New movement form
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [newMovement, setNewMovement] = useState({
    productId: "",
    type: "CARICO",
    quantity: "",
    unit: "KG",
    reason: "",
  })
  const [submitting, setSubmitting] = useState(false)

  // Product detail
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productDetail, setProductDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadStocks = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getStockSummary({ pageSize: 200, search })
      const parsed = result as unknown as { data: StockItem[] }
      setStocks(parsed.data)
    } catch {} finally { setLoading(false) }
  }, [search])

  const loadMovements = useCallback(async () => {
    try {
      setLoadingMovements(true)
      const result = await getStockMovements({ pageSize: 50 })
      const parsed = result as unknown as { data: any[] }
      setMovements(parsed.data)
    } catch {} finally { setLoadingMovements(false) }
  }, [])

  useEffect(() => { loadStocks() }, [loadStocks])
  useEffect(() => { loadMovements() }, [loadMovements])

  // Load products for forms
  useEffect(() => {
    if ((tab === "nuovo" || tab === "scheda") && products.length === 0) {
      (async () => {
        try {
          setLoadingProducts(true)
          const result = await getProducts({ pageSize: 500 })
          const parsed = result as unknown as { data: ProductOption[] }
          setProducts(parsed.data)
        } catch {} finally { setLoadingProducts(false) }
      })()
    }
  }, [tab, products.length])

  // Load product detail
  const loadProductDetail = useCallback(async (productId: string) => {
    if (!productId) { setProductDetail(null); return }
    try {
      setLoadingDetail(true)
      const data = await getProductWarehouseDetail(productId)
      setProductDetail(data)
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile caricare i dati del prodotto" })
      setProductDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [addToast])

  // Open product detail from stock table
  const openProductDetail = (productId: string) => {
    setSelectedProductId(productId)
    setTab("scheda")
    loadProductDetail(productId)
  }

  const handleNewMovement = async () => {
    if (!newMovement.productId) {
      addToast({ type: "error", title: "Errore", description: "Seleziona un prodotto" })
      return
    }
    const qty = parseFloat(newMovement.quantity)
    if (!qty || qty <= 0) {
      addToast({ type: "error", title: "Errore", description: "Inserisci una quantita' valida" })
      return
    }

    try {
      setSubmitting(true)
      await createStockMovement({
        productId: newMovement.productId,
        type: newMovement.type,
        quantity: qty,
        unit: newMovement.unit,
        reason: newMovement.reason || null,
      })
      addToast({ type: "success", title: "Movimento registrato", description: `${STOCK_MOVEMENT_TYPE_LABELS[newMovement.type]} registrato` })
      setNewMovement({ productId: "", type: "CARICO", quantity: "", unit: "KG", reason: "" })
      setTab("giacenze")
      loadStocks()
      loadMovements()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile registrare il movimento" })
    } finally {
      setSubmitting(false)
    }
  }

  // Stats
  const totalProducts = stocks.length
  const lowStock = stocks.filter((s) => s.currentStock > 0 && s.currentStock < 5).length
  const outOfStock = stocks.filter((s) => s.currentStock <= 0).length
  const totalValue = stocks.reduce((sum, s) => sum + s.currentStock * s.costPrice, 0)

  const unitLabel = (unit: string) => (PRODUCT_UNIT_LABELS[unit] || unit).toLowerCase()

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Magazzino</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestione giacenze e movimenti</p>
          </div>
          <Button onClick={() => setTab("nuovo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Movimento
          </Button>
        </div>

        {/* KPIs */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalProducts}</p>
                    <p className="text-xs text-muted-foreground">Prodotti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <ArrowDownCircle className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{lowStock}</p>
                    <p className="text-xs text-muted-foreground">Scorte basse</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <ArrowDownCircle className="h-5 w-5 text-red-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{outOfStock}</p>
                    <p className="text-xs text-muted-foreground">Esauriti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Warehouse className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-muted-foreground">Valore magazzino</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-border/50 pb-1 overflow-x-auto">
          {([
            { key: "giacenze" as const, label: "Giacenze", icon: Package },
            { key: "movimenti" as const, label: "Movimenti", icon: History },
            { key: "scheda" as const, label: "Scheda Prodotto", icon: FileSearch },
            { key: "nuovo" as const, label: "Nuovo Movimento", icon: Plus },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="warehouse-tab"
                  className="absolute inset-0 bg-primary/10 rounded-t-lg border border-primary/20 border-b-0"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className="relative z-10 h-4 w-4" strokeWidth={1.75} />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB: Giacenze */}
        {tab === "giacenze" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : stocks.length === 0 ? (
              <EmptyState
                icon={Warehouse}
                title="Nessuna giacenza"
                description="Registra il primo movimento per iniziare a tracciare il magazzino."
                action={<Button onClick={() => setTab("nuovo")}><Plus className="h-4 w-4 mr-2" />Nuovo Movimento</Button>}
              />
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prodotto</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Giacenza</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prezzo Acquisto</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valore</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheda</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                      {stocks.map((item) => {
                        const value = item.currentStock * item.costPrice
                        const isLow = item.currentStock > 0 && item.currentStock < 5
                        const isOut = item.currentStock <= 0
                        return (
                          <motion.tr
                            key={item.id}
                            variants={rowVariants}
                            className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium">{item.name}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{item.category}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-semibold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : ""}`}>
                                {item.currentStock.toFixed(item.unit === "PEZZI" ? 0 : 2)} {unitLabel(item.unit)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                              {item.costPrice > 0 ? formatCurrency(item.costPrice) : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {value > 0 ? formatCurrency(value) : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openProductDetail(item.id)}
                                title="Vedi scheda prodotto"
                              >
                                <FileSearch className="h-4 w-4" strokeWidth={1.75} />
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </motion.tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Movimenti */}
        {tab === "movimenti" && (
          <div>
            {loadingMovements ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <EmptyState
                icon={History}
                title="Nessun movimento"
                description="Non ci sono ancora movimenti di magazzino registrati."
              />
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Prodotto</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantità</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Causale</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Utente</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                      {movements.map((m) => (
                        <motion.tr
                          key={m.id}
                          variants={rowVariants}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString("it-IT")} {new Date(m.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={STOCK_MOVEMENT_TYPE_COLORS[m.type] || ""}>
                              {STOCK_MOVEMENT_TYPE_LABELS[m.type] || m.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{m.product?.name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            <span className={m.type === "CARICO" || m.type === "RETTIFICA_POS" ? "text-emerald-600" : "text-red-600"}>
                              {m.type === "CARICO" || m.type === "RETTIFICA_POS" ? "+" : "-"}
                              {Number(m.quantity).toFixed(2)} {unitLabel(m.unit)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{m.reason || m.referenceType || "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{m.createdBy?.name || "—"}</td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Scheda Prodotto */}
        {tab === "scheda" && (
          <div className="space-y-6">
            {/* Selettore prodotto */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" />Caricamento prodotti...</div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value)
                      loadProductDetail(e.target.value)
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleziona un prodotto...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>
              {productDetail && (
                <Button variant="ghost" size="sm" onClick={() => { setProductDetail(null); setSelectedProductId("") }}>
                  <X className="h-4 w-4 mr-1" />Chiudi
                </Button>
              )}
            </div>

            {/* Loading */}
            {loadingDetail && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty state */}
            {!loadingDetail && !productDetail && (
              <EmptyState
                icon={FileSearch}
                title="Seleziona un prodotto"
                description="Scegli un prodotto dal menu per vedere la scheda completa con fornitori, acquisti e movimenti."
              />
            )}

            {/* Product detail card */}
            {!loadingDetail && productDetail && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-6"
              >
                {/* Header prodotto */}
                <Card>
                  <CardContent className="pt-6 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">{productDetail.product.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge variant="outline">{productDetail.product.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            SKU: {productDetail.product.sku || "N/D"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            IVA: {productDetail.product.vatRate}%
                          </span>
                          {!productDetail.product.isAvailable && (
                            <Badge variant="destructive" className="text-xs">Non disponibile</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Prezzo Vendita</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(productDetail.product.defaultPrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Costo</p>
                          <p className="text-lg font-bold">{productDetail.product.costPrice > 0 ? formatCurrency(productDetail.product.costPrice) : "—"}</p>
                        </div>
                        {productDetail.product.costPrice > 0 && productDetail.product.defaultPrice > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Margine</p>
                            <p className="text-lg font-bold text-emerald-600">
                              {(((productDetail.product.defaultPrice - productDetail.product.costPrice) / productDetail.product.defaultPrice) * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* KPI stock + acquisti */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Package className="h-5 w-5 text-primary" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-xl font-bold">
                            {productDetail.stock.current.toFixed(productDetail.product.unit === "PEZZI" ? 0 : 2)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel(productDetail.product.unit)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Giacenza attuale</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                          <TrendingUp className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-xl font-bold">
                            {productDetail.stock.totalIn.toFixed(2)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel(productDetail.product.unit)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Totale carichi</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                          <TrendingDown className="h-5 w-5 text-red-500" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-xl font-bold">
                            {productDetail.stock.totalOut.toFixed(2)}
                            <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel(productDetail.product.unit)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Totale scarichi</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                          <Warehouse className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
                        </div>
                        <div>
                          <p className="text-xl font-bold">{formatCurrency(productDetail.stock.value)}</p>
                          <p className="text-xs text-muted-foreground">Valore giacenza</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Fornitori */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Factory className="h-4 w-4" strokeWidth={1.75} />
                        Fornitori ({productDetail.suppliers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productDetail.suppliers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nessun fornitore associato</p>
                      ) : (
                        <div className="space-y-3">
                          {productDetail.suppliers.map((s: any) => (
                            <div key={s.id} className={`p-3 rounded-xl border ${s.isPreferred ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Link href={`/fornitori/${s.id}`} className="text-sm font-semibold hover:text-primary transition-colors truncate">
                                      {s.companyName}
                                    </Link>
                                    {s.isPreferred && (
                                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 mt-1">
                                    {s.phone && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" />{s.phone}
                                      </span>
                                    )}
                                    {s.email && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />{s.email}
                                      </span>
                                    )}
                                    {s.leadTimeDays && (
                                      <span className="text-xs text-muted-foreground">
                                        Consegna: {s.leadTimeDays}gg
                                      </span>
                                    )}
                                    {s.minOrderQty && (
                                      <span className="text-xs text-muted-foreground">
                                        Min: {s.minOrderQty} {unitLabel(productDetail.product.unit)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold">{formatCurrency(s.price)}</p>
                                  <p className="text-[10px] text-muted-foreground">/{unitLabel(productDetail.product.unit)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Statistiche acquisti */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                        Riepilogo Acquisti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productDetail.purchaseStats.orderCount === 0 ? (
                        <p className="text-sm text-muted-foreground">Nessun ordine di acquisto</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-muted/30">
                              <p className="text-xs text-muted-foreground">Ordini totali</p>
                              <p className="text-lg font-bold">{productDetail.purchaseStats.orderCount}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30">
                              <p className="text-xs text-muted-foreground">Quantita totale acquistata</p>
                              <p className="text-lg font-bold">
                                {productDetail.purchaseStats.totalQuantity.toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">{unitLabel(productDetail.product.unit)}</span>
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30">
                              <p className="text-xs text-muted-foreground">Totale speso</p>
                              <p className="text-lg font-bold">{formatCurrency(productDetail.purchaseStats.totalSpent)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30">
                              <p className="text-xs text-muted-foreground">Prezzo medio</p>
                              <p className="text-lg font-bold">{formatCurrency(productDetail.purchaseStats.avgPrice)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                            <div>
                              <p className="text-xs text-muted-foreground">Range prezzo</p>
                              <p className="text-sm font-semibold">
                                {formatCurrency(productDetail.purchaseStats.minPrice)} — {formatCurrency(productDetail.purchaseStats.maxPrice)}
                              </p>
                            </div>
                            {productDetail.purchaseStats.avgPrice > 0 && productDetail.product.defaultPrice > 0 && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Margine medio</p>
                                <p className="text-sm font-bold text-emerald-600">
                                  {(((productDetail.product.defaultPrice - productDetail.purchaseStats.avgPrice) / productDetail.product.defaultPrice) * 100).toFixed(1)}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Storico ordini */}
                {productDetail.purchases.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                        Storico Ordini Fornitore
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-2 pr-4 font-medium">Ordine</th>
                              <th className="text-left py-2 px-4 font-medium">Fornitore</th>
                              <th className="text-left py-2 px-4 font-medium">Data</th>
                              <th className="text-left py-2 px-4 font-medium">Stato</th>
                              <th className="text-right py-2 px-4 font-medium">Quantita</th>
                              <th className="text-right py-2 px-4 font-medium">Prezzo Unit.</th>
                              <th className="text-right py-2 pl-4 font-medium">Totale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productDetail.purchases.map((po: any, idx: number) => (
                              <tr key={idx} className="border-b border-border/30 last:border-0">
                                <td className="py-2.5 pr-4">
                                  <Link href={`/acquisti/ordini/${po.id}`} className="text-primary hover:underline font-medium">
                                    {po.poNumber}
                                  </Link>
                                </td>
                                <td className="py-2.5 px-4">
                                  <Link href={`/fornitori/${po.supplierId}`} className="hover:text-primary transition-colors">
                                    {po.supplier}
                                  </Link>
                                </td>
                                <td className="py-2.5 px-4 text-muted-foreground">{formatDate(po.orderDate)}</td>
                                <td className="py-2.5 px-4">
                                  <Badge className={PURCHASE_ORDER_STATUS_COLORS?.[po.status] || ""}>
                                    {PURCHASE_ORDER_STATUS_LABELS?.[po.status] || po.status}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-4 text-right font-medium">
                                  {po.quantity.toFixed(2)} {unitLabel(po.unit)}
                                </td>
                                <td className="py-2.5 px-4 text-right">{formatCurrency(po.unitPrice)}</td>
                                <td className="py-2.5 pl-4 text-right font-semibold">{formatCurrency(po.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Movimenti recenti */}
                {productDetail.recentMovements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4" strokeWidth={1.75} />
                        Ultimi Movimenti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-2 pr-4 font-medium">Data</th>
                              <th className="text-left py-2 px-4 font-medium">Tipo</th>
                              <th className="text-right py-2 px-4 font-medium">Quantita</th>
                              <th className="text-left py-2 px-4 font-medium">Causale</th>
                              <th className="text-left py-2 pl-4 font-medium">Utente</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productDetail.recentMovements.map((m: any) => (
                              <tr key={m.id} className="border-b border-border/30 last:border-0">
                                <td className="py-2.5 pr-4 text-muted-foreground">
                                  {new Date(m.createdAt).toLocaleDateString("it-IT")}{" "}
                                  {new Date(m.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="py-2.5 px-4">
                                  <Badge className={STOCK_MOVEMENT_TYPE_COLORS[m.type] || ""}>
                                    {STOCK_MOVEMENT_TYPE_LABELS[m.type] || m.type}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-4 text-right font-semibold">
                                  <span className={m.type === "CARICO" || m.type === "RETTIFICA_POS" ? "text-emerald-600" : "text-red-600"}>
                                    {m.type === "CARICO" || m.type === "RETTIFICA_POS" ? "+" : "-"}
                                    {m.quantity.toFixed(2)} {unitLabel(m.unit)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-muted-foreground">{m.reason || m.referenceType || "—"}</td>
                                <td className="py-2.5 pl-4 text-muted-foreground">{m.createdBy || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* TAB: Nuovo Movimento */}
        {tab === "nuovo" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registra Movimento</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Caricamento prodotti...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Prodotto</label>
                    <select
                      value={newMovement.productId}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value)
                        setNewMovement({
                          ...newMovement,
                          productId: e.target.value,
                          unit: product?.unit || "KG",
                        })
                      }}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Seleziona prodotto...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                    <select
                      value={newMovement.type}
                      onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="CARICO">Carico</option>
                      <option value="SCARICO">Scarico</option>
                      <option value="RETTIFICA_POS">Rettifica +</option>
                      <option value="RETTIFICA_NEG">Rettifica -</option>
                      <option value="SCARTO">Scarto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Quantità ({PRODUCT_UNIT_LABELS[newMovement.unit] || newMovement.unit})
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMovement.quantity}
                      onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Causale / Note</label>
                    <Input
                      value={newMovement.reason}
                      onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
                      placeholder="es. Carico da fornitore, Rettifica inventario..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      onClick={handleNewMovement}
                      disabled={submitting || !newMovement.productId}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
                      Registra
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
