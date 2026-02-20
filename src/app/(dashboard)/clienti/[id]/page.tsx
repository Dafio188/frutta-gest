/**
 * Pagina Dettaglio Cliente
 *
 * Card con dati anagrafici, contatti, informazioni di consegna.
 * Tabs: Generale, Ordini, Fatture.
 * Modalita modifica con toggle e eliminazione con conferma.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, CreditCard,
  Truck, Pencil, Trash2, Save, X, ShoppingCart, FileText,
  User, Globe, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { DataTable, type Column } from "@/components/ui/data-table"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import {
  CUSTOMER_TYPE_LABELS, PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getCustomer, updateCustomer, deleteCustomer, createCustomerPortalUser, toggleCustomerPortalAccess } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CustomerData {
  id: string
  companyName: string
  type: string
  vatNumber: string | null
  fiscalCode: string | null
  sdiCode: string | null
  pecEmail: string | null
  address: string
  city: string
  province: string
  postalCode: string
  phone: string | null
  email: string | null
  deliveryZone: string | null
  preferredDeliveryTime: string | null
  deliveryNotes: string | null
  paymentMethod: string
  paymentTermsDays: number
  creditLimit: number | null
  notes: string | null
  isActive: boolean
  createdAt: string
  contacts: { id: string; firstName: string; lastName: string; role: string | null; phone: string | null; email: string | null; isPrimary: boolean }[]
  orders: { id: string; orderNumber: string; status: string; channel: string; total: number; orderDate: string }[]
  invoices: { id: string; invoiceNumber: string; status: string; total: number; issueDate: string; dueDate: string }[]
  portalUser?: { id: string; email: string; isActive: boolean; lastLoginAt: string | null } | null
}

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [portalOpen, setPortalOpen] = useState(false)
  const [portalEmail, setPortalEmail] = useState("")
  const [portalPassword, setPortalPassword] = useState("")
  const [creatingPortal, setCreatingPortal] = useState(false)
  const [togglingPortal, setTogglingPortal] = useState(false)

  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCustomer(customerId)
      setCustomer(data as unknown as CustomerData)
    } catch (err) {
      console.error("Errore caricamento cliente:", err)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    loadCustomer()
  }, [loadCustomer])

  const startEditing = () => {
    if (!customer) return
    setEditForm({
      companyName: customer.companyName,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
      deliveryZone: customer.deliveryZone || "",
      preferredDeliveryTime: customer.preferredDeliveryTime || "",
      deliveryNotes: customer.deliveryNotes || "",
      notes: customer.notes || "",
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!customer) return
    setSaving(true)
    try {
      await updateCustomer(customer.id, {
        companyName: editForm.companyName,
        type: customer.type,
        address: editForm.address,
        city: editForm.city,
        province: editForm.province,
        postalCode: editForm.postalCode,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        deliveryZone: editForm.deliveryZone || undefined,
        preferredDeliveryTime: editForm.preferredDeliveryTime || undefined,
        deliveryNotes: editForm.deliveryNotes || undefined,
        notes: editForm.notes || undefined,
      })
      setEditing(false)
      addToast({ type: "success", title: "Cliente aggiornato", description: "Le modifiche sono state salvate." })
      loadCustomer()
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile salvare le modifiche." })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!customer) return
    setDeleting(true)
    try {
      await deleteCustomer(customer.id)
      router.push("/clienti")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile eliminare il cliente. Potrebbe avere ordini o fatture collegati." })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Building2 className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Cliente non trovato</h2>
          <Link href="/clienti"><Button variant="outline"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} />Torna ai clienti</Button></Link>
        </div>
      </PageTransition>
    )
  }

  const orderColumns: Column<CustomerData["orders"][0]>[] = [
    { key: "orderNumber", header: "Numero", render: (item) => <span className="font-medium text-sm">{item.orderNumber}</span> },
    { key: "status", header: "Stato", render: (item) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[item.status] || ""}`}>{ORDER_STATUS_LABELS[item.status] || item.status}</span> },
    { key: "total", header: "Totale", render: (item) => <span className="font-medium text-sm">{formatCurrency(item.total)}</span> },
    { key: "orderDate", header: "Data", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(item.orderDate)}</span> },
  ]

  const invoiceColumns: Column<CustomerData["invoices"][0]>[] = [
    { key: "invoiceNumber", header: "Numero", render: (item) => <span className="font-medium text-sm">{item.invoiceNumber}</span> },
    { key: "status", header: "Stato", render: (item) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_COLORS[item.status] || ""}`}>{INVOICE_STATUS_LABELS[item.status] || item.status}</span> },
    { key: "total", header: "Totale", render: (item) => <span className="font-medium text-sm">{formatCurrency(item.total)}</span> },
    { key: "issueDate", header: "Emissione", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(item.issueDate)}</span> },
    { key: "dueDate", header: "Scadenza", render: (item) => <span className="text-sm text-muted-foreground">{formatDate(item.dueDate)}</span> },
  ]

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/clienti" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{customer.companyName}</h1>
                <Badge variant={customer.type === "RISTORANTE" ? "default" : "secondary"}>
                  {CUSTOMER_TYPE_LABELS[customer.type] || customer.type}
                </Badge>
                {customer.isActive && <Badge variant="success">Attivo</Badge>}
              </div>
              <p className="text-muted-foreground">Cliente dal {formatDate(customer.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" strokeWidth={1.75} />Annulla
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  <Save className="h-4 w-4" strokeWidth={1.75} />Salva
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />Modifica
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />Elimina
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="generale">
          <TabsList>
            <TabsTrigger value="generale">Generale</TabsTrigger>
            <TabsTrigger value="ordini">Ordini ({customer.orders?.length || 0})</TabsTrigger>
            <TabsTrigger value="fatture">Fatture ({customer.invoices?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="generale">
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              <StaggerItem className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />Dati Aziendali</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {editing && (
                        <div className="sm:col-span-2">
                          <Input label="Ragione Sociale" value={editForm.companyName || ""} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
                        </div>
                      )}
                      <InfoItem label="P.IVA" value={customer.vatNumber} />
                      <InfoItem label="Codice Fiscale" value={customer.fiscalCode} />
                      <InfoItem label="Codice SDI" value={customer.sdiCode} />
                      <InfoItem label="PEC" value={customer.pecEmail} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-5 w-5 text-primary" strokeWidth={1.75} />Indirizzo</CardTitle></CardHeader>
                  <CardContent>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2"><Input label="Indirizzo" value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
                        <Input label="Citta" value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Provincia" value={editForm.province || ""} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} maxLength={2} />
                          <Input label="CAP" value={editForm.postalCode || ""} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} maxLength={5} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p>{customer.address}</p>
                        <p>{customer.postalCode} {customer.city} ({customer.province})</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-5 w-5 text-primary" strokeWidth={1.75} />Consegna</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoItem label="Zona" value={customer.deliveryZone} />
                      <InfoItem label="Orario Preferito" value={customer.preferredDeliveryTime} />
                      {customer.deliveryNotes && (
                        <div className="sm:col-span-2"><InfoItem label="Note" value={customer.deliveryNotes} /></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-5 w-5 text-primary" strokeWidth={1.75} />Contatti</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <ContactRow icon={Phone} label="Telefono" value={customer.phone} />
                      <ContactRow icon={Mail} label="Email" value={customer.email} />
                      <ContactRow icon={Globe} label="PEC" value={customer.pecEmail} />
                    </div>
                    {customer.contacts?.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Persone di Contatto</p>
                          {customer.contacts.map((contact) => (
                            <div key={contact.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {contact.firstName[0]}{contact.lastName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {contact.firstName} {contact.lastName}
                                  {contact.isPrimary && <Badge variant="info" className="ml-2 text-[10px]">Principale</Badge>}
                                </p>
                                {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                                {contact.phone && <p className="text-xs text-muted-foreground mt-0.5">{contact.phone}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-5 w-5 text-primary" strokeWidth={1.75} />Pagamento</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <InfoItem label="Metodo" value={PAYMENT_METHOD_LABELS[customer.paymentMethod] || customer.paymentMethod} />
                    <InfoItem label="Termini" value={`${customer.paymentTermsDays} giorni`} />
                    <InfoItem label="Limite Credito" value={customer.creditLimit ? formatCurrency(customer.creditLimit) : "Nessun limite"} />
                  </CardContent>
                </Card>

                {/* Portale Cliente */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />Portale Cliente</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {customer.portalUser ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant={customer.portalUser.isActive ? "success" : "destructive"}>
                            {customer.portalUser.isActive ? "Attivo" : "Disattivato"}
                          </Badge>
                        </div>
                        <InfoItem label="Email Accesso" value={customer.portalUser.email} />
                        <InfoItem label="Ultimo Accesso" value={customer.portalUser.lastLoginAt ? formatDate(customer.portalUser.lastLoginAt) : "Mai"} />
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          loading={togglingPortal}
                          onClick={async () => {
                            setTogglingPortal(true)
                            try {
                              await toggleCustomerPortalAccess(customer.id, !customer.portalUser!.isActive)
                              addToast({ type: "success", title: customer.portalUser!.isActive ? "Accesso disattivato" : "Accesso riattivato" })
                              loadCustomer()
                            } catch (err: any) {
                              addToast({ type: "error", title: "Errore", description: err.message })
                            } finally {
                              setTogglingPortal(false)
                            }
                          }}
                        >
                          {customer.portalUser.isActive ? "Disattiva Accesso" : "Riattiva Accesso"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Questo cliente non ha ancora accesso al portale.
                        </p>
                        <Button
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => {
                            setPortalEmail(customer.email || "")
                            setPortalPassword("")
                            setPortalOpen(true)
                          }}
                        >
                          <Globe className="h-4 w-4" strokeWidth={1.75} />
                          Attiva Portale Cliente
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {customer.notes && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p></CardContent>
                  </Card>
                )}
              </StaggerItem>
            </StaggerContainer>
          </TabsContent>

          <TabsContent value="ordini">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }} className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <DataTable columns={orderColumns} data={customer.orders || []} total={customer.orders?.length || 0} emptyIcon={ShoppingCart} emptyTitle="Nessun ordine" emptyDescription="Questo cliente non ha ancora effettuato ordini." onRowClick={(item) => router.push(`/ordini/${item.id}`)} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="fatture">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }} className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <DataTable columns={invoiceColumns} data={customer.invoices || []} total={customer.invoices?.length || 0} emptyIcon={FileText} emptyTitle="Nessuna fattura" emptyDescription="Non ci sono fatture per questo cliente." onRowClick={(item) => router.push(`/fatture/${item.id}`)} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Dialog Crea Accesso Portale */}
        <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attiva Portale Cliente</DialogTitle>
              <DialogDescription>
                Crea le credenziali di accesso al portale per <strong>{customer.companyName}</strong>.
                Il cliente potrà inserire ordini e visualizzare fatture.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                label="Email di accesso"
                type="email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="email@esempio.it"
              />
              <Input
                label="Password"
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPortalOpen(false)}>Annulla</Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                loading={creatingPortal}
                onClick={async () => {
                  if (!portalEmail || portalPassword.length < 6) {
                    addToast({ type: "error", title: "Errore", description: "Inserisci email e password (minimo 6 caratteri)." })
                    return
                  }
                  setCreatingPortal(true)
                  try {
                    await createCustomerPortalUser(customer.id, portalEmail, portalPassword)
                    addToast({ type: "success", title: "Portale Attivato", description: `Accesso creato per ${portalEmail}` })
                    setPortalOpen(false)
                    loadCustomer()
                  } catch (err: any) {
                    addToast({ type: "error", title: "Errore", description: err.message })
                  } finally {
                    setCreatingPortal(false)
                  }
                }}
              >
                <Globe className="h-4 w-4" strokeWidth={1.75} />
                Crea Accesso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminare il cliente?</DialogTitle>
              <DialogDescription>
                Stai per eliminare <strong>{customer.companyName}</strong>. Questa azione non puo essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annulla</Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleting}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />Elimina Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value || "--"}</p>
    </div>
  )
}

function ContactRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}
