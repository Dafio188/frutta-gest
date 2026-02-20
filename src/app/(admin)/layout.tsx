/**
 * Layout Admin Panel
 *
 * Estende il layout dashboard con navigazione admin.
 * Accessibile solo agli utenti con ruolo ADMIN.
 */

import { SessionProvider } from "next-auth/react"
import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
