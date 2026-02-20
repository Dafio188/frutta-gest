/**
 * Dettaglio Prodotto
 *
 * Informazioni complete del prodotto con modifica inline ed eliminazione.
 */

"use client"

import { useState, useEffect, useCallback, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Apple, Pencil, Trash2, Save, X, Loader2, Star, Upload, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { PRODUCT_UNIT_LABELS, PRODUCT_UNIT_LABELS_FULL } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { getProduct, updateProduct, deleteProduct, getCategories, toggleProductFeatured } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface ProductData {
  id: string
  name: string
  unit: string
  image: string | null
  defaultPrice: number
  costPrice: number | null
  vatRate: number
  isAvailable: boolean
  isFeatured: boolean
  seasonalFrom: string | null
  seasonalTo: string | null
  description: string | null
  minOrderQuantity: number | null
  createdAt: string
  category: { id: string; name: string } | null
  supplierProducts: { id: string; price: number; isPreferred: boolean; supplier: { id: string; companyName: string } }[]
}

interface FormState {
  name: string
  categoryId: string
  unit: string
  defaultPrice: string
  costPrice: string
  vatRate: string
  isAvailable: boolean
  seasonalFrom: string
  seasonalTo: string
  description: string
  minOrderQuantity: string
}

function productToForm(p: ProductData): FormState {
  return {
    name: p.name,
    categoryId: p.category?.id || "",
    unit: p.unit,
    defaultPrice: String(p.defaultPrice),
    costPrice: p.costPrice != null ? String(p.costPrice) : "",
    vatRate: String(p.vatRate),
    isAvailable: p.isAvailable,
    seasonalFrom: p.seasonalFrom ? String(p.seasonalFrom) : "",
    seasonalTo: p.seasonalTo ? String(p.seasonalTo) : "",
    description: p.description || "",
    minOrderQuantity: p.minOrderQuantity != null ? String(p.minOrderQuantity) : "",
  }
}

export default function ProdottoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [product, setProduct] = useState<ProductData | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingFeatured, setTogglingFeatured] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getProduct(productId)
      setProduct(data as unknown as ProductData)
    } catch (err) {
      console.error("Errore caricamento prodotto:", err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadProduct()
    getCategories().then((cats: any) => setCategories(cats)).catch(console.error)
  }, [loadProduct])

  const startEditing = () => {
    if (product) {
      setForm(productToForm(product))
      setEditing(true)
    }
  }

  const cancelEditing = () => {
    setEditing(false)
    setForm(null)
  }

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSave = async () => {
    if (!form || !product) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        unit: form.unit,
        defaultPrice: parseFloat(form.defaultPrice) || 0,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        vatRate: parseFloat(form.vatRate) || 4,
        isAvailable: form.isAvailable,
        seasonalFrom: form.seasonalFrom ? parseInt(form.seasonalFrom) : null,
        seasonalTo: form.seasonalTo ? parseInt(form.seasonalTo) : null,
        description: form.description || null,
        minOrderQuantity: form.minOrderQuantity ? parseFloat(form.minOrderQuantity) : null,
      }
      const updated = await updateProduct(product.id, payload)
      setProduct(updated as unknown as ProductData)
      setEditing(false)
      setForm(null)
      addToast({ type: "success", title: "Prodotto aggiornato", description: `${form.name} salvato con successo.` })
    } catch (err: any) {
      addToast({ type: "error", title: "Errore salvataggio", description: err.message || "Impossibile salvare le modifiche." })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      router.push("/catalogo")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile eliminare il prodotto." })
      setDeleting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return

    // Validazione client-side
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      addToast({ type: "error", title: "Formato non valido", description: "Usa JPG, PNG, WebP o GIF." })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: "error", title: "File troppo grande", description: "Massimo 5MB." })
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("productId", product.id)

      const res = await fetch("/api/products/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Errore upload")

      // Aggiorna stato locale con cache-bust
      setProduct((prev) => prev ? { ...prev, image: data.image + "?t=" + Date.now() } : prev)
      addToast({ type: "success", title: "Immagine aggiornata", description: "L'immagine del prodotto è stata caricata." })
    } catch (err: any) {
      addToast({ type: "error", title: "Errore upload", description: err.message || "Impossibile caricare l'immagine." })
    } finally {
      setUploadingImage(false)
      // Reset input per permettere ri-selezione stesso file
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Apple className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Prodotto non trovato</h2>
          <Link href="/catalogo"><Button variant="outline"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} />Torna al catalogo</Button></Link>
        </div>
      </PageTransition>
    )
  }

  const margin = product.costPrice ? ((product.defaultPrice - product.costPrice) / product.defaultPrice) * 100 : null
  const categoryName = product.category?.name || "Senza categoria"

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/catalogo" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div className="flex items-center gap-3">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Apple className="h-5 w-5" strokeWidth={1.75} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
                  {product.isAvailable ? <Badge variant="success">Disponibile</Badge> : <Badge variant="destructive">Non Disponibile</Badge>}
                  {product.isFeatured && <Badge variant="warning" className="gap-1"><Star className="h-3 w-3" />In Evidenza</Badge>}
                </div>
                <p className="text-muted-foreground text-sm">{categoryName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={cancelEditing}><X className="h-4 w-4" strokeWidth={1.75} />Annulla</Button>
                <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" strokeWidth={1.75} />Salva</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}><Pencil className="h-4 w-4" strokeWidth={1.75} />Modifica</Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" strokeWidth={1.75} />Elimina</Button>
              </>
            )}
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StaggerItem className="lg:col-span-2 space-y-6">
            {/* Prezzi e Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">{editing ? "Modifica Prodotto" : "Prezzi e Unita"}</CardTitle></CardHeader>
              <CardContent>
                {editing && form ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input label="Nome Prodotto *" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Es. Pomodori San Marzano" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => updateField("categoryId", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
                      >
                        <option value="">Seleziona categoria</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Unita di Misura</label>
                      <select
                        value={form.unit}
                        onChange={(e) => updateField("unit", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
                      >
                        {Object.entries(PRODUCT_UNIT_LABELS_FULL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </div>
                    <Input label="Prezzo di Vendita *" type="number" step="0.01" min="0" value={form.defaultPrice} onChange={(e) => updateField("defaultPrice", e.target.value)} placeholder="0.00" />
                    <Input label="Prezzo di Costo" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => updateField("costPrice", e.target.value)} placeholder="0.00" />
                    <Input label="Aliquota IVA (%)" type="number" min="0" max="22" value={form.vatRate} onChange={(e) => updateField("vatRate", e.target.value)} />
                    <Input label="Quantita Minima Ordine" type="number" min="0" step="0.1" value={form.minOrderQuantity} onChange={(e) => updateField("minOrderQuantity", e.target.value)} />
                    <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                      <Switch checked={form.isAvailable} onCheckedChange={(c) => updateField("isAvailable", c)} />
                      <Label className="text-sm font-medium">Disponibile per ordini</Label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prezzo Vendita</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(product.defaultPrice)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/ {PRODUCT_UNIT_LABELS[product.unit] || product.unit}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prezzo Costo</p>
                      <p className="text-xl font-bold">{product.costPrice ? formatCurrency(product.costPrice) : "--"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/ {PRODUCT_UNIT_LABELS[product.unit] || product.unit}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Margine</p>
                      <p className={`text-xl font-bold ${margin && margin > 0 ? "text-emerald-600" : "text-red-500"}`}>{margin ? `${margin.toFixed(1)}%` : "--"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">IVA</p>
                      <p className="text-xl font-bold">{product.vatRate}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Descrizione */}
            <Card>
              <CardHeader><CardTitle className="text-base">Descrizione</CardTitle></CardHeader>
              <CardContent>
                {editing && form ? (
                  <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Descrizione del prodotto..." rows={3} />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description || "Nessuna descrizione"}</p>
                )}
              </CardContent>
            </Card>

            {/* Stagionalita (solo in editing) */}
            {editing && form && (
              <Card>
                <CardHeader><CardTitle className="text-base">Stagionalita</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Mese Inizio</label>
                      <select
                        value={form.seasonalFrom}
                        onChange={(e) => updateField("seasonalFrom", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
                      >
                        <option value="">Tutto l&apos;anno</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                          <option key={m} value={m}>{new Date(2024, m-1).toLocaleString("it-IT", { month: "long" })}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Mese Fine</label>
                      <select
                        value={form.seasonalTo}
                        onChange={(e) => updateField("seasonalTo", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
                      >
                        <option value="">Tutto l&apos;anno</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                          <option key={m} value={m}>{new Date(2024, m-1).toLocaleString("it-IT", { month: "long" })}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {product.supplierProducts?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Fornitori ({product.supplierProducts.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.supplierProducts.map((sp) => (
                      <div key={sp.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">{sp.supplier.companyName}</p>
                          {sp.isPreferred && <Badge variant="success" className="text-[10px]">Preferito</Badge>}
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(sp.price)}/{PRODUCT_UNIT_LABELS[product.unit] || product.unit}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </StaggerItem>

          <StaggerItem className="space-y-6">
            {/* Immagine Prodotto con Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            <Card className="overflow-hidden">
              {product.image ? (
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingImage ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-white mb-2" strokeWidth={1.75} />
                        <span className="text-white text-sm font-medium">Cambia immagine</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Carica immagine</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP o GIF (max 5MB)</p>
                      </div>
                      <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                        <Upload className="h-4 w-4" strokeWidth={1.75} />Scegli file
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Dettagli</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoItem label="Categoria" value={categoryName} />
                <InfoItem label="Unita" value={PRODUCT_UNIT_LABELS[product.unit] || product.unit} />
                <InfoItem label="Quantita Minima" value={product.minOrderQuantity ? `${product.minOrderQuantity} ${PRODUCT_UNIT_LABELS[product.unit] || product.unit}` : "Nessuna"} />
                <InfoItem label="Stagionalita" value={product.seasonalFrom && product.seasonalTo ? `${product.seasonalFrom} - ${product.seasonalTo}` : "Tutto l'anno"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Star className="h-5 w-5 text-amber-500" strokeWidth={1.75} />Portale Clienti</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {product.isFeatured
                    ? "Questo prodotto è in evidenza nel portale clienti."
                    : "Mostra questo prodotto in evidenza nella dashboard del portale clienti."}
                </p>
                <Button
                  variant={product.isFeatured ? "outline" : "default"}
                  className={!product.isFeatured ? "w-full bg-amber-500 hover:bg-amber-600 text-white" : "w-full"}
                  loading={togglingFeatured}
                  onClick={async () => {
                    setTogglingFeatured(true)
                    try {
                      const updated = await toggleProductFeatured(productId)
                      setProduct((prev: any) => prev ? { ...prev, isFeatured: (updated as any).isFeatured } : prev)
                      addToast({
                        type: "success",
                        title: (updated as any).isFeatured ? "Prodotto in Evidenza" : "Evidenza Rimossa",
                        description: (updated as any).isFeatured ? "Il prodotto apparirà nel portale clienti." : "Il prodotto non è più in evidenza.",
                      })
                    } catch (err: any) {
                      addToast({ type: "error", title: "Errore", description: err.message })
                    } finally {
                      setTogglingFeatured(false)
                    }
                  }}
                >
                  <Star className="h-4 w-4" strokeWidth={1.75} />
                  {product.isFeatured ? "Rimuovi Evidenza" : "Metti in Evidenza"}
                </Button>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminare il prodotto?</DialogTitle>
              <DialogDescription>Stai per eliminare <strong>{product.name}</strong>. Se il prodotto ha ordini associati verra disattivato anziche eliminato.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annulla</Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="h-4 w-4" strokeWidth={1.75} />Elimina</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p><p className="text-sm">{value || "--"}</p></div>
}
