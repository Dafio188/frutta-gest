/**
 * Scheda Cliente Tenant — Server Component
 *
 * Carica i dati dell'organizzazione e degli utenti del tenant,
 * poi passa tutto al componente client per la visualizzazione e le azioni.
 */

import { notFound } from "next/navigation"
import { getOrganizationDetail, getTenantUsers } from "@/lib/actions-master"
import { OrgDetailClient } from "./org-client"

interface Props {
  params: Promise<{ orgId: string }>
}

export default async function OrgDetailPage({ params }: Props) {
  const { orgId } = await params

  let org: any
  let tenantUsers: any[] = []

  try {
    org = await getOrganizationDetail(orgId)
    tenantUsers = await getTenantUsers(orgId)
  } catch {
    notFound()
  }

  return <OrgDetailClient org={org} tenantUsers={tenantUsers} />
}
