/**
 * API Parsing Ordine con AI
 *
 * Endpoint per analizzare testo libero e estrarre prodotti/quantità.
 * Usato dalla UI per parsing manuale di messaggi copia-incollati.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseOrderText } from "@/lib/ai/parse-order"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const { text, image } = await req.json()

    if ((!text || typeof text !== "string") && (!image || typeof image !== "string")) {
      return NextResponse.json(
        { error: "Testo o immagine obbligatori" },
        { status: 400 }
      )
    }

    const parsed = await parseOrderText(text || "", image)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error("Errore parsing ordine:", error)
    return NextResponse.json(
      { error: "Errore durante il parsing" },
      { status: 500 }
    )
  }
}
