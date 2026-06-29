/**
 * Custom 404 — FruttaGest
 *
 * Pagina di errore personalizzata in stile FruttaGest,
 * con gradienti brand, glassmorphism, e navigazione di recupero.
 */

import Link from "next/link"
import { PublicHeader } from "@/components/layouts/public-header"
import { ArrowLeft, Home, ShoppingCart, HelpCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
      <PublicHeader />

      <main className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-green/15 via-brand-blue/15 to-brand-orange/15 blur-3xl dark:from-brand-green/10 dark:via-brand-blue/10" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[300px] w-[400px] rounded-full bg-gradient-to-l from-brand-orange/15 to-transparent blur-3xl dark:from-brand-orange/10" />

        <div className="relative mx-auto max-w-2xl text-center">
          {/* 404 Number */}
          <div className="mb-2 select-none">
            <span className="text-[12rem] font-black leading-none tracking-tighter sm:text-[16rem]">
              <span className="bg-gradient-to-r from-brand-green via-brand-blue to-brand-orange bg-clip-text text-transparent">
                404
              </span>
            </span>
          </div>

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-sm font-medium text-brand-orange dark:border-brand-orange/30 dark:bg-brand-orange/10 dark:text-brand-orange">
            <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            Pagina non trovata
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questa pagina non esiste
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Forse il link è cambiato, la pagina è stata spostata,
            o hai semplicemente digitato male l&apos;indirizzo.
            Torniamo alla frutta fresca?
          </p>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25 sm:w-auto"
            >
              <Home className="h-4 w-4" strokeWidth={1.75} />
              Torna alla Home
            </Link>
            <Link
              href="/#suite"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
              Scopri la Suite
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Contattaci
            </Link>
          </div>

          {/* Helpful links */}
          <div className="mt-14 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-sm dark:bg-card/50">
            <p className="text-sm font-medium text-foreground">
              Potresti cercare queste pagine?
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Home
              </Link>
              <Link
                href="/#suite"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Suite Applicativi
              </Link>
              <Link
                href="/#confronto"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Confronto Funzionalità
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Contatti
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Registrati
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 px-4 py-10 dark:bg-card/30 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <picture>
              <img
                src="/LOGO.png"
                alt="FruttaGest"
                className="h-12 w-auto"
              />
            </picture>
            <span className="text-sm font-medium text-muted-foreground">
              &copy; 2026 FruttaGest. Tutti i diritti riservati.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Termini
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-foreground"
            >
              Contatti
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
