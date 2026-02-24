/**
 * API Generazione PDF DDT
 *
 * Genera e restituisce il PDF della bolla di consegna.
 */

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DDTPdfDocument } from "@/components/ddt/ddt-pdf"
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

  const ddt = await db.deliveryNote.findUnique({
    where: { id },
    include: {
      items: { include: { product: true }, orderBy: { sortOrder: "asc" } },
      customer: true,
    },
  })

  if (!ddt) {
    return NextResponse.json({ error: "DDT non trovata" }, { status: 404 })
  }

  const company = await db.companyInfo.findFirst()
  if (!company) {
    return NextResponse.json(
      { error: "Configurare i dati aziendali" },
      { status: 400 }
    )
  }

  const ddtData = {
    ...ddt,
    weight: ddt.weight ? Number(ddt.weight) : null,
    numberOfPackages: ddt.numberOfPackages ? Number(ddt.numberOfPackages) : null,
    items: ddt.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      lineTotal: Number(item.lineTotal),
      product: item.product ?? { name: item.productName ?? "Prodotto personalizzato" },
    })),
  }

  const pdfElement = React.createElement(DDTPdfDocument, { ddt: ddtData, company })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await (renderToBuffer as any)(pdfElement)

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="DDT-${ddt.ddtNumber}.pdf"`,
    },
  })
}
