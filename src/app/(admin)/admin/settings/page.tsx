/**
 * Impostazioni Admin — Pagina configurazione sistema
 *
 * Gestisce le impostazioni globali dell'applicazione FruttaGest:
 * generali, autenticazione/sicurezza, email e manutenzione.
 * Accessibile solo agli amministratori.
 */

"use client"

import { useState } from "react"
import {
  Settings,
  Building2,
  Shield,
  Mail,
  Globe,
  Database,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Calculator,
} from "lucide-react"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { backfillInvoiceItemCosts } from "@/lib/actions"

// Mock default settings
const DEFAULT_GENERAL = {
  appName: "FruttaGest",
  description: "Gestionale per grossisti di frutta e verdura",
  logoUrl: "https://fruttagest.it/logo.png",
  timezone: "Europe/Rome",
}

const DEFAULT_AUTH = {
  publicRegistration: true,
  googleLogin: true,
  githubLogin: false,
  emailVerification: true,
  maxLoginAttempts: 5,
  sessionDurationDays: 30,
}

const DEFAULT_EMAIL = {
  senderEmail: "noreply@fruttagest.it",
  welcomeTemplate: "Benvenuto in FruttaGest! Il tuo account e stato creato con successo. Accedi alla piattaforma per iniziare a gestire i tuoi ordini di frutta e verdura.",
  smtpHost: "smtp.resend.com",
}

const DEFAULT_MAINTENANCE = {
  maintenanceMode: false,
  maintenanceMessage: "Il sistema e attualmente in manutenzione. Torneremo operativi a breve. Ci scusiamo per il disagio.",
  ipWhitelist: "192.168.1.1, 10.0.0.1",
}

const TIMEZONE_OPTIONS = [
  "Europe/Rome",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
]

