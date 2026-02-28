
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardList, ShoppingBag, Printer, Trash2,
  Sparkles, Loader2, Check, Package, Truck, Warehouse, AlertTriangle,
  Users, Layers, ArrowRightLeft, Combine
} from "lucide-react"
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { PRODUCT_UNIT_LABELS, SHOPPING_LIST_STATUS_LABELS } from "@/lib/constants"
import { formatNumber } from "@/lib/utils"
import {
  generateShoppingListFromOrders, getShoppingLists, getSuppliers,
  updateShoppingListItem, updateShoppingListStatus, deleteShoppingList,
  createPurchaseOrdersFromShoppingList, toggleShoppingListItemMaxiList,
  mergeShoppingListItems, bulkToggleMaxiList
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
  productId?: string
  productName: string
  category: string
  totalQuantity: number
  availableStock: number
  netQuantity: number
  unit: string
  supplierId?: string | null
  supplierName?: string
  checked: boolean
  customerId?: string | null
  customerName?: string
  isInMaxiList: boolean
  notes?: string
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

// Draggable Item Component
function DraggableSpesaItem({ item, children }: { item: SpesaItem, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: item
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      {children}
    </div>
  )
}

// Droppable Item Component (Target for merge)
function DroppableSpesaItem({ item, children, onDrop }: { item: SpesaItem, children: React.ReactNode, onDrop?: (sourceId: string) => void }) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: item.id,
    data: item
  })

  const isCompatible = active?.data.current?.productId === item.productId && active?.id !== item.id

  return (
    <div ref={setNodeRef} className={`relative transition-all duration-200 rounded-xl ${isOver && isCompatible ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}>
      {children}
      {isOver && isCompatible && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px] rounded-xl z-10 pointer-events-none">
          <Badge className="bg-primary text-primary-foreground shadow-lg animate-in zoom-in">
            <Combine className="w-3 h-3 mr-1" /> Unisci
          </Badge>
        </div>
      )}
    </div>
  )
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
  const [activeTab, setActiveTab] = useState("maxi")
  const [draggedItem, setDraggedItem] = useState<SpesaItem | null>(null)
  const { addToast } = useUIStore()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [result, suppResult] = await Promise.all([
        getShoppingLists({ pageSize: 1 }),
        getSuppliers({ pageSize: 100 }),
      ])
      const parsed = result as unknown as { data: { id: string; date: string; status: string; items: any[] }[] }
      const suppParsed = suppResult as unknown as { data: { id: string; companyName: string }[] }
      setSuppliers(suppParsed.data.map((s) => ({ id: s.id, companyName: s.companyName })))

      const list = parsed.data[0]
      if (list) {
        setListId(list.id)
        setListStatus(list.status || "DRAFT")
        setListDate(list.date)
        setItems(list.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || item.productName || "—",
          category: item.product?.category?.slug || "ALTRO",
          totalQuantity: Number(item.totalQuantity),
          availableStock: Number(item.availableStock || 0),
          netQuantity: Number(item.netQuantity ?? item.totalQuantity),
          unit: item.unit,
          supplierId: item.supplierId || item.supplier?.id || null,
          supplierName: item.supplier?.companyName,
          checked: item.isOrdered || false,
          customerId: item.customerId,
          customerName: item.customer?.name || "Nessun Cliente",
          isInMaxiList: item.isInMaxiList,
          notes: item.notes
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

  const handleToggleMaxi = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newState = !item.isInMaxiList
    
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, isInMaxiList: newState } : i))
    
    try {
      await toggleShoppingListItemMaxiList(id, newState)
    } catch (err) {
      // Revert
      setItems(prev => prev.map(i => i.id === id ? { ...i, isInMaxiList: !newState } : i))
      addToast({ type: "error", title: "Errore", description: "Impossibile aggiornare lo stato Maxi Lista" })
    }
  }

  const handleBulkToggle = async (itemIds: string[], isInMaxiList: boolean) => {
    if (itemIds.length === 0) return
    
    // Optimistic
    setItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, isInMaxiList } : i))

    try {
      await bulkToggleMaxiList(itemIds, isInMaxiList)
      addToast({ type: "success", title: "Aggiornato", description: `${itemIds.length} articoli aggiornati` })
    } catch {
      // Revert
      setItems(prev => prev.map(i => itemIds.includes(i.id) ? { ...i, isInMaxiList: !isInMaxiList } : i))
      addToast({ type: "error", title: "Errore", description: "Impossibile aggiornare gli articoli" })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedItem(null)

    if (!over || active.id === over.id) return

    const sourceItem = items.find(i => i.id === active.id)
    const targetItem = items.find(i => i.id === over.id)

    if (!sourceItem || !targetItem) return

    // Allow merge only if same product
    if (sourceItem.productId !== targetItem.productId) {
      addToast({ type: "error", title: "Non compatibile", description: "Puoi unire solo articoli dello stesso prodotto" })
      return
    }

    // Optimistic merge
    const newTotalQty = targetItem.totalQuantity + sourceItem.totalQuantity
    const newNotes = [targetItem.notes, sourceItem.notes].filter(Boolean).join("; ")
    
    const previousItems = [...items]
    
    setItems(prev => prev.map(i => {
      if (i.id === targetItem.id) {
        return { ...i, totalQuantity: newTotalQty, netQuantity: newTotalQty, notes: newNotes }
      }
      return i
    }).filter(i => i.id !== sourceItem.id))

    try {
      await mergeShoppingListItems(targetItem.id, [sourceItem.id])
      addToast({ type: "success", title: "Articoli uniti", description: "Gli articoli sono stati uniti con successo" })
    } catch (err) {
      setItems(previousItems)
      addToast({ type: "error", title: "Errore unione", description: "Impossibile unire gli articoli" })
    }
  }

  const handleDragStart = (event: any) => {
    const item = items.find(i => i.id === event.active.id)
    setDraggedItem(item || null)
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
    const maxiItems = items.filter(i => i.isInMaxiList)
    if (maxiItems.every((i) => !i.supplierId)) {
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

  const checkedCount = items.filter((i) => i.checked && i.isInMaxiList).length
  const totalCount = items.filter(i => i.isInMaxiList).length
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
  const statusActions = STATUS_FLOW[listStatus] || []

  const categoryLabels: Record<string, string> = {
    FRUTTA: "Frutta", VERDURA: "Verdura", ERBE_AROMATICHE: "Erbe Aromatiche",
    ORTAGGI: "Ortaggi", FRUTTA_ESOTICA: "Frutta Esotica", FRUTTA_SECCA: "Frutta Secca",
    SPEZIE: "Spezie", ALTRO: "Altro",
  }

  // Grouping for Clienti View
  const groupedByCustomer = items.reduce<Record<string, { name: string, items: SpesaItem[] }>>((acc, item) => {
    const custId = item.customerId || "unknown"
    const custName = item.customerName || "Non assegnato"
    if (!acc[custId]) acc[custId] = { name: custName, items: [] }
    acc[custId].items.push(item)
    return acc
  }, {})

  // Grouping for Maxi View
  const maxiItems = items.filter(i => i.isInMaxiList)
  const groupedByCategory = maxiItems.reduce<Record<string, SpesaItem[]>>((acc, item) => {
    const cat = item.category?.toUpperCase() || "ALTRO"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const renderItemCard = (item: SpesaItem, isDragOverlay = false) => {
    const unitLabel = (PRODUCT_UNIT_LABELS[item.unit] || item.unit).toLowerCase()
    const hasStock = item.availableStock > 0
    const fullyCovered = item.netQuantity <= 0
    
    return (
      <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all bg-card ${
        fullyCovered ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" :
        item.checked ? "border-border/50 bg-muted/50 opacity-60" : "border-border/50 hover:bg-muted/30"
      } ${isDragOverlay ? "shadow-xl scale-105 cursor-grabbing" : ""}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {!isDragOverlay && <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${item.checked ? "line-through" : ""}`}>{item.productName}</p>
              {item.notes && <Badge variant="outline" className="text-[10px] h-4 px-1 truncate max-w-[100px]">{item.notes}</Badge>}
              {!item.isInMaxiList && <Badge variant="secondary" className="text-[10px] h-4 px-1">Non in Maxi</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{formatNumber(item.totalQuantity)} {unitLabel}</span>
              </span>
              {hasStock && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Warehouse className="h-3 w-3" />
                  Stock: {formatNumber(item.availableStock)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-9 sm:ml-0">
          <select
            value={item.supplierId || ""}
            onChange={(e) => handleSupplierChange(item.id, e.target.value || null)}
            className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring/20 max-w-[120px] truncate"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on select
          >
            <option value="">— Fornitore —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.companyName}</option>
            ))}
          </select>
          <input
            type="number" min="0" step="0.5" value={item.totalQuantity}
            onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
            className="w-16 h-8 px-2 text-right rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on input
          />
        </div>
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
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
            {listId && (listStatus === "DRAFT" || listStatus === "FINALIZED") && maxiItems.some((i) => i.supplierId) && (
              <Button size="sm" onClick={handleCreatePOs} disabled={creatingPOs}>
                {creatingPOs ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
                Ordini Fornitore
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

        {listId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="clienti" className="gap-2">
                <Users className="h-4 w-4" /> Vista Clienti
              </TabsTrigger>
              <TabsTrigger value="maxi" className="gap-2">
                <Layers className="h-4 w-4" /> Maxi Lista
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clienti" className="mt-4 space-y-4">
               {Object.entries(groupedByCustomer).map(([custId, { name, items: customerItems }]) => (
                 <Card key={custId}>
                   <CardHeader className="py-3 bg-muted/30">
                     <CardTitle className="text-base font-medium flex items-center justify-between">
                       <span>{name}</span>
                       <div className="flex items-center gap-2">
                         <Badge variant="secondary">{customerItems.length} articoli</Badge>
                         {customerItems.some(i => !i.isInMaxiList) && (
                           <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleBulkToggle(customerItems.filter(i => !i.isInMaxiList).map(i => i.id), true)}>
                             Aggiungi tutti
                           </Button>
                         )}
                       </div>
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                     <div className="divide-y">
                       {customerItems.map(item => (
                         <div key={item.id} className="p-3 flex items-center justify-between hover:bg-muted/10">
                           <div>
                             <p className="font-medium text-sm">{item.productName}</p>
                             <p className="text-xs text-muted-foreground">{formatNumber(item.totalQuantity)} {item.unit} {item.notes && `• ${item.notes}`}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <Button 
                               variant={item.isInMaxiList ? "secondary" : "outline"} 
                               size="sm" 
                               className="h-7 text-xs"
                               onClick={() => handleToggleMaxi(item.id)}
                             >
                               {item.isInMaxiList ? "In Maxi Lista" : "Aggiungi"}
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="maxi" className="mt-4 space-y-4">
              {/* Progress */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso acquisti</span>
                    <span className="text-sm text-muted-foreground">{checkedCount}/{totalCount} articoli</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                  </div>
                </CardContent>
              </Card>

              {maxiItems.length === 0 && (
                 <EmptyState icon={Layers} title="Maxi Lista vuota" description="Aggiungi articoli dalla vista Clienti." />
              )}

              {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
                <motion.div key={category} variants={fadeUp} initial="hidden" animate="show">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        {categoryLabels[category] || category}
                        <Badge variant="secondary" className="ml-auto">{categoryItems.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {categoryItems.map((item) => (
                        <DroppableSpesaItem key={item.id} item={item} onDrop={(sourceId) => console.log('drop', sourceId)}>
                          <DraggableSpesaItem item={item}>
                            {renderItemCard(item)}
                          </DraggableSpesaItem>
                        </DroppableSpesaItem>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState icon={ClipboardList} title="Nessuna lista della spesa"
            description="Genera una lista dalla data selezionata per aggregare i prodotti dagli ordini." />
        )}
      </div>
      <DragOverlay>
        {draggedItem ? renderItemCard(draggedItem, true) : null}
      </DragOverlay>
    </DndContext>
  )
}
