/**
 * SaaS CRM — Hub Vendite e Provisioning SuperAdmin
 *
 * Versione Server Component: recupera i dati reali dal Master DB.
 */

import { getLeads, getSaaSSummary, getMasterOrganizations } from "@/lib/actions-master"
import { SaasCrmClient } from "./crm-client"
import { IsolationAuditPanel } from "@/components/saas/isolation-audit-panel"

export default async function SaasCrmPage() {
  // Recupero dati in parallelo per massime performance
  const [summary, leads, organizations] = await Promise.all([
    getSaaSSummary(),
    getLeads(),
    getMasterOrganizations()
  ])

  return (
    <div className="space-y-6">
      <SaasCrmClient 
        initialSummary={summary}
        initialLeads={leads}
        initialOrganizations={organizations}
      />
      {/* Diagnostica isolamento — sezione riservata al tech review */}
      <div className="px-4 md:px-0">
        <IsolationAuditPanel />
      </div>
    </div>
  )
}

