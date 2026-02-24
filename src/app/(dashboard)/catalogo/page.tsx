/**
 * Catalogo Prodotti
 *
 * Vista a griglia con card prodotto: nome, categoria, prezzo, unita,
 * disponibilita. Filtro per categoria, ricerca, aggiunta nuovo prodotto.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Apple, Plus, Search, Check, X as XIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { PageTransition } from "@/components/animations/page-transition"
import { formatCurrency } from "@/lib/utils"
import { PRODUCT_UNIT_LABELS, PRODUCT_CATEGORY_LABELS } from "@/lib/constants"
import { getProducts, scanAndLinkImages } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"
import { RefreshCw } from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

const CATEGORY_COLORS: Record<string, string> = {
  FRUTTA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VERDURA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ORTAGGI: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ERBE_AROMATICHE: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  FRUTTA_ESOTICA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FRUTTA_SECCA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SPEZIE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

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
  const { addToast } = useUIStore()
  const [isLinking, setIsLinking] = useState(false)

  const handleLinkImages = async () => {
    setIsLinking(true)
    try {
      const result = await scanAndLinkImages()
      if ('error' in result) {
        addToast({
          title: "Errore",
          description: result.error,
          type: "error",
        })
      } else {
        addToast({
          title: "Immagini collegate",
          description: `Sono state collegate ${result.count} nuove immagini.`,
          type: "success",
        })
        loadProducts()
      }
    } catch (error) {
      addToast({
        title: "Errore",
        description: "Impossibile collegare le immagini.",
        type: "error",
      })
    } finally {
      setIsLinking(false)
    }
  }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getProducts({
        search,
        pageSize: 500,
      })
      setProducts(result.data as unknown as ProductRow[])
    } catch (err) {
      console.error("Errore caricamento prodotti:", err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = categoryFilter === "ALL"
    ? products
    : products.filter((p) => (p.category as any)?.type === categoryFilter)

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Catalogo Prodotti</h1>
            <p className="text-muted-foreground">Gestisci i tuoi prodotti ortofrutticoli</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleLinkImages}
              disabled={isLinking}
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
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
            <Input icon={Search} placeholder="Cerca prodotto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${categoryFilter === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Tutte
            </button>
            {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${categoryFilter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState icon={Apple} title="Nessun prodotto trovato" description="Prova a modificare i filtri o aggiungi un nuovo prodotto." />
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const categoryKey = (product.category as any)?.type || ""
              return (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => router.push(`/catalogo/${product.id}`)}
                  className="cursor-pointer rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
                >
                  {product.image ? (
                    <div className="mb-3 -mx-5 -mt-5 overflow-hidden rounded-t-2xl">
                      <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[categoryKey] || "bg-muted text-muted-foreground"}`}>
                      {product.category?.name || "Senza categoria"}
                    </span>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${product.isAvailable ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {product.isAvailable ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className="text-lg font-bold text-primary">{formatCurrency(product.defaultPrice)}</span>
                    <span className="text-xs text-muted-foreground">/ {PRODUCT_UNIT_LABELS[product.unit] || product.unit}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
