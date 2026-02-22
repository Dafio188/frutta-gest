import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart,
  BarChart3,
  Truck,
  Users,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Smartphone,
  Store,
  ShoppingBasket,
  Check,
  X,
  Info,
  LayoutGrid,
} from "lucide-react"

const suiteApps = [
  {
    id: "distributori",
    icon: Truck,
    title: "FruttaGest Distributori",
    subtitle: "Per chi consegna a ristoranti e hotel",
    price: "599,00",
    updateCost: "299,00",
    status: "available",
    badge: "Disponibile Ora",
    features: [
      "Ordini da WhatsApp con AI",
      "Gestione giri e consegne",
      "Listini personalizzati",
      "Fatturazione automatica",
    ],
  },
  {
    id: "grossisti",
    icon: Store,
    title: "FruttaGest Grossisti",
    subtitle: "Per box al mercato e magazzini",
    price: "1.599,00",
    updateCost: "299,00",
    status: "coming_soon",
    badge: "In Arrivo",
    features: [
      "Vendita al banco veloce",
      "Gestione stoccaggio e lotti",
      "Contabilità semplificata",
      "Integrazione bilance",
    ],
  },
  {
    id: "fruttivendolo",
    icon: ShoppingBasket,
    title: "FruttaGest Fruttivendolo",
    subtitle: "Per negozi al dettaglio",
    price: "999,00",
    updateCost: "299,00",
    status: "coming_soon",
    badge: "In Arrivo",
    features: [
      "Punto cassa smart",
      "Fidelity card clienti",
      "E-commerce locale",
      "Gestione scarti",
    ],
  },
]

const comparisonFeatures = [
  { name: "Ordini WhatsApp AI", distributori: true, grossisti: false, fruttivendolo: false },
  { name: "Gestione Magazzino", distributori: true, grossisti: true, fruttivendolo: true },
  { name: "Giri di Consegna", distributori: true, grossisti: false, fruttivendolo: true },
  { name: "Vendita al Banco", distributori: false, grossisti: true, fruttivendolo: true },
  { name: "Fatturazione Elettronica", distributori: true, grossisti: true, fruttivendolo: true },
  { name: "E-commerce B2B", distributori: true, grossisti: true, fruttivendolo: false },
  { name: "E-commerce B2C", distributori: false, grossisti: false, fruttivendolo: true },
]

const features = [
  {
    icon: ShoppingCart,
    title: "Ordini Intelligenti",
    description:
      "Importa ordini da WhatsApp, messaggi vocali e email grazie all'intelligenza artificiale. Niente più trascrizioni manuali.",
  },
  {
    icon: Users,
    title: "Gestione Clienti",
    description:
      "CRM completo per ristoranti, supermercati e bar. Storico ordini, preferenze e listini personalizzati.",
  },
  {
    icon: Truck,
    title: "Bolle e Fatture",
    description:
      "DDT e fatturazione automatica generati direttamente dagli ordini confermati. Zero errori, zero stress.",
  },
  {
    icon: BarChart3,
    title: "Report Avanzati",
    description:
      "Analisi vendite, margini e trend in tempo reale. Prendi decisioni basate sui dati, non sull'istinto.",
  },
  {
    icon: ShoppingCart,
    title: "Lista della Spesa",
    description:
      "Aggregazione intelligente di tutti gli ordini del giorno. Sai esattamente cosa comprare al mercato.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description:
      "Usa FruttaGest ovunque, anche dal cellulare. Perfetto per chi lavora in movimento tra mercato e magazzino.",
  },
]

const stats = [
  { value: "500+", label: "Aziende" },
  { value: "1M+", label: "Ordini gestiti" },
  { value: "99.9%", label: "Uptime" },
]

const productImages = [
  {
    src: "/images/products/box-frutta-e-verdura-mista.png",
    alt: "Box frutta e verdura mista",
  },
  {
    src: "/images/products/box-frutta-esotica.jpg",
    alt: "Box frutta esotica",
  },
  {
    src: "/images/products/box-frutta-grande.jpg",
    alt: "Box frutta assortita",
  },
  {
    src: "/images/products/box-verdura-grande.jpg",
    alt: "Box verdura assortita",
  },
  {
    src: "/images/products/arance-bionde.jpg",
    alt: "Arance bionde",
  },
  {
    src: "/images/products/banane-1kg.jpg",
    alt: "Banane",
  },
  {
    src: "/images/products/cavolfiore-bianco-1pz.jpg",
    alt: "Cavolfiore bianco",
  },
  {
    src: "/images/products/broccolo-romanesco-1p.jpg",
    alt: "Broccolo romanesco",
  },
  {
    src: "/images/products/ciliegie-1-cestino.jpg",
    alt: "Ciliegie",
  },
  {
    src: "/images/products/clementine-1kg.jpg",
    alt: "Clementine",
  },
  {
    src: "/images/products/fichi-d-india.jpg",
    alt: "Fichi d'India",
  },
  {
    src: "/images/products/anguria-cocomero.jpg",
    alt: "Anguria",
  },
]

