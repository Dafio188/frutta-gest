# FruttaGest — Gestione Completa Commercio Ortofrutticolo

> **Versione:** 0.5.0 (in sviluppo) | **Stack:** Next.js 16 + TypeScript + Prisma 7 + PostgreSQL + Auth.js v5
> **Ultimo aggiornamento:** Febbraio 2026

---

## Mission

**FruttaGest** nasce per digitalizzare e ottimizzare l'intera operatività di un commerciante ortofrutticolo che serve principalmente **ristoranti** e **supermercati**.

L'obiettivo è fornire un unico strumento che copra l'intero ciclo di lavoro quotidiano — dalla ricezione degli ordini alla consegna, dalla fatturazione alla contabilità — eliminando fogli Excel, appunti cartacei e messaggi WhatsApp sparsi.

### Obiettivi Strategici

1. **CRM Ortofrutticolo Completo** — Anagrafica clienti (ristoranti, supermercati, GDO, hotel, mense), fornitori, storico rapporti commerciali, listini personalizzati per cliente, condizioni di pagamento e scontistiche.

2. **Gestione Ordini Intelligente con AI** — I clienti possono inserire ordini in modo facilitato attraverso:
   - **Portale clienti** con login dedicato e interfaccia ultra-semplificata
   - **Importazione da WhatsApp** — messaggi testuali interpretati automaticamente dall'AI
   - **Ordini vocali** — messaggi audio trascritti e convertiti in ordini strutturati via AI
   - **Email** — parsing automatico di ordini ricevuti via posta elettronica
   - L'AI (OpenAI GPT-4) riconosce nomi di prodotti ortofrutticoli, quantitativi, unità di misura e li trasforma in righe d'ordine pronte per la conferma.

3. **Ciclo Documentale Completo** — Ordini → DDT (Bolle di consegna) → Fatture → Note di credito, con generazione PDF automatica, numerazione progressiva e tracciabilità completa.

4. **Contabilità Integrata** — Gestione finanziaria bidirezionale:
   - **Lato clienti:** fatture emesse, scadenze, incassi, solleciti, estratto conto
   - **Lato fornitori:** fatture ricevute, ordini di acquisto, pagamenti, saldi
   - Dashboard finanziaria con flussi di cassa e posizioni debitorie/creditorie

5. **Lista della Spesa Intelligente** — Aggregazione automatica dei fabbisogni giornalieri dagli ordini clienti, con suggerimenti AI basati su storico e stagionalità, per ottimizzare gli acquisti al mercato.

6. **Reportistica e Analytics** — Dashboard con KPI operativi (vendite, margini, clienti top, prodotti più venduti, trend stagionali), report esportabili.

7. **Admin Panel** — Pannello di amministrazione per gestione utenti, ruoli, impostazioni applicazione, aspetto grafico e log attività.

---

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Linguaggio** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Componenti** | Radix UI + shadcn/ui | latest |
| **Animazioni** | Framer Motion | 12.34 |
| **Icone** | Lucide React | 0.563 |
| **State** | Zustand | 5.0.11 |
| **ORM** | Prisma | 7.3.0 |
| **Database** | PostgreSQL | — |
| **Autenticazione** | NextAuth.js v5 (Auth.js) | 5.0.0-beta.30 |
| **Validazione** | Zod | 4.3.6 |
| **AI** | OpenAI API | 6.20.0 |
| **PDF** | @react-pdf/renderer | 4.3.2 |
| **Email** | Resend | 6.9.1 |
| **Grafici** | Recharts | 3.7.0 |
| **Command Palette** | cmdk | 1.1.1 |

---

## Architettura del Progetto

