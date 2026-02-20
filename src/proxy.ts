/**
 * Proxy di Protezione Route (Next.js 16)
 *
 * Sostituisce il vecchio middleware.ts.
 * Gira su Node.js runtime (supporta crypto, bcrypt, Prisma).
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/", "/login", "/register", "/forgot-password"]
const adminRoutes = ["/admin"]
const customerRoutes = ["/portale"]
const staffRoutes = [
  "/dashboard", "/ordini", "/bolle", "/catalogo", "/clienti",
  "/fornitori", "/fatture", "/finanza", "/lista-spesa", "/acquisti",
  "/magazzino", "/report", "/settings",
]

export async function proxy(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Skip static assets and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next()
  }

  const session = await auth()
  const isLoggedIn = !!session?.user
  const role = session?.user?.role

  // Public routes — redirect if already logged in
  if (publicRoutes.some((r) => pathname === r) && isLoggedIn) {
    if (["/login", "/register"].includes(pathname)) {
      const dest = role === "CUSTOMER" ? "/portale" : "/dashboard"
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Not logged in — redirect to login (except public & API)
  const isPublic = publicRoutes.some((r) => pathname === r)
  const isApiRoute = pathname.startsWith("/api")

  if (!isPublic && !isApiRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn) return NextResponse.next()

  // Le route admin richiedono ruolo ADMIN
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "ADMIN") {
      const dest = role === "CUSTOMER" ? "/portale" : "/dashboard"
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // CUSTOMER non puo accedere alle route staff
  if (role === "CUSTOMER") {
    if (staffRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/portale", request.url))
    }
  }

  // Staff non puo accedere alle route customer
  if (role !== "CUSTOMER") {
    if (customerRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images|fonts|icons).*)"],
}