const audiences = [
  {
    title: "Distributori per ristoranti",
    description:
      "Gestisci i giri dei furgoni, gli orari di consegna e i listini dedicati per ogni locale.",
    badge: "Foodservice",
  },
  {
    title: "Fornitori per supermercati e GDO",
    description:
      "Allinea ordini ricorrenti, offerte promozionali e volumi elevati con controllo sui margini.",
    badge: "Supermercati",
  },
  {
    title: "Produttori con vendita diretta",
    description:
      "Centralizza gli ordini di ristoranti, mense e negozi interni con un unico cruscotto.",
    badge: "Produttori",
  },
]

const steps = [
  {
    title: "Il cliente invia l'ordine",
    description:
      "Dal portale dedicato o da WhatsApp/email: l'AI interpreta testo e vocali e li converte in righe d'ordine.",
  },
  {
    title: "Tu pianifichi giri e documenti",
    description:
      "Confermi gli ordini, organizzi i giri dei furgoni e generi automaticamente DDT e fatture.",
  },
  {
    title: "Consegna e controllo incassi",
    description:
      "Il cliente riceve la merce, tu tieni sotto controllo pagamenti, scadenze e performance in tempo reale.",
  },
]

const upgrades = [
  {
    icon: Truck,
    title: "Tracking furgoni in tempo reale",
    description:
      "Collega i tuoi mezzi via GPS e mostra ai clienti lo stato della consegna direttamente dal portale.",
  },
  {
    icon: Users,
    title: "Versioni dedicate per ogni cliente",
    description:
      "Distribuzione in Docker con istanza personalizzata, branding su misura e configurazioni specifiche per il tuo distributore.",
  },
  {
    icon: Shield,
    title: "Permessi avanzati e multi-filiale",
    description:
      "Gestione di piú magazzini, punti vendita e ruoli granulari per team amministrativi e operativi.",
  },
  {
    icon: BarChart3,
    title: "Previsioni e suggerimenti AI",
    description:
      "Analisi stagionali e suggerimenti automatici sugli acquisti per ridurre sprechi e rotture di stock.",
  },
]

