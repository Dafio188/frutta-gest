/**
 * Catalogo Prodotti
 *
 * Vista a griglia con card prodotto: nome, categoria, prezzo, unita,
 * disponibilita. Filtro per categoria, ricerca, aggiunta nuovo prodotto.
 * Prodotti raggruppati visivamente per categoria con sezioni collassabili.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Apple, Plus, Search, Check, X as XIcon, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS, PRODUCT_CATEGORY_LABELS } from "@/lib/constants"
import { getProducts, scanAndSyncProducts } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"
import { RefreshCw } from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  FRUTTA:          { color: "text-red-700 dark:text-red-400",          bg: "bg-red-100 dark:bg-red-900/30",          icon: "🍎" },
  VERDURA:         { color: "text-green-700 dark:text-green-400",       bg: "bg-green-100 dark:bg-green-900/30",       icon: "🥬" },
  ORTAGGI:         { color: "text-emerald-700 dark:text-emerald-400",   bg: "bg-emerald-100 dark:bg-emerald-900/30",   icon: "🥕" },
  ERBE_AROMATICHE: { color: "text-lime-700 dark:text-lime-400",         bg: "bg-lime-100 dark:bg-lime-900/30",         icon: "🌿" },
  FRUTTA_ESOTICA:  { color: "text-amber-700 dark:text-amber-400",       bg: "bg-amber-100 dark:bg-amber-900/30",       icon: "🥭" },
  FRUTTA_SECCA:    { color: "text-orange-700 dark:text-orange-400",     bg: "bg-orange-100 dark:bg-orange-900/30",     icon: "🌰" },
  SPEZIE:          { color: "text-rose-700 dark:text-rose-400",         bg: "bg-rose-100 dark:bg-rose-900/30",         icon: "🫚" },
}

const SORTED_CATEGORY_KEYS = ["FRUTTA", "VERDURA", "ORTAGGI", "ERBE_AROMATICHE", "FRUTTA_ESOTICA", "FRUTTA_SECCA", "SPEZIE"]

interface ProductRow {
  id: string
  name: string
  image: string | null
  defaultPrice: number
  unit: string
  isAvailable: boolean
  category: { id: string; name: string; slug: string; type?: string } | null
}

export default function CatalogoPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const { addToast } = useUIStore()
  const [isLinking, setIsLinking] = useState(false)

  const toggleCollapse = (catType: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(catType)) next.delete(catType)
      else next.add(catType)
      return next
    })
  }

  const handleLinkImages = async () => {
    setIsLinking(true)
    try {
      const result = await scanAndSyncProducts()
      if ("error" in result) {
        addToast({ title: "Errore", description: result.error, type: "error" })
      } else {
        addToast({
          title: "Sincronizzazione completata",
          description: `Aggiornati: ${result.updated}, Creati: ${result.created} prodotti.`,
          type: "success",
        })
        loadProducts()
      }
    } catch {
      addToast({ title: "Errore", description: "Impossibile sincronizzare i prodotti.", type: "error" })
    } finally {
      setIsLinking(false)
    }
  }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProducts({ search, pageSize: 1000 })
      setProducts(result.data as unknown as ProductRow[])
    } catch (err) {
      console.error("Errore caricamento prodotti:", err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { loadProducts() }, [loadProducts])

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === "ALL" || (p.category as any)?.type === categoryFilter
    return matchSearch && matchCat
  })

  // Raggruppa per categoria
  const grouped: { type: string; name: string; items: ProductRow[] }[] = []
  for (const catType of SORTED_CATEGORY_KEYS) {
    const items = filteredProducts.filter(p => (p.category as any)?.type === catType)
    if (items.length > 0) {
      grouped.push({ type: catType, name: PRODUCT_CATEGORY_LABELS[catType] || catType, items })
    }
  }
  // Prodotti senza categoria mappata
  const uncategorized = filteredProducts.filter(p => !SORTED_CATEGORY_KEYS.includes((p.category as any)?.type || ""))
  if (uncategorized.length > 0) grouped.push({ type: "ALTRO", name: "Altro", items: uncategorized })

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Catalogo Prodotti</h1>
            <p className="text-muted-foreground">
              {products.length} prodotti · {grouped.length} categorie
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLinkImages} disabled={isLinking}>
              {isLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Collega Immagini
            </Button>
            <Link href="/catalogo/nuovo">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuovo Prodotto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:max-w-xs">
            <Input icon={Search} placeholder="Cerca prodotto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                categoryFilter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Tutte
            </button>
            {SORTED_CATEGORY_KEYS.map(key => {
              const cfg = CATEGORY_CONFIG[key]
              const active = categoryFilter === key
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    active ? `${cfg?.bg} ${cfg?.color}` : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cfg?.icon} {PRODUCT_CATEGORY_LABELS[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grouped Catalog */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Apple}
            title="Nessun prodotto trovato"
            description="Prova a modificare i filtri o aggiungi un nuovo prodotto."
          />
        ) : (
          <div className="space-y-10">
            {grouped.map(({ type, name, items }) => {
              const cfg = CATEGORY_CONFIG[type]
              const isCollapsed = collapsed.has(type)

              return (
                <section key={type}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCollapse(type)}
                    className="w-full flex items-center gap-3 mb-3 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${cfg?.bg || "bg-muted"}`}>
                      {cfg?.icon || "📦"}
                    </div>
                    <span className={`flex-1 text-base font-bold ${cfg?.color || "text-foreground"}`}>
                      {name}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg?.bg || "bg-muted"} ${cfg?.color || "text-muted-foreground"}`}>
                      {items.length}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground/60 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  <div className={`h-px mb-5 rounded-full ${cfg?.bg || "bg-border"} opacity-60`} />

                  {/* Animated Grid */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        >
                          {items.map(product => (
                            <motion.div
                              key={product.id}
                              variants={itemVariants}
                              whileHover={{ y: -3, transition: { duration: 0.18 } }}
                              onClick={() => router.push(`/catalogo/${product.id}`)}
                              className="cursor-pointer rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow overflow-hidden"
                            >
                              {/* Image / Placeholder */}
                              {product.image ? (
                                <div className="relative h-32 overflow-hidden">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full ${product.isAvailable ? "bg-emerald-500" : "bg-red-400"}`}>
                                    {product.isAvailable
                                      ? <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                                      : <XIcon className="h-3 w-3 text-white" strokeWidth={2.5} />
                                    }
                                  </div>
                                </div>
                              ) : (
                                <div className={`h-20 flex items-center justify-center text-3xl ${cfg?.bg || "bg-muted/50"}`}>
                                  {cfg?.icon || "📦"}
                                </div>
                              )}

                              {/* Info */}
                              <div className="p-3">
                                <h3 className="font-semibold text-xs leading-snug mb-1.5 line-clamp-2">{product.name}</h3>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-sm font-bold text-primary">{formatCurrency(product.defaultPrice)}</span>
                                  <span className="text-[10px] text-muted-foreground">/{PRODUCT_UNIT_LABELS[product.unit] || product.unit}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
