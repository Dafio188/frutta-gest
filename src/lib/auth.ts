/**
 * Configurazione Autenticazione NextAuth.js v5
 *
 * Supporta: email+password con bcrypt, Google OAuth.
 * Le sessioni usano JWT con durata 30 giorni.
 * Il ruolo utente viene incluso nel token JWT.
 */

import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
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
    }
  }

  interface User {
    role: Role
    customerId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    customerId?: string | null
  }
}

const providers: NextAuthConfig["providers"] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

providers.push(
  Credentials({
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials)
      if (!parsed.success) return null

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      })

      if (!user || !user.password || !user.isActive) return null

      const passwordMatch = await bcrypt.compare(
        parsed.data.password,
        user.password
      )

      if (!passwordMatch) return null

      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        customerId: user.customerId,
      }
    },
  })
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db) as never,
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as Role
        session.user.customerId = (token.customerId as string | null) ?? null
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.customerId = user.customerId ?? null
      }
      if (token.sub && !user) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, customerId: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.customerId = dbUser.customerId ?? null
        }
      }
      return token
    },
  },
})
