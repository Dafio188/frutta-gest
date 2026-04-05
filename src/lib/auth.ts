console.log('[AUTH.TS] Module Loaded');
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs"
import { getCurrentDb, getTenantSlug } from "@/lib/tenant-context"
import { masterDb } from "@/lib/master-db"
import { loginSchema } from "@/lib/validations"
import type { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
      role: Role
      customerId?: string | null
      tenantSlug: string
      isSuperAdmin: boolean
      logoUrl?: string | null
      primaryColor?: string | null
    }
  }

  interface User {
    role: Role
    customerId?: string | null
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role
    customerId?: string | null
    tenantSlug: string
    isSuperAdmin: boolean
    logoUrl?: string | null
    primaryColor?: string | null
  }
}

import { PrismaClient as MasterClient } from "../generated/master-client/index.js"
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const masterPool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL })
const masterAdapter = new PrismaPg(masterPool as any)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          console.error(`[AUTH DEBUG] Validation failed:`, parsed.error.format())
          return null
        }

        const email = parsed.data.email.toLowerCase()
        const password = parsed.data.password

        try {
          const slug = await getTenantSlug()
          let db: any;
          
          if (slug === 'master') {
            console.log(`[AUTH DEBUG] Using Master DB for ${email}`)
            db = masterDb
          } else {
            console.log(`[AUTH DEBUG] Using Tenant DB for ${email} (Tenant: ${slug})`)
            db = await getCurrentDb()
          }

          const user = await db.user.findUnique({
             where: { email },
          });

          if (!user) {
            console.log(`[AUTH DEBUG] User ${email} not found in DB for slug: ${slug}`)
            return null
          }

          if (!user.password || !user.isActive) {
            console.log(`[AUTH DEBUG] User ${email} exists but is inactive or has no password`)
            return null
          }

          const passwordMatch = await bcrypt.compare(password, user.password)

          if (!passwordMatch) {
            console.log(`[AUTH DEBUG] Password mismatch for ${email}`)
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: (user as any).image || null,
            role: user.role,
            customerId: (user as any).customerId || null,
          }
        } catch (error) {
          console.error("[AUTH CRITICAL ERROR]:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Se è Credentials (ha già validato nel authorize), lascia passare
      if (account?.provider === "credentials") return true;

      // Se è OAuth (Google), controlliamo nel DB se l'utente esiste
      if (user.email) {
        try {
          const email = user.email.toLowerCase();
          const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
          
          if (email === superAdminEmail) {
             console.log(`[AUTH DEBUG] SuperAdmin OAuth login bypassed DB check for slug`);
             user.role = "ADMIN"; // Forziamo un ruolo compatibile
             return true;
          }

          const { getTenantSlug, getCurrentDb } = await import("@/lib/tenant-context");
          const { masterDb } = await import("@/lib/master-db");
          const slug = await getTenantSlug();
          let db: any = slug === 'master' ? masterDb : await getCurrentDb();
          
          const dbUser = await db.user.findUnique({ where: { email } });
          
          if (!dbUser) {
            console.log(`[AUTH DEBUG] Google Login rejected: User ${email} does not exist in domain ${slug}`);
            // Puoi gestire l'auto-creazione qui se desiderato, ma in B2B di solito si rifiuta
            return false; // Access Denied
          }
          
          if (!dbUser.isActive) {
            console.log(`[AUTH DEBUG] Google Login rejected: User ${email} is inactive`);
            return false;
          }
          
          // Popoliamo l'oggetto user con i dati del DB per il passaggio a jwt()
          user.role = dbUser.role;
          user.customerId = dbUser.customerId;
          user.id = dbUser.id;
          
          return true;
        } catch (e) {
          console.error("SignIn Callback Error", e);
          return false;
        }
      }
      return false;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as Role
        session.user.customerId = (token.customerId as string | null) ?? null
        session.user.tenantSlug = token.tenantSlug
        session.user.isSuperAdmin = !!token.isSuperAdmin
        session.user.logoUrl = token.logoUrl
        session.user.primaryColor = token.primaryColor
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        // Al primo login (OAuth o Credentials), user contiene role e customerId
        token.role = (user as any).role
        token.customerId = (user as any).customerId ?? null
        const { getTenantSlug } = await import("@/lib/tenant-context")
        token.tenantSlug = await getTenantSlug()
        token.isSuperAdmin = user.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
        
        // Carica il branding dal Master DB
        if (token.tenantSlug && token.tenantSlug !== 'master') {
          const { masterDb } = await import("@/lib/master-db")
          const org = await masterDb.organization.findUnique({ where: { slug: token.tenantSlug } }) as any
          if (org) {
            token.logoUrl = org.logoUrl
            token.primaryColor = org.primaryColor
          }
        }

      }
      return token
    },
  },
})
