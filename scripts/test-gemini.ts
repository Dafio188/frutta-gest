
import { GoogleGenerativeAI } from "@google/generative-ai"
import "dotenv/config"

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY non trovata nelle variabili d'ambiente.")
    return
  }

  console.log(`✅ GEMINI_API_KEY trovata (lunghezza: ${apiKey.length})`)

  const genAI = new GoogleGenerativeAI(apiKey)
  const modelName = "gemini-2.0-flash" 
  
  console.log(`Testing modello: ${modelName}...`)

  try {
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent("Ciao, sei funzionante? Rispondi solo con SI o NO.")
    const response = await result.response
    const text = response.text()
    console.log(`✅ Risposta ricevuta: ${text}`)
  } catch (error: any) {
    console.error("❌ Errore durante il test del modello:")
    if (error.message.includes("404")) {
      console.error("Il modello potrebbe non esistere o non essere accessibile con questa chiave API.")
      console.error("Suggerimento: Prova 'gemini-1.5-flash' o 'gemini-1.5-pro'.")
    } else {
      console.error(error.message)
    }
  }
}

testGemini()
