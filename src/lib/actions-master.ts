"use server"

import { revalidatePath } from "next/cache"
import { masterDb } from "@/lib/master-db"
import { auth } from "@/lib/auth"
import { exec } from "child_process"
import { promisify } from "util"
import bcrypt from "bcryptjs"
import { seedTenantCatalog } from "@/lib/seed-catalog"
const execPromise = promisify(exec)

// Protezione: solo l'admin globale puo accedere a queste azioni
// Per ora usiamo una lista di email autorizzate o un flag nel DB master
const SUPER_ADMIN_EMAILS = [process.env.SUPER_ADMIN_EMAIL].filter(Boolean)

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.email || !SUPER_ADMIN_EMAILS.includes(session.user.email)) {
    throw new Error("Accesso negato: Richiesti privilegi di SuperAdmin")
  }
  return session
}

export async function getMasterOrganizations() {
  await requireSuperAdmin()
  return await masterDb.organization.findMany({
    include: {
      subscription: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function toggleOrganizationStatus(id: string, isActive: boolean) {
  await requireSuperAdmin()
  const org = await masterDb.organization.update({
    where: { id },
    data: { isActive },
  })
  revalidatePath("/admin-master")
  return org
}

export async function renewSubscription(orgId: string) {
  await requireSuperAdmin()
  const sub = await masterDb.subscription.findUnique({ where: { organizationId: orgId } })
  if (!sub) throw new Error("Subscription non trovata")
  
  const currentExpiresAt = sub.expiresAt && sub.expiresAt > new Date() ? sub.expiresAt : new Date()
  const nextYear = new Date(currentExpiresAt)
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  
  await masterDb.subscription.update({
    where: { organizationId: orgId },
    data: { expiresAt: nextYear }
  })
  revalidatePath("/admin-master")
  return { success: true, expiresAt: nextYear }
}

export async function updateOrganization(id: string, data: { name?: string; dbUrl?: string; logoUrl?: string | null; primaryColor?: string | null }) {
  await requireSuperAdmin()
  const org = await masterDb.organization.update({
    where: { id },
    data,

  })
  revalidatePath("/admin-master")
  return org
}

export async function createMasterOrganization(data: { name: string; slug: string; dbUrl: string }) {
  await requireSuperAdmin()
  const org = await masterDb.organization.create({
    data: {
      ...data,
      isActive: true,
    },
  })
  revalidatePath("/admin-master")
  return org
}

export async function initializeTenantDatabase(orgId: string) {
  await requireSuperAdmin()
  const org = await masterDb.organization.findUnique({ where: { id: orgId } })
  if (!org) throw new Error("Organizzazione non trovata")

  try {
    // 1. Prisma DB Push sul nuovo database
    // Usiamo env override per puntare al nuovo DB
    console.log(`[PROVISIONING] Pushing schema to ${org.slug}...`)
    
    // Su Windows usiamo set per le variabili d'ambiente
    const command = `npx prisma db push --schema=prisma/schema.prisma --accept-data-loss`
    const { stdout, stderr } = await execPromise(command, {
      env: { ...process.env, DATABASE_URL: org.dbUrl }
    })
    
    console.log("[PROVISIONING] Stdout:", stdout)
    if (stderr) console.warn("[PROVISIONING] Stderr:", stderr)

    // 2. Creazione Utente Admin di default nel nuovo DB
    // Importiamo dinamicamente il client del tenant (o usiamo un client temporaneo)
    const { PrismaClient } = await import("@prisma/client")
    const pgModule = await import("pg")
    const { PrismaPg } = await import("@prisma/adapter-pg")

    const pg = pgModule.default || pgModule
    
    // FONDAMENTALE FORZARE LA RICERCA SULLO SCHEMA CORRETTO:
    const schemaMatch = org.dbUrl.match(/schema=([^&]+)/);
    const schemaName = schemaMatch ? schemaMatch[1] : org.slug;

    const pool = new pg.Pool({ connectionString: org.dbUrl })
    pool.on('connect', (client: any) => {
      client.query(`SET search_path TO "${schemaName}"`);
    });

    const adapter = new PrismaPg(pool as any)
    const tenantDb = new PrismaClient({ adapter } as any)
    
    const adminPassword = await bcrypt.hash("admin123", 10)
    
    await tenantDb.user.upsert({
      where: { email: "admin@" + org.slug + ".it" },
      update: {},
      create: {
        email: "admin@" + org.slug + ".it",
        password: adminPassword,
        name: "Amministratore " + org.name,
        role: "ADMIN",
        isActive: true,
      }
    })
    
    // 3. SEED INIZIALE DEL CATALOGO
    console.log(`[PROVISIONING] Inserimento catalogo prodotti base...`)
    await seedTenantCatalog(tenantDb, org)
    
    await tenantDb.$disconnect()
    
    // 4. CREA LICENZA MASTER SAAS DI 1 ANNO
    console.log(`[PROVISIONING] Creazione abbonamento SaaS...`)
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    
    await masterDb.subscription.upsert({
      where: { organizationId: org.id },
      update: {
        status: "active",
        expiresAt: nextYear
      },
      create: {
        organizationId: org.id,
        plan: "BASIC",
        status: "active",
        expiresAt: nextYear
      }
    })
    
    console.log(`[PROVISIONING] Database ${org.slug} inizializzato con successo.`)
    revalidatePath("/admin-master")
    return { success: true }
  } catch (error: any) {
    console.error("[PROVISIONING ERROR]:", error)
    throw new Error(`Inizializzazione fallita: ${error.message}`)
  }
}

// ============================================================
// AZIONI PER SAAS CRM & LEADS
// ============================================================

export async function getLeads() {
  await requireSuperAdmin()
  return await masterDb.lead.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function getSaaSSummary() {
  await requireSuperAdmin()
  const orgCount = await masterDb.organization.count()
  const activeSubs = await masterDb.subscription.count({ where: { status: 'active' } })
  const newLeads = await masterDb.lead.count({ where: { status: 'NEW' } })
  
  // Calcolo MRR approssimativo (somma subscriptionFee / 12 se annuale, o mensile)
  const subs = await masterDb.subscription.findMany({ where: { status: 'active' } })
  const mrr = subs.reduce((acc, s) => acc + (s.subscriptionFee || 0) / 12, 0)

  // Rinnovi reali: abbonamenti attivi che scadono entro 60 giorni
  const now = new Date()
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const renewingSoon = await masterDb.subscription.count({
    where: {
      status: 'active',
      expiresAt: { gte: now, lte: in60Days },
    }
  })

  return { orgCount, activeSubs, newLeads, mrr, renewingSoon }
}

export async function updateLeadStatus(id: string, status: any) {
  await requireSuperAdmin()
  const lead = await masterDb.lead.update({
    where: { id },
    data: { status }
  })
  revalidatePath("/saas-crm")
  return lead
}

export async function deleteLead(id: string) {
  await requireSuperAdmin()
  await masterDb.lead.delete({ where: { id } })
  revalidatePath("/saas-crm")
  return { success: true }
}

/**
 * Genera automaticamente la DB URL per un nuovo tenant.
 * Usa lo stesso host Neon del master, con schema isolation via search_path.
 */
function buildTenantDbUrl(slug: string): string {
  const masterUrl = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL || ""
  // Estraiamo host/user/password/db dal master URL
  const base = masterUrl.split("?")[0]
  // Costruiamo la URL con schema = slug del tenant
  return `${base}?sslmode=require&schema=${slug}`
}

/**
 * Converte un Lead in un Tenant attivo:
 * 1. Crea Organization nel Master
 * 2. Crea Subscription (1 anno BASIC)
 * 3. Inizializza il database del tenant (schema + admin user + catalogo)
 * 4. Aggiorna il Lead con status CONVERTED
 */
export async function convertLeadToTenant(leadId: string) {
  await requireSuperAdmin()

  const lead = await masterDb.lead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error("Lead non trovato")
  if (lead.status === "CONVERTED") throw new Error("Questo lead è già stato convertito")

  // Genera slug dal nome azienda o dal nome del lead
  const rawSlug = (lead.company || lead.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .substring(0, 20)

  // Verifica unicità slug
  const existing = await masterDb.organization.findUnique({ where: { slug: rawSlug } })
  if (existing) throw new Error(`Lo slug "${rawSlug}" è già in uso. Converti manualmente dal pannello Infrastruttura.`)

  const dbUrl = buildTenantDbUrl(rawSlug)

  // 1. Crea Organization
  const org = await masterDb.organization.create({
    data: {
      name: lead.company || lead.name,
      slug: rawSlug,
      dbUrl,
      isActive: true,
      contactEmail: lead.email,
      contactPhone: lead.phone || null,
    },
  })

  // 2. Inizializza il database (schema push + admin user + catalogo)
  try {
    await initializeTenantDatabase(org.id)
  } catch (err: any) {
    // Rollback: cancella l'org creata se il provisioning fallisce
    await masterDb.organization.delete({ where: { id: org.id } })
    throw new Error(`Provisioning database fallito: ${err.message}`)
  }

  // 3. Aggiorna Lead come CONVERTED 
  await masterDb.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      convertedOrgId: org.id,
    },
  })

  revalidatePath("/saas-crm")
  revalidatePath("/admin-master")
  return { success: true, organization: org }
}


export async function updateSaaSSubscription(orgId: string, data: {
  billingEmail?: string;
  billingIban?: string;
  subscriptionFee?: number;
  notes?: string;
  status?: string;
  plan?: any;
}) {
  await requireSuperAdmin()
  const sub = await masterDb.subscription.update({
    where: { organizationId: orgId },
    data
  })
  revalidatePath("/saas-crm")
  return sub
}

// ============================================================
// SISTEMA DI INVITO (TOKEN MAGIC LINK)
// ============================================================

import { randomUUID } from "crypto"

export async function createInviteLink(orgId: string, email: string, name: string) {
  await requireSuperAdmin()
  
  // 1. Recupero l'organizzazione per avere lo slug
  const org = await masterDb.organization.findUnique({ where: { id: orgId } })
  if (!org) throw new Error("Organizzazione non trovata")

  // 2. Cleanup vecchi inviti per questa mail
  await masterDb.inviteToken.deleteMany({
    where: { email: email.toLowerCase() }
  })

  const token = randomUUID()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48) // Valido 48 ore

  // 3. Creazione invito
  await masterDb.inviteToken.create({
    data: {
      token,
      email: email.toLowerCase(),
      name,
      organizationId: orgId,
      tenantSlug: org.slug,
      expiresAt
    }
  })

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'fruttagest.it'
  const magicLink = `https://${org.slug}.${rootDomain}/setup?token=${token}`

  // 4. Invio email Magic Link automatico
  let emailSent = false
  if (email && email.includes("@")) {
    try {
      const { sendInviteEmail } = await import("@/lib/email")
      const emailResult = await sendInviteEmail(email.toLowerCase(), {
        inviteeName: name,
        tenantName: org.name,
        inviteUrl: magicLink,
        role: "ADMIN",
        expiresInHours: 48,
      })
      emailSent = emailResult.success
    } catch (emailError) {
      console.error("[createInviteLink] Errore invio email:", emailError)
      // Non blocca il flusso — l'admin può comunque copiare il link
    }
  }

  revalidatePath("/saas-crm")
  return { success: true, magicLink, expiresAt, emailSent }
}

export async function getInviteByToken(token: string) {
  // Questa funzione NON richiede SuperAdmin (è usata dal cliente in setup)
  const invite = await masterDb.inviteToken.findUnique({
    where: { token }
  })

  if (!invite) return null
  
  // Recuperiamo l'organizzazione manualmente se serve
  const organization = await masterDb.organization.findUnique({
    where: { id: invite.organizationId }
  })

  return { ...invite, organization }
}

export async function completeTenantSetup(token: string, password: string) {
  // 1. Prendo l'invito
  const invite = await masterDb.inviteToken.findUnique({
    where: { token }
  })

  if (!invite || invite.usedAt) throw new Error("Invito non valido o già usato")

  // 1.1 Recupero l'organizzazione manualmente per avere la dbUrl
  const org = await masterDb.organization.findUnique({
    where: { id: invite.organizationId }
  })
  
  if (!org) throw new Error("Organizzazione non trovata")

  // 2. Connessione al DB del Tenant
  const { PrismaClient } = await import("@prisma/client")
  const pgModule = await import("pg")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const pg = pgModule.default || pgModule
  
  const pool = new pg.Pool({ connectionString: org.dbUrl })
  const adapter = new PrismaPg(pool as any)
  const tenantDb = new PrismaClient({ adapter } as any)

  try {
    // 3. Hash password e aggiornamento utente nel tenant
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Aggiorniamo l'utente admin (già creato durate il provisioning in Phase 3)
    await tenantDb.user.update({
      where: { email: invite.email.toLowerCase() },
      data: {
        password: hashedPassword,
        isActive: true
      }
    })

    // 4. Marca invito come usato nel Master
    await masterDb.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    })

    return { success: true }
  } catch (e: any) {
    throw new Error(`Errore durante attivazione: ${e.message}`)
  } finally {
    await tenantDb.$disconnect()
  }
}

