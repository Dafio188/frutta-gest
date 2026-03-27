"use client"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { 
  Check, MoreHorizontal, Package, History, Warehouse, Truck, 
  AlertTriangle, Users, Calendar, ShoppingCart
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber, formatCurrency } from "@/lib/utils"
import { getProductPurchaseHistory } from "@/lib/actions"
import { PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Interface duplicated from page.tsx (better to move to types.ts later)
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

interface ShoppingListItemCardProps {
  item: SpesaItem
  suppliers: SupplierOption[]
  onToggle: (id: string) => void
  onSupplierChange: (id: string, supplierId: string | null) => void
  onQtyChange: (id: string, qty: number) => void
  onToggleMaxi?: (id: string) => void
  isDragOverlay?: boolean
  showCustomerInfo?: boolean
  viewMode?: "maxi" | "client"
}

export function ShoppingListItemCard({
  item,
  suppliers,
  onToggle,
  onSupplierChange,
  onQtyChange,
  onToggleMaxi,
  isDragOverlay = false,
  showCustomerInfo = false,
  viewMode = "maxi"
}: ShoppingListItemCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadHistory = async () => {
    if (!item.productId) return
    setLoadingHistory(true)
    try {
      const data = await getProductPurchaseHistory(item.productId)
      setHistory(data)
    } catch (err) {
      console.error("Failed to load history", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const unitLabel = (PRODUCT_UNIT_LABELS[item.unit as keyof typeof PRODUCT_UNIT_LABELS] || item.unit || "").toLowerCase()
  const hasStock = item.availableStock > 0
  const fullyCovered = item.netQuantity <= 0
  const isChecked = item.checked

  return (
    <>
      <div className={cn(
        "group relative flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition-all bg-card",
        isChecked ? "bg-muted/50 border-muted opacity-80" : "hover:shadow-sm hover:border-primary/20",
        fullyCovered && !isChecked ? "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900" : "",
        isDragOverlay ? "shadow-xl scale-105 cursor-grabbing z-50 bg-background" : ""
      )}>
        {/* Left Section: Checkbox & Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {!isDragOverlay && (
            <Checkbox 
              checked={isChecked} 
              onCheckedChange={() => onToggle(item.id)} 
              className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          )}
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-semibold text-sm sm:text-base truncate",
                isChecked && "line-through text-muted-foreground"
              )}>
                {item.productName}
              </span>
              
              {item.notes && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 truncate max-w-[150px]">
                  {item.notes}
                </Badge>
              )}
              
              {!item.isInMaxiList && viewMode === "client" && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                  Non in Maxi
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md">
                <span className="font-medium text-foreground">{formatNumber(item.totalQuantity)}</span>
                <span>{unitLabel}</span>
              </div>
              
              {hasStock && (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-900/20 dark:text-emerald-400">
                  <Warehouse className="h-3 w-3" />
                  <span className="font-medium">{formatNumber(item.availableStock)}</span>
                  <span>Stock</span>
                </div>
              )}

              {showCustomerInfo && item.customerName && (
                 <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-900/20 dark:text-blue-400">
                   <Users className="h-3 w-3" />
                   <span className="truncate max-w-[120px]">{item.customerName}</span>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Actions & Inputs */}
        <div className="flex items-center gap-2 ml-9 sm:ml-0 self-start sm:self-center mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Supplier Select */}
          <div className="flex-1 sm:flex-none sm:w-[160px]">
             <select
                value={item.supplierId || ""}
                onChange={(e) => onSupplierChange(item.id, e.target.value || null)}
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring/20 truncate appearance-none"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isChecked}
              >
                <option value="">— Seleziona Fornitore —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.companyName}</option>
                ))}
              </select>
          </div>

          {/* Quantity Input */}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={item.totalQuantity}
              onChange={(e) => onQtyChange(item.id, parseFloat(e.target.value) || 0)}
              className="w-16 h-8 text-right font-medium px-2 text-xs"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={isChecked}
            />
          </div>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Azioni</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setHistoryOpen(true); loadHistory(); }}>
                <History className="mr-2 h-4 w-4" /> Storico Acquisti
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onToggleMaxi && (
                <DropdownMenuItem onClick={() => onToggleMaxi(item.id)}>
                   <Package className="mr-2 h-4 w-4" /> 
                   {item.isInMaxiList ? "Rimuovi da Maxi Lista" : "Aggiungi a Maxi Lista"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Storico Acquisti
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{item.productName}</p>
          </DialogHeader>
          
          {loadingHistory ? (
             <div className="py-8 flex justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : history.length > 0 ? (
            <div className="space-y-4 mt-2">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium text-muted-foreground text-xs uppercase">Data</th>
                      <th className="p-3 font-medium text-muted-foreground text-xs uppercase">Fornitore</th>
                      <th className="p-3 font-medium text-muted-foreground text-xs uppercase text-right">Qta</th>
                      <th className="p-3 font-medium text-muted-foreground text-xs uppercase text-right">Prezzo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((h: any) => (
                      <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-xs">
                          {format(new Date(h.date), "dd MMM yy", { locale: it })}
                        </td>
                        <td className="p-3 truncate max-w-[120px] font-medium">
                          {h.supplierName}
                        </td>
                        <td className="p-3 text-right text-xs">
                          {formatNumber(h.quantity)} {PRODUCT_UNIT_LABELS[h.unit as keyof typeof PRODUCT_UNIT_LABELS] || h.unit}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(h.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
              <p>Nessuno storico acquisti trovato</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
