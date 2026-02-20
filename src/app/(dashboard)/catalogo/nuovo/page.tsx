/**
 * Nuovo Prodotto
 *
 * Form per aggiungere un nuovo prodotto al catalogo.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Apple, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { PRODUCT_CATEGORY_LABELS, PRODUCT_UNIT_LABELS_FULL } from "@/lib/constants"
import { useUIStore } from "@/stores/ui-store"

export default function NuovoProdottoPage() {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    unit: "KG",
    defaultPrice: "",
    costPrice: "",
    vatRate: "4",
    isAvailable: true,
    seasonalFrom: "",
    seasonalTo: "",
    description: "",
    minOrderQuantity: "",
  })

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    addToast({ type: "success", title: "Prodotto creato", description: `${formData.name} aggiunto al catalogo.` })
    setIsSubmitting(false)
    router.push("/catalogo")
  }

  return (
    <PageTransition>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/catalogo" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuovo Prodotto</h1>
            <p className="text-muted-foreground">Aggiungi un prodotto al catalogo</p>
          </div>
        </div>

        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Apple className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Informazioni Prodotto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input label="Nome Prodotto *" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Es. Pomodori San Marzano" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                    <select value={formData.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
                      <option value="">Seleziona categoria</option>
                      {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Unita di Misura</label>
                    <select value={formData.unit} onChange={(e) => updateField("unit", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
                      {Object.entries(PRODUCT_UNIT_LABELS_FULL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <Input label="Prezzo di Vendita *" type="number" step="0.01" min="0" value={formData.defaultPrice} onChange={(e) => updateField("defaultPrice", e.target.value)} placeholder="0.00" />
                  <Input label="Prezzo di Costo" type="number" step="0.01" min="0" value={formData.costPrice} onChange={(e) => updateField("costPrice", e.target.value)} placeholder="0.00" />
                  <Input label="Aliquota IVA (%)" type="number" min="0" max="22" value={formData.vatRate} onChange={(e) => updateField("vatRate", e.target.value)} />
                  <Input label="Quantita Minima Ordine" type="number" min="0" step="0.1" value={formData.minOrderQuantity} onChange={(e) => updateField("minOrderQuantity", e.target.value)} />
                  <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    <Switch checked={formData.isAvailable} onCheckedChange={(c) => updateField("isAvailable", c)} />
                    <Label className="text-sm font-medium">Disponibile per ordini</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader><CardTitle className="text-base">Stagionalita</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Disponibile Da" type="date" value={formData.seasonalFrom} onChange={(e) => updateField("seasonalFrom", e.target.value)} />
                  <Input label="Disponibile A" type="date" value={formData.seasonalTo} onChange={(e) => updateField("seasonalTo", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader><CardTitle className="text-base">Descrizione</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Descrizione del prodotto..." rows={3} />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!formData.name.trim()}>
            <Save className="h-4 w-4" strokeWidth={1.75} />
            Salva Prodotto
          </Button>
        </div>
      </form>
    </PageTransition>
  )
}
