export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Informativa sulla Privacy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ultimo aggiornamento: febbraio 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">
              1. Titolare del trattamento
            </h2>
            <p className="mt-2">
              Il titolare del trattamento dei dati personali raccolti tramite la
              piattaforma FruttaGest è il gestore del servizio, come indicato
              nella sezione Contatti del sito.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              2. Tipologie di dati raccolti
            </h2>
            <p className="mt-2">
              FruttaGest tratta principalmente dati anagrafici e di contatto
              degli utenti (come nome, cognome, email, numero di telefono),
              nonché dati relativi alla gestione degli ordini, dei clienti e dei
              fornitori inseriti nella piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              3. Finalità del trattamento
            </h2>
            <p className="mt-2">
              I dati sono trattati esclusivamente per fornire e migliorare il
              servizio FruttaGest, gestire gli account utente, adempiere agli
              obblighi di legge e rispondere alle richieste di supporto.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              4. Base giuridica
            </h2>
            <p className="mt-2">
              La base giuridica del trattamento è l&apos;esecuzione del
              contratto tra l&apos;utente e il fornitore del servizio, nonché
              l&apos;adempimento di obblighi legali e il legittimo interesse a
              garantire sicurezza e funzionamento della piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              5. Conservazione dei dati
            </h2>
            <p className="mt-2">
              I dati personali sono conservati per il tempo necessario a
              fornire il servizio e adempiere agli obblighi di legge. Alla
              cessazione del rapporto, i dati possono essere anonimizzati o
              cancellati secondo le normative vigenti.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              6. Diritti dell&apos;interessato
            </h2>
            <p className="mt-2">
              In qualunque momento l&apos;utente può esercitare i diritti
              previsti dagli articoli 15-22 del GDPR, tra cui accesso, rettifica,
              cancellazione, limitazione del trattamento, portabilità dei dati e
              opposizione, contattando il titolare ai recapiti indicati nella
              sezione Contatti.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">
              7. Sicurezza
            </h2>
            <p className="mt-2">
              Sono adottate misure tecniche e organizzative adeguate per
              proteggere i dati personali da accessi non autorizzati, perdita
              accidentale o trattamenti illeciti.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

