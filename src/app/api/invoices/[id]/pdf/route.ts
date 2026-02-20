/**
 * API Generazione PDF Fattura
 *
 * Genera e restituisce il PDF della fattura.
 */

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { InvoicePdfDocument } from "@/components/invoices/invoice-pdf"
import React from "react"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      ddtLinks: {
        include: { deliveryNote: { select: { ddtNumber: true } } },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Fattura non trovata" }, { status: 404 })
  }

  const company = await db.companyInfo.findFirst()
  if (!company) {
    return NextResponse.json(
      { error: "Configurare i dati aziendali" },
      { status: 400 }
    )
  }

  const invoiceData = {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      lineTotal: Number(item.lineTotal),
    })),
    ddtNumbers: invoice.ddtLinks.map((l) => l.deliveryNote.ddtNumber),
  }

  const pdfElement = React.createElement(InvoicePdfDocument, { invoice: invoiceData, company })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await (renderToBuffer as any)(pdfElement)

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Fattura-${invoice.invoiceNumber}.pdf"`,
    },
  })
}
