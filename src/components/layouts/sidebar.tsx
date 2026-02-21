/**
 * Sidebar Navigazione — Stile Finder macOS
 *
 * Sidebar con navigazione raggruppata, avatar utente,
 * indicatore pagina attiva con animazione layout, collapsabile.
 */

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Truck,
  Apple, Building2, Factory, FileText, CreditCard, Calendar,
  TrendingUp, BarChart3, PieChart, Settings, LogOut, ChevronLeft,
  Menu, Leaf, Warehouse,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { signOut, useSession } from "next-auth/react"
import { SIDEBAR_NAV } from "@/lib/constants"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, ShoppingCart, ClipboardList, Truck,
  Apple, Building2, Factory, FileText, CreditCard, Calendar,
  TrendingUp, BarChart3, PieChart, Leaf, Warehouse,
}

export function Sidebar() {
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
        <div className="flex h-24 items-center justify-between px-4 border-b border-border/50">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/LOGO.png"
                alt="FruttaGest"
                width={360}
                height={120}
                priority
                className="h-20 w-auto"
              />
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Image
                src="/LOGO.png"
                alt="FruttaGest"
                width={36}
                height={36}
                priority
                className="h-7 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} strokeWidth={1.75} />
          </button>
        </div>

        {/* User info */}
        {session?.user && !sidebarCollapsed && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
              {session.user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.role}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {SIDEBAR_NAV.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutDashboard
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        "transition-all duration-200",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
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
        <div className="border-t border-border/50 p-3 space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {!sidebarCollapsed && <span>Impostazioni</span>}
          </Link>
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
