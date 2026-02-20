/**
 * Layout Portale Clienti — Area autenticata cliente
 *
 * CustomerSidebar + CustomerHeader + Content area.
 * Protetto dal middleware di autenticazione (role: CUSTOMER).
 */

import { SessionProvider } from "next-auth/react"
import { CustomerSidebar } from "@/components/layouts/customer-sidebar"
import { CustomerHeader } from "@/components/layouts/customer-header"
import { ToastContainer } from "@/components/ui/toast"

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <CustomerSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <CustomerHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
    </SessionProvider>
  )
}
