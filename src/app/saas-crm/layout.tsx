/**
 * Layout SaaS CRM — Sezione SuperAdmin
 *
 * Utilizza la sidebar globale ma filtra le sezioni per il SuperAdmin.
 * Protetto da auth.config.ts e middleware.
 */

import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"
import { ToastContainer } from "@/components/ui/toast"

export default function SaasCrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