```
frutta-gest/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Login, Registrazione, Reset Password
│   │   ├── (dashboard)/              # Area operativa autenticata
│   │   │   ├── dashboard/            # Dashboard principale con KPI
│   │   │   ├── ordini/               # Lista ordini + dettaglio [id]
│   │   │   ├── clienti/              # Lista + dettaglio + nuovo cliente
│   │   │   ├── fornitori/            # Lista + dettaglio + nuovo fornitore
│   │   │   ├── catalogo/             # Catalogo prodotti + dettaglio + nuovo
│   │   │   ├── bolle/                # Lista DDT + dettaglio [id]
│   │   │   ├── fatture/              # Lista fatture + dettaglio [id]
│   │   │   ├── finanza/              # Dashboard finanziaria + scadenzario
│   │   │   ├── lista-spesa/          # Lista spesa aggregata
│   │   │   ├── report/               # Reportistica e analytics
│   │   │   └── settings/             # Impostazioni utente
│   │   ├── (admin)/                  # Pannello amministrazione
│   │   └── api/                      # API Routes
│   │       ├── auth/                 # Autenticazione
│   │       ├── ai/                   # Parsing ordini con AI
│   │       ├── audio/                # Upload e trascrizione audio
│   │       ├── delivery-notes/       # Generazione PDF DDT
│   │       ├── invoices/             # Generazione PDF fatture
│   │       └── webhooks/whatsapp/    # Webhook WhatsApp
│   ├── components/
│   │   ├── ui/                       # Componenti base (shadcn/Radix)
│   │   ├── layouts/                  # Sidebar, Header
│   │   ├── animations/              # Wrapper Framer Motion
│   │   ├── ddt/                      # Componenti DDT/PDF
│   │   └── invoices/                 # Componenti Fatture/PDF
│   ├── lib/                          # Configurazioni e utilità
│   │   ├── auth.ts                   # Config NextAuth.js
│   │   ├── db.ts                     # Prisma Client
│   │   ├── actions.ts                # Server Actions (2300+ righe)
│   │   ├── validations/              # Schemi Zod
│   │   ├── ai/                       # Parsing AI ordini
│   │   ├── utils.ts                  # Utilità (format, serialize)
│   │   └── constants.ts              # Costanti, label, navigazione
│   ├── stores/                       # Zustand stores
│   └── types/                        # Definizioni TypeScript
├── prisma/
│   └── schema.prisma                 # Schema DB (803 righe, 30+ modelli)
└── package.json
```

---

## Schema Database (Entita Principali)

Lo schema Prisma (`prisma/schema.prisma`) definisce **30+ modelli** che coprono l'intero dominio:

| Area | Modelli | Descrizione |
|------|---------|-------------|
| **Utenti** | `User`, `UserPreferences`, `Account`, `Session` | Autenticazione, ruoli (ADMIN, OPERATOR, VIEWER), preferenze |
| **Anagrafica** | `Customer`, `Contact`, `Supplier` | Clienti (7 tipologie), contatti multipli, fornitori |
| **Catalogo** | `ProductCategory`, `Product`, `CustomerProductPrice`, `SupplierProduct` | Prodotti con categorie, listini personalizzati per cliente, prezzi fornitore |
| **Ordini** | `Order`, `OrderItem` | Ordini con 6 stati e 5 canali di ingresso (manuale, WhatsApp, vocale, email, portale) |
| **Documenti** | `DeliveryNote`, `DeliveryNoteItem`, `Invoice`, `InvoiceItem`, `CreditNote`, `InvoiceDDTLink` | DDT, fatture, note di credito con link tracciabile |
| **Finanza** | `Payment`, `PurchaseOrder`, `PurchaseOrderItem`, `SupplierInvoice` | Pagamenti bidirezionali, ordini acquisto, fatture fornitori |
| **Operativo** | `ShoppingList`, `ShoppingListItem` | Lista spesa aggregata giornaliera |
| **AI/Integrazioni** | `WhatsAppMessage`, `AudioTranscription`, `IncomingEmail` | Messaggi WhatsApp, trascrizioni audio, email in arrivo |
| **Sistema** | `ActivityLog`, `AppSettings`, `CompanyInfo`, `NumberSequence` | Log, impostazioni, dati azienda, numerazione documenti |

---

## Funzionalità Implementate

### ✅ Completate

#### Autenticazione e Sicurezza
- Login con credenziali (email + password) e Google OAuth
- Registrazione utente con ruoli (ADMIN, OPERATOR, VIEWER)
- Middleware protezione route con redirect automatico
- JWT session con bcrypt hashing

#### Dashboard Principale
- 4 card KPI animate (ordini oggi, da preparare, fatturato mese, clienti attivi)
- Grafico vendite settimanali (Recharts)
- Lista attività recenti dal database
- Ordini urgenti con evidenziazione

#### Anagrafica Clienti — CRUD Completo
- **Lista** con ricerca full-text, ordinamento, paginazione dal DB
- **Dettaglio** con dati aziendali, fatturazione (P.IVA, SDI, PEC), indirizzo, contatti
- **Modifica inline** — tutti i campi editabili (ragione sociale, P.IVA, CF, SDI, PEC, indirizzo, contatti, zona consegna, note)
- **Eliminazione** con soft-delete se ha ordini/fatture collegati
- Tab ordini e fatture storici per cliente
- Creazione nuovo cliente con validazione Zod

#### Anagrafica Fornitori — CRUD Completo
- **Lista** con ricerca e paginazione dal DB
- **Dettaglio** con dati aziendali, indirizzo, contatti, prodotti forniti
- **Modifica inline** — tutti i campi editabili (ragione sociale, P.IVA, CF, indirizzo, telefono, email, note)
- **Eliminazione** con soft-delete se ha ordini acquisto collegati
- Creazione nuovo fornitore con `createSupplier` server action

