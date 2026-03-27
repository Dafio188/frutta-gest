import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/validations"

export const authConfig = {
  providers: [], // Verranno popolati in auth.ts
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdminMaster = nextUrl.pathname.startsWith("/admin-master")
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      
      if (isOnAdminMaster) {
        if (isLoggedIn && auth?.user?.email === process.env.SUPER_ADMIN_EMAIL) return true
        return false // Redirect to login
      }
      
      return true
    },
  },
} satisfies NextAuthConfig
