/**
 * Pagina Dettaglio Fornitore
 *
 * Card con informazioni aziendali, contatti, condizioni di pagamento.
 * Modalita modifica con toggle, eliminazione con conferma dialog.
 */

"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Factory, MapPin, Phone, Mail, CreditCard,
  Pencil, Trash2, Save, X, Package, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { PAYMENT_METHOD_LABELS, PRODUCT_UNIT_LABELS } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getSupplier, updateSupplier, deleteSupplier } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface SupplierData {
  id: string
  companyName: string
  vatNumber: string | null
  fiscalCode: string | null
  address: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  phone: string | null
  email: string | null
  paymentMethod: string
  paymentTermsDays: number
  notes: string | null
  isActive: boolean
  createdAt: string
  contacts: { id: string; firstName: string; lastName: string; role: string | null; phone: string | null; email: string | null; isPrimary: boolean }[]
  supplierProducts: { id: string; price: number; isPreferred: boolean; product: { id: string; name: string; unit: string; category: { name: string } | null } }[]
}

export default function FornitoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: supplierId } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()

  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const loadSupplier = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSupplier(supplierId)
      setSupplier(data as unknown as SupplierData)
    } catch (err) {
      console.error("Errore caricamento fornitore:", err)
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    loadSupplier()
  }, [loadSupplier])

  const startEditing = () => {
    if (!supplier) return
    setEditForm({
      companyName: supplier.companyName,
      vatNumber: supplier.vatNumber || "",
      fiscalCode: supplier.fiscalCode || "",
      address: supplier.address || "",
      city: supplier.city || "",
      province: supplier.province || "",
      postalCode: supplier.postalCode || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      notes: supplier.notes || "",
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!supplier) return
    setSaving(true)
    try {
      await updateSupplier(supplier.id, {
        companyName: editForm.companyName,
        address: editForm.address || undefined,
        city: editForm.city || undefined,
        province: editForm.province || undefined,
        postalCode: editForm.postalCode || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        vatNumber: editForm.vatNumber || undefined,
        fiscalCode: editForm.fiscalCode || undefined,
        notes: editForm.notes || undefined,
      })
      setEditing(false)
      addToast({ type: "success", title: "Fornitore aggiornato", description: "Le modifiche sono state salvate." })
      loadSupplier()
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile salvare le modifiche." })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!supplier) return
    setDeleting(true)
    try {
      await deleteSupplier(supplier.id)
      router.push("/fornitori")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: "Impossibile eliminare il fornitore." })
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

  if (!supplier) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Factory className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Fornitore non trovato</h2>
          <Link href="/fornitori"><Button variant="outline"><ArrowLeft className="h-4 w-4" strokeWidth={1.75} />Torna ai fornitori</Button></Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/fornitori" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <Factory className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{supplier.companyName}</h1>
                <p className="text-muted-foreground text-sm">Fornitore dal {formatDate(supplier.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" strokeWidth={1.75} />Annulla</Button>
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
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Factory className="h-5 w-5 text-primary" strokeWidth={1.75} />Dati Aziendali</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><Input label="Ragione Sociale" value={editForm.companyName || ""} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} /></div>
                    <Input label="P.IVA" value={editForm.vatNumber || ""} onChange={(e) => setEditForm({ ...editForm, vatNumber: e.target.value })} />
                    <Input label="Codice Fiscale" value={editForm.fiscalCode || ""} onChange={(e) => setEditForm({ ...editForm, fiscalCode: e.target.value })} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="P.IVA" value={supplier.vatNumber} />
                    <InfoItem label="Codice Fiscale" value={supplier.fiscalCode} />
                  </div>
                )}
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
                    <p>{supplier.address || "--"}</p>
                    {supplier.city && <p>{supplier.postalCode} {supplier.city} ({supplier.province})</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {supplier.supplierProducts?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5 text-primary" strokeWidth={1.75} />Prodotti Forniti ({supplier.supplierProducts.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {supplier.supplierProducts.map((sp) => (
                      <div key={sp.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">{sp.product.name}</p>
                          {sp.isPreferred && <Badge variant="success" className="text-[10px]">Preferito</Badge>}
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(sp.price)}/{PRODUCT_UNIT_LABELS[sp.product.unit] || sp.product.unit}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </StaggerItem>

          <StaggerItem className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Phone className="h-5 w-5 text-primary" strokeWidth={1.75} />Contatti</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <ContactRow icon={Phone} label="Telefono" value={supplier.phone} />
                <ContactRow icon={Mail} label="Email" value={supplier.email} />
                {supplier.contacts?.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Persone di Contatto</p>
                      {supplier.contacts.map((contact) => (
                        <div key={contact.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{contact.firstName} {contact.lastName}{contact.isPrimary && <Badge variant="info" className="ml-2 text-[10px]">Principale</Badge>}</p>
                            {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
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
                <InfoItem label="Metodo" value={PAYMENT_METHOD_LABELS[supplier.paymentMethod] || supplier.paymentMethod} />
                <InfoItem label="Termini" value={`${supplier.paymentTermsDays} giorni`} />
              </CardContent>
            </Card>

            {supplier.notes && (
              <Card>
                <CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p></CardContent>
              </Card>
            )}
          </StaggerItem>
        </StaggerContainer>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminare il fornitore?</DialogTitle>
              <DialogDescription>Stai per eliminare <strong>{supplier.companyName}</strong>. Questa azione non puo essere annullata.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annulla</Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="h-4 w-4" strokeWidth={1.75} />Elimina Fornitore</Button>
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

function ContactRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm">{value}</p></div>
    </div>
  )
}