#### Catalogo Prodotti — CRUD Completo
- **Lista** con filtri per categoria, disponibilità, ricerca
- **Dettaglio** con prezzi vendita/costo, margine calcolato, IVA, unità di misura
- **Modifica inline** — prezzo vendita, prezzo costo, IVA, unità, categoria, quantità minima, disponibilità, descrizione
- **Eliminazione** con soft-delete se ha ordini associati
- Fornitori per prodotto con badge "Preferito"
- Creazione nuovo prodotto con slug automatico

#### Gestione Ordini
- **Lista** con filtri stato (Ricevuto, Confermato, In Preparazione, Consegnato, Fatturato, Annullato), ricerca, paginazione
- **Dettaglio** con articoli, cliente, stato, canale ordine
- **Progressione stato** (Ricevuto → Confermato → In Preparazione → Consegnato)
- Creazione e modifica ordini con calcolo totali automatico
- Generazione DDT da ordine

#### Bolle DDT (Documenti di Trasporto)
- **Lista** con filtri stato (Bozza, Emessa, Consegnata) e ricerca — dati reali dal DB
- **Dettaglio** con tabella articoli, subtotale/IVA/totale, dati trasporto
- **Progressione stato** (Bozza → Emessa → Consegnata)
- **Generazione fattura** da DDT consegnata
- Link a ordine e fattura collegati
- Download PDF

#### Fatture
- **Lista** con filtri stato (Bozza, Emessa, Inviata, Pagata, Scaduta, Annullata) e ricerca — dati reali dal DB
- **Dettaglio** con articoli, DDT collegate, pagamenti registrati, riepilogo importi
- **Progressione stato** (Bozza → Emessa → Inviata → Pagata)
- Evidenziazione fatture completamente pagate
- Download PDF

#### Dashboard Finanziaria
- 4 card KPI reali: Incassi Mese, Pagamenti Mese, Saldo Netto, Fatture Scadute
- Tab Incassi (da clienti) e Pagamenti (a fornitori) dal DB
- Ricerca e filtri su pagamenti

#### Componenti UI (shadcn/ui + Custom)
- Button, Input, Badge (7 varianti), Card, Dialog, Tabs, Separator, Label

---

## Stato attuale Deploy & Infrastruttura (Feb 2026)

### Vercel (Produzione)

- **Hosting:** Vercel (account Davide, piano Hobby)
- **Progetto attivo:** `frutta-gest`
  - Repository collegato: `Dafio188/frutta-gest` (branch `main`)
  - Eventuali progetti duplicati (es. `frutta-gest-6516`) non sono utilizzati in produzione
- **Framework preset:** Next.js
- **Build Command (override):**

  ```bash
  npm run build
  ```

  che esegue, da `package.json`:

  ```json
  "build": "prisma generate && next build && node scripts/create-middleware-nft.mjs"
  ```

- **Output directory:** default Next.js (`.next`)
- **Ambiente di build:** Next.js 16 (Turbopack) + Node gestito da Vercel
- **Middleware:** il vecchio `middleware.ts` globale è stato rimosso dal repository
  - Vercel continua a generare internamente un proxy middleware per l’App Router
  - Per evitare errori `ENOENT` su Vercel, dopo il build viene creato lo stub `.next/server/middleware.js.nft.json` tramite lo script:

    ```bash
    node scripts/create-middleware-nft.mjs
    ```

### Flusso di lavoro (locale → GitHub → Vercel)

- Sviluppo in locale sul repository `Dafio188/frutta-gest` usando il branch `main` (o branch dedicati per le feature).
- Prima del push esecuzione dei comandi di verifica:
  - `npm run lint`
  - `npm run build`
- Commit e push su GitHub:
  - `git add .`
  - `git commit -m "descrizione modifiche"`
  - `git push origin main`
- Vercel riceve automaticamente i push sul branch `main`, esegue la build (`npm run build`) e deploya su:
  - `https://fruttagest.it` (produzione)
  - `https://frutta-gest.vercel.app` (dominio tecnico di supporto).
- Quando si aggiungono o modificano variabili d’ambiente:
  - aggiornarle su Vercel in **Settings → Environment Variables** (Production),
  - quindi lanciare un **Redeploy** dall’ultima distribuzione (non serve un nuovo push).

### Database attuale

- **Tecnologia:** PostgreSQL
- **ORM:** Prisma 7 (`prisma/schema.prisma`)
- **Datasource:**

  ```ts
  // prisma.config.ts
  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
      seed: "npx tsx prisma/seed.ts",
    },
    datasource: {
      url: process.env["DATABASE_URL"],
    },
  })
  ```

