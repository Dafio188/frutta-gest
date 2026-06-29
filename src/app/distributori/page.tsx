"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Truck,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Star,
  ChevronDown,
  HelpCircle,
  Smartphone,
  ShoppingCart,
  Users,
  BarChart3,
  MessageCircle,
  ClipboardList,
  FileCheck,
} from "lucide-react"
import { PublicHeader } from "@/components/layouts/public-header"
import Head from "next/head"

const features = [
  {
    icon: MessageCircle,
    title: "Ordini da WhatsApp con AI",
    description:
      "I clienti inviano ordini via WhatsApp o messaggi vocali. L'AI li interpreta e li converte automaticamente in righe d'ordine."
  },
  {
    icon: Truck,
    title: "Gestione Giri e Consegne",
    description:
      "Pianifica i giri dei furgoni, ottimizza i percorsi e tieni traccia di ogni consegna in tempo reale."
  },
  {
    icon: ClipboardList,
    title: "Listini Personalizzati",
    description:
      "Crea listini prezzi dedicati per ogni cliente. Gestisci sconti, promozioni e condizioni specifiche."
  },
  {
    icon: FileCheck,
    title: "Fatturazione Automatica",
    description:
      "DDT e fatture generate automaticamente dagli ordini confermati. Zero errori, zero stress."
  },
  {
    icon: BarChart3,
    title: "Report e Analisi",
    description:
      "Dashboard con report vendite, margini e trend in tempo reale. Decisioni basate sui dati."
  },
  {
    icon: Users,
    title: "CRM Clienti",
    description:
      "Storico ordini, preferenze e contatti per ogni cliente. Tutto a portata di click."
  },
]

const faqs = [
  {
    q: "Come funziona l'integrazione con WhatsApp?",
    a: "I tuoi clienti ti inviano ordini su WhatsApp come sempre. FruttaGest interpreta automaticamente il testo o i messaggi vocali e li trasforma in righe d'ordine pronte da confermare. Nessuna trascrizione manuale."
  },
  {
    q: "Posso gestire listini diversi per ogni cliente?",
    a: "Assolutamente sì. Puoi creare listini personalizzati per ogni ristorante, hotel o supermercato, con prezzi, sconti e condizioni specifiche. Ogni cliente vede il suo listino dedicato."
  },
  {
    q: "Come vengono generate le fatture?",
    a: "Una volta confermato l'ordine e la consegna, DDT e fattura vengono generati automaticamente. Puoi inviarli via email direttamente dalla piattaforma o scaricarli in PDF."
  },
]

export default function DistributoriPage() {
  return (
    <>
      <Head>
        <title>FruttaGest Distributori — Software per Distributori Ortofrutticoli</title>
        <meta name="description" content="FruttaGest Distributori: gestisci ordini da WhatsApp con AI, giri di consegna, listini personalizzati e fatturazione automatica. Per chi consegna a ristoranti e hotel." />
        <meta name="keywords" content="distributori ortofrutta, software distribuzione ortofrutticola, gestione ordini WhatsApp, fatturazione automatica ortofrutta" />
        <meta property="og:title" content="FruttaGest Distributori — Software per Distributori Ortofrutticoli" />
        <meta property="og:description" content="Gestisci ordini da WhatsApp con AI, giri di consegna e fatturazione automatica. Pensato per chi consegna a ristoranti e hotel." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://fruttagest.it/distributori" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
        <PublicHeader />

        {/* ============================================= */}
        {/* HERO SECTION                                  */}
        {/* ============================================= */}
        <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          {/* Decorative gradient blobs */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-green/20 via-brand-blue/20 to-brand-orange/20 blur-3xl dark:from-brand-green/10 dark:via-brand-blue/10" />
          <div className="pointer-events-none absolute right-0 top-20 h-[300px] w-[400px] rounded-full bg-gradient-to-l from-brand-green/20 to-transparent blur-3xl dark:from-brand-green/10" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 text-sm font-medium text-brand-green dark:border-brand-green/30 dark:bg-brand-green/10 dark:text-brand-green">
                <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
                Disponibile Ora
              </div>

              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                  <Truck className="h-8 w-8" strokeWidth={1.75} />
                </div>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                FruttaGest{" "}
                <span className="bg-gradient-to-r from-brand-green to-emerald-600 bg-clip-text text-transparent">
                  Distributori
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Per chi consegna a ristoranti e hotel.
                <span className="block mt-2 font-medium text-foreground">
                  Ordini da WhatsApp, giri di consegna, listini personalizzati e fatturazione automatica.
                </span>
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25 sm:w-auto"
                >
                  Inizia Ora
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
                >
                  Richiedi Demo
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                  SaaS cloud sicuro
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                  Prova gratuita 14 giorni
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* PRICING HIGHLIGHT                             */}
        {/* ============================================= */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-brand-green/20 bg-gradient-to-br from-brand-green/5 via-white to-white p-8 text-center shadow-lg shadow-brand-green/5 dark:from-brand-green/10 dark:via-background dark:to-background sm:p-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Piano Unico — Tutto Incluso
              </h2>
              <p className="mt-3 text-muted-foreground">
                Nessun canone mensile. Unico pagamento una tantum, aggiornamenti annuali.
              </p>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-brand-green sm:text-6xl">
                    €599,00
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">una tantum</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aggiornamento annuo: €299,00
                </p>
              </div>
              <ul className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {[
                  "Ordini da WhatsApp con AI",
                  "Gestione giri e consegne",
                  "Listini personalizzati",
                  "Fatturazione automatica",
                  "Report e dashboard",
                  "Supporto tecnico dedicato",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="h-5 w-5 shrink-0 text-brand-green" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25"
              >
                Inizia Ora
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* FEATURES SECTION                              */}
        {/* ============================================= */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tutto ciò che serve al tuo business
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Funzionalità specifiche per distributori ortofrutticoli: dalla ricezione ordini alla consegna.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-green/5 dark:bg-card/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green transition-colors group-hover:bg-brand-green/20 dark:bg-brand-green/20 dark:text-brand-green dark:group-hover:bg-brand-green/30">
                    <feature.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* FAQ SECTION                                   */}
        {/* ============================================= */}
        <section className="bg-emerald-50/30 px-4 py-20 dark:bg-emerald-950/10 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Domande Frequenti
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Tutto quello che devi sapere su FruttaGest Distributori.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm transition-all hover:shadow-md dark:bg-card/60"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-foreground">
                    {faq.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" strokeWidth={1.75} />
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* CTA SECTION                                   */}
        {/* ============================================= */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Inizia ora con FruttaGest Distributori
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Unisciti a centinaia di aziende ortofrutticole che hanno già scelto la nostra piattaforma.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25 sm:w-auto"
              >
                Crea il tuo account gratuito
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
              >
                Richiedi Demo
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* FOOTER                                        */}
        {/* ============================================= */}
        <footer className="border-t border-border/40 bg-card/50 px-4 py-10 dark:bg-card/30 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/LOGO.png"
                alt="FruttaGest"
                width={260}
                height={80}
                className="h-12 w-auto"
              />
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
    </>
  )
}
