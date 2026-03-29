/**
 * SaaS CRM Client Component — Interfaccia interattiva SuperAdmin
 *
 * Gestisce la visualizzazione dei dati reali, le animazioni e le azioni
 * commerciali (modifica status lead, apertura schede cliente).
 */

"use client"

import { useState } from "react"
import { Shield, Sparkles, Users, TrendingUp, Clock, CreditCard, ChevronRight, Mail, Phone, ExternalLink, UserPlus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createInviteLink } from "@/lib/actions-master"
import { toast } from "sonner"

interface SaasCrmClientProps {
  initialSummary: any
  initialLeads: any[]
  initialOrganizations: any[]
}

export function SaasCrmClient({ initialSummary, initialLeads, initialOrganizations }: SaasCrmClientProps) {
  const [leads] = useState(initialLeads)
  const [organizations] = useState(initialOrganizations)
  const [summary] = useState(initialSummary)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const handleCreateInvite = async (orgId: string, email: string, name: string) => {
    setIsGenerating(orgId)
    try {
      const result = await createInviteLink(orgId, email, name)
      if (result.success) {
        // Copia negli appunti
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
            <Button className="rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-2" />
              Nuovo Tenant
            </Button>
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
                           {/* Bottone d'Invito */}
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
                      Usa "Nuovo Tenant" per attivare la prima piattaforma.
                    </p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Lead Manager */}
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
                    {leads.map((lead) => (
                      <div key={lead.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm">{lead.name}</p>
                          <Badge className="text-[9px] h-4 uppercase">NEW</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{lead.company || 'Privato'}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full flex-1">
                             <Mail className="h-3 w-3 mr-1" /> Scrivi
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full flex-1">
                             <Phone className="h-3 w-3 mr-1" /> Chiama
                          </Button>
                        </div>
                      </div>
                    ))}
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
    </PageTransition>
  )
}
