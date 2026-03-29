"use client"

/**
 * Scheda Cliente Tenant — Client Component
 *
 * UI premium (Apple-style) per la gestione completa di un cliente SaaS.
 * Versione 2: fix inizio servizio editabile, contatti editabili, KPI scadenza reale.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Check, X, Clock, CreditCard,
  Mail, Phone, Users, Shield, Loader2,
  CalendarDays, Banknote, FileText, ExternalLink, UserPlus,
  AlertTriangle, Edit3, Save, BellRing,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  saveSubscriptionDetails,
  createInviteLink,
  toggleOrganizationStatus,
} from "@/lib/actions-master"
import { toast } from "sonner"

// ─── Costanti ────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  BASIC: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PRO: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  ENTERPRISE: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operatore",
  VIEWER: "Viewer",
  CUSTOMER: "Cliente",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) return "—"
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
}

function daysUntilExpiry(expiresAt: string | Date | null | undefined): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Field helper per non ripetere codice ────────────────────────────────────

function FieldRow({
  label, value, editMode, inputType = "text", inputValue, placeholder, onChange, mono = false, icon,
}: {
  label: string; value: string; editMode: boolean; inputType?: string
  inputValue: string; placeholder?: string; onChange: (v: string) => void
  mono?: boolean; icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
        {icon} {label}
      </p>
      {editMode ? (
        <input
          type={inputType}
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
            mono && "font-mono"
          )}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <p className={cn("text-sm font-medium", mono && "font-mono")}>{value || "—"}</p>
      )}
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface OrgDetailClientProps {
  org: any
  tenantUsers: any[]
}

// ─── Componente Principale ───────────────────────────────────────────────────

export function OrgDetailClient({ org, tenantUsers }: OrgDetailClientProps) {
  const router = useRouter()
  const sub = org.subscription

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const [form, setForm] = useState({
    plan: sub?.plan || "BASIC",
    status: sub?.status || "active",
    subscriptionFee: sub?.subscriptionFee?.toString() || "",
    billingEmail: sub?.billingEmail || org.contactEmail || "",
    billingIban: sub?.billingIban || "",
    startsAt: toInputDate(sub?.startsAt),
    expiresAt: toInputDate(sub?.expiresAt),
    notes: sub?.notes || "",
    contactEmail: org.contactEmail || "",
    contactPhone: org.contactPhone || "",
  })

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSubscriptionDetails(org.id, {
        ...form,
        subscriptionFee: form.subscriptionFee ? parseFloat(form.subscriptionFee) : undefined,
      })
      toast.success("Scheda cliente aggiornata con successo")
      setEditMode(false)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    const emailToUse = form.billingEmail || form.contactEmail
    if (!emailToUse) {
      toast.error("Inserisci un'email di contatto prima di generare l'invito")
      return
    }
    setInviting(true)
    try {
      const result = await createInviteLink(org.id, emailToUse, org.name)
      if (result.success) {
        await navigator.clipboard.writeText(result.magicLink)
        toast.success("Link di invito copiato negli appunti!", {
          description: `Scade il ${new Date(result.expiresAt).toLocaleDateString("it-IT")}. Invialo al cliente.`,
        })
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setInviting(false)
    }
  }

  const handleToggleStatus = async () => {
    setToggling(true)
    try {
      await toggleOrganizationStatus(org.id, !org.isActive)
      toast.success(org.isActive ? "Tenant sospeso" : "Tenant riattivato")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setToggling(false)
    }
  }

  const daysLeft = daysUntilExpiry(sub?.expiresAt)
  const expired = daysLeft !== null && daysLeft < 0
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 60

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">

      {/* ── Back + Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link href="/saas-crm">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            CRM
          </Button>
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-xl text-primary shrink-0">
              {org.logoUrl
                ? <img src={org.logoUrl} className="h-full w-full object-cover rounded-2xl" alt="" />
                : org.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono font-bold text-muted-foreground uppercase">
                  {org.slug}
                </span>
                <Badge className={cn(
                  "text-[10px] rounded-full",
                  org.isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                )}>
                  {org.isActive
                    ? <><Check className="h-3 w-3 mr-1" />Attivo</>
                    : <><X className="h-3 w-3 mr-1" />Sospeso</>}
                </Badge>
                {sub?.plan && (
                  <Badge className={cn("text-[10px] rounded-full", PLAN_COLORS[sub.plan] || PLAN_COLORS.BASIC)}>
                    {PLAN_LABELS[sub.plan] || sub.plan}
                  </Badge>
                )}
                {expiringSoon && (
                  <Badge className="text-[10px] rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <BellRing className="h-3 w-3 mr-1" />
                    {daysLeft === 0 ? "Scade oggi!" : `Scade in ${daysLeft}gg`}
                  </Badge>
                )}
                {expired && (
                  <Badge className="text-[10px] rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />Scaduto
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Azioni rapide */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-full gap-2"
            onClick={handleInvite} disabled={inviting}>
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Invita Admin
          </Button>
          <Button
            variant="outline" size="sm"
            className={cn("rounded-full gap-2",
              org.isActive
                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            )}
            onClick={handleToggleStatus} disabled={toggling}>
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : org.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {org.isActive ? "Sospendi" : "Riattiva"}
          </Button>
          <a href={`https://${org.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'fruttagest.it'}`}
            target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="rounded-full gap-2 shadow-lg shadow-primary/20">
              <ExternalLink className="h-4 w-4" />
              Apri Tenant
            </Button>
          </a>
        </div>
      </div>

      {/* ── Banner scadenza critica ─────────────────── */}
      {(expired || expiringSoon) && (
        <div className={cn(
          "rounded-2xl border px-5 py-4 flex items-center gap-4",
          expired
            ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
        )}>
          <AlertTriangle className={cn("h-5 w-5 shrink-0", expired ? "text-red-500" : "text-amber-500")} />
          <p className={cn("text-sm font-semibold", expired ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300")}>
            {expired
              ? `L'abbonamento è scaduto il ${formatDate(sub?.expiresAt)}. Rinnova per ripristinare il servizio.`
              : `L'abbonamento scade il ${formatDate(sub?.expiresAt)} (tra ${daysLeft} giorni). Ricorda di rinnovare.`}
          </p>
        </div>
      )}

      {/* ── Griglia principale ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Card Abbonamento & Fatturazione */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-card">
          <CardHeader className="flex-row items-center justify-between border-b bg-muted/20 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Abbonamento & Fatturazione
            </CardTitle>
            <Button variant="ghost" size="sm" className="rounded-full gap-2 h-8"
              onClick={() => editMode ? handleSave() : setEditMode(true)} disabled={saving}>
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : editMode ? <Save className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
              {editMode ? (saving ? "Salvataggio..." : "Salva") : "Modifica"}
            </Button>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">

            {/* Piano + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Piano</p>
                {editMode ? (
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.plan} onChange={(e) => set("plan")(e.target.value)}>
                    {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                ) : (
                  <Badge className={cn("text-xs rounded-lg px-3 py-1", PLAN_COLORS[sub?.plan] || PLAN_COLORS.BASIC)}>
                    {PLAN_LABELS[sub?.plan] || sub?.plan || "—"}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Stato</p>
                {editMode ? (
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.status} onChange={(e) => set("status")(e.target.value)}>
                    <option value="active">Attivo</option>
                    <option value="suspended">Sospeso</option>
                    <option value="trial">Trial</option>
                    <option value="cancelled">Cancellato</option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold capitalize">{sub?.status || "—"}</p>
                )}
              </div>
            </div>

            {/* Canone */}
            <FieldRow
              label="Canone Mensile (€)"
              value={formatCurrency(sub?.subscriptionFee)}
              editMode={editMode}
              inputType="number"
              inputValue={form.subscriptionFee}
              placeholder="es. 49.90"
              onChange={set("subscriptionFee")}
              icon={<Banknote className="h-3.5 w-3.5" />}
            />

            {/* Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Inizio Servizio
                </p>
                {editMode ? (
                  <input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.startsAt} onChange={(e) => set("startsAt")(e.target.value)} />
                ) : (
                  <p className="text-sm font-semibold">{formatDate(sub?.startsAt)}</p>
                )}
              </div>
              <div>
                <p className={cn("text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1",
                  expired ? "text-red-500" : expiringSoon ? "text-amber-500" : "")}>
                  <Clock className="h-3.5 w-3.5" /> Scadenza
                </p>
                {editMode ? (
                  <input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.expiresAt} onChange={(e) => set("expiresAt")(e.target.value)} />
                ) : (
                  <p className={cn("text-sm font-semibold",
                    expired ? "text-red-500" : expiringSoon ? "text-amber-500" : "")}>
                    {formatDate(sub?.expiresAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Dati fatturazione */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Dati Fatturazione</p>
              <div className="space-y-3">
                <FieldRow
                  label="Email Fatturazione"
                  value={sub?.billingEmail || org.contactEmail}
                  editMode={editMode}
                  inputType="email"
                  inputValue={form.billingEmail}
                  placeholder="billing@azienda.it"
                  onChange={set("billingEmail")}
                  icon={<Mail className="h-3.5 w-3.5" />}
                />
                <FieldRow
                  label="IBAN"
                  value={sub?.billingIban}
                  editMode={editMode}
                  inputValue={form.billingIban}
                  placeholder="IT60 X054 2811 1010 0000 0123 456"
                  onChange={set("billingIban")}
                  mono
                  icon={<Banknote className="h-3.5 w-3.5" />}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Colonna destra */}
        <div className="space-y-5">

          {/* Card Contatti — EDITABILE */}
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/20 pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Contatti
              </CardTitle>
              {editMode && (
                <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">In modifica</span>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <FieldRow
                label="Email Contatto"
                value={org.contactEmail}
                editMode={editMode}
                inputType="email"
                inputValue={form.contactEmail}
                placeholder="titolare@azienda.it"
                onChange={set("contactEmail")}
                icon={<Mail className="h-3.5 w-3.5" />}
              />
              <FieldRow
                label="Telefono"
                value={org.contactPhone}
                editMode={editMode}
                inputType="tel"
                inputValue={form.contactPhone}
                placeholder="+39 333 1234567"
                onChange={set("contactPhone")}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data Setup</p>
                <p className="text-sm font-medium">{formatDate(org.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card Note Interne */}
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                Note Interne
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {editMode ? (
                <textarea
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none min-h-[120px]"
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="Note private sul cliente (non visibili al tenant)..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {sub?.notes || <span className="italic text-muted-foreground/50">Nessuna nota.</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card Info Scadenza */}
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BellRing className="h-4 w-4 text-blue-500" />
                Info Rinnovo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Il sistema segnala automaticamente i rinnovi nel KPI <strong>"Rinnovi a breve"</strong> del CRM
                quando mancano meno di 60 giorni alla scadenza.
              </p>
              {daysLeft !== null && daysLeft > 0 && (
                <div className="rounded-xl bg-muted/50 px-3 py-2 text-center">
                  <p className="text-2xl font-black text-primary">{daysLeft}</p>
                  <p className="text-xs text-muted-foreground">giorni rimanenti</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Utenti del Tenant ─────────────────────── */}
      <Card className="border-none shadow-xl bg-card">
        <CardHeader className="flex-row items-center justify-between border-b bg-muted/20 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Utenti del Tenant
          </CardTitle>
          <Badge variant="outline" className="rounded-full">{tenantUsers.length} utenti</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {tenantUsers.length > 0 ? (
            <div className="divide-y divide-border/50">
              {tenantUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{user.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "text-[10px] rounded-full",
                      user.role === "ADMIN"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                    <Badge className={cn(
                      "text-[10px] rounded-full",
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {user.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Mai connesso"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Nessun utente trovato</p>
              <p className="text-xs text-muted-foreground mt-1">
                Usa &quot;Invita Admin&quot; per configurare il primo accesso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
