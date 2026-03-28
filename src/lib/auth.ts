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

        try {
          const slug = await getTenantSlug()
          let db: any;
          
          if (slug === 'master') {
            process.stdout.write(`[AUTH DEBUG] Atomic Master Client Initializing...\n`)
            const masterUrl = process.env.MASTER_DATABASE_URL + (process.env.MASTER_DATABASE_URL?.includes('?') ? '&' : '?') + 'schema=master&search_path=master';
            db = new MasterClient({ adapter: masterAdapter })
          } else {
            db = await getCurrentDb()
          }

          process.stdout.write(`[AUTH DEBUG] Attempt: ${parsed.data.email} | Tenant: ${slug}\n`)
          process.stdout.write(`[AUTH DEBUG] DB Keys: ${Object.keys(db || {}).join(', ')}\n`);
          
          const user = await db.user.findUnique({
             where: { email: parsed.data.email },
          });

          if (!user) {
            console.log(`[AUTH DEBUG] User not found in DB for tenant ${slug}`)
            return null
          }

          if (!user.password || !user.isActive) {
            console.log(`[AUTH DEBUG] User inactive or no password`)
            return null
          }

          const passwordMatch = await bcrypt.compare(
            parsed.data.password,
            user.password
          )

          if (!passwordMatch) {
            console.log(`[AUTH DEBUG] Password mismatch`)
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
        token.role = user.role
        token.customerId = user.customerId ?? null
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
