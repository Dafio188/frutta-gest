/**
 * Pagina Impostazioni
 *
 * Tabs: Azienda, Profilo, Notifiche, Aspetto.
 * Salvataggio con loading state e toast di conferma.
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Building2, User, Bell, Palette, Save, Lock,
  Sun, Moon, Monitor,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { useUIStore } from "@/stores/ui-store"

export default function SettingsPage() {
  const { addToast, sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  // Azienda state
  const [company, setCompany] = useState({
    companyName: "FruttaGest S.r.l.",
    vatNumber: "IT12345678901",
    fiscalCode: "12345678901",
    sdiCode: "ABCDEFG",
    pecEmail: "fruttagest@pec.it",
    address: "Via Roma 123",
    city: "Milano",
    province: "MI",
    postalCode: "20100",
    phone: "+39 02 1234567",
    email: "info@fruttagest.it",
    bankName: "Banca Intesa",
    iban: "IT60X0542811101000000123456",
    bic: "BCITITMM",
  })

  // Profilo state
  const [profile, setProfile] = useState({
    name: "Mario Rossi",
    email: "mario@fruttagest.it",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notifiche state
  const [notifications, setNotifications] = useState({
    newOrders: true,
    aiProcessed: true,
    overdueInvoices: true,
    supplierDeadlines: false,
    weeklyReport: true,
  })

  // Aspetto state
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [compactSidebar, setCompactSidebar] = useState(sidebarCollapsed)

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      addToast({
        type: "success",
        title: "Impostazioni salvate",
        description: "Le modifiche sono state applicate con successo.",
      })
    } catch {
      addToast({
        type: "error",
        title: "Errore",
        description: "Impossibile salvare le impostazioni.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    // In a real app, this would update the document class
  }

  const handleCompactSidebarChange = (checked: boolean) => {
    setCompactSidebar(checked)
    setSidebarCollapsed(checked)
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Impostazioni</h1>
          <p className="text-muted-foreground">Gestisci le impostazioni dell'applicazione</p>
        </div>

        <Tabs defaultValue="azienda">
          <TabsList>
            <TabsTrigger value="azienda" className="gap-1.5">
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
              Azienda
            </TabsTrigger>
            <TabsTrigger value="profilo" className="gap-1.5">
              <User className="h-4 w-4" strokeWidth={1.75} />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="notifiche" className="gap-1.5">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              Notifiche
            </TabsTrigger>
            <TabsTrigger value="aspetto" className="gap-1.5">
              <Palette className="h-4 w-4" strokeWidth={1.75} />
              Aspetto
            </TabsTrigger>
          </TabsList>

          {/* Tab Azienda */}
          <TabsContent value="azienda">
            <StaggerContainer className="space-y-6 mt-4">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      Dati Aziendali
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label="Ragione Sociale"
                          value={company.companyName}
                          onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                        />
                      </div>
                      <Input
                        label="P.IVA"
                        value={company.vatNumber}
                        onChange={(e) => setCompany({ ...company, vatNumber: e.target.value })}
                      />
                      <Input
                        label="Codice Fiscale"
                        value={company.fiscalCode}
                        onChange={(e) => setCompany({ ...company, fiscalCode: e.target.value })}
                      />
                      <Input
                        label="Codice SDI"
                        value={company.sdiCode}
                        onChange={(e) => setCompany({ ...company, sdiCode: e.target.value })}
                      />
                      <Input
                        label="PEC"
                        type="email"
                        value={company.pecEmail}
                        onChange={(e) => setCompany({ ...company, pecEmail: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Indirizzo e Contatti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label="Indirizzo"
                          value={company.address}
                          onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        />
                      </div>
                      <Input
                        label="Citta"
                        value={company.city}
                        onChange={(e) => setCompany({ ...company, city: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Provincia"
                          value={company.province}
                          onChange={(e) => setCompany({ ...company, province: e.target.value })}
                          maxLength={2}
                        />
                        <Input
                          label="CAP"
                          value={company.postalCode}
                          onChange={(e) => setCompany({ ...company, postalCode: e.target.value })}
                          maxLength={5}
                        />
                      </div>
                      <Input
                        label="Telefono"
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Coordinate Bancarie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Banca"
                        value={company.bankName}
                        onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                      />
                      <Input
                        label="BIC/SWIFT"
                        value={company.bic}
                        onChange={(e) => setCompany({ ...company, bic: e.target.value })}
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="IBAN"
                          value={company.iban}
                          onChange={(e) => setCompany({ ...company, iban: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </TabsContent>

          {/* Tab Profilo */}
          <TabsContent value="profilo">
            <StaggerContainer className="space-y-6 mt-4">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      Informazioni Personali
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nome"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      Cambia Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                      <div className="md:col-span-2">
                        <Input
                          label="Password Attuale"
                          type="password"
                          value={profile.currentPassword}
                          onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                        />
                      </div>
                      <Input
                        label="Nuova Password"
                        type="password"
                        value={profile.newPassword}
                        onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                      />
                      <Input
                        label="Conferma Password"
                        type="password"
                        value={profile.confirmPassword}
                        onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </TabsContent>

          {/* Tab Notifiche */}
          <TabsContent value="notifiche">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
              className="mt-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    Preferenze Notifiche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <NotificationRow
                    label="Nuovi ordini"
                    description="Ricevi una notifica quando arriva un nuovo ordine"
                    checked={notifications.newOrders}
                    onCheckedChange={(c) => setNotifications({ ...notifications, newOrders: c })}
                  />
                  <Separator />
                  <NotificationRow
                    label="Ordini elaborati da AI"
                    description="Notifica quando l'AI completa l'elaborazione di un ordine"
                    checked={notifications.aiProcessed}
                    onCheckedChange={(c) => setNotifications({ ...notifications, aiProcessed: c })}
                  />
                  <Separator />
                  <NotificationRow
                    label="Fatture scadute"
                    description="Avviso per fatture con pagamento scaduto"
                    checked={notifications.overdueInvoices}
                    onCheckedChange={(c) => setNotifications({ ...notifications, overdueInvoices: c })}
                  />
                  <Separator />
                  <NotificationRow
                    label="Scadenze fornitori"
                    description="Promemoria per pagamenti ai fornitori in scadenza"
                    checked={notifications.supplierDeadlines}
                    onCheckedChange={(c) => setNotifications({ ...notifications, supplierDeadlines: c })}
                  />
                  <Separator />
                  <NotificationRow
                    label="Report settimanale"
                    description="Ricevi un riepilogo settimanale delle vendite via email"
                    checked={notifications.weeklyReport}
                    onCheckedChange={(c) => setNotifications({ ...notifications, weeklyReport: c })}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tab Aspetto */}
          <TabsContent value="aspetto">
            <StaggerContainer className="space-y-6 mt-4">
              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="h-5 w-5 text-primary" strokeWidth={1.75} />
                      Tema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                      <ThemeOption
                        icon={Sun}
                        label="Chiaro"
                        active={theme === "light"}
                        onClick={() => handleThemeChange("light")}
                      />
                      <ThemeOption
                        icon={Moon}
                        label="Scuro"
                        active={theme === "dark"}
                        onClick={() => handleThemeChange("dark")}
                      />
                      <ThemeOption
                        icon={Monitor}
                        label="Sistema"
                        active={theme === "system"}
                        onClick={() => handleThemeChange("system")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Layout</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Sidebar compatta</p>
                        <p className="text-sm text-muted-foreground">
                          Riduci la sidebar mostrando solo le icone
                        </p>
                      </div>
                      <Switch
                        checked={compactSidebar}
                        onCheckedChange={handleCompactSidebarChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </StaggerContainer>
          </TabsContent>
        </Tabs>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex justify-end pt-2"
        >
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" strokeWidth={1.75} />
            Salva Impostazioni
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function NotificationRow({
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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
