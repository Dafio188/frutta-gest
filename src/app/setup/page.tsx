/**
 * Pagina di Setup — Attivazione Piattaforma Tenant
 *
 * Questa pagina viene aperta dal cliente (es. Simone) tramite Magic Link.
 * Permette di impostare la password definitiva e attivare l'accesso.
 */

import { getInviteByToken } from "@/lib/actions-master"
import { SetupClient } from "./setup-client"
import { Shield } from "lucide-react"

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
           <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
           <h1 className="text-2xl font-bold text-foreground">Token mancante</h1>
           <p className="text-muted-foreground mt-2">Usa il link ricevuto via email per accedere al setup.</p>
        </div>
      </div>
    )
  }

  const result = await getInviteByToken(token)

  if (!result || !result.organization) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
           <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
           <h1 className="text-2xl font-bold text-foreground">Link non valido o scaduto</h1>
           <p className="text-muted-foreground mt-2">L'invito potrebbe esser stato annullato o il cliente rimosso.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
        <SetupClient 
          token={token} 
          organizationName={result.organization.name}
          email={result.email}
        />
    </div>
  )
}
