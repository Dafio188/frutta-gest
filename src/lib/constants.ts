/**
 * Costanti dell'applicazione FruttaGest
 *
 * Etichette italiane, configurazioni e mappature
 * per tutti gli enum e le entità del sistema.
 */

export const APP_NAME = "FruttaGest"
export const APP_DESCRIPTION = "Gestionale vendite prodotti ortofrutticoli"

// Etichette per i ruoli utente
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Amministratore",
  OPERATOR: "Operatore",
  VIEWER: "Visualizzatore",
  CUSTOMER: "Cliente",
}

// Etichette per i tipi di cliente
export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  RISTORANTE: "Ristorante",
  SUPERMERCATO: "Supermercato",
  BAR: "Bar",
  HOTEL: "Hotel",
  MENSA: "Mensa",
  GASTRONOMIA: "Gastronomia",
  ALTRO: "Altro",
}

// Etichette per le unità di misura
export const PRODUCT_UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  PEZZI: "Pz",
  CASSETTA: "Cassetta",
  MAZZO: "Mazzo",
  GRAPPOLO: "Grappolo",
  VASETTO: "Vasetto",
  SACCHETTO: "Sacchetto",
}

export const PRODUCT_UNIT_LABELS_FULL: Record<string, string> = {
  KG: "Chilogrammi",
  G: "Grammi",
  PEZZI: "Pezzi",
  CASSETTA: "Cassette",
  MAZZO: "Mazzi",
  GRAPPOLO: "Grappoli",
  VASETTO: "Vasetti",
  SACCHETTO: "Sacchetti",
}

// Etichette per le categorie prodotto
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  FRUTTA: "Frutta",
  VERDURA: "Verdura",
  ORTAGGI: "Ortaggi",
  ERBE_AROMATICHE: "Erbe Aromatiche",
  SPEZIE: "Spezie",
  FRUTTA_ESOTICA: "Frutta Esotica",
  FRUTTA_SECCA: "Frutta Secca",
}

// Etichette per lo stato degli ordini
export const ORDER_STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Ricevuto",
  CONFIRMED: "Confermato",
  IN_PREPARATION: "In Preparazione",
  DELIVERED: "Consegnato",
  INVOICED: "Fatturato",
  CANCELLED: "Annullato",
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  IN_PREPARATION: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  DELIVERED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  INVOICED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

// Etichette per i canali degli ordini
export const ORDER_CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  AUDIO: "Audio",
  MANUAL: "Manuale",
  WEB: "Web",
}

export const ORDER_CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: "MessageCircle",
  EMAIL: "Mail",
  AUDIO: "Mic",
  MANUAL: "PenLine",
  WEB: "Globe",
}

// Etichette per lo stato DDT
export const DDT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  ISSUED: "Emessa",
  DELIVERED: "Consegnata",
}

export const DDT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
}

// Etichette per lo stato fatture
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  ISSUED: "Emessa",
  SENT: "Inviata",
  PAID: "Pagata",
  OVERDUE: "Scaduta",
  CANCELLED: "Annullata",
}

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SENT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-500",
}

// Etichette per i metodi di pagamento
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CONTANTI: "Contanti",
  BONIFICO: "Bonifico Bancario",
  ASSEGNO: "Assegno",
  RIBA: "Ri.Ba.",
  CARTA: "Carta di Credito",
}

// Etichette per la direzione dei pagamenti
export const PAYMENT_DIRECTION_LABELS: Record<string, string> = {
  INCOMING: "Incasso",
  OUTGOING: "Pagamento",
}

// Etichette per lo stato dei pagamenti
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "In Attesa",
  COMPLETED: "Completato",
  CANCELLED: "Annullato",
}

// Etichette per lo stato della lista della spesa
export const SHOPPING_LIST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  FINALIZED: "Finalizzata",
  ORDERED: "Ordinata",
  RECEIVED: "Ricevuta",
}

// Etichette per lo stato degli ordini fornitore
export const PURCHASE_ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bozza",
  SENT: "Inviato",
  RECEIVED: "Ricevuto",
  CANCELLED: "Annullato",
}

export const PURCHASE_ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RECEIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

// Etichette per i movimenti di magazzino
export const STOCK_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  CARICO: "Carico",
  SCARICO: "Scarico",
  RETTIFICA_POS: "Rettifica +",
  RETTIFICA_NEG: "Rettifica -",
  SCARTO: "Scarto",
}

export const STOCK_MOVEMENT_TYPE_COLORS: Record<string, string> = {
  CARICO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  SCARICO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RETTIFICA_POS: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  RETTIFICA_NEG: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  SCARTO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

// Etichette e colori per le fatture fornitore
export const SUPPLIER_INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Da Pagare",
  PAID: "Pagata",
  OVERDUE: "Scaduta",
}

export const SUPPLIER_INVOICE_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

