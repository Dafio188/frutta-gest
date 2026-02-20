import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

type SessionToken = {
  role?: "ADMIN" | "OPERATOR" | "VIEWER" | "CUSTOMER"
}

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })) as SessionToken | null
  const role = token?.role

  const protectedPrefixes = [
    "/dashboard",
    "/ordini",
    "/lista-spesa",
    "/bolle",
    "/catalogo",
    "/clienti",
    "/fornitori",
    "/acquisti",
    "/magazzino",
    "/fatture",
    "/finanza",
    "/report",
    "/admin",
    "/portale",
  ]

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (isProtected && !token) {
    const url = new URL("/login", origin)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const url = new URL("/dashboard", origin)
    return NextResponse.redirect(url)
  }

  if (pathname === "/dashboard" && role === "CUSTOMER") {
    const url = new URL("/portale", origin)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|api/auth|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