const aboutBlocks = [
  {
    title: "La nostra storia",
    description:
      "FruttaGest nasce sul campo, ascoltando le esigenze dei distributori ortofrutticoli che lavorano ogni notte tra mercati generali, magazzino e consegne ai clienti.",
  },
  {
    title: "La nostra missione",
    description:
      "Ridurre carta, errori e telefonate infinite. Vogliamo che ogni ordine, DDT, fattura e incasso sia tracciato, semplice da trovare e pronto per crescere con il tuo business.",
  },
  {
    title: "Chi siamo",
    description:
      "Un team di prodotto, design e sviluppo che unisce esperienza nel foodservice, SaaS B2B e intelligenza artificiale al servizio dei grossisti di frutta e verdura.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
      {/* ============================================= */}
      {/* NAVBAR                                        */}
      {/* ============================================= */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/70 backdrop-blur-xl dark:bg-background/70">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/LOGO.png"
              alt="FruttaGest"
              width={360}
              height={120}
              priority
              className="h-20 w-auto"
            />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#suite"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Applicativi
            </Link>
            <Link
              href="#confronto"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Confronto
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contatti
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Accedi
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Inizia Ora
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================= */}
      {/* HERO SECTION                                  */}
      {/* ============================================= */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200/40 via-green-100/30 to-transparent blur-3xl dark:from-emerald-900/20 dark:via-green-900/10" />
        <div className="pointer-events-none absolute right-0 top-20 h-[300px] w-[400px] rounded-full bg-gradient-to-l from-emerald-100/50 to-transparent blur-3xl dark:from-emerald-900/10" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
              Potenziato dall&apos;Intelligenza Artificiale
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              La Suite Completa per{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-green-400">
                l&apos;Ortofrutta
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Tre soluzioni integrate per digitalizzare l&apos;intera filiera:
              Distributori, Grossisti e Fruttivendoli.
              <span className="font-medium text-foreground block mt-2">
                Un unico ecosistema per il tuo business.
              </span>
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#suite"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-emerald-500/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-emerald-500/25 sm:w-auto"
              >
                Scopri gli Applicativi
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
                Sicuro e affidabile
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
      {/* SUITE SECTION                                 */}
      {/* ============================================= */}
      <section id="suite" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8 bg-emerald-50/30 dark:bg-emerald-950/10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Gli Applicativi della Suite
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Soluzioni specifiche per ogni ruolo nella filiera ortofrutticola, integrate e sincronizzate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {suiteApps.map((app) => (
              <div 
                key={app.id} 
                className="relative flex flex-col items-center text-center rounded-3xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:shadow-emerald-500/5"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                  <app.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                
                <span className={`absolute top-8 right-8 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  app.status === 'available' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}>
                  {app.badge}
                </span>

                <h3 className="text-xl font-bold text-foreground">{app.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{app.subtitle}</p>

                <div className="mt-5 mb-5 flex flex-col items-center gap-1 rounded-xl bg-muted/50 p-4 border border-border/50 w-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">€{app.price}</span>
                    <span className="text-xs font-medium text-muted-foreground">una tantum</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aggiornamento annuo €{app.updateCost}
                  </p>
                </div>

                <ul className="space-y-3 flex-1 w-full text-left">
                  {app.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {app.status === 'available' ? (
                    <Link
                      href="/register"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                    >
                      Inizia Ora
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* COMPARISON SECTION                            */}
      {/* ============================================= */}
      <section id="confronto" className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Confronto Funzionalità
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Scopri quale applicativo della suite fa al caso tuo.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="p-6 font-semibold text-foreground">Funzionalità</th>
                    <th className="p-6 font-semibold text-emerald-700 dark:text-emerald-400 text-center w-40">Distributori</th>
                    <th className="p-6 font-semibold text-muted-foreground text-center w-40">Grossisti</th>
                    <th className="p-6 font-semibold text-muted-foreground text-center w-40">Fruttivendolo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {comparisonFeatures.map((feat, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="p-6 font-medium text-foreground">{feat.name}</td>
                      <td className="p-6 text-center">
                        {feat.distributori ? (
                          <div className="flex justify-center"><Check className="h-5 w-5 text-emerald-600" /></div>
                        ) : (
                          <div className="flex justify-center"><X className="h-5 w-5 text-muted-foreground/30" /></div>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {feat.grossisti ? (
                          <div className="flex justify-center"><Check className="h-5 w-5 text-emerald-600" /></div>
                        ) : (
                          <div className="flex justify-center"><X className="h-5 w-5 text-muted-foreground/30" /></div>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {feat.fruttivendolo ? (
                          <div className="flex justify-center"><Check className="h-5 w-5 text-emerald-600" /></div>
                        ) : (
                          <div className="flex justify-center"><X className="h-5 w-5 text-muted-foreground/30" /></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-muted/30 text-center text-xs text-muted-foreground border-t border-border/50">
              * Funzionalità per Grossisti e Fruttivendoli sono in fase di sviluppo e potrebbero variare.
            </div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* PRODUCT STRIP SECTION                         */}
      {/* ============================================= */}
      <section className="px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Alcuni dei prodotti che puoi gestire con FruttaGest
            </h2>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 py-6 shadow-sm dark:bg-card/60">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-card to-transparent" />
            <div className="flex gap-6 animate-product-marquee">
              {[...productImages, ...productImages].map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl bg-muted/60"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Uno sguardo dentro il modulo Distributori
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alcune schermate reali della piattaforma FruttaGest Distributori.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-border/50 bg-card/80 p-3 shadow-sm">
              <div className="relative h-52 w-full overflow-hidden rounded-xl bg-muted/40">
                <Image
                  src="/01.png"
                  alt="Dashboard generale con panoramica ordini e incassi"
                  width={1024}
                  height={512}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Dashboard generale con riepilogo di ordini, incassi e attivit&agrave; recente.
              </p>
            </div>
            <div className="flex flex-col rounded-2xl border border-border/50 bg-card/80 p-3 shadow-sm">
              <div className="relative h-52 w-full overflow-hidden rounded-xl bg-muted/40">
                <Image
                  src="/02.png"
                  alt="Report vendite con andamento fatturato e top clienti"
                  width={1024}
                  height={512}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Report vendite per analizzare fatturato, periodi e clienti pi&ugrave; importanti.
              </p>
            </div>
            <div className="hidden flex-col rounded-2xl border border-border/50 bg-card/80 p-3 shadow-sm md:flex">
              <div className="relative h-52 w-full overflow-hidden rounded-xl bg-muted/40">
                <Image
                  src="/03.png"
                  alt="Analisi prodotti con categorie e performance"
                  width={1024}
                  height={512}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Analisi prodotti per capire cosa vende di pi&ugrave; e come si distribuiscono le categorie.
              </p>
            </div>
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
              Tutto ci&ograve; che serve al tuo ingrosso
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Funzionalit&agrave; specifiche di <strong>FruttaGest Distributori</strong>: dalla ricezione ordini alla consegna.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 dark:bg-card/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:group-hover:bg-emerald-900/70">
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
      {/* AUDIENCE SECTION                              */}
      {/* ============================================= */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr,1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pensato per chi distribuisce ortofrutta
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              FruttaGest Distributori &egrave; progettato per gestire
              centinaia di referenze, clienti esigenti e consegne
              quotidiane.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Che tu serva pochi ristoranti premium o catene di supermercati,
              hai sempre una vista chiara su ordini, documenti e incassi.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {audiences.map((audience) => (
              <div
                key={audience.title}
                className="flex flex-col rounded-2xl border border-border/50 bg-card/80 p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-500/10 dark:bg-card/60"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {audience.badge}
                </span>
                <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
                  {audience.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* HOW IT WORKS SECTION                          */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Come funziona nella pratica
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Dall&apos;ordine del cliente alla consegna e fatturazione: un
            flusso unico, senza file Excel sparsi o messaggi da rincorrere.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex h-full flex-col rounded-2xl border border-border/50 bg-card/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-500/10 dark:bg-card/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold dark:bg-emerald-900/60 dark:text-emerald-300">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="rounded-3xl border border-border/50 bg-card/80 p-4 shadow-sm dark:bg-card/60">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-muted/40 sm:h-96">
              <Image
                src="/infografica.png"
                alt="Infografica FruttaGest - panoramica del flusso gestionale"
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* ABOUT GRID SECTION                            */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center">
            Ricercatori. Designer. Ingegneri. Innovatori.
          </h2>
          <p className="mt-4 text-center text-lg text-muted-foreground">
            Dietro FruttaGest c&apos;&egrave; un lavoro continuo di ricerca
            sul flusso operativo reale di chi fa distribuzione ortofrutticola.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-2">
          <div className="relative row-span-2 overflow-hidden rounded-2xl bg-muted/60">
            <Image
              src="/images/products/box-frutta-e-verdura-mista.png"
              alt="Team al lavoro sulla pianificazione ordini"
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-card p-6 text-left shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {aboutBlocks[0].title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {aboutBlocks[0].description}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-muted/60">
            <Image
              src="/images/products/ciliegie-1-cestino.jpg"
              alt="Dettaglio prodotti freschi"
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-zinc-900 p-6 text-left text-zinc-50 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold tracking-tight">
              {aboutBlocks[1].title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              {aboutBlocks[1].description}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-amber-500 p-6 text-left text-white">
            <h3 className="text-lg font-semibold tracking-tight">
              {aboutBlocks[2].title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-amber-50/95">
              {aboutBlocks[2].description}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* UPGRADES SECTION                              */}
      {/* ============================================= */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pronto per la crescita, non solo per oggi
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              FruttaGest nasce per essere esteso: su richiesta possiamo
              attivare funzionalit&agrave; avanzate pensate per distributori
              in forte espansione.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {upgrades.map((upgrade) => (
              <div
                key={upgrade.title}
                className="flex h-full flex-col rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-card to-card/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-card/60 dark:to-card/40"
              >
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-900/60">
                    Upgrade
                  </span>
                </div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <upgrade.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {upgrade.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {upgrade.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* STATS SECTION                                 */}
      {/* ============================================= */}
      <section className="border-y border-border/40 bg-emerald-50/50 px-4 py-16 dark:bg-emerald-950/10 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-base font-medium text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
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
            Unisciti a centinaia di aziende ortofrutticole che hanno gi&agrave;
            scelto la nostra piattaforma.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-emerald-500/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-emerald-500/25"
          >
            Crea il tuo account gratuito
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
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
  )
}