// Province italiane
export const ITALIAN_PROVINCES = [
  { code: "AG", name: "Agrigento" }, { code: "AL", name: "Alessandria" },
  { code: "AN", name: "Ancona" }, { code: "AO", name: "Aosta" },
  { code: "AR", name: "Arezzo" }, { code: "AP", name: "Ascoli Piceno" },
  { code: "AT", name: "Asti" }, { code: "AV", name: "Avellino" },
  { code: "BA", name: "Bari" }, { code: "BT", name: "Barletta-Andria-Trani" },
  { code: "BL", name: "Belluno" }, { code: "BN", name: "Benevento" },
  { code: "BG", name: "Bergamo" }, { code: "BI", name: "Biella" },
  { code: "BO", name: "Bologna" }, { code: "BZ", name: "Bolzano" },
  { code: "BS", name: "Brescia" }, { code: "BR", name: "Brindisi" },
  { code: "CA", name: "Cagliari" }, { code: "CL", name: "Caltanissetta" },
  { code: "CB", name: "Campobasso" }, { code: "CE", name: "Caserta" },
  { code: "CT", name: "Catania" }, { code: "CZ", name: "Catanzaro" },
  { code: "CH", name: "Chieti" }, { code: "CO", name: "Como" },
  { code: "CS", name: "Cosenza" }, { code: "CR", name: "Cremona" },
  { code: "KR", name: "Crotone" }, { code: "CN", name: "Cuneo" },
  { code: "EN", name: "Enna" }, { code: "FM", name: "Fermo" },
  { code: "FE", name: "Ferrara" }, { code: "FI", name: "Firenze" },
  { code: "FG", name: "Foggia" }, { code: "FC", name: "Forlì-Cesena" },
  { code: "FR", name: "Frosinone" }, { code: "GE", name: "Genova" },
  { code: "GO", name: "Gorizia" }, { code: "GR", name: "Grosseto" },
  { code: "IM", name: "Imperia" }, { code: "IS", name: "Isernia" },
  { code: "SP", name: "La Spezia" }, { code: "AQ", name: "L'Aquila" },
  { code: "LT", name: "Latina" }, { code: "LE", name: "Lecce" },
  { code: "LC", name: "Lecco" }, { code: "LI", name: "Livorno" },
  { code: "LO", name: "Lodi" }, { code: "LU", name: "Lucca" },
  { code: "MC", name: "Macerata" }, { code: "MN", name: "Mantova" },
  { code: "MS", name: "Massa-Carrara" }, { code: "MT", name: "Matera" },
  { code: "ME", name: "Messina" }, { code: "MI", name: "Milano" },
  { code: "MO", name: "Modena" }, { code: "MB", name: "Monza e Brianza" },
  { code: "NA", name: "Napoli" }, { code: "NO", name: "Novara" },
  { code: "NU", name: "Nuoro" }, { code: "OR", name: "Oristano" },
  { code: "PD", name: "Padova" }, { code: "PA", name: "Palermo" },
  { code: "PR", name: "Parma" }, { code: "PV", name: "Pavia" },
  { code: "PG", name: "Perugia" }, { code: "PU", name: "Pesaro e Urbino" },
  { code: "PE", name: "Pescara" }, { code: "PC", name: "Piacenza" },
  { code: "PI", name: "Pisa" }, { code: "PT", name: "Pistoia" },
  { code: "PN", name: "Pordenone" }, { code: "PZ", name: "Potenza" },
  { code: "PO", name: "Prato" }, { code: "RG", name: "Ragusa" },
  { code: "RA", name: "Ravenna" }, { code: "RC", name: "Reggio Calabria" },
  { code: "RE", name: "Reggio Emilia" }, { code: "RI", name: "Rieti" },
  { code: "RN", name: "Rimini" }, { code: "RM", name: "Roma" },
  { code: "RO", name: "Rovigo" }, { code: "SA", name: "Salerno" },
  { code: "SS", name: "Sassari" }, { code: "SV", name: "Savona" },
  { code: "SI", name: "Siena" }, { code: "SR", name: "Siracusa" },
  { code: "SO", name: "Sondrio" }, { code: "SU", name: "Sud Sardegna" },
  { code: "TA", name: "Taranto" }, { code: "TE", name: "Teramo" },
  { code: "TR", name: "Terni" }, { code: "TO", name: "Torino" },
  { code: "TP", name: "Trapani" }, { code: "TN", name: "Trento" },
  { code: "TV", name: "Treviso" }, { code: "TS", name: "Trieste" },
  { code: "UD", name: "Udine" }, { code: "VA", name: "Varese" },
  { code: "VE", name: "Venezia" }, { code: "VB", name: "Verbano-Cusio-Ossola" },
  { code: "VC", name: "Vercelli" }, { code: "VR", name: "Verona" },
  { code: "VV", name: "Vibo Valentia" }, { code: "VI", name: "Vicenza" },
  { code: "VT", name: "Viterbo" },
]

// Navigazione sidebar portale clienti
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

// Navigazione sidebar
export const SIDEBAR_NAV = [
  {
    title: "Gestione Ordini",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Ordini", href: "/ordini", icon: "ShoppingCart" },
      { label: "Lista della Spesa", href: "/lista-spesa", icon: "ClipboardList" },
      { label: "Bolle DDT", href: "/bolle", icon: "Truck" },
    ],
  },
  {
    title: "Anagrafica",
    items: [
      { label: "Catalogo Prodotti", href: "/catalogo", icon: "Apple" },
      { label: "Clienti", href: "/clienti", icon: "Building2" },
      { label: "Fornitori", href: "/fornitori", icon: "Factory" },
    ],
  },
  {
    title: "Gestione Fornitori",
    items: [
      { label: "Ordini Fornitore", href: "/acquisti", icon: "ShoppingCart" },
      { label: "Fatture Fornitore", href: "/acquisti/fatture", icon: "FileText" },
      { label: "Magazzino", href: "/magazzino", icon: "Warehouse" },
    ],
  },
  {
    title: "Gestione Clienti",
    items: [
      { label: "Fatture", href: "/fatture", icon: "FileText" },
      { label: "Pagamenti", href: "/finanza", icon: "CreditCard" },
      { label: "Scadenzario", href: "/finanza/scadenzario", icon: "Calendar" },
    ],
  },
  {
    title: "Report",
    items: [
      { label: "Vendite", href: "/report/vendite", icon: "TrendingUp" },
      { label: "Prodotti", href: "/report/prodotti", icon: "BarChart3" },
      { label: "Margini", href: "/report/margini", icon: "PieChart" },
    ],
  },
]
