/**
 * Catalogo Prodotti — Portale Clienti
 *
 * Griglia prodotti con prezzi personalizzati, filtro per categoria,
 * ricerca, badge "In Evidenza".
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Package, Star, ShoppingCart, Filter } from "lucide-react"
import { getPortalProducts } from "@/lib/actions"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

export default function PortalCatalogPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [page, setPage] = useState(1)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getPortalProducts({ search, categoryId: categoryId || undefined, page, pageSize: 50 })
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, page])

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Title */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogo Prodotti</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.total} prodotti disponibili` : "Caricamento..."}
          </p>
        </div>
        <Link href="/portale/ordini/nuovo">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nuovo Ordine
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-10 rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        {data?.categories && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCategoryId(""); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !categoryId
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Tutti
            </button>
            {data.categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryId === cat.id
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">Nessun prodotto trovato</p>
          <p className="text-sm text-muted-foreground mt-1">Prova a modificare i filtri di ricerca</p>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {data?.data?.map((product: any) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
            >
              {product.image ? (
                <div className="-mx-5 -mt-5 mb-3 overflow-hidden rounded-t-2xl relative">
                  <img src={product.image} alt={product.name} className="w-full h-36 object-cover" />
                  {product.isFeaturedActive && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-100/90 dark:bg-amber-900/80 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Star className="h-3 w-3" /> In Evidenza
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Package className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  {product.isFeaturedActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Star className="h-3 w-3" /> In Evidenza
                    </span>
                  )}
                </div>
              )}

              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{product.category?.name}</p>

              {product.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
              )}

              <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-border/30">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(product.customerPrice))}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {PRODUCT_UNIT_LABELS[product.unit] || product.unit}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} di {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages}
          >
            Successiva
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
