/**
 * SaaS CRM — Hub Vendite e Provisioning SuperAdmin
 *
 * Versione Server Component: recupera i dati reali dal Master DB.
 */

import { getLeads, getSaaSSummary, getMasterOrganizations } from "@/lib/actions-master"
import { SaasCrmClient } from "./crm-client"

export default async function SaasCrmPage() {
  // Recupero dati in parallelo per massime performance
  const [summary, leads, organizations] = await Promise.all([
    getSaaSSummary(),
    getLeads(),
    getMasterOrganizations()
  ])

  return (
    <SaasCrmClient 
      initialSummary={summary}
      initialLeads={leads}
      initialOrganizations={organizations}
    />
  )
}
