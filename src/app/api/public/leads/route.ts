/**
 * Public Lead API — Route pubblica per fruttagest.it
 * 
 * Riceve le richieste di demo dal form contatti e le salva
 * nella tabella Lead del database Master.
 */

import { NextResponse } from "next/server"
import { masterDb } from "@/lib/master-db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, company, phone, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    // Salvataggio nel Master DB
    const lead = await masterDb.lead.create({
      data: {
        name,
        email: email.toLowerCase(),
        company: company || null,
        phone: phone || null,
        message,
        status: "NEW", // Nuovo Lead
      }
    })

    console.log(`[MASTER DB] Nuovo Lead salvato con successo: ${lead.email}`)

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })

  } catch (error: any) {
    console.error("[MASTER DB ERROR] Fallimento salvataggio Lead:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
