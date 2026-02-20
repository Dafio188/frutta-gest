/**
 * Script per importare immagini e creare/aggiornare prodotti
 *
 * Per ogni immagine in public/images/products/:
 * 1. Deriva il nome prodotto dal nome file
 * 2. Cerca un prodotto esistente che corrisponda
 * 3. Se esiste → aggiorna il campo image
 * 4. Se non esiste → crea un nuovo prodotto con categoria dedotta
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'fruttagest',
  user: 'postgres',
  password: 'postgres',
})

// ============================================================
// MAPPING CATEGORIE
// ============================================================

// Categorie dal DB
const CATEGORIES = {
  FRUTTA: null,       // ID verrà caricato dal DB
  VERDURA: null,
  ORTAGGI: null,
  ERBE_AROMATICHE: null,
  FRUTTA_ESOTICA: null,
  FRUTTA_SECCA: null,
  SPEZIE: null,
}

// Parole chiave per assegnare categoria
const CATEGORY_KEYWORDS = {
  ERBE_AROMATICHE: [
    'basilico', 'rosmarino', 'salvia', 'timo', 'prezzemolo', 'menta',
    'alloro', 'origano', 'aneto', 'dragoncello', 'maggiorana', 'coriandolo',
    'erba cipollina', 'rughetta', 'lemongrass',
  ],
  FRUTTA_ESOTICA: [
    'mango', 'papaya', 'avocado', 'passion', 'maracuja', 'pitaya', 'dragon fruit',
    'frutto del drago', 'litchi', 'lychee', 'cocco', 'ananas', 'banana', 'bananito',
    'platano', 'guava', 'guanabana', 'ramboutan', 'rambutan', 'mangostano', 'mangosteen',
    'durian', 'jackfruit', 'carambola', 'star fruit', 'tamarillo', 'tamarindo',
    'cherimoya', 'annona', 'feijoa', 'granadilla', 'kiwano', 'lulo', 'tumbo',
    'curuba', 'pepino', 'canna da zucchero', 'finger lime', 'caviale limone',
    'cassava', 'yuca', 'manioca', 'zapote', 'longan', 'pandan', 'sakura',
    'keffir', 'alchechengi', 'physalis',
  ],
  FRUTTA_SECCA: [
    'noci', 'nocciole', 'mandorle', 'mandorla', 'pistacchi', 'pistacchio',
    'arachidi', 'anacardo', 'pinoli', 'castagne', 'semi di zucca',
    'datteri', 'fichi secchi', 'prugne secche', 'prugna secca',
    'disidratato', 'disidratata', 'disidradato', 'disidratate', 'reidratata',
    'aloe disidratata', 'cocco disidratato',
    'noci pecan', 'noci franquette', 'noci lara', 'noci sgusciate',
    'kumquat disidratato', 'kiwi disidratato',
    'fragole disidratate', 'ciliegie disidratate', 'mango disidratato',
    'ananas disidradato', 'ananas disidratata',
    'chips di', 'gallette di platano', 'torroncini',
  ],
  SPEZIE: [
    'curcuma', 'zenzero', 'peperoncino',
  ],
  FRUTTA: [
    'mela', 'mele', 'pera', 'pere', 'pesca', 'pesche', 'albicocche', 'albicocca',
    'ciliegia', 'ciliegie', 'fragola', 'fragole', 'kiwi', 'arancia', 'arance',
    'arancio', 'limoni', 'limone', 'mandarini', 'clementine', 'pompelmo',
    'melograno', 'melagrana', 'melone', 'anguria', 'cocomero', 'uva',
    'susine', 'prugne', 'nespole', 'more', 'lampone', 'ribes',
    'fichi d', 'cachi', 'kako', 'bergamotto', 'mapo', 'kumquat',
    'miyagawa', 'orri', 'ovetto verde',
    'mix frutti', 'macedonia',
    'mela fuji', 'mela golden', 'mela granny', 'mela pink',
    'mela envy', 'mela renetta', 'mela royal', 'mela story',
    'melannurca', 'mele annurca', 'mele golden', 'mele pinklady',
    'mele renette', 'mele royal', 'mele samboa', 'mele smith', 'mele stark',
    'mele kissabel',
    'pera coscia', 'pera degana', 'pera nashi', 'pere abate', 'pere williams', 'pere opera',
    'box agrumi', 'box frutta',
  ],
  VERDURA: [
    'spinaci', 'spinacino', 'bietola', 'biedina', 'insalata', 'lattuga',
    'radicchio', 'rughetta', 'valeriana', 'cicoria', 'cicorietta',
    'cavolo', 'verza', 'cavolfiore', 'cavolini', 'broccol', 'kale',
    'puntarelle', 'scarola', 'indivia', 'canasta', 'cappuccina', 'gentilina',
    'iceberg', 'insalatina', 'baby leaf',
    'borragine', 'agretti', 'microgreen', 'shiso',
    'pack choi', 'pak choi',
    'box verdura', 'cassetta verdura',
  ],
  ORTAGGI: [
    'pomodor', 'datterino', 'zucch', 'melan', 'peperone', 'peperoni',
    'carota', 'carote', 'patata', 'patate', 'patatine',
    'cipolla', 'cipolle', 'cipollotto', 'aglio', 'porro',
    'finocch', 'sedano', 'carciofi', 'carciofo', 'carciof',
    'cetrioli', 'cetriolo', 'ravanelli', 'barbabietola',
    'fagiol', 'piselli', 'fave', 'fava', 'taccole', 'ceci',
    'lenticchi', 'mais', 'topinambur', 'daikon', 'pastinaca',
    'rabarbaro', 'scalogno', 'lampascioni',
    'zucca', 'funghi', 'fungo', 'fiori di zucca',
    'minestrone', 'mini mais', 'crauti', 'radice',
    'cardo gobbo', 'cavoletti', 'sedano rapa',
    'cassetta di patate',
  ],
}

// Prodotti gastronomia / non ortofrutta → ORTAGGI come fallback
const GASTRONOMIA_KEYWORDS = [
  'agnolotti', 'fettuccine', 'gnocch', 'orecchiette', 'paccheri',
  'pappardelle', 'ravioli', 'raviolini', 'scialatielli', 'spaghettoni',
  'strozzapreti', 'tonnarelli', 'tortellini', 'maltagliati', 'calamarata',
  'capresina', 'fresella', 'coppiette', 'guanciale', 'fior di guanciale',
  'rigatino', 'lardo', 'pecorino', 'tonno', 'filetti di acciughe',
  'olio extra vergine', 'olive', 'miele', 'succo', 'nettare',
  'peperonata', 'friarielli sott', 'pomodori secchi sott',
  'carciofi grigliati', 'carciofi interi sott', 'carciofino alla brace',
  'melanzane grigliate', 'melanzane a filetti', 'tris di funghi',
  'filetti di arancio', 'pacco', 'shop', 'cassetta frutta',
  'box del mese', 'box personalizzato', 'box frutta e verdura',
]

// Unità dal nome file
function guessUnit(filename) {
  const lower = filename.toLowerCase()
  if (lower.includes('mazzo') || lower.includes('1mz') || lower.includes('1-mz')) return 'MAZZO'
  if (lower.includes('1pz') || lower.includes('1-pz') || lower.includes('pezzo') || lower.includes('frutto') || lower.includes('pianta') || lower.includes('vaso')) return 'PEZZI'
  if (lower.includes('cestino') || lower.includes('cassa') || lower.includes('cassetta') || lower.includes('box') || lower.includes('pacco') || lower.includes('confezione') || lower.includes('conf')) return 'CASSETTA'
  if (lower.includes('vaschetta') || lower.includes('vassoio')) return 'CASSETTA'
  if (lower.includes('bustina') || lower.includes('sacchetto') || lower.includes('busta')) return 'SACCHETTO'
  if (lower.includes('grappolo')) return 'GRAPPOLO'
  if (lower.includes('vaso')) return 'VASETTO'
  if (lower.match(/\d+gr/) || lower.match(/\d+g[^r]/)) return 'G'
  return 'KG'
}

// Categoria dal nome file
function guessCategory(filename, categoryIds) {
  const lower = filename.toLowerCase()

  // Prima controlla gastronomia → ORTAGGI come fallback
  for (const kw of GASTRONOMIA_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return categoryIds.ORTAGGI
  }

  // Controlla in ordine di specificità
  const checkOrder = ['ERBE_AROMATICHE', 'FRUTTA_ESOTICA', 'FRUTTA_SECCA', 'SPEZIE', 'VERDURA', 'ORTAGGI', 'FRUTTA']

  for (const cat of checkOrder) {
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      if (lower.includes(kw.toLowerCase())) return categoryIds[cat]
    }
  }

  // Default: FRUTTA
  return categoryIds.FRUTTA
}

// Converti nome file in nome prodotto leggibile
function filenameToProductName(filename) {
  // Rimuovi estensione
  let name = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '')

  // Rimuovi suffisso -dup1, -dup2, etc.
  name = name.replace(/-dup\d+$/, '')

  // Sostituisci trattini con spazi
  name = name.replace(/-/g, ' ')

  // Decodifica HTML entities
  name = name.replace(/&#039;/g, "'")
  name = name.replace(/&amp;/g, "&")

  // Capitalizza ogni parola
  name = name.replace(/\b\w/g, c => c.toUpperCase())

  // Fix abbreviazioni comuni
  name = name.replace(/\b(\d+)Kg\b/gi, '$1kg')
  name = name.replace(/\b(\d+)Gr\b/gi, '$1gr')
  name = name.replace(/\b(\d+)Pz\b/gi, '$1pz')
  name = name.replace(/\b(\d+)Lt\b/gi, '$1lt')
  name = name.replace(/\b1Mz\b/gi, '1mz')
  name = name.replace(/\bD O P\b/gi, 'D.O.P.')
  name = name.replace(/\bD India\b/gi, "d'India")
  name = name.replace(/\bSott Olio\b/gi, "sott'olio")
  name = name.replace(/\bAll Uovo\b/gi, "all'uovo")
  name = name.replace(/\bAll 039 Uovo\b/gi, "all'uovo")
  name = name.replace(/\bD 039 India\b/gi, "d'India")
  name = name.replace(/\bDi Oliva\b/g, "di Oliva")
  name = name.replace(/\bDi Carne\b/g, "di Carne")
  name = name.replace(/\bDi Patate\b/g, "di Patate")
  name = name.replace(/\bDel Mese\b/g, "del Mese")
  name = name.replace(/\bDel Drago\b/g, "del Drago")
  name = name.replace(/\bAl Peperoncino\b/g, "al Peperoncino")
  name = name.replace(/\bAl Basilico\b/g, "al Basilico")
  name = name.replace(/\bAl Bergamotto\b/g, "al Bergamotto")
  name = name.replace(/\bAl Pistacchio\b/g, "al Pistacchio")
  name = name.replace(/\bAlla Fragola\b/g, "alla Fragola")
  name = name.replace(/\bAlla Brace\b/g, "alla Brace")
  name = name.replace(/\bA Fette\b/g, "a Fette")
  name = name.replace(/\bA Ciuffo\b/g, "a Ciuffo")
  name = name.replace(/\bA Mazzi\b/g, "a Mazzi")
  name = name.replace(/\bA Mano\b/g, "a Mano")
  name = name.replace(/\bA Legna\b/g, "a Legna")
  name = name.replace(/\bA Treccia\b/g, "a Treccia")
  name = name.replace(/\bIn Guscio\b/g, "in Guscio")
  name = name.replace(/\bIn Spicchi\b/g, "in Spicchi")
  name = name.replace(/\bDa Spremuta\b/g, "da Spremuta")
  name = name.replace(/\bDa Forno\b/g, "da Forno")
  name = name.replace(/\bDa Bere\b/g, "da Bere")
  name = name.replace(/\bDa Sgusciare\b/g, "da Sgusciare")
  name = name.replace(/\bDa Grigliare\b/g, "da Grigliare")
  name = name.replace(/\bDa Condire\b/g, "da Condire")
  name = name.replace(/\bDi Bosco\b/g, "di Bosco")
  name = name.replace(/\bDi Bruxelles\b/g, "di Bruxelles")
  name = name.replace(/\bDi Tropea\b/g, "di Tropea")
  name = name.replace(/\bDi Montagna\b/g, "di Montagna")
  name = name.replace(/\bDi Leonessa\b/g, "di Leonessa")
  name = name.replace(/\bDi Soncino\b/g, "di Soncino")
  name = name.replace(/\bDi Verona\b/g, "di Verona")
  name = name.replace(/\bDi Acciughe\b/g, "di Acciughe")
  name = name.replace(/\bDi Arancio\b/g, "di Arancio")
  name = name.replace(/\bDi Limone\b/g, "di Limone")
  name = name.replace(/\bDi Rafano\b/g, "di Rafano")
  name = name.replace(/\bDi Mango\b/g, "di Mango")
  name = name.replace(/\bDi Guava\b/g, "di Guava")
  name = name.replace(/\bE Verdura\b/g, "e Verdura")
  name = name.replace(/\bE Nettare\b/g, "e Nettare")
  name = name.replace(/\bE Spinaci\b/g, "e Spinaci")
  name = name.replace(/\bE Farina\b/g, "e Farina")
  name = name.replace(/\bCon Frutti\b/g, "con Frutti")
  name = name.replace(/\bPer Friggere\b/g, "per Friggere")
  name = name.replace(/\bPer Aziende\b/g, "per Aziende")
  name = name.replace(/\bSu Ordinazione\b/g, "su Ordinazione")
  name = name.replace(/\bVia Aerea\b/g, "Via Aerea")
  name = name.replace(/\bAcqua e Farina\b/g, "Acqua e Farina")
  name = name.replace(/\bRicotta e Spinaci\b/g, "Ricotta e Spinaci")
  name = name.replace(/\bCotta a Legna\b/g, "Cotta a Legna")
  name = name.replace(/\bCotte Al Vapore\b/g, "Cotte al Vapore")
  name = name.replace(/\bCotto Al Vapore\b/g, "Cotto al Vapore")
  name = name.replace(/\bAl Vapore\b/g, "al Vapore")
  name = name.replace(/\bAl Naturale\b/g, "al Naturale")
  name = name.replace(/\bSenza Buccia\b/g, "Senza Buccia")
  name = name.replace(/\bReady To Eat\b/g, "Ready to Eat")

  return name.trim()
}

function nameToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuovi accenti
    .replace(/['']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
}

function generateCuid() {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(8).toString('hex')
  return `climg${timestamp}${random.substring(0, 16)}`
}

async function main() {
  const client = await pool.connect()

  try {
    // 1. Carica categorie
    const catResult = await client.query('SELECT id, name, type FROM "ProductCategory"')
    const categoryIds = {}
    for (const row of catResult.rows) {
      categoryIds[row.type] = row.id
    }
    console.log('Categorie caricate:', Object.keys(categoryIds).length)

    // 2. Carica prodotti esistenti
    const prodResult = await client.query('SELECT id, name, slug, image FROM "Product"')
    const existingProducts = prodResult.rows
    console.log('Prodotti esistenti:', existingProducts.length)

    // Crea lookup per slug e nome normalizzato
    const slugLookup = {}
    const nameLookup = {}
    for (const p of existingProducts) {
      slugLookup[p.slug] = p
      nameLookup[p.name.toLowerCase()] = p
    }

    // 3. Leggi file immagini
    const imageFiles = fs.readdirSync(imagesDir).filter(f =>
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f)
    )
    console.log('Immagini trovate:', imageFiles.length)

    let updated = 0
    let created = 0
    let skippedDup = 0
    const processedSlugs = new Set()

    await client.query('BEGIN')

    for (const imageFile of imageFiles) {
      const imagePath = `/images/products/${imageFile}`
      const productName = filenameToProductName(imageFile)
      const slug = nameToSlug(productName)

      // Salta duplicati (file con -dup1, etc. o che generano lo stesso slug)
      const baseSlug = slug.replace(/-dup\d+$/, '')
      if (processedSlugs.has(baseSlug)) {
        skippedDup++
        continue
      }

      // Cerca prodotto esistente
      let existingProduct = slugLookup[slug] || slugLookup[baseSlug] || nameLookup[productName.toLowerCase()]

      // Prova match parziale - cerca prodotti il cui slug è contenuto o contiene
      if (!existingProduct) {
        for (const p of existingProducts) {
          const pSlug = p.slug
          // Match se lo slug dell'immagine inizia con lo slug del prodotto
          if (baseSlug.startsWith(pSlug + '-') || pSlug === baseSlug) {
            existingProduct = p
            break
          }
        }
      }

      if (existingProduct) {
        // Aggiorna immagine del prodotto esistente
        await client.query(
          'UPDATE "Product" SET image = $1, "updatedAt" = NOW() WHERE id = $2',
          [imagePath, existingProduct.id]
        )
        updated++
        processedSlugs.add(baseSlug)
      } else {
        // Verifica che lo slug non esista già nel DB (potrebbe essere stato creato in questa sessione)
        const slugCheck = await client.query('SELECT id FROM "Product" WHERE slug = $1', [baseSlug])
        if (slugCheck.rows.length > 0) {
          // Aggiorna solo l'immagine
          await client.query(
            'UPDATE "Product" SET image = $1, "updatedAt" = NOW() WHERE slug = $2',
            [imagePath, baseSlug]
          )
          updated++
          processedSlugs.add(baseSlug)
          continue
        }

        // Crea nuovo prodotto
        const categoryId = guessCategory(productName, categoryIds)
        const unit = guessUnit(imageFile)
        const id = generateCuid()

        await client.query(
          `INSERT INTO "Product" (id, name, slug, "categoryId", unit, "defaultPrice", "vatRate", "isAvailable", image, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [id, productName, baseSlug, categoryId, unit, 0, 4, false, imagePath]
        )
        created++
        processedSlugs.add(baseSlug)
      }
    }

    await client.query('COMMIT')

    console.log('\n========================================')
    console.log(`Prodotti aggiornati (immagine): ${updated}`)
    console.log(`Nuovi prodotti creati: ${created}`)
    console.log(`Duplicati saltati: ${skippedDup}`)
    console.log(`Totale processati: ${updated + created}`)
    console.log('========================================')

    // Verifica finale
    const finalCount = await client.query('SELECT COUNT(*) as count FROM "Product"')
    const withImage = await client.query('SELECT COUNT(*) as count FROM "Product" WHERE image IS NOT NULL')
    console.log(`\nProdotti totali nel DB: ${finalCount.rows[0].count}`)
    console.log(`Prodotti con immagine: ${withImage.rows[0].count}`)

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('ERRORE:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(console.error)
