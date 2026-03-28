/**
 * Pagina Login — Unified Sliding Design
 */

"use client"

import { Suspense } from "react"
import AuthUnified from "@/components/auth/auth-unified"
import { getCurrentOrganization } from "@/lib/tenant-context"

export default async function LoginPage() {
  const org = await getCurrentOrganization()

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AuthUnified initialMode="login" tenantLogo={(org as any)?.logoUrl || undefined} />
    </Suspense>
  )
}

