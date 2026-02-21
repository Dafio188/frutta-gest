import Link from "next/link"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Contatti
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Per informazioni su FruttaGest, demo e collaborazioni puoi usare i
          recapiti qui sotto.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              Contatto principale
            </h2>
            <p className="mt-2">
              Il progetto FruttaGest è curato da Davide Fiore. Puoi trovare i
              suoi recapiti completi e aggiornati sul sito personale.
            </p>
            <p className="mt-2">
              Visita{" "}
              <Link
                href="https://davidefiore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                davidefiore.com
              </Link>{" "}
              per email, profili social e altre informazioni di contatto.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Supporto e richieste sul prodotto
            </h2>
            <p className="mt-2">
              Se stai valutando FruttaGest per la tua azienda ortofrutticola,
              puoi contattarmi per:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>richiedere una demo o una presentazione del gestionale</li>
              <li>discutere integrazioni e personalizzazioni</li>
              <li>ricevere supporto sull&apos;utilizzo della piattaforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              Tempi di risposta
            </h2>
            <p className="mt-2">
              Di norma le richieste vengono gestite nei giorni lavorativi entro
              1-2 giorni dalla ricezione. In caso di urgenze puoi utilizzare i
              contatti diretti indicati su davidefiore.com.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