export default function AdminSettingsPage() {
  // Section states
  const [general, setGeneral] = useState(DEFAULT_GENERAL)
  const [auth, setAuth] = useState(DEFAULT_AUTH)
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [maintenance, setMaintenance] = useState(DEFAULT_MAINTENANCE)

  // Loading states for each section
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingAuth, setSavingAuth] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [backfillResult, setBackfillResult] = useState<{ updated: number; total?: number } | null>(null)

  const handleSave = async (
    section: string,
    setSaving: (v: boolean) => void
  ) => {
    setSaving(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Impostazioni Applicazione
            </h1>
            <p className="text-muted-foreground">
              Configurazione globale del sistema FruttaGest
            </p>
          </div>
          <Badge variant="info" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
            Admin
          </Badge>
        </div>

        <StaggerContainer className="space-y-6">
          {/* === SEZIONE 1: Impostazioni Generali === */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Impostazioni Generali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome Applicazione"
                    value={general.appName}
                    onChange={(e) =>
                      setGeneral({ ...general, appName: e.target.value })
                    }
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Fuso Orario
                    </label>
                    <select
                      value={general.timezone}
                      onChange={(e) =>
                        setGeneral({ ...general, timezone: e.target.value })
                      }
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Descrizione"
                      value={general.description}
                      onChange={(e) =>
                        setGeneral({ ...general, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="URL Logo Aziendale"
                      icon={Globe}
                      value={general.logoUrl}
                      onChange={(e) =>
                        setGeneral({ ...general, logoUrl: e.target.value })
                      }
                      helperText="Inserisci l'URL completo dell'immagine del logo"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => handleSave("general", setSavingGeneral)}
                    loading={savingGeneral}
                  >
                    <Save className="h-4 w-4" strokeWidth={1.75} />
                    Salva Modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* === SEZIONE 2: Autenticazione e Sicurezza === */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Autenticazione e Sicurezza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Toggle switches */}
                  <div className="space-y-5">
                    <SettingToggle
                      label="Registrazione pubblica abilitata"
                      description="Consenti ai nuovi utenti di registrarsi autonomamente"
                      checked={auth.publicRegistration}
                      onCheckedChange={(c) =>
                        setAuth({ ...auth, publicRegistration: c })
                      }
                    />
                    <SettingToggle
                      label="Login Google abilitato"
                      description="Permetti l'accesso tramite account Google"
                      checked={auth.googleLogin}
                      onCheckedChange={(c) =>
                        setAuth({ ...auth, googleLogin: c })
                      }
                    />
                    <SettingToggle
                      label="Login GitHub abilitato"
                      description="Permetti l'accesso tramite account GitHub"
                      checked={auth.githubLogin}
                      onCheckedChange={(c) =>
                        setAuth({ ...auth, githubLogin: c })
                      }
                    />
                    <SettingToggle
                      label="Verifica email obbligatoria"
                      description="Richiedi la verifica dell'indirizzo email alla registrazione"
                      checked={auth.emailVerification}
                      onCheckedChange={(c) =>
                        setAuth({ ...auth, emailVerification: c })
                      }
                    />
                  </div>

                  {/* Numeric inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Max tentativi login"
                      type="number"
                      value={auth.maxLoginAttempts.toString()}
                      onChange={(e) =>
                        setAuth({
                          ...auth,
                          maxLoginAttempts: parseInt(e.target.value) || 0,
                        })
                      }
                      helperText="Numero massimo di tentativi prima del blocco account"
                    />
                    <Input
                      label="Durata sessione (giorni)"
                      type="number"
                      value={auth.sessionDurationDays.toString()}
                      onChange={(e) =>
                        setAuth({
                          ...auth,
                          sessionDurationDays: parseInt(e.target.value) || 0,
                        })
                      }
                      helperText="Giorni di validita della sessione utente"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => handleSave("auth", setSavingAuth)}
                    loading={savingAuth}
                  >
                    <Save className="h-4 w-4" strokeWidth={1.75} />
                    Salva Modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* === SEZIONE 3: Email === */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mittente Email"
                      icon={Mail}
                      type="email"
                      value={email.senderEmail}
                      onChange={(e) =>
                        setEmail({ ...email, senderEmail: e.target.value })
                      }
                      helperText="Indirizzo email usato come mittente"
                    />
                    <Input
                      label="Host SMTP"
                      icon={Database}
                      value={email.smtpHost}
                      onChange={(e) =>
                        setEmail({ ...email, smtpHost: e.target.value })
                      }
                      helperText="Server SMTP per l'invio delle email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Template Email di Benvenuto
                    </label>
                    <textarea
                      value={email.welcomeTemplate}
                      onChange={(e) =>
                        setEmail({ ...email, welcomeTemplate: e.target.value })
                      }
                      rows={4}
                      className="flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Testo inviato ai nuovi utenti dopo la registrazione
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => handleSave("email", setSavingEmail)}
                    loading={savingEmail}
                  >
                    <Save className="h-4 w-4" strokeWidth={1.75} />
                    Salva Modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* === SEZIONE 4: Manutenzione === */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Manutenzione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <SettingToggle
                    label="Modalita manutenzione"
                    description="Attiva la modalita manutenzione per bloccare l'accesso agli utenti"
                    checked={maintenance.maintenanceMode}
                    onCheckedChange={(c) =>
                      setMaintenance({ ...maintenance, maintenanceMode: c })
                    }
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Messaggio di Manutenzione
                    </label>
                    <textarea
                      value={maintenance.maintenanceMessage}
                      onChange={(e) =>
                        setMaintenance({
                          ...maintenance,
                          maintenanceMessage: e.target.value,
                        })
                      }
                      rows={3}
                      className="flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Messaggio visualizzato agli utenti durante la manutenzione
                    </p>
                  </div>

                  <Input
                    label="IP Whitelist"
                    value={maintenance.ipWhitelist}
                    onChange={(e) =>
                      setMaintenance({
                        ...maintenance,
                        ipWhitelist: e.target.value,
                      })
                    }
                    helperText="Indirizzi IP separati da virgola che possono accedere durante la manutenzione"
                  />
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() =>
                      handleSave("maintenance", setSavingMaintenance)
                    }
                    loading={savingMaintenance}
                  >
                    <Save className="h-4 w-4" strokeWidth={1.75} />
                    Salva Modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* === SEZIONE 5: Operazioni Dati === */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  Operazioni Dati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Backfill costi fatture</p>
                      <p className="text-sm text-muted-foreground">
                        Aggiorna le righe fattura esistenti con il costo di acquisto e il fornitore di provenienza,
                        calcolati dagli ordini fornitore ricevuti e dai listini fornitori.
                      </p>
                      {backfillResult && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
                          <span className="text-emerald-600 font-medium">
                            {backfillResult.updated} righe aggiornate su {backfillResult.total} totali
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setBackfillLoading(true)
                        setBackfillResult(null)
                        try {
                          const result = await backfillInvoiceItemCosts()
                          setBackfillResult(result)
                        } catch (err) {
                          console.error("Backfill error:", err)
                        } finally {
                          setBackfillLoading(false)
                        }
                      }}
                      disabled={backfillLoading}
                    >
                      {backfillLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                      )}
                      {backfillLoading ? "In corso..." : "Esegui"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}

/**
 * Riga di impostazione con toggle Switch
 */
function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
