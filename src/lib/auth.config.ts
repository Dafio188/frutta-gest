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
        if (isLoggedIn && auth?.user?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) return true
        return false // Redirect to login
      }

      // Proteggi dashboard e amministrazione
      const isPrivateRoute = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/settings");
      
      if (isPrivateRoute) {
        if (isLoggedIn) return true;
        return false; // Reindirizza a /login
      }
      
      return true
    },
  },
} satisfies NextAuthConfig
