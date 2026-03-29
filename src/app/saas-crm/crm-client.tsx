/**
 * SaaS CRM Client Component — Interfaccia interattiva SuperAdmin
 *
 * Versione 2: Lead management completo con Dialog dettagli, azioni
 * mailto/tel, eliminazione, cambio stato e conversione a Tenant.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, Sparkles, Users, TrendingUp, Clock, CreditCard,
  ChevronRight, Mail, Phone, ExternalLink, UserPlus, Loader2,
  Trash2, ArrowRightCircle, X, Building2, Eye, MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  createInviteLink,
  updateLeadStatus,
  deleteLead,
  convertLeadToTenant,
} from "@/lib/actions-master"
import { toast } from "sonner"

// ─── Status config ───────────────────────────────────────────────────────────

const LEAD_STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nuovo", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  CONTACTED: { label: "Contattato", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  DEMO: { label: "In Demo", color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  CONVERTED: { label: "Convertito ✓", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  LOST: { label: "Perso", color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SaasCrmClientProps {
  initialSummary: any
  initialLeads: any[]
  initialOrganizations: any[]
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SaasCrmClient({ initialSummary, initialLeads, initialOrganizations }: SaasCrmClientProps) {
  const router = useRouter()
  const [leads, setLeads] = useState(initialLeads)
  const [organizations] = useState(initialOrganizations)
  const [summary] = useState(initialSummary)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  // Lead detail dialog
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [statusChanging, setStatusChanging] = useState<string | null>(null)

  // ── Invite ─────────────────────────────────────────

  const handleCreateInvite = async (orgId: string, email: string, name: string) => {
    setIsGenerating(orgId)
    try {
      const result = await createInviteLink(orgId, email, name)
      if (result.success) {
        await navigator.clipboard.writeText(result.magicLink)
        toast.success("Link di invito generato e copiato negli appunti!", {
          description: "Invialo al cliente per permettergli di impostare la password."
        })
      }
    } catch (error: any) {
      toast.error("Errore: " + error.message)
    } finally {
      setIsGenerating(null)
    }
  }

  // ── Lead status ────────────────────────────────────

  const handleStatusChange = async (leadId: string, status: string) => {
    setStatusChanging(leadId)
    try {
      await updateLeadStatus(leadId, status)
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l))
      if (selectedLead?.id === leadId) setSelectedLead((l: any) => l ? { ...l, status } : l)
      toast.success(`Stato aggiornato in "${LEAD_STATUS_MAP[status]?.label || status}"`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setStatusChanging(null)
    }
  }

  // ── Delete lead ────────────────────────────────────

  const handleDeleteLead = async (leadId: string) => {
    setDeleting(leadId)
    try {
      await deleteLead(leadId)
      setLeads((prev) => prev.filter((l) => l.id !== leadId))
      if (selectedLead?.id === leadId) setSelectedLead(null)
      toast.success("Lead eliminato")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleting(null)
    }
  }

  // ── Convert lead to tenant ─────────────────────────

  const handleConvert = async (leadId: string) => {
    setConverting(true)
    try {
      const result = await convertLeadToTenant(leadId)
      if (result.success) {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: "CONVERTED" } : l))
        setSelectedLead(null)
        toast.success(`Tenant "${result.organization.name}" creato con successo!`, {
          description: `Slug: ${result.organization.slug} — Il database è stato inizializzato.`,
        })
        router.refresh()
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setConverting(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-20">
        
        {/* Header Commerciale */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              SaaS CRM & Sales
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Monitoraggio ricavi e provisioning per la rete FruttaGest.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin-master">
              <Button variant="outline" className="rounded-full">
                <Shield className="h-4 w-4 mr-2" />
                Infrastruttura
              </Button>
            </Link>
            <Link href="/admin-master">
              <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Nuovo Tenant
              </Button>
            </Link>
          </div>
        </div>

        {/* Commercial KPI */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MRR (Monthly Recurring)", value: formatCurrency(summary.mrr), sub: "Ricavi mensili stimati", icon: TrendingUp, color: "text-emerald-500" },
            { label: "Clienti Attivi", value: summary.activeSubs, sub: "Su " + summary.orgCount + " tenant totali", icon: Users, color: "text-blue-500" },
            { label: "Lead Nuovi", value: summary.newLeads, sub: "In attesa di contatto", icon: Sparkles, color: "text-amber-500" },
            { label: "Rinnovi a breve", value: String(summary.renewingSoon ?? 0), sub: "Prossimi 60 giorni", icon: Clock, color: "text-purple-500" },
          ].map((kpi) => (
            <StaggerItem key={kpi.label}>
              <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden group">
                <div className={cn("absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors", kpi.color.replace('text', 'bg'))} />
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl bg-muted group-hover:scale-110 transition-transform", kpi.color)}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{kpi.value}</p>
                  <p className="text-sm font-bold opacity-70 mt-1 uppercase tracking-tight">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground mt-2">{kpi.sub}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Sezioni Tabellari */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Portfolio Clienti SaaS */}
          <Card className="lg:col-span-2 border-none shadow-2xl bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Shield className="h-5 w-5 text-primary" />
                  Clienti Attivi (Tenant)
                </CardTitle>
                <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {organizations.length} Totali
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {organizations.length > 0 ? (
                 <div className="divide-y divide-border/50">
                    {organizations.map((org) => (
                      <div key={org.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center font-bold text-lg text-primary overflow-hidden">
                            {org.logoUrl ? <img src={org.logoUrl} className="h-full w-full object-cover" alt="" /> : org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{org.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground">{org.slug}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Scade: {org.subscription?.expiresAt ? new Date(org.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full h-8 px-3 text-[10px] font-bold gap-2"
                              disabled={isGenerating === org.id}
                              onClick={() => handleCreateInvite(org.id, org.contactEmail || '', org.name)}
                           >
                              {isGenerating === org.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserPlus className="h-3 w-3 text-primary" />
                              )}
                              INVITA ADMIN
                           </Button>

                           <Link href={`/saas-crm/${org.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                           </Link>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-semibold text-muted-foreground">Nessun cliente attivo</p>
                    <p className="text-xs text-muted-foreground max-w-[240px] mt-1 italic">
                      Usa &quot;Nuovo Tenant&quot; per attivare la prima piattaforma.
                    </p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* ── Lead Manager ──────────────────────────────── */}
          <Card className="border-none shadow-2xl bg-card overflow-hidden">
            <CardHeader className="border-b bg-amber-500/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Ultimi Lead (Prospect)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {leads.length > 0 ? (
                 <div className="divide-y divide-border/50">
                    {leads.map((lead) => {
                      const st = LEAD_STATUS_MAP[lead.status] || LEAD_STATUS_MAP.NEW
                      return (
                        <div key={lead.id} className="p-4 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-bold text-sm truncate flex-1">{lead.name}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge className={cn("text-[9px] h-5 rounded-full uppercase px-2", st.color)}>
                                {st.label}
                              </Badge>
                              {/* Bottone dettagli */}
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                            {lead.company || "Privato"} — {lead.email}
                          </p>
                          <div className="flex items-center gap-2">
                            <a href={`mailto:${lead.email}`} className="flex-1">
                              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full w-full">
                                <Mail className="h-3 w-3 mr-1" /> Scrivi
                              </Button>
                            </a>
                            {lead.phone ? (
                              <a href={`tel:${lead.phone}`} className="flex-1">
                                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full w-full">
                                  <Phone className="h-3 w-3 mr-1" /> Chiama
                                </Button>
                              </a>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="h-7 text-[10px] rounded-full flex-1">
                                <Phone className="h-3 w-3 mr-1" /> N/D
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-500/10 mb-3">
                      <Users className="h-5 w-5 text-amber-500/40" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">Coda Lead vuota</p>
                    <p className="text-xs text-muted-foreground mt-1 mx-6">
                      I messaggi dal form di fruttagest.it appariranno qui.
                    </p>
                 </div>
               )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LEAD DETAIL DIALOG (Overlay modale Apple-style)
         ═══════════════════════════════════════════════════════════════════ */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />

          {/* Dialog */}
          <div className="relative bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-black">{selectedLead.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLead.company || "Privato"} — Registrato il {new Date(selectedLead.createdAt).toLocaleDateString("it-IT")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setSelectedLead(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Contatti */}
              <div className="grid grid-cols-2 gap-3">
                <a href={`mailto:${selectedLead.email}`} className="block">
                  <div className="rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors px-4 py-3 text-center group">
                    <Mail className="h-5 w-5 mx-auto mb-1.5 text-primary group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-semibold truncate">{selectedLead.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Invia Email</p>
                  </div>
                </a>
                {selectedLead.phone ? (
                  <a href={`tel:${selectedLead.phone}`} className="block">
                    <div className="rounded-xl bg-muted/50 hover:bg-emerald-500/10 transition-colors px-4 py-3 text-center group">
                      <Phone className="h-5 w-5 mx-auto mb-1.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold">{selectedLead.phone}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Chiama</p>
                    </div>
                  </a>
                ) : (
                  <div className="rounded-xl bg-muted/30 px-4 py-3 text-center opacity-50">
                    <Phone className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-xs font-semibold">N/D</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Telefono mancante</p>
                  </div>
                )}
              </div>

              {/* Messaggio */}
              {selectedLead.message && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Messaggio</p>
                  <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Stato */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Cambia Stato</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(LEAD_STATUS_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      className={cn(
                        "text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all",
                        selectedLead.status === key
                          ? `${val.color} border-transparent shadow-sm`
                          : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                      disabled={statusChanging === selectedLead.id || selectedLead.status === key}
                      onClick={() => handleStatusChange(selectedLead.id, key)}
                    >
                      {statusChanging === selectedLead.id ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer azioni */}
            <div className="flex items-center gap-2 px-6 pb-6 pt-2">
              {/* Elimina */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                disabled={deleting === selectedLead.id}
                onClick={() => handleDeleteLead(selectedLead.id)}
              >
                {deleting === selectedLead.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Elimina Lead
              </Button>

              <div className="flex-1" />

              {/* Converti in Tenant */}
              {selectedLead.status !== "CONVERTED" ? (
                <Button
                  size="sm"
                  className="rounded-full gap-2 shadow-lg shadow-primary/20"
                  disabled={converting}
                  onClick={() => handleConvert(selectedLead.id)}
                >
                  {converting
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creazione Tenant...</>
                    : <><ArrowRightCircle className="h-3.5 w-3.5" /> Converti in Cliente</>}
                </Button>
              ) : (
                <Badge className="text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-4 py-1.5">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  Già Convertito
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

    </PageTransition>
  )
}
