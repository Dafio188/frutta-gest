import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    return NextResponse.json(
      { error: "Dati non validi" },
      { status: 400 }
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nuova password deve avere almeno 8 caratteri" },
      { status: 400 }
    )
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user || !user.password) {
    return NextResponse.json(
      { error: "Operazione non disponibile per questo account" },
      { status: 400 }
    )
  }

  const match = await bcrypt.compare(currentPassword, user.password)

  if (!match) {
    return NextResponse.json(
      { error: "Password attuale non corretta" },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(newPassword, 12)

  await db.user.update({
    where: { id: user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}

