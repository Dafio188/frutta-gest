/**
 * Public Lead API — Route pubblica per fruttagest.it
 * 
 * Riceve le richieste di demo dal form contatti e le salva
 * nella tabella Lead del database Master.
 * Invia notifica email al SuperAdmin (info@fruttagest.it).
 */

import { NextResponse } from "next/server"
import { masterDb } from "@/lib/master-db"
import { sendLeadNotificationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, company, phone, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    // 1. Salvataggio nel Master DB
    const lead = await masterDb.lead.create({
      data: {
        name,
        email: email.toLowerCase(),
        company: company || null,
        phone: phone || null,
        message,
        status: "NEW",
      }
    })

    console.log(`[Lead] Nuovo lead salvato: ${lead.email}`)

    // 2. Notifica email al SuperAdmin (non bloccante)
    sendLeadNotificationEmail({
      leadId: lead.id,
      leadName: name,
      leadEmail: email,
      leadPhone: phone || null,
      leadCompany: company || null,
      leadMessage: message,
    }).catch((err) => console.error("[Lead] Errore invio notifica email:", err))

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })

  } catch (error: any) {
    console.error("[Lead] Errore salvataggio:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
