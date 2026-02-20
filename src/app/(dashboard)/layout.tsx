/**
 * Layout Dashboard — Area autenticata principale
 *
 * Sidebar + Header + Content area con padding consistente.
 * Include Toast notifications e Command Palette globali.
 * Protetto dal middleware di autenticazione.
 */

import { SessionProvider } from "next-auth/react"
import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"
import { ToastContainer } from "@/components/ui/toast"
import { CommandPalette } from "@/components/ui/command-palette"

export default function DashboardLayout({
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
      <ToastContainer />
      <CommandPalette />
    </SessionProvider>
  )
}
