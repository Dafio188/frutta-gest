/**
 * Pagina Registrazione — fruttagest.it
 *
 * Landing page dedicata alla registrazione e iscrizione alla piattaforma.
 * Mostra value proposition, benefici e CTA per iniziare il percorso con FruttaGest.
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  ShoppingCart,
  Truck,
  Users,
  Leaf,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react"
import { PublicHeader } from "@/components/layouts/public-header"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

const benefits = [
  {
    icon: Zap,
    title: "Ordini con AI",
    description:
      "Importa automaticamente ordini da WhatsApp, vocali ed email. L'intelligenza artificiale interpreta e struttura tutto al posto tuo.",
  },
  {
    icon: Truck,
    title: "Gestionale completo",
    description:
      "DDT, fatture, listini e giri di consegna in un unico posto. Niente più fogli Excel o app sconnesse.",
  },
  {
    icon: BarChart3,
    title: "Report in tempo reale",
    description:
      "Vendite, margini e trend aggiornati in tempo reale. Prendi decisioni basate sui dati, non sull'istinto.",
  },
  {
    icon: Smartphone,
    title: "Mobile first",
    description:
      "Usa FruttaGest dal cellulare, al mercato, in magazzino o in viaggio. Sempre connesso, sempre aggiornato.",
  },
  {
    icon: Shield,
    title: "Sicurezza e backup",
    description:
      "Dati crittografati, backup automatici e uptime garantito al 99.9%. I tuoi dati sono al sicuro.",
  },
  {
    icon: Users,
    title: "CRM clienti avanzato",
    description:
      "Storico ordini, preferenze, listini personalizzati per ogni cliente. Fidelizza e cresci con dati reali.",
  },
]

const planCards = [
  {
    title: "Distributori",
    subtitle: "Per chi consegna a ristoranti e hotel",
    icon: Truck,
    price: "€ 599",
    period: "una tantum + € 299/anno",
    features: [
      "Ordini da WhatsApp con AI",
      "Gestione giri e consegne",
      "Listini personalizzati per cliente",
      "Fatturazione automatica",
      "Report vendite e margini",
      "CRM clienti completo",
    ],
    color: "brand-green",
    gradient: "from-brand-green/20 via-brand-green/5 to-transparent",
    border: "border-brand-green/30",
    badgeColor: "bg-brand-green/10 text-brand-green border-brand-green/20",
    shadowColor: "shadow-brand-green/20",
  },
  {
    title: "Fruttivendolo",
    subtitle: "Per negozi al dettaglio",
    icon: ShoppingCart,
    price: "€ 999",
    period: "una tantum + € 399/anno",
    features: [
      "Punto cassa smart",
      "Fidelity card clienti",
      "E-commerce locale",
      "Gestione scarti e rimanenze",
      "Integrazione bilance",
      "Report giornalieri",
    ],
    color: "brand-orange",
    gradient: "from-brand-orange/20 via-brand-orange/5 to-transparent",
    border: "border-brand-orange/30",
    badgeColor: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
    shadowColor: "shadow-brand-orange/20",
    comingSoon: true,
  },
  {
    title: "Grossisti",
    subtitle: "Per box al mercato e magazzini",
    icon: Leaf,
    price: "€ 1.599",
    period: "una tantum + € 499/anno",
    features: [
      "Vendita al banco veloce",
      "Gestione stoccaggio e lotti",
      "Contabilità semplificata",
      "Integrazione bilance",
      "Multi-magazzino",
      "Report finanziari",
    ],
    color: "brand-blue",
    gradient: "from-brand-blue/20 via-brand-blue/5 to-transparent",
    border: "border-brand-blue/30",
    badgeColor: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
    shadowColor: "shadow-brand-blue/20",
    comingSoon: true,
  },
]

const stats = [
  { value: "500+", label: "Aziende attive", icon: Users },
  { value: "1M+", label: "Ordini gestiti", icon: FileText },
  { value: "99.9%", label: "Uptime garantito", icon: Shield },
  { value: "14", label: "Giorni di prova gratuita", icon: Clock },
]

export default function RegisterPage() {
  useEffect(() => {
    document.title = "Registrati | FruttaGest — Inizia la tua Prova Gratuita"
    const metaDesc = document.querySelector('meta[name="description"]')
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Registrati a FruttaGest e scopri il gestionale ortofrutticolo completo. Prova gratuita 14 giorni. Ordini AI, DDT, fatture, report in tempo reale."
      )
    }
    if (metaKeywords) {
      metaKeywords.setAttribute(
        "content",
        "FruttaGest, registrazione, prova gratuita, gestionale ortofrutta, ordini AI, software frutta e verdura, distributori ortofrutticoli"
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
      {/* ============================================= */}
      {/* HEAD (SEO meta)                               */}
      {/* ============================================= */}
      <head>
        <title>Registrati | FruttaGest — Inizia la tua Prova Gratuita</title>
        <meta
          name="description"
          content="Registrati a FruttaGest e scopri il gestionale ortofrutticolo completo. Prova gratuita 14 giorni. Ordini AI, DDT, fatture, report in tempo reale."
        />
        <meta
          name="keywords"
          content="FruttaGest, registrazione, prova gratuita, gestionale ortofrutta, ordini AI, software frutta e verdura, distributori ortofrutticoli"
        />
      </head>

      <PublicHeader />

      {/* ============================================= */}
      {/* HERO SECTION                                  */}
      {/* ============================================= */}
      <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-green/20 via-brand-blue/20 to-brand-orange/20 blur-3xl dark:from-brand-green/10 dark:via-brand-blue/10" />
        <div className="pointer-events-none absolute -right-20 top-40 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-emerald-200/30 to-transparent blur-3xl dark:from-emerald-800/10" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 text-sm font-medium text-brand-green dark:border-brand-green/30 dark:bg-brand-green/10 dark:text-brand-green">
              <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
              Prova Gratuita 14 Giorni — Nessun Impegno
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Inizia a{" "}
              <span className="bg-gradient-to-r from-brand-green via-brand-blue to-brand-orange bg-clip-text text-transparent animate-gradient-x">
                Digitalizzare
              </span>{" "}
              la Tua Attività
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Unisciti a centinaia di aziende ortofrutticole che gestiscono
              ordini, consegne e fatture con{" "}
              <span className="font-semibold text-brand-green">FruttaGest</span>.
              <span className="block mt-2 font-medium text-foreground">
                Più tempo per il tuo business, meno tempo per la burocrazia.
              </span>
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25 sm:w-auto group"
              >
                Richiedi la Prova Gratuita
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
              </Link>
              <Link
                href="/#suite"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
              >
                Scopri la Suite
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                Nessun dato richiesto
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                Attivazione immediata
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                Annulla quando vuoi
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* STATS SECTION                                 */}
      {/* ============================================= */}
      <section className="border-y border-border/40 bg-emerald-50/50 px-4 py-14 dark:bg-emerald-950/10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={itemVariants}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                  <stat.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* BENEFITS SECTION                              */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Perché Scegliere FruttaGest
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tutto ciò che serve per portare la tua attività ortofrutticola
              nel digitale, senza complicazioni.
            </p>
          </motion.div>

          <motion.div
            className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                className="group rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 dark:bg-card/50"
                variants={itemVariants}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:group-hover:bg-emerald-900/70">
                  <benefit.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* PLAN COMPARISON SECTION                       */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8 bg-emerald-50/30 dark:bg-emerald-950/10">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="mx-auto max-w-2xl text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Scegli il Tuo Applicativo
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Ogni azienda ha esigenze diverse. Trova la soluzione FruttaGest
              più adatta al tuo business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {planCards.map((plan, i) => {
              const isGreen = plan.color === "brand-green"
              const isBlue = plan.color === "brand-blue"
              const isOrange = plan.color === "brand-orange"

              const checkColor = isGreen
                ? "text-brand-green"
                : isBlue
                ? "text-brand-blue"
                : "text-brand-orange"
              const priceColor = isGreen
                ? "text-brand-green"
                : isBlue
                ? "text-brand-blue"
                : "text-brand-orange"
              const iconBg = isGreen
                ? "bg-brand-green/10 text-brand-green"
                : isBlue
                ? "bg-brand-blue/10 text-brand-blue"
                : "bg-brand-orange/10 text-brand-orange"

              return (
                <motion.div
                  key={plan.title}
                  className="relative flex flex-col rounded-3xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  {plan.comingSoon && (
                    <span className="absolute right-6 top-6 inline-flex items-center rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      In Arrivo
                    </span>
                  )}

                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
                  >
                    <plan.icon className="h-7 w-7" strokeWidth={1.75} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    FruttaGest {plan.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.subtitle}
                  </p>

                  <div className="mt-6 mb-6 flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-4 border border-border/50 w-full">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${priceColor}`}>
                        {plan.price}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        una tantum
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.period}</p>
                  </div>

                  <ul className="space-y-3 flex-1 w-full text-left">
                    {plan.features.map((feature, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-3 text-sm text-muted-foreground"
                      >
                        <Check
                          className={`h-5 w-5 shrink-0 ${checkColor}`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 w-full">
                    {!plan.comingSoon ? (
                      <Link
                        href="/contact"
                        className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl ${
                          isGreen
                            ? "bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20"
                            : isBlue
                            ? "bg-brand-blue hover:bg-brand-blue/90 shadow-brand-blue/20"
                            : "bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20"
                        }`}
                      >
                        Inizia Ora
                        <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.75} />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-muted/50 px-4 text-sm font-semibold text-muted-foreground cursor-not-allowed"
                      >
                        Presto Disponibile
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* KEY FEATURES / QUICK BENEFITS LIST            */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 text-sm font-medium text-brand-green">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                Perché Passare a FruttaGest
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Meno Carta, Più Frutta
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Elimina blocchi notes, fogli Excel e messaggi sparsi.
                FruttaGest centralizza tutto in un unico posto.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Ricevi ordini da WhatsApp, email e vocali automaticamente",
                  "Genera DDT e fatture con un clic dagli ordini confermati",
                  "Pianifica i giri di consegna con vista calendario",
                  "Tieni traccia di pagamenti, scadenze e saldi clienti",
                  "Analizza vendite e margini in tempo reale",
                  "Lavora da qualsiasi dispositivo, anche offline",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-border/50 bg-gradient-to-br from-emerald-50 to-card p-8 shadow-sm dark:from-emerald-950/20 dark:to-card/60"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-foreground">
                Cosa Includono i Piani
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Aggiornamenti inclusi", value: "1 anno" },
                  { label: "Supporto tecnico", value: "Prioritario" },
                  { label: "Backup automatici", value: "Giornalieri" },
                  { label: "Formazione iniziale", value: "Gratuita" },
                  { label: "Prova gratuita", value: "14 giorni" },
                  { label: "Recesso", value: "Senza penali" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm text-brand-green font-semibold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* CTA SECTION                                   */}
      {/* ============================================= */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-green/10 via-brand-blue/10 to-brand-orange/10 dark:from-brand-green/5 dark:via-brand-blue/5 dark:to-brand-orange/5" />
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-800/10" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-800/10" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-white/60 px-4 py-1.5 text-sm font-medium text-brand-green backdrop-blur-sm dark:bg-brand-green/10">
              <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
              Inizia Senza Impegno
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Pronto a Digitalizzare la{" "}
              <span className="bg-gradient-to-r from-brand-green via-brand-blue to-brand-orange bg-clip-text text-transparent animate-gradient-x">
                Tua Attività
              </span>
              ?
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Richiedi ora la tua prova gratuita di 14 giorni. Nessuna carta
              di credito, nessun impegno. Attivazione immediata.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-8 text-base font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/25 sm:w-auto"
              >
                Richiedi la Prova Gratuita
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 text-base font-semibold text-foreground transition-all hover:bg-accent sm:w-auto"
              >
                Contattaci per Info
              </Link>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              🔒 Attivazione immediata · Nessun dato richiesto · Annulla
              quando vuoi
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================= */}
      {/* FOOTER                                        */}
      {/* ============================================= */}
      <footer className="border-t border-border/40 bg-card/50 px-4 py-10 dark:bg-card/30 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground tracking-tight">
              FruttaGest
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              &copy; {new Date().getFullYear()} FruttaGest. Tutti i diritti
              riservati.
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