- **Connessione:**
  - In locale: stringa `DATABASE_URL` definita in `.env` (PostgreSQL di sviluppo)
  - In produzione (Vercel): variabile d’ambiente `DATABASE_URL` configurata nella sezione **Settings → Environment Variables**
  - Lo schema Prisma usa `provider = "postgresql"`, quindi è compatibile con provider gestiti (Neon, Railway, RDS, ecc.)

### Stato funzionalità AI in produzione

- **Libreria:** `openai@6.20.0`
- **Chiave API:** letta da `process.env.OPENAI_API_KEY`
- **Comportamento corrente:**
  - `src/lib/ai/parse-order.ts`
    - Se `OPENAI_API_KEY` **non è configurata**, la funzione non blocca la build:
      - ritorna un ordine “vuoto” (lista articoli vuota) mantenendo solo il testo grezzo
  - `src/lib/ai/transcribe-audio.ts`
    - Se `OPENAI_API_KEY` non è presente, lancia un errore a runtime (le funzionalità di trascrizione audio richiedono per forza la chiave)
- **Implicazione:**
  - Il sito può essere deployato e usato anche senza chiave OpenAI (AI degradata ma non blocca l’applicazione)
  - Per avere **parsing ordini da testo/audio** completamente funzionante va impostata `OPENAI_API_KEY` sia in locale che su Vercel

### Aggiornamenti UI & Auth (Febbraio 2026)

- Branding coerente su tutte le schermate:
  - logo ingrandito in navbar home, footer, login/registrazione e sidebar dashboard
  - logo nelle pagine di login e registrazione cliccabile verso la home (`/`)
- Pagine legali pubbliche:
  - `/privacy` — Informativa Privacy base in italiano
  - `/terms` — Termini e Condizioni d’uso
  - `/contact` — Pagina Contatti con rimando a davidefiore.com per i recapiti aggiornati
  - link inseriti nel footer della home (Privacy, Termini, Contatti)
  - aggiornato il middleware di protezione (`src/middleware.ts`) per mantenere queste route pubbliche (no redirect al login)

