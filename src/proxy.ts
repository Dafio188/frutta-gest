import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname
  const hostname = req.headers.get('host') || '';

  // 1. Identificazione Tenant
  let tenant = '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'fruttagest.it';
  
  if (hostname === 'localhost:3650' || hostname === '127.0.0.1:3650') {
    let t = req.nextUrl.searchParams.get('tenant');
    if (!t) {
      const referer = req.headers.get('referer');
      if (referer) {
        try {
          t = new URL(referer).searchParams.get('tenant');
        } catch(e) {}
      }
    }
    tenant = t || 'master';
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    tenant = hostname.replace(`.${rootDomain}`, '');
  } else if (hostname === rootDomain) {
    tenant = 'master';
  } else {
    tenant = hostname; 
  }

  // 2. Protezione SuperAdmin (Global Master)
  if (pathname.startsWith("/admin-master")) {
    const isLoggedIn = !!req.auth?.user
    const isSuperAdmin = req.auth?.user?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
    
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.host = req.headers.get("host") || loginUrl.host // FIX DOMINIO CUSTOM
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    if (!isSuperAdmin) {
      const dashUrl = new URL("/dashboard", req.url)
      dashUrl.host = req.headers.get("host") || dashUrl.host // FIX DOMINIO CUSTOM
      return NextResponse.redirect(dashUrl)
    }
  }

  // 3. Iniezione Header Tenant
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('X-Tenant-Slug', tenant);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|icons|privacy|terms|contact).*)",
  ],
}
