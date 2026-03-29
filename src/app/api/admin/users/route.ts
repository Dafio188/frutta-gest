import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCurrentDb } from "@/lib/tenant-context"

export async function GET() {
  const session = await auth()
  const db = await getCurrentDb()

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
  const db = await getCurrentDb()

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

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const db = await getCurrentDb()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { userId } = await req.json()

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "ID utente non valido" }, { status: 400 })
  }

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Non puoi eliminare il tuo account" },
      { status: 400 }
    )
  }

  // Controlla integrità contabile: ordini, fatture, DDT
  const [orderCount, invoiceCount, ddtCount] = await Promise.all([
    db.order.count({ where: { createdById: userId } }),
    db.invoice.count({ where: { userId } }),
    db.deliveryNote.count({ where: { userId } }),
  ])

  if (orderCount > 0 || invoiceCount > 0 || ddtCount > 0) {
    const details = [
      orderCount > 0 ? `${orderCount} ordini` : null,
      invoiceCount > 0 ? `${invoiceCount} fatture` : null,
      ddtCount > 0 ? `${ddtCount} DDT` : null,
    ]
      .filter(Boolean)
      .join(", ")

    return NextResponse.json(
      {
        error: `Impossibile eliminare: l'utente ha ${details} associati. I record contabili devono essere preservati.`,
      },
      { status: 409 }
    )
  }

  await db.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
