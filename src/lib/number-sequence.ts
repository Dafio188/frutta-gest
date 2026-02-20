/**
 * Generatore numeri sequenziali
 *
 * Genera numeri progressivi per documenti (ordini, DDT, fatture, ecc.)
 * usando la tabella NumberSequence del database.
 */

import { db } from "@/lib/db"

type SequenceType = "ORDER" | "DDT" | "INVOICE" | "CUSTOMER" | "SUPPLIER" | "PURCHASE_ORDER" | "SUPPLIER_INVOICE"

const PREFIXES: Record<SequenceType, string> = {
  ORDER: "ORD",
  DDT: "DDT",
  INVOICE: "FT",
  CUSTOMER: "CLI",
  SUPPLIER: "FOR",
  PURCHASE_ORDER: "OA",
  SUPPLIER_INVOICE: "FT-FORN",
}

/**
 * Genera il prossimo numero per una sequenza.
 * Formato: PREFIX-ANNO-NUMERO (es. ORD-2026-0001)
 */
export async function getNextNumber(type: SequenceType): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = PREFIXES[type]
  const sequenceKey = `${type}_${year}`

  const result = await db.$transaction(async (tx) => {
    const sequence = await tx.numberSequence.upsert({
      where: {
        type_year: {
          type: sequenceKey,
          year,
        },
      },
      update: {
        lastNumber: { increment: 1 },
      },
      create: {
        type: sequenceKey,
        year,
        lastNumber: 1,
        prefix,
      },
    })

    return sequence.lastNumber
  })

  return `${prefix}-${year}-${String(result).padStart(4, "0")}`
}
