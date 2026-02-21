/**
 * Header Portale Clienti — Stile Title Bar macOS
 *
 * Breadcrumb, theme toggle e info utente.
 */

"use client"

import { usePathname } from "next/navigation"
import { Menu, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const pathLabels: Record<string, string> = {
  portale: "Dashboard",
  catalogo: "Catalogo",
  ordini: "I Miei Ordini",
  fatture: "Fatture",
  pagamenti: "Pagamenti",
  nuovo: "Nuovo Ordine",
}

export function CustomerHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { setSidebarOpen } = useUIStore()
  const [isDark, setIsDark] = useState(
    typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
  )

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

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
            src="/LOGO.png"
            alt="FruttaGest"
            width={200}
            height={70}
            priority
            className="h-10 w-auto"
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

      {/* Right: theme toggle + avatar */}
      <div className="flex items-center gap-2">
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

        {session?.user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-sm ml-1">
            {session.user.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
        )}
      </div>
    </header>
  )
}
