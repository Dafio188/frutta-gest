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
    tenant = req.nextUrl.searchParams.get('tenant') || 'fruttagest';
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
    const isSuperAdmin = req.auth?.user?.email === process.env.SUPER_ADMIN_EMAIL
    
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|fonts|icons|privacy|terms|contact).*)",
  ],
}
