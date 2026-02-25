/**
 * AI Order Parsing
 *
 * Usa Google Gemini per analizzare testo libero (da WhatsApp, email, audio)
 * e estrarre una lista strutturata di prodotti con quantità.
 * Fa matching fuzzy con il catalogo prodotti esistente.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"
import type { ParsedOrderData, ParsedOrderItem } from "@/types"

const SYSTEM_PROMPT = `Sei un assistente specializzato nel parsing di ordini di prodotti ortofrutticoli per il mercato italiano.

Dato un testo (messaggio WhatsApp, email o trascrizione audio), devi estrarre:
1. La lista dei prodotti ordinati con quantità e unità di misura
2. Il nome del cliente (se menzionato)
3. La data di consegna richiesta (se menzionata)
4. Eventuali note aggiuntive

Regole per le unità di misura:
- "kg", "chili", "chilogrammi" → "KG"
- "g", "grammi" → "G"
- "pezzi", "pz", "unità" → "PEZZI"
- "cassetta", "cassette", "cassa", "casse" → "CASSETTA"
- "mazzo", "mazzi" → "MAZZO"
- "grappolo", "grappoli" → "GRAPPOLO"
- "vasetto", "vasetti" → "VASETTO"
- "sacchetto", "sacchetti" → "SACCHETTO"

Se la quantità non è specificata, usa 1 come default.
Se l'unità non è specificata, usa "KG" come default per frutta/verdura, "MAZZO" per erbe, "PEZZI" per frutta che si vende a pezzi.

Rispondi SOLO con JSON valido nel seguente formato:
{
  "items": [
    {"productName": "nome prodotto", "quantity": numero, "unit": "UNITA"},
    ...
  ],
  "customerName": "nome cliente o null",
  "deliveryDate": "YYYY-MM-DD o null",
  "notes": "eventuali note o null"
}`

export async function parseOrderText(text: string, imageUrl?: string): Promise<ParsedOrderData> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY mancante")
    return { items: [], rawText: text }
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  })

  const productNames = await getProductCatalogNames()
  
  const prompt = `${SYSTEM_PROMPT}

Catalogo prodotti disponibili:
${productNames.join(", ")}

Testo dell'ordine:
${text || "Nessun testo fornito, analizza l'immagine."}`

  const parts: any[] = [prompt]

  if (imageUrl) {
    // imageUrl format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const matches = imageUrl.match(/^data:(.+);base64,(.+)$/)
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      })
    }
  }

  try {
    const result = await model.generateContent(parts)
    const response = await result.response
    const textResponse = response.text()
    
    if (!textResponse) {
      return { items: [], rawText: text }
    }

    const parsed = JSON.parse(textResponse)
    const matchedItems = await matchProductsToIds(parsed.items || [])

    return {
      items: matchedItems,
      customerName: parsed.customerName || undefined,
      deliveryDate: parsed.deliveryDate || undefined,
      notes: parsed.notes || undefined,
      rawText: text,
    }
  } catch (error) {
    console.error("Errore Gemini:", error)
    return { items: [], rawText: text }
  }
}

async function getProductCatalogNames(): Promise<string[]> {
  const products = await db.product.findMany({
    where: { isAvailable: true },
    select: { name: true },
    orderBy: { name: "asc" },
  })
  return products.map((p) => p.name)
}

async function matchProductsToIds(
  items: Array<{ productName: string; quantity: number; unit: string }>
): Promise<ParsedOrderItem[]> {
  const allProducts = await db.product.findMany({
    where: { isAvailable: true },
    select: { id: true, name: true, unit: true, defaultPrice: true },
  })

  return items.map((item) => {
    const normalizedName = item.productName.toLowerCase().trim()

    // Exact match first
    let match = allProducts.find(
      (p) => p.name.toLowerCase() === normalizedName
    )

    // Partial match
    if (!match) {
      match = allProducts.find(
        (p) =>
          p.name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(p.name.toLowerCase())
      )
    }

    // Fuzzy match (simple Levenshtein-like)
    if (!match) {
      let bestScore = 0
      for (const p of allProducts) {
        const score = similarity(normalizedName, p.name.toLowerCase())
        if (score > bestScore && score > 0.6) {
          bestScore = score
          match = p
        }
      }
    }

    return {
      productName: item.productName,
      productId: match?.id,
      quantity: item.quantity,
      unit: item.unit,
      confidence: match ? 1 : 0.5,
    }
  })
}

function similarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1.0

  const costs: number[] = []
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[shorter.length] = lastValue
  }

  return (longer.length - costs[shorter.length]) / longer.length
}