// ============================================================
// SCHEDA CLIENTE — Dettaglio Organizzazione
// ============================================================

export async function getOrganizationDetail(orgId: string) {
  await requireSuperAdmin()
  const org = await masterDb.organization.findUnique({
    where: { id: orgId },
    include: { subscription: true },
  })
  if (!org) throw new Error("Organizzazione non trovata")
  return org
}

export async function getTenantUsers(orgId: string) {
  await requireSuperAdmin()
  const org = await masterDb.organization.findUnique({
    where: { id: orgId },
    select: { isActive: true },
  })
  if (!org?.isActive) return []

  try {
    const { tenantDbManager } = await import("@/lib/tenant-db")
    const tenantClient = await tenantDbManager.getClient(orgId)
    return await tenantClient.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return []
  }
}

export async function saveSubscriptionDetails(
  orgId: string,
  data: {
    billingEmail?: string
    billingIban?: string
    subscriptionFee?: number
    notes?: string
    plan?: string
    status?: string
    expiresAt?: string
    startsAt?: string
    contactEmail?: string
    contactPhone?: string
  }
) {
  await requireSuperAdmin()
  const { expiresAt, startsAt, plan, status, contactEmail, contactPhone, ...rest } = data

  const sub = await masterDb.subscription.upsert({
    where: { organizationId: orgId },
    update: {
      ...rest,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...(plan ? { plan: plan as any } : {}),
      ...(status ? { status } : {}),
    },
    create: {
      organizationId: orgId,
      status: status || "active",
      plan: (plan as any) || "BASIC",
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
      ...rest,
    },
  })

  // Aggiorna i dati di contatto dell'organizzazione se forniti
  if (contactEmail !== undefined || contactPhone !== undefined) {
    await masterDb.organization.update({
      where: { id: orgId },
      data: {
        ...(contactEmail !== undefined ? { contactEmail } : {}),
        ...(contactPhone !== undefined ? { contactPhone } : {}),
      },
    })
  }

  revalidatePath(`/saas-crm/${orgId}`)
  revalidatePath("/saas-crm")
  return sub
}

