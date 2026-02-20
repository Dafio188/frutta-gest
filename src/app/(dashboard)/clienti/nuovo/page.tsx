/**
 * Pagina Nuovo Cliente
 *
 * Form completo per registrazione cliente.
 * Include: dati aziendali, dati fiscali, contatti, consegna, pagamento.
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Building2, MapPin, CreditCard,
  Truck, Save, User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CUSTOMER_TYPE_LABELS, PAYMENT_METHOD_LABELS, ITALIAN_PROVINCES } from "@/lib/constants"

export default function NuovoClientePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    type: "RISTORANTE",
    vatNumber: "",
    fiscalCode: "",
    sdiCode: "",
    pecEmail: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    deliveryZone: "",
    preferredDeliveryTime: "",
    deliveryNotes: "",
    paymentMethod: "BONIFICO",
    paymentTermsDays: "30",
    creditLimit: "",
    notes: "",
    // Contatto principale
    contactFirstName: "",
    contactLastName: "",
    contactRole: "",
    contactPhone: "",
    contactEmail: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: Connect to server action
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/clienti"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nuovo Cliente</h1>
          <p className="text-muted-foreground">Registra un nuovo cliente</p>
        </div>
      </div>

      {/* Dati Aziendali */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Dati Aziendali
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Ragione Sociale *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="Es. Ristorante Da Mario S.r.l."
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            >
              {Object.entries(CUSTOMER_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">P.IVA</label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => updateField("vatNumber", e.target.value)}
              placeholder="IT12345678901"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Codice Fiscale</label>
            <input
              type="text"
              value={formData.fiscalCode}
              onChange={(e) => updateField("fiscalCode", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Codice SDI</label>
            <input
              type="text"
              value={formData.sdiCode}
              onChange={(e) => updateField("sdiCode", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">PEC</label>
            <input
              type="email"
              value={formData.pecEmail}
              onChange={(e) => updateField("pecEmail", e.target.value)}
              placeholder="azienda@pec.it"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Telefono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Indirizzo */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Indirizzo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Indirizzo *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Via Roma 1"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Città *</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Provincia *</label>
              <select
                required
                value={formData.province}
                onChange={(e) => updateField("province", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
              >
                <option value="">—</option>
                {ITALIAN_PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">CAP *</label>
              <input
                type="text"
                required
                maxLength={5}
                value={formData.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consegna */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Consegna
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Zona di Consegna</label>
            <input
              type="text"
              value={formData.deliveryZone}
              onChange={(e) => updateField("deliveryZone", e.target.value)}
              placeholder="Es. Centro, Zona Nord"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Orario Preferito</label>
            <input
              type="text"
              value={formData.preferredDeliveryTime}
              onChange={(e) => updateField("preferredDeliveryTime", e.target.value)}
              placeholder="Es. 06:00-08:00"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Note Consegna</label>
            <textarea
              value={formData.deliveryNotes}
              onChange={(e) => updateField("deliveryNotes", e.target.value)}
              placeholder="Istruzioni speciali per la consegna..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Contatto Principale */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Contatto Principale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <input
              type="text"
              value={formData.contactFirstName}
              onChange={(e) => updateField("contactFirstName", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cognome</label>
            <input
              type="text"
              value={formData.contactLastName}
              onChange={(e) => updateField("contactLastName", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ruolo</label>
            <input
              type="text"
              value={formData.contactRole}
              onChange={(e) => updateField("contactRole", e.target.value)}
              placeholder="Es. Chef, Resp. Acquisti"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.75} />
          Condizioni di Pagamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Metodo di Pagamento</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => updateField("paymentMethod", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Termini (giorni)</label>
            <input
              type="number"
              min="0"
              value={formData.paymentTermsDays}
              onChange={(e) => updateField("paymentTermsDays", e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Limite Credito €</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.creditLimit}
              onChange={(e) => updateField("creditLimit", e.target.value)}
              placeholder="Nessun limite"
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !formData.companyName}
          className={cn(
            "flex items-center gap-2 h-11 px-8 rounded-xl text-sm font-medium transition-all",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Save className="h-4 w-4" strokeWidth={1.75} />
          {isSubmitting ? "Salvataggio..." : "Salva Cliente"}
        </button>
      </div>
    </form>
  )
}
