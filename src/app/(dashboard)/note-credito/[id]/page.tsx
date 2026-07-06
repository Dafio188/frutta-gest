/**
 * Dettaglio Nota di Credito
 *
 * Importi, motivo, fattura collegata e dati cliente, con eliminazione.
 */

"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, FileMinus, FileText, User, MapPin, Phone, Mail,
  Trash2, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageTransition } from "@/components/animations/page-transition"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "@/lib/constants"
import { getCreditNote, deleteCreditNote } from "@/lib/actions"
import { useUIStore } from "@/stores/ui-store"

interface CreditNoteData {
  id: string
  creditNoteNumber: string
  issueDate: string
  amount: number
  vatAmount: number
  total: number
  reason: string
  createdAt: string
  customer: {
    id: string; companyName: string; vatNumber: string | null; fiscalCode: string | null
    address: string; city: string; province: string; postalCode: string
    phone: string | null; email: string | null; sdiCode: string | null; pecEmail: string | null
  }
  invoice: {
    id: string; invoiceNumber: string; issueDate: string
    subtotal: number; vatAmount: number; total: number; status: string
    creditNotes: { id: string; total: number }[]
  }
}

export default function NotaCreditoDettaglioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useUIStore()
  const [creditNote, setCreditNote] = useState<CreditNoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getCreditNote(id)
      setCreditNote(result as unknown as CreditNoteData)
    } catch (err) {
      console.error("Errore caricamento nota di credito:", err)
      addToast({ type: "error", title: "Errore", description: "Nota di credito non trovata" })
      router.push("/note-credito")
    } finally {
      setLoading(false)
    }
  }, [id, router, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async () => {
    if (!creditNote) return
    if (!confirm(`Sei sicuro di voler eliminare la nota di credito ${creditNote.creditNoteNumber}?`)) return
    try {
      setActionLoading(true)
      await deleteCreditNote(creditNote.id)
      addToast({ type: "success", title: "Nota di credito eliminata", description: `${creditNote.creditNoteNumber} eliminata con successo` })
      router.push("/note-credito")
    } catch (err) {
      addToast({ type: "error", title: "Errore", description: (err as Error)?.message || "Impossibile eliminare la nota di credito" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!creditNote) return null

  const totalCredited = creditNote.invoice.creditNotes.reduce((sum, cn) => sum + cn.total, 0)
  const invoiceNet = creditNote.invoice.total - totalCredited

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/note-credito">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{creditNote.creditNoteNumber}</h1>
                <Badge variant="warning">Nota di Credito</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {creditNote.customer.companyName} — Emessa il {formatDate(creditNote.issueDate)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" strokeWidth={1.75} />}
              Elimina
            </Button>
          </div>
        </div>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Importi */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileMinus className="h-4 w-4" />Importi Accreditati
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imponibile</span>
                      <span>-{formatCurrency(creditNote.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA</span>
                      <span>-{formatCurrency(creditNote.vatAmount)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Totale accreditato</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(creditNote.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Motivo */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Motivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{creditNote.reason}</p>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Fattura collegata */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />Fattura Collegata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/fatture/${creditNote.invoice.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{creditNote.invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Emessa il {formatDate(creditNote.invoice.issueDate)} — {formatCurrency(creditNote.invoice.total)}
                      </p>
                    </div>
                    <Badge className={INVOICE_STATUS_COLORS[creditNote.invoice.status]}>
                      {INVOICE_STATUS_LABELS[creditNote.invoice.status] || creditNote.invoice.status}
                    </Badge>
                  </Link>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Totale fattura</span>
                      <span>{formatCurrency(creditNote.invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Totale note di credito</span>
                      <span>-{formatCurrency(totalCredited)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium">
                      <span>Netto fattura</span>
                      <span>{formatCurrency(invoiceNet)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer */}
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/clienti/${creditNote.customer.id}`} className="text-sm font-medium text-primary hover:underline">
                    {creditNote.customer.companyName}
                  </Link>
                  {creditNote.customer.vatNumber && (
                    <p className="text-sm text-muted-foreground">P.IVA: {creditNote.customer.vatNumber}</p>
                  )}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{creditNote.customer.address}, {creditNote.customer.postalCode} {creditNote.customer.city} ({creditNote.customer.province})</span>
                  </div>
                  {creditNote.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />{creditNote.customer.phone}
                    </div>
                  )}
                  {creditNote.customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />{creditNote.customer.email}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Info Card */}
            <StaggerItem>
              <Card>
                <CardContent className="pt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data emissione</span>
                    <span>{formatDate(creditNote.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creata il</span>
                    <span>{formatDateTime(creditNote.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