- Login Google (OAuth) operativo:
  - provider Google configurato in `src/lib/auth.ts` tramite `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
  - bottone “Continua con Google” attivo in login e registrazione
  - redirect autorizzati:
    - `http://localhost:3650/api/auth/callback/google`
    - `https://frutta-gest.vercel.app/api/auth/callback/google`
    - `https://fruttagest.it/api/auth/callback/google`
  - variabili d’ambiente configurate su Vercel (Production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`, `AUTH_TRUST_HOST`, `AUTH_SECRET`, `NEXTAUTH_URL=https://fruttagest.it`
- Domini di produzione:
  - `https://fruttagest.it` (dominio principale)
  - `https://www.fruttagest.it` (CNAME verso `fruttagest.it`)
  - `https://frutta-gest.vercel.app` (dominio tecnico Vercel per anteprime/debug)

### Riepilogo modifiche principali legate al deploy (Gen–Feb 2026)

- Rimozione dell’output `standalone` in `next.config.ts` per compatibilità con Next 16 + Vercel
- Refactor funzioni AI per spostare l’inizializzazione del client OpenAI **a runtime** e gestire in modo sicuro l’assenza di `OPENAI_API_KEY`
- Eliminazione del `middleware.ts` globale per:
  - evitare conflitti con il sistema di middleware interno di Next 16
  - semplificare il deploy su Vercel (niente più errori su `middleware.js.nft.json`)
- Introduzione dello script `scripts/create-middleware-nft.mjs` eseguito a fine build per creare il file NFT atteso da Vercel:
  - Risolto l’errore ricorrente:

    ```text
    ENOENT: no such file or directory, open '/vercel/path0/.next/server/middleware.js.nft.json'
    ```

- Verifica completa del build locale tramite:
  - `npm run lint`
  - `npm run build`

Questo è lo **stato di riferimento** da cui partire per i prossimi step (es. pubblicazione su Aruba o reintroduzione di un middleware di sicurezza più evoluto). 
- DataTable con ordinamento, ricerca, paginazione, empty state
- Toast/Notifiche animati
- Command Palette (Cmd+K)
- Sidebar responsive con overlay mobile

#### Animazioni (Framer Motion)
- Page Transition (fade + blur + slide)
- Stagger Container per liste animate
- CountUp animato per KPI
- Micro-interazioni hover/click
- CSS keyframes (shimmer, fade-in, slide-in, scale-in)

#### Server Actions (Backend)
- **2300+ righe** di server actions in `actions.ts`
- CRUD completo: Clienti, Fornitori, Prodotti, Categorie, Ordini, DDT, Fatture, Pagamenti
- `getDashboardKPIs()` — aggregazione KPI da DB
- `getRecentActivity()` — activity log
- Numerazione progressiva automatica documenti
- Activity logging per tracciabilità
- Validazione Zod su tutti gli input

### 🔧 In Corso / Parziale

| Funzionalità | Stato | Note |
|--------------|-------|------|
| Ordini da WhatsApp/Audio/Email | Scaffolded | Endpoint API creati, parsing AI da completare |
| Lista della Spesa intelligente | Scaffolded | Pagina e modello DB pronti, aggregazione da completare |
| Report Vendite/Prodotti/Margini | Scaffolded | Pagine hub create, grafici da implementare |
| Admin Panel | Scaffolded | Layout creato, CRUD utenti da implementare |
| Generazione PDF DDT e Fatture | Parziale | Componenti React-PDF creati, API routes da completare |
| Note di Credito | Modello DB pronto | Nessuna UI implementata |
| Fatture Fornitori | Modello DB pronto | Nessuna UI implementata |

### ❌ Non Ancora Implementato

- Pagine autenticazione (Login, Register, Forgot Password) — UI custom
- Rate limiting (Redis/Upstash)
- Sistema email transazionali (Resend)
- PWA e ottimizzazione mobile avanzata
- Testing (Unit, Integration, E2E)
- CI/CD e deploy Vercel

---

## Riepilogo Visivo Avanzamento

```
Architetto di Sistema    ██████████  100%
Backend / Server Actions █████████░   90%
UI/UX Pagine             ████████░░   80%
Animazioni               ████████░░   75%
Mobile / Responsive      █████░░░░░   50%
Admin Panel              █░░░░░░░░░   10%
Testing / Deploy         ░░░░░░░░░░    0%
─────────────────────────────────────────
PROGRESSO TOTALE          ███████░░░  ~58%
```

---

## Prossimi Passi (Priorita)

### Priorita Alta
1. Completare generazione PDF (DDT e Fatture) con download funzionante
2. Implementare lista della spesa con aggregazione ordini giornalieri
3. Implementare report con grafici Recharts (vendite, prodotti, margini)
4. Completare parsing AI ordini da WhatsApp/vocale/email

### Priorita Media
5. Admin Panel — gestione utenti, impostazioni, log
6. Fatture fornitori — modello, azioni, UI
7. Note di credito — flusso completo
8. Sistema email transazionali (solleciti, conferme ordine)

### Priorita Bassa
9. UI pagine autenticazione custom
10. Ottimizzazione mobile e PWA
11. Testing e sicurezza
12. CI/CD e deploy Vercel

---

## Setup Sviluppo

```bash
# Clona il repository
git clone <repo-url>
cd frutta-gest

# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env.local
# Compila .env.local con le tue credenziali

# Setup database
npx prisma db push
npx prisma generate

# Seed dati di esempio (opzionale)
npx prisma db seed

# Avvia in sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Credenziali di Test

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@fruttagest.it | Admin2026! |
| Operatore | marco@fruttagest.it | Operatore2026! |
| Viewer | anna@fruttagest.it | Operatore2026! |

---

## Variabili Ambiente Necessarie

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
OPENAI_API_KEY=""
RESEND_API_KEY=""
```

---
Implementazione Cliente dashboard

> **FruttaGest** — Gestione ortofrutticola moderna, intelligente, italiana.

Piano: Portale Clienti FruttaGest
Contesto
L'utente vuole che i clienti (ristoranti, supermercati, ecc.) possano:

Accedere con credenziali proprie al portale
Inserire ordini in autonomia sfogliando il catalogo con i prezzi personalizzati
Monitorare lo stato dei propri ordini (ricevuto → confermato → in preparazione → consegnato → fatturato)
Visualizzare la contabilità: fatture emesse, pagamenti effettuati, scadenze
Vedere prodotti in evidenza scelti dall'admin nella propria dashboard
Stato attuale: Il modello Customer non ha campi di autenticazione (password, email unique). Il Role enum ha solo ADMIN, OPERATOR, VIEWER. Non esiste un concetto di "prodotto in evidenza". Non esiste middleware.ts.

1. Schema Prisma — Modifiche (prisma/schema.prisma)
1.1 Aggiungere CUSTOMER al Role enum

enum Role {
  ADMIN
  OPERATOR
  VIEWER
  CUSTOMER    // NUOVO
}
1.2 Aggiungere customerId al model User

model User {
  // ...campi esistenti...
  customerId  String?   @unique    // NUOVO: link al profilo cliente
  customer    Customer? @relation(fields: [customerId], references: [id])
}
1.3 Aggiungere relazione inversa in Customer

model Customer {
  // ...campi esistenti...
  portalUser  User?    // NUOVO: utente portale collegato
}
1.4 Aggiungere campo isFeatured al Product

model Product {
  // ...campi esistenti...
  isFeatured     Boolean   @default(false)     // NUOVO
  featuredUntil  DateTime?                      // NUOVO: scadenza evidenziazione
}
1.5 Migrazione
Eseguire npx prisma db push per applicare le modifiche.

2. Auth — Modifiche (src/lib/auth.ts)
2.1 Estendere il JWT/session con customerId
Nel callback jwt: aggiungere token.customerId = user.customerId se presente.
Nel callback session: aggiungere session.user.customerId = token.customerId.

2.2 Tipo Session
Aggiornare la dichiarazione declare module "next-auth" per includere customerId?: string nell'interfaccia Session.user.

2.3 Redirect post-login
Nel login page (src/app/(auth)/login/page.tsx), dopo login riuscito:

Se role === CUSTOMER → redirect a /portale invece di /dashboard
Il callbackUrl di default diventa /portale per i customer
3. Middleware — NUOVO (src/middleware.ts)
Creare il middleware Next.js per proteggere le route:


/portale/*    → accessibile SOLO a role CUSTOMER
/dashboard/*  → accessibile a ADMIN, OPERATOR, VIEWER (NO CUSTOMER)
/ordini/*, /fatture/*, /clienti/*, ecc. → accessibile a ADMIN, OPERATOR, VIEWER
/login, /register → pubbliche (redirect se già autenticato)
Usare auth() da NextAuth per ottenere la sessione nel middleware.

4. Server Actions — Nuove e Modificate (src/lib/actions.ts)
4.1 Helper: requireCustomer()
Nuova funzione che verifica session.user.role === "CUSTOMER" e session.user.customerId esiste. Ritorna { session, customerId }.

4.2 NUOVA: getPortalDashboard()
Ritorna dati aggregati per il cliente:

Ordini recenti (ultimi 5) con stato
Fatture non pagate / scadute
Totale da pagare
Prodotti in evidenza (isFeatured = true e featuredUntil > now() o null)
Prossima consegna prevista
4.3 NUOVA: getPortalProducts(params)
Catalogo prodotti visibile al cliente:

Solo prodotti isAvailable = true
Per ogni prodotto, cercare CustomerProductPrice per quel customerId → se esiste usare quel prezzo, altrimenti defaultPrice
Filtro per categoria, ricerca per nome
Paginazione
Ordina featured in cima
4.4 NUOVA: createPortalOrder(data)
Ordine creato dal cliente:

requireCustomer() per autenticare
customerId preso automaticamente dalla sessione (NON dal form)
channel: "WEB" forzato
Calcola totali come createOrder ma usando prezzi personalizzati del cliente
Status iniziale: RECEIVED
Log activity CREATE_ORDER con dettagli
4.5 NUOVA: getPortalOrders(params)
Lista ordini del cliente:

Filtra automaticamente per customerId dalla sessione
Paginazione, filtro per status, ricerca
Include items con product
4.6 NUOVA: getPortalOrder(id)
Dettaglio singolo ordine:

Verifica che order.customerId === session.customerId
Include items, deliveryNote (se esiste), stato tracking
4.7 NUOVA: getPortalInvoices(params)
Fatture del cliente:

Filtra per customerId dalla sessione
Include stato pagamento, importo pagato vs totale
4.8 NUOVA: getPortalPayments(params)
Storico pagamenti del cliente:

Filtra per customerId, direction INCOMING
4.9 NUOVA: createCustomerPortalUser(customerId, email, password)
Action admin per creare l'utente portale per un cliente:

Crea User con role: CUSTOMER, customerId, email, password (bcrypt hash)
Verifica che il customer non abbia già un portalUser
4.10 Modificare: toggleProductFeatured(productId)
Action admin per impostare/rimuovere isFeatured + featuredUntil su un prodotto.

5. Constants — Modifiche (src/lib/constants.ts)
5.1 Aggiungere CUSTOMER a ROLE_LABELS

ROLE_LABELS: { ..., CUSTOMER: "Cliente" }
5.2 NUOVA: PORTAL_SIDEBAR_NAV

export const PORTAL_SIDEBAR_NAV = [
  {
    title: "Principale",
    items: [
      { label: "Dashboard", href: "/portale", icon: "LayoutDashboard" },
      { label: "Catalogo", href: "/portale/catalogo", icon: "Apple" },
      { label: "I Miei Ordini", href: "/portale/ordini", icon: "ShoppingCart" },
    ],
  },
  {
    title: "Contabilità",
    items: [
      { label: "Fatture", href: "/portale/fatture", icon: "FileText" },
      { label: "Pagamenti", href: "/portale/pagamenti", icon: "CreditCard" },
    ],
  },
]
6. Route e Pagine — NUOVI FILE
6.1 Layout Portale: src/app/(customer-portal)/layout.tsx
Struttura identica al dashboard layout (SessionProvider → Sidebar → Header → main)
Usa un CustomerSidebar con PORTAL_SIDEBAR_NAV
Header semplificato (nome azienda cliente, logout, theme toggle)
6.2 Sidebar Portale: src/components/layouts/customer-sidebar.tsx
Stessa struttura della Sidebar esistente ma con PORTAL_SIDEBAR_NAV
Mostra nome azienda cliente e tipo (es. "Ristorante Da Mario")
Link logout
6.3 Dashboard Portale: src/app/(customer-portal)/portale/page.tsx
Layout con:

Card riepilogo: Ordini in corso, Fatture da pagare, Totale dovuto, Prossima consegna
Prodotti in Evidenza: griglia card prodotti con isFeatured + bottone "Aggiungi all'ordine"
Ordini Recenti: ultimi 5 ordini con stato (badge colorato) e link al dettaglio
Fatture Recenti: ultime fatture con stato pagamento
6.4 Catalogo: src/app/(customer-portal)/portale/catalogo/page.tsx
Griglia prodotti con: immagine placeholder, nome, categoria, prezzo personalizzato, unità
Filtro per categoria (tabs o select)
Ricerca per nome
Badge "In Evidenza" sui prodotti featured
Bottone "Ordina" → apre modal/drawer per aggiungere al carrello
6.5 Nuovo Ordine: src/app/(customer-portal)/portale/ordini/nuovo/page.tsx
Carrello/form ordine:
Selettore prodotti (search + select dal catalogo)
Per ogni riga: prodotto, quantità, unità, prezzo (read-only, personalizzato)
Data consegna richiesta (date picker)
Note per il fornitore
Riepilogo totale con IVA
Bottone "Invia Ordine"
Dopo invio → redirect a lista ordini con toast successo
6.6 Lista Ordini: src/app/(customer-portal)/portale/ordini/page.tsx
Tabella ordini con: numero, data, stato (badge), totale, n. articoli
Filtro per stato, ricerca
Paginazione
Bottone "Nuovo Ordine"
6.7 Dettaglio Ordine: src/app/(customer-portal)/portale/ordini/[id]/page.tsx
Info ordine: numero, data, stato con timeline visiva (step tracker)
Tabella articoli: prodotto, quantità, prezzo, totale riga
Riepilogo: subtotale, IVA, totale
Se DDT collegata: link/info consegna
Se fatturata: link alla fattura
6.8 Lista Fatture: src/app/(customer-portal)/portale/fatture/page.tsx
Tabella: numero fattura, data emissione, scadenza, totale, pagato, stato
Filtro per stato (tutte, da pagare, pagate, scadute)
Badge colorati per stato
6.9 Dettaglio Fattura: src/app/(customer-portal)/portale/fatture/[id]/page.tsx
Info fattura completa: numero, date, metodo pagamento
Tabella articoli
Riepilogo importi
Storico pagamenti collegati
PDF download se disponibile
6.10 Pagamenti: src/app/(customer-portal)/portale/pagamenti/page.tsx
Lista pagamenti con: data, importo, metodo, riferimento fattura, stato
7. Admin — Modifiche per gestione portale
7.1 Pagina cliente — Bottone "Crea Accesso Portale" (src/app/(dashboard)/clienti/[id]/page.tsx)
Se il cliente non ha portalUser: mostra bottone "Attiva Portale Cliente"
Click → modal con form: email (precompilata da customer.email), password
Salva con createCustomerPortalUser()
Se già attivo: mostra email utente portale, bottone reset password, bottone disattiva
7.2 Prodotti — Toggle "In Evidenza" (src/app/(dashboard)/catalogo/[id]/page.tsx o lista)
Switch/toggle nella scheda prodotto per isFeatured
Opzionale: date picker per featuredUntil
File da creare
src/middleware.ts — Route protection
src/app/(customer-portal)/layout.tsx — Layout portale
src/components/layouts/customer-sidebar.tsx — Sidebar portale
src/app/(customer-portal)/portale/page.tsx — Dashboard cliente
src/app/(customer-portal)/portale/catalogo/page.tsx — Catalogo prodotti
src/app/(customer-portal)/portale/ordini/page.tsx — Lista ordini
src/app/(customer-portal)/portale/ordini/nuovo/page.tsx — Nuovo ordine
src/app/(customer-portal)/portale/ordini/[id]/page.tsx — Dettaglio ordine
src/app/(customer-portal)/portale/fatture/page.tsx — Lista fatture
src/app/(customer-portal)/portale/fatture/[id]/page.tsx — Dettaglio fattura
src/app/(customer-portal)/portale/pagamenti/page.tsx — Pagamenti
File da modificare
prisma/schema.prisma — Role enum + User.customerId + Product.isFeatured
src/lib/auth.ts — JWT/session con customerId, tipo Session
src/lib/actions.ts — 8+ nuove server actions per portale + action admin
src/lib/constants.ts — ROLE_LABELS, PORTAL_SIDEBAR_NAV
src/app/(auth)/login/page.tsx — Redirect condizionale per CUSTOMER
src/app/(dashboard)/clienti/[id]/page.tsx — Bottone attiva portale
src/app/(dashboard)/catalogo/[id]/page.tsx — Toggle isFeatured
Funzioni esistenti da riutilizzare
serialize() da src/lib/utils.ts:75 — per serializzare Decimal/Date
getNextNumber() da src/lib/actions.ts — per numerazione ordini
logActivity() da src/lib/actions.ts — per activity log
Pattern createOrder() da src/lib/actions.ts:650 — base per createPortalOrder
Pattern getOrders() da src/lib/actions.ts:564 — base per getPortalOrders
Pattern getInvoices() da src/lib/actions.ts:1508 — base per getPortalInvoices
Pattern getPayments() da src/lib/actions.ts:1800 — base per getPortalPayments
getProducts() da src/lib/actions.ts:389 — base per getPortalProducts
Componenti UI: GlassCard, Button, Input, Badge, Table, Toast — tutti da src/components/ui/
SIDEBAR_NAV pattern da src/lib/constants.ts:265 — base per PORTAL_SIDEBAR_NAV
Sidebar component da src/components/layouts/sidebar.tsx — base per CustomerSidebar
Dashboard layout da src/app/(dashboard)/layout.tsx — base per layout portale
Sicurezza — Regole fondamentali
Ogni action portale usa requireCustomer() che valida sia il ruolo che il customerId
Il customerId NON viene MAI passato dal frontend — sempre dalla sessione JWT
Ogni query filtra per customerId — un cliente non può vedere dati di un altro
Il middleware impedisce ai CUSTOMER di accedere a route admin/operative
Le action admin usano requireAdmin() — i clienti non possono creare utenti o modificare prodotti
Ordine di implementazione
Schema Prisma + migrazione (5 min)
Auth: JWT/session + tipi (10 min)
Middleware route protection (10 min)
Server actions portale (30 min)
Constants + portal sidebar nav (5 min)
Layout portale + customer sidebar (15 min)
Dashboard portale (20 min)
Catalogo prodotti (20 min)
Ordini: lista + nuovo + dettaglio (30 min)
Fatture: lista + dettaglio (15 min)
Pagamenti (10 min)
Admin: bottone attiva portale su cliente (15 min)
Admin: toggle isFeatured su prodotti (10 min)
Login: redirect condizionale (5 min)
Verifica
Creare utente portale per un cliente esistente dall'admin
Login come cliente → redirect a /portale
Dashboard mostra: card riepilogo, prodotti in evidenza, ordini recenti
Catalogo mostra prodotti con prezzi personalizzati del cliente
Creare un ordine dal portale → verificare che appaia nella lista ordini admin con channel: WEB
Verificare che l'ordine progredisca (RECEIVED → CONFIRMED → ecc.) e il cliente veda lo stato aggiornato
Verificare fatture e pagamenti visibili al cliente
Tentare di accedere a /dashboard come CUSTOMER → redirect a /portale
Tentare di accedere a /portale come ADMIN → redirect a /dashboard
Verificare che un cliente non possa vedere ordini/fatture di altri clienti
User approved the plan
Piano approvato. Inizio l'implementazione seguendo l'ordine stabilito.

Update Todos

Schema Prisma: Role CUSTOMER + User.customerId + Product.isFeatured + migrazione

Auth: JWT/session con customerId + tipi TypeScript

Middleware route protection

Server actions portale (8+ nuove actions)

Constants: ROLE_LABELS + PORTAL_SIDEBAR_NAV

Layout portale + CustomerSidebar

Dashboard portale cliente

Catalogo prodotti portale

Ordini portale: lista + nuovo + dettaglio

Fatture portale: lista + dettaglio

Pagamenti portale

Admin: bottone attiva portale su cliente + toggle isFeatured

Login: redirect condizionale per CUSTOMER
