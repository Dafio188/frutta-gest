import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/validations"

export const authConfig = {
  trustHost: true,
  providers: [], // Verranno popolati in auth.ts
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const user = auth?.user
      const email = user?.email?.toLowerCase()
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
      
      // SICUREZZA: Un utente è SuperAdmin solo se l'email corrisponde E il contesto è 'master'
      const tenantSlug = nextUrl.hostname.split('.')[0] === 'localhost' ? 'master' : nextUrl.hostname.split('.')[0]
      const isMasterDomain = tenantSlug === 'master' || tenantSlug === 'localhost' || tenantSlug === 'fruttagest'
      const isSuperAdmin = email === superAdminEmail && isMasterDomain

      const { pathname } = nextUrl
      
      // 1. Aree Esclusive SuperAdmin (CRM SaaS e Infrastruttura Master)
      const isSuperAdminArea = pathname.startsWith("/admin-master") || pathname.startsWith("/saas-crm")
      if (isSuperAdminArea) {
        if (!isLoggedIn) return false // Redirect a /login
        return isSuperAdmin // Solo se è SuperAdmin REALE nel contesto master
      }

      // 2. Area Amministrazione Tenant (Esclusiva per Admin del tenant, esclusi SuperAdmin e clienti)
      const isAdminArea = pathname.startsWith("/admin")
      if (isAdminArea) {
        if (!isLoggedIn) return false
        // Un SuperAdmin NON entra in /admin (ha /admin-master), un Customer non entra in /admin
        return (user?.role === 'ADMIN' || isSuperAdmin) // Permettiamo al SuperAdmin per ora per test, ma separiamo poi
      }

      // 3. Area Operativa Comune (Dashboard, Ordini, Prodotti, ecc.)
      const isPrivateRoute = 
        pathname.startsWith("/dashboard") || 
        pathname.startsWith("/settings") || 
        pathname.startsWith("/profile") ||
        pathname.startsWith("/notifiche")
      
      if (isPrivateRoute) {
        if (isLoggedIn) return true
        return false // Reindirizza a /login
      }
      
      return true
    },
  },
} satisfies NextAuthConfig
