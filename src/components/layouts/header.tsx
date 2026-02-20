/**
 * Header Dashboard — Stile Title Bar macOS
 *
 * Breadcrumb, ricerca globale (Cmd+K), notifiche, theme toggle, avatar.
 */

"use client"

import { usePathname } from "next/navigation"
import { Menu, Search, Bell, Sun, Moon, Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  ordini: "Ordini",
  catalogo: "Catalogo Prodotti",
  "lista-spesa": "Lista della Spesa",
  bolle: "Bolle DDT",
  fatture: "Fatture",
  clienti: "Clienti",
  fornitori: "Fornitori",
  finanza: "Finanza",
  report: "Report",
  settings: "Impostazioni",
  profile: "Profilo",
  admin: "Amministrazione",
  nuovo: "Nuovo",
  nuova: "Nuova",
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { setSidebarOpen, setCommandPaletteOpen } = useUIStore()
  const [isDark, setIsDark] = useState(
    typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
  )

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  // Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setCommandPaletteOpen])

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((segment) => ({
    label: pathLabels[segment] || segment,
    segment,
  }))

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Left: hamburger + logo + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <Link href="/" className="hidden sm:flex items-center">
          <Image
            src="/logo-fruttagest.png"
            alt="FruttaGest"
            width={148}
            height={40}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.segment} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span className={cn(
                i === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}>
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 h-9 rounded-xl border border-border/50 bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
          <span>Cerca...</span>
          <kbd className="flex items-center gap-0.5 rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          )}
        </button>

        {/* Avatar */}
        {session?.user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm ml-1">
            {session.user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    </header>
  )
}
