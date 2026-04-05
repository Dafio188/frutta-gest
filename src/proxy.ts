import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const url = new URL(req.url)
  const pathname = url.pathname
  const hostname = req.headers.get('host') || '';

  // 1. Identificazione Tenant
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'fruttagest.it';
  // Sottodomini riservati: www/app/api ecc. → trattati come master, non come tenant
  const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'smtp'])
  let tenant = '';

  if (hostname === 'localhost:3650' || hostname === '127.0.0.1:3650') {
    // Query param ha la priorità massima
    let t: string | undefined = req.nextUrl.searchParams.get('tenant') ?? undefined;

    // Fallback 1: cookie persistente (fondamentale per le Server Actions POST)
    if (!t) {
      t = req.cookies.get('tenant')?.value;
    }

    // Fallback 2: referer (meno affidabile, usato solo come ultima risorsa)
    if (!t) {
      const referer = req.headers.get('referer');
      if (referer) {
        try {
          t = new URL(referer).searchParams.get('tenant') ?? undefined;
        } catch (_e) {}
      }
    }

    tenant = t || 'master';
  } else if (hostname === rootDomain) {
    // fruttagest.it → master
    tenant = 'master';
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.replace(`.${rootDomain}`, '');
    // www.fruttagest.it → master (non è un tenant)
    tenant = RESERVED_SUBDOMAINS.has(sub) ? 'master' : sub;
  } else {
    tenant = hostname;
  }

  // 2. Protezione SuperAdmin (Global Master - Infrastruttura e CRM SaaS)
  const isSuperAdminArea = pathname.startsWith("/admin-master") || pathname.startsWith("/saas-crm")
  
  if (isSuperAdminArea) {
    const isLoggedIn = !!req.auth?.user
    const email = req.auth?.user?.email?.toLowerCase()
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
    const isSuperAdmin = email === superAdminEmail
    
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.host = req.headers.get("host") || loginUrl.host
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    if (!isSuperAdmin) {
      const dashUrl = new URL("/dashboard", req.url)
      dashUrl.host = req.headers.get("host") || dashUrl.host
      return NextResponse.redirect(dashUrl)
    }
  }

  // 3. Protezione Area Privata (Dashboard dei clienti e operatori vari)
  const isPrivateRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/settings") || 
    pathname.startsWith("/profile") ||
    pathname.startsWith("/notifiche") ||
    pathname.startsWith("/ordini") ||
    pathname.startsWith("/finanza") ||
    pathname.startsWith("/clienti") ||
    pathname.startsWith("/fornitori") ||
    pathname.startsWith("/portale") ||
    pathname.startsWith("/fatture");
  
  if (isPrivateRoute) {
    const isLoggedIn = !!req.auth?.user;
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.host = req.headers.get("host") || loginUrl.host
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 4. Iniezione Header Tenant
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('X-Tenant-Slug', tenant);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 4. Persistenza tenant nel cookie (essenziale per le Server Actions POST)
  // Le Server Actions non portano query params → il cookie è la fonte affidabile
  if (tenant && tenant !== 'master') {
    response.cookies.set('tenant', tenant, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 ore, si rinnova ad ogni navigazione
    });
  } else {
    // Pulisci il cookie sul dominio master per evitare contaminazioni
    response.cookies.delete('tenant');
  }

  return response;
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|icons|privacy|terms|contact).*)",
  ],
}
