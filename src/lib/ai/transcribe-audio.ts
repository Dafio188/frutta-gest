/**
 * Trascrizione Audio con OpenAI Whisper
 *
 * Gestisce upload di file audio e trascrizione automatica.
 * Dopo la trascrizione, il testo viene passato al parser ordini AI.
 */

import OpenAI from "openai"
import { db } from "@/lib/db"
import { parseOrderText } from "@/lib/ai/parse-order"
import fs from "fs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAudio(transcriptionId: string): Promise<void> {
  const record = await db.audioTranscription.findUnique({
    where: { id: transcriptionId },
  })

  if (!record) throw new Error("Trascrizione non trovata")

  await db.audioTranscription.update({
    where: { id: transcriptionId },
    data: { status: "transcribing" },
  })

  try {
    // Scarica il file audio dall'URL
    const response = await fetch(record.fileUrl)
    const buffer = Buffer.from(await response.arrayBuffer())

    // Scrivi il file temporaneo
    const tempPath = `/tmp/${record.fileName}`
    fs.writeFileSync(tempPath, buffer)

    // Trascrivi con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "it",
      response_format: "text",
    })

    // Pulisci file temporaneo
    fs.unlinkSync(tempPath)

    // Parsing del testo trascritto
    const parsedData = await parseOrderText(transcription)

    await db.audioTranscription.update({
      where: { id: transcriptionId },
      data: {
        transcription,
        parsedData: JSON.parse(JSON.stringify(parsedData)),
        status: "parsed",
      },
    })
  } catch (error) {
    await db.audioTranscription.update({
      where: { id: transcriptionId },
      data: {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Errore trascrizione",
      },
    })
    throw error
  }
}
