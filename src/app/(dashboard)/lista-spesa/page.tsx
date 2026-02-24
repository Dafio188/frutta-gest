/**
 * Lista della Spesa — Aggregazione intelligente dagli ordini del giorno
 *
 * Genera lista dagli ordini confermati per data consegna.
 * Persistenza check items, modifica quantità, cambio stato lista.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ClipboardList, ShoppingBag, Printer, Trash2,
  Sparkles, Loader2, Check, Package, Truck, Warehouse, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { PRODUCT_UNIT_LABELS, SHOPPING_LIST_STATUS_LABELS } from "@/lib/constants"
import { formatNumber } from "@/lib/utils"
import {
  generateShoppingListFromOrders, getShoppingLists, getSuppliers,
  updateShoppingListItem, updateShoppingListStatus, deleteShoppingList,
  createPurchaseOrdersFromShoppingList,
} from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

interface SpesaItem {
  id: string
  productName: string
  category: string
  totalQuantity: number
  availableStock: number
  netQuantity: number
  unit: string
  supplierId?: string | null
  supplierName?: string
  checked: boolean
}

interface SupplierOption {
  id: string
  companyName: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  FINALIZED: "bg-blue-100 text-blue-800",
  ORDERED: "bg-amber-100 text-amber-800",
  RECEIVED: "bg-emerald-100 text-emerald-800",
}

const STATUS_FLOW: Record<string, { label: string; next: string; icon: React.ComponentType<any> }[]> = {
  DRAFT: [{ label: "Finalizza", next: "FINALIZED", icon: Check }],
  FINALIZED: [{ label: "Segna Ordinata", next: "ORDERED", icon: Package }],
  ORDERED: [{ label: "Merce Ricevuta", next: "RECEIVED", icon: Truck }],
}

export default function ListaSpesaPage() {
  const [items, setItems] = useState<SpesaItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [creatingPOs, setCreatingPOs] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [listId, setListId] = useState<string | null>(null)
  const [listStatus, setListStatus] = useState("DRAFT")
  const [listDate, setListDate] = useState("")
  const { addToast } = useUIStore()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [result, suppResult] = await Promise.all([
        getShoppingLists({ pageSize: 1 }),
        getSuppliers({ pageSize: 100 }),
      ])
      const parsed = result as unknown as { data: { id: string; date: string; status: string; items: { id: string; totalQuantity: number; availableStock: number; netQuantity: number; unit: string; isOrdered: boolean; supplierId: string | null; productName?: string; product: { name: string; category: { name: string; slug: string } | null } | null; supplier: { id: string; companyName: string } | null }[] }[] }
      const suppParsed = suppResult as unknown as { data: { id: string; companyName: string }[] }
      setSuppliers(suppParsed.data.map((s) => ({ id: s.id, companyName: s.companyName })))

      const list = parsed.data[0]
      if (list) {
        setListId(list.id)
        setListStatus(list.status || "DRAFT")
        setListDate(list.date)
        setItems(list.items.map((item) => ({
          id: item.id,
          productName: item.product?.name || item.productName || "—",
          category: item.product?.category?.slug || "ALTRO",
          totalQuantity: item.totalQuantity,
          availableStock: item.availableStock || 0,
          netQuantity: item.netQuantity ?? item.totalQuantity,
          unit: item.unit,
          supplierId: item.supplierId || item.supplier?.id || null,
          supplierName: item.supplier?.companyName,
          checked: item.isOrdered || false,
        })))
      } else {
        setListId(null)
        setListStatus("DRAFT")
        setItems([])
      }
    } catch (err) {
      console.error("Errore caricamento lista spesa:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const result = await generateShoppingListFromOrders(selectedDate) as any
      if (result?.error) {
        addToast({ type: "error", title: "Errore", description: result.error })
        return
      }
      addToast({ type: "success", title: "Lista generata", description: `Lista della spesa generata per il ${selectedDate}` })
      loadData()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile generare la lista" })
    } finally {
      setGenerating(false)
    }
  }

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const newChecked = !item.checked
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: newChecked } : i))
    try {
      await updateShoppingListItem(id, { isOrdered: newChecked })
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !newChecked } : i))
    }
  }

  const handleSupplierChange = async (id: string, supplierId: string | null) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, supplierId, supplierName: supplier?.companyName || undefined } : i))
    try {
      await updateShoppingListItem(id, { supplierId })
    } catch {
      addToast({ type: "error", title: "Errore", description: "Impossibile assegnare il fornitore" })
      loadData()
    }
  }

  const handleQtyChange = async (id: string, qty: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, totalQuantity: qty } : i))
    try {
      await updateShoppingListItem(id, { totalQuantity: qty })
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile aggiornare la quantità" })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!listId) return
    try {
      await updateShoppingListStatus(listId, newStatus)
      setListStatus(newStatus)
      addToast({ type: "success", title: "Stato aggiornato", description: `Lista ${SHOPPING_LIST_STATUS_LABELS[newStatus] || newStatus}` })
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile aggiornare lo stato" })
    }
  }

  const handleDelete = async () => {
    if (!listId) return
    if (!confirm("Sei sicuro di voler eliminare questa lista della spesa?")) return
    try {
      await deleteShoppingList(listId)
      addToast({ type: "success", title: "Lista eliminata" })
      setListId(null)
      setItems([])
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile eliminare" })
    }
  }

  const handleCreatePOs = async () => {
    if (!listId) return
    if (items.every((i) => !i.supplierId)) {
      addToast({ type: "error", title: "Errore", description: "Nessun articolo ha un fornitore assegnato. Assegna i fornitori prima." })
      return
    }
    try {
      setCreatingPOs(true)
      const result = await createPurchaseOrdersFromShoppingList(listId) as unknown as { createdCount: number; poNumbers: string[]; skippedCount: number }
      let msg = `Creati ${result.createdCount} ordini fornitore: ${result.poNumbers.join(", ")}`
      if (result.skippedCount > 0) msg += ` (${result.skippedCount} articoli senza fornitore saltati)`
      addToast({ type: "success", title: "Ordini creati", description: msg })
      loadData()
    } catch (err: any) {
      addToast({ type: "error", title: "Errore", description: err?.message || "Impossibile generare gli ordini" })
    } finally {
      setCreatingPOs(false)
    }
  }

  const checkedCount = items.filter((i) => i.checked).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
  const statusActions = STATUS_FLOW[listStatus] || []

  const categoryLabels: Record<string, string> = {
    FRUTTA: "Frutta", VERDURA: "Verdura", ERBE_AROMATICHE: "Erbe Aromatiche",
    ORTAGGI: "Ortaggi", FRUTTA_ESOTICA: "Frutta Esotica", FRUTTA_SECCA: "Frutta Secca",
    SPEZIE: "Spezie", ALTRO: "Altro",
  }

  const groupedByCategory = items.reduce<Record<string, SpesaItem[]>>((acc, item) => {
    const cat = item.category?.toUpperCase() || "ALTRO"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Lista della Spesa</h1>
            {listId && (
              <Badge className={STATUS_COLORS[listStatus] || ""}>{SHOPPING_LIST_STATUS_LABELS[listStatus] || listStatus}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {listDate ? `Lista del ${new Date(listDate).toLocaleDateString("it-IT")}` : "Aggregata dagli ordini del giorno"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
          <Button variant="outline" size="sm" onClick={handleGenerate} loading={generating}>
            <Sparkles className="h-4 w-4 mr-1" />Genera
          </Button>
          {listId && statusActions.map((action) => (
            <Button key={action.next} size="sm" onClick={() => handleStatusChange(action.next)}>
              <action.icon className="h-4 w-4 mr-1" />{action.label}
            </Button>
          ))}
          {listId && (listStatus === "DRAFT" || listStatus === "FINALIZED") && items.some((i) => i.supplierId) && (
            <Button size="sm" onClick={handleCreatePOs} disabled={creatingPOs}>
              {creatingPOs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
              Genera Ordini Fornitore
            </Button>
          )}
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" />Stampa</Button>
          {listId && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />Elimina
            </Button>
          )}
        </div>
      </motion.div>

      {/* Progress */}
      {totalCount > 0 && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso acquisti</span>
                <span className="text-sm text-muted-foreground">{checkedCount}/{totalCount} articoli</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as const }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {totalCount === 0 && (
        <EmptyState icon={ClipboardList} title="Nessuna lista della spesa"
          description="Genera una lista dalla data selezionata per aggregare i prodotti dagli ordini." />
      )}

      {/* Items by category */}
      {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
        <motion.div key={category} variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                {categoryLabels[category] || category}
                <Badge variant="secondary" className="ml-auto">{categoryItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const unitLabel = (PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()
                  const hasStock = item.availableStock > 0
                  const fullyCovered = item.netQuantity <= 0
                  return (
                    <motion.div key={item.id} layout
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                        fullyCovered ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" :
                        item.checked ? "border-border/50 bg-muted/50 opacity-60" : "border-border/50 hover:bg-muted/30"
                      }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.checked ? "line-through" : ""}`}>{item.productName}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs">
                            <span className="text-muted-foreground">
                              Richiesti: <span className="font-medium text-foreground">{formatNumber(item.totalQuantity)} {unitLabel}</span>
                            </span>
                            {hasStock && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Warehouse className="h-3 w-3" />
                                In magazzino: <span className="font-medium">{formatNumber(item.availableStock)} {unitLabel}</span>
                              </span>
                            )}
                            {fullyCovered ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <Check className="h-3 w-3" />Coperto da magazzino
                              </span>
                            ) : hasStock ? (
                              <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <AlertTriangle className="h-3 w-3" />Da ordinare: {formatNumber(item.netQuantity)} {unitLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-9 sm:ml-0">
                        <select
                          value={item.supplierId || ""}
                          onChange={(e) => handleSupplierChange(item.id, e.target.value || null)}
                          className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring/20 max-w-[160px] truncate"
                        >
                          <option value="">— Fornitore —</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.companyName}</option>
                          ))}
                        </select>
                        <input
                          type="number" min="0" step="0.5" value={item.totalQuantity}
                          onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 px-2 text-right rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                        />
                        <span className="text-xs text-muted-foreground w-8">{unitLabel}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
