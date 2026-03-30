/**
 * POST /api/auth/forgot-password
 *
 * Gestisce la richiesta di reset password:
 * 1. Trova l'utente nel DB del tenant corrente
 * 2. Genera un token sicuro con scadenza 1 ora
 * 3. Lo salva nel VerificationToken (riuso del modello NextAuth)
 * 4. Invia l'email di reset con il link
 *
 * Per sicurezza, risponde sempre con successo (anche se email non trovata)
 * per evitare enumerazione degli utenti registrati.
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentDb } from "@/lib/tenant-context"
import { getTenantSlug } from "@/lib/tenant-context"
import { sendResetPasswordEmail } from "@/lib/email"
import crypto from "crypto"

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "fruttagest.it"
const DEV_PORT = "3650"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Guard: se siamo sul dominio master (www/root) non abbiamo un tenant DB
    // Gli utenti Admin/Customer appartengono a slug.fruttagest.it, non al root domain
    const tenantSlugHeader = req.headers.get("x-tenant-slug") || ""
    if (!tenantSlugHeader || tenantSlugHeader === "master") {
      console.log(`[ForgotPassword] Richiesta da master domain — nessun tenant DB. Email: ${normalizedEmail}`)
      // Rispondi con successo silenzioso per non rivelare la struttura
      return NextResponse.json({ success: true })
    }

    // 1. Trova l'utente nel DB del tenant corrente
    const db = await getCurrentDb()
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    })

    // Se l'utente non esiste o non è attivo, rispondi comunque con successo
    // (security: non rivela se l'email è registrata)
    if (!user || !user.isActive) {
      console.log(`[ForgotPassword] Email non trovata o disattivata: ${normalizedEmail}`)
      return NextResponse.json({ success: true })
    }

    // 2. Genera token sicuro (32 bytes hex = 64 caratteri)
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 ora

    // 3. Upsert del VerificationToken (rimuove precedenti per lo stesso utente)
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    })

    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    })

    // 4. Costruisci il reset URL (adattato a localhost dev o produzione)
    const host = req.headers.get("host") || ""
    let resetUrl: string

    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const tenantSlug = await getTenantSlug()
      resetUrl = `http://localhost:${DEV_PORT}/reset-password?token=${token}&tenant=${tenantSlug}`
    } else {
      // In produzione: mantieni il sottodominio tenant nel link
      const protocol = "https"
      resetUrl = `${protocol}://${host}/reset-password?token=${token}`
    }

    // 5. Invia email
    const emailResult = await sendResetPasswordEmail(normalizedEmail, {
      userName: user.name,
      resetUrl,
    })

    if (!emailResult.success) {
      console.error("[ForgotPassword] Errore invio email:", emailResult.error)
      // Non bloccare l'utente — logga ma restituisci successo
      // (per non rivelare lo stato del sistema)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ForgotPassword] Errore:", error)
    return NextResponse.json(
      { error: "Errore durante la richiesta. Riprova più tardi." },
      { status: 500 }
    )
  }
}
