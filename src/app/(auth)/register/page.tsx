/**
 * Pagina Registrazione — Unified Sliding Design
 */

import { Suspense } from "react"
import AuthUnified from "@/components/auth/auth-unified"

export default function RegisterPage() {
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
