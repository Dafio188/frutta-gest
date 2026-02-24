/**
 * Combobox — Menu a tendina con ricerca
 *
 * Componente riutilizzabile per selezionare un valore
 * da una lista filtrata tramite ricerca testuale.
 * Stile macOS con glassmorphism e animazioni fluide.
 */

"use client"

import * as React from "react"
import { Search, Check, ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  subtitle?: string
  meta?: Record<string, any>
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string, option: ComboboxOption | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  label?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  onSearchChange?: (query: string) => void
  allowCustom?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seleziona...",
  searchPlaceholder = "Cerca...",
  emptyMessage = "Nessun risultato",
  label,
  error,
  disabled = false,
  loading = false,
  onSearchChange,
  allowCustom = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value) || (allowCustom && value ? { value, label: value } : undefined)

  const filtered = React.useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q))
    )
  }, [options, search])

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelect = (option: ComboboxOption) => {
    onValueChange(option.value, option)
    setSearch("")
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("", null)
    setSearch("")
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    onSearchChange?.(val)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="text-sm font-medium mb-1.5 block">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(!open)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className={cn(
          "w-full flex items-center justify-between h-10 px-3 rounded-xl border bg-background text-sm",
          "transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-destructive focus:ring-destructive/30"
            : "border-input",
          open && "ring-2 ring-ring/30 border-primary"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-xl border border-border/80",
            "bg-card/95 backdrop-blur-xl shadow-[var(--shadow-lg)]",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Caricamento...
              </div>
            ) : filtered.length === 0 && (!allowCustom || !search) ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <>
                {filtered.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm",
                      "transition-colors duration-100",
                      "hover:bg-muted/70",
                      value === option.value && "bg-primary/10 text-primary"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                      strokeWidth={2}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{option.label}</p>
                      {option.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
                {allowCustom && search && !filtered.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(search, { value: search, label: search, subtitle: "Prodotto personalizzato" })
                      setSearch("")
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm text-primary hover:bg-muted/70 transition-colors duration-100"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">Usa &quot;{search}&quot;</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive mt-1.5">{error}</p>
      )}
    </div>
  )
}
