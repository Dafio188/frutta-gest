"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Truck, Apple, Building2,
  Factory, FileText, CreditCard, TrendingUp, Settings, Search, Plus,
} from "lucide-react"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const commands = [
  { group: "Navigazione", items: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Ordini", icon: ShoppingCart, href: "/ordini" },
    { label: "Lista della Spesa", icon: ClipboardList, href: "/lista-spesa" },
    { label: "Bolle DDT", icon: Truck, href: "/bolle" },
    { label: "Catalogo Prodotti", icon: Apple, href: "/catalogo" },
    { label: "Clienti", icon: Building2, href: "/clienti" },
    { label: "Fornitori", icon: Factory, href: "/fornitori" },
    { label: "Ordini Fornitore", icon: ShoppingCart, href: "/acquisti" },
    { label: "Fatture Fornitore", icon: FileText, href: "/acquisti/fatture" },
    { label: "Fatture", icon: FileText, href: "/fatture" },
    { label: "Pagamenti", icon: CreditCard, href: "/finanza" },
    { label: "Report Vendite", icon: TrendingUp, href: "/report/vendite" },
    { label: "Impostazioni", icon: Settings, href: "/settings" },
  ]},
  { group: "Azioni Rapide", items: [
    { label: "Nuovo Ordine", icon: Plus, href: "/ordini/nuovo" },
    { label: "Nuovo Cliente", icon: Plus, href: "/clienti/nuovo" },
    { label: "Nuovo Fornitore", icon: Plus, href: "/fornitori/nuovo" },
    { label: "Nuova Fattura", icon: Plus, href: "/fatture/nuova" },
    { label: "Nuovo Ordine Fornitore", icon: Plus, href: "/acquisti/nuovo" },
    { label: "Nuova Fattura Fornitore", icon: Plus, href: "/acquisti/fatture/nuova" },
  ]},
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const router = useRouter()

  const navigate = useCallback((href: string) => {
    setCommandPaletteOpen(false)
    router.push(href)
  }, [router, setCommandPaletteOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommandPaletteOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [setCommandPaletteOpen])

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] as const }}
            className="fixed left-1/2 top-[20%] z-[61] w-full max-w-lg -translate-x-1/2"
          >
            <Command
              className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-xl)] overflow-hidden"
              label="Ricerca globale"
            >
              <div className="flex items-center gap-2 border-b border-border/50 px-4">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <Command.Input
                  placeholder="Cerca pagine, azioni..."
                  className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  Nessun risultato trovato.
                </Command.Empty>
                {commands.map((group) => (
                  <Command.Group
                    key={group.group}
                    heading={group.group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.href}
                        value={item.label}
                        onSelect={() => navigate(item.href)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer",
                          "aria-selected:bg-muted transition-colors"
                        )}
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        {item.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
