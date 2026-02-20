/**
 * Sidebar Portale Clienti — Stile Finder macOS
 *
 * Sidebar dedicata al portale clienti con navigazione semplificata,
 * nome azienda e bottone logout.
 */

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ShoppingCart, Apple, FileText, CreditCard,
  LogOut, ChevronLeft, Leaf, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { signOut, useSession } from "next-auth/react"
import { PORTAL_SIDEBAR_NAV } from "@/lib/constants"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, ShoppingCart, Apple, FileText, CreditCard,
}

export function CustomerSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore()

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border/50",
          "bg-card/80 backdrop-blur-xl backdrop-saturate-150",
          "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "lg:relative lg:z-auto",
          sidebarCollapsed ? "w-[72px]" : "w-[280px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          {!sidebarCollapsed && (
            <Link href="/portale" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Leaf className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="text-lg font-semibold tracking-tight">FruttaGest</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} strokeWidth={1.75} />
          </button>
        </div>

        {/* Customer info */}
        {session?.user && !sidebarCollapsed && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Portale Cliente</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {PORTAL_SIDEBAR_NAV.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutDashboard
                  const isActive = pathname === item.href || (item.href !== "/portale" && pathname.startsWith(item.href + "/"))
                    || (item.href === "/portale" && pathname === "/portale")

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        "transition-all duration-200",
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="portal-sidebar-active"
                          className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="relative z-10 h-5 w-5 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && (
                        <span className="relative z-10 truncate">{item.label}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!sidebarCollapsed && <span>Esci</span>}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
