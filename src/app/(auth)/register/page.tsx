import { Suspense } from "react"
import { redirect } from "next/navigation"
import AuthUnified from "@/components/auth/auth-unified"
import { getTenantSlug } from "@/lib/tenant-context"

export default async function RegisterPage() {
  const slug = await getTenantSlug()
  
  // SICUREZZA: Non permettiamo la registrazione libera sul dominio Master.
  // I nuovi tenant/admin si registrano solo tramite invito (Phase 4).
  if (slug === 'master') {
    redirect("/contact?msg=registration_disabled")
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <AuthUnified initialMode="register" />
    </Suspense>
  )
}
