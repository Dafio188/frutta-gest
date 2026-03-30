/**
 * POST /api/auth/reset-password
 *
 * Valida il token di reset e aggiorna la password dell'utente:
 * 1. Verifica che il token esista e non sia scaduto
 * 2. Aggiorna la password dell'utente con bcrypt
 * 3. Invalida il token (cancella da VerificationToken)
 * 4. Risponde con successo
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentDb } from "@/lib/tenant-context"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token mancante" }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "La password deve essere di almeno 8 caratteri" },
        { status: 400 }
      )
    }

    const db = await getCurrentDb()

    // 1. Trova il token — cerca per valore (non per identifier)
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Link non valido o già utilizzato" },
        { status: 400 }
      )
    }

    // 2. Verifica scadenza
    if (verificationToken.expires < new Date()) {
      // Pulizia token scaduto
      await db.verificationToken.delete({ where: { token } })
      return NextResponse.json(
        { error: "Il link è scaduto. Richiedi un nuovo link di reset." },
        { status: 400 }
      )
    }

    const email = verificationToken.identifier

    // 3. Trova l'utente
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Utente non trovato o disattivato" },
        { status: 400 }
      )
    }

    // 4. Hash nuova password (cost 12)
    const hashedPassword = await bcrypt.hash(password, 12)

    // 5. Aggiorna password + invalida token in transazione
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, updatedAt: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ])

    console.log(`[ResetPassword] Password aggiornata per: ${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ResetPassword] Errore:", error)
    return NextResponse.json(
      { error: "Errore durante il reset. Riprova più tardi." },
      { status: 500 }
    )
  }
}