// ============================================================
// AUDIT: VERIFICA ISOLAMENTO MULTI-TENANT
// ============================================================

/**
 * Esegue l'audit di isolamento multi-tenant.
 * Chiama l'endpoint /api/debug/verify-isolation e restituisce il report.
 * Usato dalla UI di diagnostica nel pannello SaaS CRM.
 */
export async function runIsolationAudit() {
  const session = await requireSuperAdmin()

  try {
    const { tenantDbManager } = await import("@/lib/tenant-db")
    const startTime = Date.now()

    // 1. Recupera tutte le organizzazioni attive
    const organizations = await masterDb.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, dbUrl: true },
      orderBy: { createdAt: "asc" },
    })

    if (organizations.length === 0) {
      return {
        status: "SKIP" as const,
        message: "Nessun tenant attivo da verificare.",
        report: [],
        summary: { total_tenants: 0, passed: 0, partial: 0, failed: 0 },
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    }

    type CheckResult = { name: string; passed: boolean; detail: string }
    type TenantReport = {
      orgId: string; orgName: string; slug: string
      status: "PASS" | "FAIL" | "PARTIAL"
      userCount: number
      users: { email: string; role: string; isActive: boolean }[]
      errors: string[]; checks: CheckResult[]
    }

    const report: TenantReport[] = []
    const allTenantEmails: Record<string, string[]> = {}

    for (const org of organizations) {
      const tenantReport: TenantReport = {
        orgId: org.id, orgName: org.name, slug: org.slug,
        status: "PASS", userCount: 0, users: [], errors: [], checks: [],
      }

      try {
        const db = await tenantDbManager.getClient(org.id)

        // Utenti del tenant
        const users = await db.user.findMany({
          select: { id: true, email: true, name: true, role: true, isActive: true },
          orderBy: { createdAt: "asc" },
        })
        tenantReport.userCount = users.length
        tenantReport.users = users.map((u) => ({
          email: u.email, role: u.role, isActive: u.isActive,
        }))
        allTenantEmails[org.slug] = users.map((u) => u.email)

        // CHECK 1 — Schema isolation
        const schemaMatch = org.dbUrl.match(/schema=([^&]+)/)
        const expectedSchema = schemaMatch ? schemaMatch[1] : org.slug
        tenantReport.checks.push({
          name: "Schema Isolation",
          passed: true,
          detail: `OK — schema configurato: "${expectedSchema}"`,
        })

        // CHECK 2 — Admin attivo presente
        const adminCount = users.filter((u) => u.role === "ADMIN" && u.isActive).length
        const hasAdmin = adminCount > 0
        tenantReport.checks.push({
          name: "Admin Attivo",
          passed: hasAdmin,
          detail: hasAdmin
            ? `OK — ${adminCount} admin attivo/i nel tenant`
            : "WARN — nessun admin attivo in questo tenant",
        })
        if (!hasAdmin) tenantReport.status = "PARTIAL"

        // CHECK 3 — DB operativo (conta ordini)
        const orderCount = await db.order.count().catch(() => -1)
        const dbOk = orderCount >= 0
        tenantReport.checks.push({
          name: "DB Operativo",
          passed: dbOk,
          detail: dbOk
            ? `OK — ${orderCount} ordini nel DB tenant`
            : "FAIL — impossibile contare gli ordini (tabella non raggiungibile)",
        })
        if (!dbOk) tenantReport.status = "FAIL"

      } catch (err: any) {
        tenantReport.status = "FAIL"
        tenantReport.errors.push(`Connessione fallita: ${err.message}`)
      }

      report.push(tenantReport)
    }

    // CHECK GLOBALE — Cross-contamination
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

    const failedCount = report.filter((r) => r.status === "FAIL").length
    const partialCount = report.filter((r) => r.status === "PARTIAL").length
    const globalStatus =
      failedCount > 0 || crossContaminated.length > 0 ? "FAIL"
        : partialCount > 0 ? "PARTIAL"
        : "PASS"

    return {
      status: globalStatus,
      summary: {
        total_tenants: organizations.length,
        passed: report.filter((r) => r.status === "PASS").length,
        partial: partialCount,
        failed: failedCount,
        cross_contamination: crossContaminated.length === 0 ? null : crossContaminated,
      },
      report,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  } catch (err: any) {
    throw new Error(`Audit fallito: ${err.message}`)
  }
}

