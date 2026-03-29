/**
 * API Registrazione Utente
 *
 * Crea un nuovo account utente con email e password.
 * La password viene hashata con bcrypt prima del salvataggio.
 */

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getCurrentDb, getTenantSlug } from "@/lib/tenant-context"
import { registerSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    // Blocco registrazione sul dominio master (fruttagest.it)
    // Gli utenti si registrano solo via invite link dal proprio sottodominio tenant
    const slug = await getTenantSlug()
    if (slug === "master") {
      return NextResponse.json(
        {
          error:
            "La registrazione diretta non è disponibile su questo dominio. " +
            "Accedi tramite il link di invito ricevuto dal tuo amministratore.",
        },
        { status: 403 }
      )
    }

    const db = await getCurrentDb()
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email già registrata" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CUSTOMER", // Cliente del tenant (es. ristorante che ordina da Simone Fruit)
      },
    })

    // ActivityLog esiste solo nel DB tenant, non nel master
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          entity: "User",
          entityId: user.id,
        },
      })
    } catch {
      // silenzioso: il log non è critico
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Errore registrazione:", error)
    return NextResponse.json(
      { error: "Errore durante la registrazione" },
      { status: 500 }
    )
  }
}
