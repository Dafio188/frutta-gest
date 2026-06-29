"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ShoppingBasket,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Star,
  ChevronDown,
  Smartphone,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Gift,
  Globe,
  Trash2,
} from "lucide-react"
import { PublicHeader } from "@/components/layouts/public-header"
import Head from "next/head"

const features = [
  {
    icon: CreditCard,
    title: "Punto Cassa Smart",
    description:
      "Registra le vendite al dettaglio con un'interfaccia pensata per il banco. Velocità e precisione ad ogni transazione."
  },
  {
    icon: Gift,
    title: "Fidelity Card Clienti",
    description:
      "Programma fedeltà integrato: punti, sconti e promozioni personalizzate per fidelizzare la tua clientela."
  },
  {
    icon: Globe,
    title: "E-commerce Locale",
    description:
      "Vendi online ai tuoi clienti di zona. Ordini via web, ritiro in negozio o consegna a domicilio."
  },
  {
    icon: Trash2,
    title: "Gestione Scarti",
    description:
      "Tracciamento degli scarti e delle rimanenze per ridurre gli sprechi e ottimizzare gli acquisti."
  },
  {
    icon: BarChart3,
    title: "Report Vendite",
    description:
      "Analisi giornaliere delle vendite, margini e prodotti più venduti. Decisioni basate sui dati."
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Usa FruttaGest Fruttivendolo anche dal tuo smartphone. Perfetto per gestire il negozio in movimento."
  },
]

const faqs = [
  {
    q: "Quando sarà disponibile FruttaGest Fruttivendolo?",
    a: "Stiamo lavorando al rilascio. FruttaGest Fruttivendolo è attualmente in fase di sviluppo. Iscriviti alla lista d'attesa per essere tra i primi a ricevere l'accesso e una demo esclusiva."
  },
  {
    q: "Posso gestire la fidelity card dei clienti?",
    a: "Sì, il modulo include un programma fedeltà completo: accumulo punti, sconti personalizzati, promozioni e notifiche automatiche per mantenere i clienti coinvolti."
  },
  {
    q: "Come funziona l'e-commerce locale?",
    a: "I tuoi clienti possono ordinare online dal tuo catalogo digitale, scegliere il ritiro in negozio o la consegna a domicilio. Gli ordini arrivano direttamente al punto cassa."
  },
]

export default function FruttivendoloPage() {
  return (
    <>
      <Head>
        <title>FruttaGest Fruttivendolo — Software per Negozi di Frutta e Verdura</title>
        <meta name="description" content="FruttaGest Fruttivendolo: punto cassa smart, fidelity card, e-commerce locale e gestione scarti. Per negozi al dettaglio di ortofrutta." />
        <meta name="keywords" content="fruttivendolo software, punto cassa ortofrutta, fidelity card fruttivendolo, e-commerce ortofrutta locale, gestione scarti" />
        <meta property="og:title" content="FruttaGest Fruttivendolo — Software per Negozi di Frutta e Verdura" />
        <meta property="og:description" content="Punto cassa smart, fidelity card clienti, e-commerce locale e gestione scarti. Pensato per negozi al dettaglio." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://fruttagest.it/fruttivendolo" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white dark:from-orange-950/20 dark:via-background dark:to-background">
        <PublicHeader />

        {/* ============================================= */}
        {/* HERO SECTION                                  */}
        {/* ============================================= */}
        <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          {/* Decorative gradient blobs */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-orange/20 via-brand-green/20 to-brand-orange/20 blur-3xl dark:from-brand-orange/10 dark:via-brand-green/10" />
          <div className="pointer-events-none absolute right-0 top-20 h-[300px] w-[400px] rounded-full bg-gradient-to-l from-brand-orange/20 to-transparent blur-3xl dark:from-brand-orange/10" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-sm font-medium text-brand-orange dark:border-brand-orange/30 dark:bg-brand-orange/10 dark:text-brand-orange">
                <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
                In Arrivo
              </div>

              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                  <ShoppingBasket className="h-8 w-8" strokeWidth={1.75} />
                </div>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                FruttaGest{" "}
                <span className="bg-gradient-to-r from-brand-orange to-amber-600 bg-clip-text text-transparent">
                  Fruttivendolo
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Per negozi al dettaglio.
                <span className="block mt-2 font-medium text-foreground">
                  Punto cassa smart, fidelity card, e-commerce locale e gestione scarti.
                </span>
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 text-base font-semibold text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 hover:shadow-xl hover:shadow-brand-orange/25 sm:w-auto"
                >
                  Richiedi Demo
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
                <Link
                  href="/#suite"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
                >
                  Scopri la Suite
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" strokeWidth={1.75} />
                  SaaS cloud sicuro
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-orange-600 dark:text-orange-400" strokeWidth={1.75} />
                  Presto disponibile
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
            <div className="rounded-3xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/5 via-white to-white p-8 text-center shadow-lg shadow-brand-orange/5 dark:from-brand-orange/10 dark:via-background dark:to-background sm:p-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Piano Unico — Tutto Incluso
              </h2>
              <p className="mt-3 text-muted-foreground">
                Nessun canone mensile. Unico pagamento una tantum, aggiornamenti annuali.
              </p>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-brand-orange sm:text-6xl">
                    €999,00
                  </span>
                  <span className="text-lg font-medium text-muted-foreground">una tantum</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aggiornamento annuo: €399,00
                </p>
              </div>
              <ul className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {[
                  "Punto cassa smart",
                  "Fidelity card clienti",
                  "E-commerce locale",
                  "Gestione scarti",
                  "Report vendite",
                  "Mobile friendly",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="h-5 w-5 shrink-0 text-brand-orange" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 text-base font-semibold text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 hover:shadow-xl hover:shadow-brand-orange/25"
              >
                Richiedi Demo
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
                Tutto ciò che serve al tuo negozio
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Funzionalità specifiche per fruttivendoli e negozi al dettaglio di ortofrutta.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-orange/5 dark:bg-card/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange transition-colors group-hover:bg-brand-orange/20 dark:bg-brand-orange/20 dark:text-brand-orange dark:group-hover:bg-brand-orange/30">
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
        <section className="bg-orange-50/30 px-4 py-20 dark:bg-orange-950/10 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Domande Frequenti
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Tutto quello che devi sapere su FruttaGest Fruttivendolo.
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
              Resta aggiornato su FruttaGest Fruttivendolo
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Iscriviti alla lista d'attesa e ricevi un avviso appena il prodotto è disponibile.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 text-base font-semibold text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-brand-orange/90 hover:shadow-xl hover:shadow-brand-orange/25 sm:w-auto"
              >
                Richiedi Demo
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href="/#suite"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
              >
                Scopri gli altri Applicativi
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
