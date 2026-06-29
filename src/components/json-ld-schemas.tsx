/**
 * JSON-LD Structured Data components for FruttaGest
 *
 * Injects schema.org markup for SoftwareApplication, FAQ, and Organization
 * to improve visibility in search engines, AI engines (GEO), and answer engines (AEO).
 */

type JsonLdProps = {
  data: Record<string, unknown>
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FruttaGest",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    description:
      "Gestionale completo per la vendita di prodotti ortofrutticoli a ristoranti e supermercati. Ordini, DDT, fatture, gestione finanziaria.",
    url: "https://www.fruttagest.it",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Prova gratuita disponibile",
    },
    featureList:
      "Ordini WhatsApp AI, Gestione Magazzino, Giri di Consegna, Vendita al Banco, Fatturazione Elettronica, E-commerce B2B, E-commerce B2C",
  }

  return <JsonLd data={data} />
}

export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FruttaGest",
    description: "Suite per la digitalizzazione della filiera ortofrutticola",
    url: "https://www.fruttagest.it",
    areaServed: { "@type": "Country", name: "IT" },
    knowsAbout: [
      "Ortofrutta",
      "Gestionale",
      "Software Distributori",
      "Software Grossisti",
      "Software Fruttivendoli",
    ],
  }

  return <JsonLd data={data} />
}

export function FAQSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cos'è FruttaGest?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "FruttaGest è la suite completa per digitalizzare la filiera ortofrutticola. Tre soluzioni integrate per Distributori, Grossisti e Fruttivendoli.",
        },
      },
      {
        "@type": "Question",
        name: "Come funziona l'ordine tramite WhatsApp?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "I clienti possono inviare ordini via WhatsApp o email. L'intelligenza artificiale di FruttaGest interpreta il testo e i messaggi vocali, convertendoli automaticamente in righe d'ordine nel sistema.",
        },
      },
      {
        "@type": "Question",
        name: "FruttaGest è gratuito?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sì, puoi creare un account gratuito per iniziare. Funzionalità avanzate sono disponibili su richiesta per distributori in forte espansione.",
        },
      },
    ],
  }

  return <JsonLd data={data} />
}
