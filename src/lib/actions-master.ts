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
