/**
 * Pagina Nuovo Fornitore
 *
 * Form completo per registrazione fornitore con tutti i campi.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Factory, MapPin, CreditCard, Save, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { PAYMENT_METHOD_LABELS, ITALIAN_PROVINCES } from "@/lib/constants"
import { useUIStore } from "@/stores/ui-store"

export default function NuovoFornitorePage() {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    companyName: "",
    vatNumber: "",
    fiscalCode: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    paymentMethod: "BONIFICO",
    paymentTermsDays: "30",
    notes: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.companyName.trim()) newErrors.companyName = "La ragione sociale e obbligatoria"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email non valida"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    addToast({ type: "success", title: "Fornitore creato", description: `${formData.companyName} aggiunto con successo.` })
    setIsSubmitting(false)
    router.push("/fornitori")
  }

  return (
    <PageTransition>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/fornitori" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuovo Fornitore</h1>
            <p className="text-muted-foreground">Registra un nuovo fornitore</p>
          </div>
        </div>

        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Factory className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Dati Aziendali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input label="Ragione Sociale *" value={formData.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Es. Frutta & Verdura S.r.l." error={errors.companyName} />
                  </div>
                  <Input label="P.IVA" value={formData.vatNumber} onChange={(e) => updateField("vatNumber", e.target.value)} placeholder="IT12345678901" />
                  <Input label="Codice Fiscale" value={formData.fiscalCode} onChange={(e) => updateField("fiscalCode", e.target.value)} />
                  <Input label="Telefono" type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  <Input label="Email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} error={errors.email} />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Indirizzo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input label="Indirizzo" value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Via Roma 1" />
                  </div>
                  <Input label="Citta" value={formData.city} onChange={(e) => updateField("city", e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Provincia</label>
                      <select value={formData.province} onChange={(e) => updateField("province", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
                        <option value="">--</option>
                        {ITALIAN_PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
                      </select>
                    </div>
                    <Input label="CAP" value={formData.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} maxLength={5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Condizioni di Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Metodo di Pagamento</label>
                    <select value={formData.paymentMethod} onChange={(e) => updateField("paymentMethod", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all">
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <Input label="Termini (giorni)" type="number" min={0} value={formData.paymentTermsDays} onChange={(e) => updateField("paymentTermsDays", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Note aggiuntive sul fornitore..." rows={3} />
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!formData.companyName.trim()}>
            <Save className="h-4 w-4" strokeWidth={1.75} />
            Salva Fornitore
          </Button>
        </div>
      </form>
    </PageTransition>
  )
}
