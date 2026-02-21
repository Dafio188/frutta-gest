import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      emailVerified: true,
      _count: {
        select: {
          orders: true,
          activityLogs: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { userId, role, isActive } = await req.json()

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "ID utente non valido" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (role) {
    const allowedRoles = ["ADMIN", "OPERATOR", "VIEWER", "CUSTOMER"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 })
    }
    data.role = role
  }

  if (typeof isActive === "boolean") {
    data.isActive = isActive
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 })
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      emailVerified: true,
      _count: {
        select: {
          orders: true,
          activityLogs: true,
        },
      },
    },
  })

  return NextResponse.json({ user })
}

