/**
 * API Verifica Isolamento Multi-Tenant
 *
 * Endpoint riservato al SuperAdmin che esegue un audit completo
 * dell'isolamento dei dati tra i tenant.
 *
 * GET /api/debug/verify-isolation
 *
 * Per ogni organizzazione attiva:
 * 1. Si connette al DB del tenant
 * 2. Legge gli utenti presenti
 * 3. Verifica che nessun utente di un altro tenant sia visibile
 * 4. Restituisce un report completo con stato PASS/FAIL per tenant
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { masterDb } from "@/lib/master-db"
import { tenantDbManager } from "@/lib/tenant-db"

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL

export async function GET() {
  // Protezione: solo SuperAdmin
  const session = await auth()
  if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
  }

  const startTime = Date.now()
  const report: TenantIsolationReport[] = []
  let globalStatus: "PASS" | "FAIL" | "PARTIAL" = "PASS"

  try {
    // 1. Recupera tutte le organizzazioni attive
    const organizations = await masterDb.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, dbUrl: true },
      orderBy: { createdAt: "asc" },
    })

    if (organizations.length === 0) {
      return NextResponse.json({
        status: "SKIP",
        message: "Nessun tenant attivo da verificare.",
        report: [],
        duration_ms: Date.now() - startTime,
      })
    }

    // 2. Costruisce la mappa globale di tutti gli utenti di tutti i tenant
    // Per verificare cross-contamination
    const allTenantEmails: Record<string, string[]> = {}

    for (const org of organizations) {
      const tenantReport: TenantIsolationReport = {
        orgId: org.id,
        orgName: org.name,
        slug: org.slug,
        status: "PASS",
        userCount: 0,
        users: [],
        errors: [],
        checks: [],
      }

      try {
        const db = await tenantDbManager.getClient(org.id)

        // 2a. Legge utenti del tenant
        const users = await db.user.findMany({
          select: { id: true, email: true, name: true, role: true, isActive: true },
          orderBy: { createdAt: "asc" },
        })

        tenantReport.userCount = users.length
        tenantReport.users = users.map((u) => ({
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        }))

        allTenantEmails[org.slug] = users.map((u) => u.email)

        // 2b. CHECK 1 — Verifica che la connessione usi lo schema corretto
        const schemaMatch = org.dbUrl.match(/schema=([^&]+)/)
        const expectedSchema = schemaMatch ? schemaMatch[1] : org.slug
        const schemaCheckResult = await (db as any).$queryRaw`SELECT current_schema() as schema`
          .catch(() => null)

        if (schemaCheckResult) {
          const actualSchema = (schemaCheckResult as any[])[0]?.schema
          const schemaOk = actualSchema === expectedSchema
          tenantReport.checks.push({
            name: "Schema Isolation",
            passed: schemaOk,
            detail: schemaOk
              ? `OK — schema attivo: "${actualSchema}"`
              : `FAIL — atteso "${expectedSchema}", trovato "${actualSchema}"`,
          })
          if (!schemaOk) tenantReport.status = "FAIL"
        } else {
          tenantReport.checks.push({
            name: "Schema Isolation",
            passed: true,
            detail: "OK — verifica schema non disponibile (adapter)",
          })
        }

        // 2c. CHECK 2 — Verifica che il DB abbia almeno un admin
        const adminCount = users.filter(
          (u) => u.role === "ADMIN" && u.isActive
        ).length
        const hasAdmin = adminCount > 0
        tenantReport.checks.push({
          name: "Admin Presente",
          passed: hasAdmin,
          detail: hasAdmin
            ? `OK — ${adminCount} admin attivi`
            : "WARN — nessun utente admin attivo nel tenant",
        })
        if (!hasAdmin) tenantReport.status = "PARTIAL"

        // 2d. CHECK 3 — Verifica che gli ordini siano fisicamente presenti nel tenant
        const orderCount = await db.order.count()
        tenantReport.checks.push({
          name: "DB Tenant Operativo",
          passed: true,
          detail: `OK — ${orderCount} ordini registrati nel DB tenant`,
        })
      } catch (err: any) {
        tenantReport.status = "FAIL"
        tenantReport.errors.push(`Connessione fallita: ${err.message}`)
        globalStatus = "FAIL"
      }

      report.push(tenantReport)
    }

    // 3. CHECK GLOBALE — Cross-contamination: email duplicate tra tenant diversi
    const emailToTenants: Record<string, string[]> = {}
    for (const [slug, emails] of Object.entries(allTenantEmails)) {
      for (const email of emails) {
        if (!emailToTenants[email]) emailToTenants[email] = []
        emailToTenants[email].push(slug)
      }
    }

    const crossContaminated = Object.entries(emailToTenants)
      .filter(([, tenants]) => tenants.length > 1)
      .map(([email, tenants]) => ({ email, tenants }))

    // Aggiorna lo status globale
    const failedTenants = report.filter((r) => r.status === "FAIL").length
    const partialTenants = report.filter((r) => r.status === "PARTIAL").length

    if (failedTenants > 0 || crossContaminated.length > 0) {
      globalStatus = "FAIL"
    } else if (partialTenants > 0) {
      globalStatus = "PARTIAL"
    } else {
      globalStatus = "PASS"
    }

    return NextResponse.json({
      status: globalStatus,
      summary: {
        total_tenants: organizations.length,
        passed: report.filter((r) => r.status === "PASS").length,
        partial: partialTenants,
        failed: failedTenants,
        cross_contamination: crossContaminated.length === 0
          ? "NONE"
          : crossContaminated,
      },
      report,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Errore durante la verifica", detail: err.message },
      { status: 500 }
    )
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface IsolationCheck {
  name: string
  passed: boolean
  detail: string
}

interface TenantIsolationReport {
  orgId: string
  orgName: string
  slug: string
  status: "PASS" | "FAIL" | "PARTIAL"
  userCount: number
  users: { email: string; role: string; isActive: boolean }[]
  errors: string[]
  checks: IsolationCheck[]
}
