/**
 * API Upload Audio
 *
 * Gestisce l'upload di file audio per la trascrizione ordini.
 * Salva il file e avvia la trascrizione in background.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { transcribeAudio } from "@/lib/ai/transcribe-audio"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("audio") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nessun file audio" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // In produzione, caricare su Uploadthing/Cloudinary
    // Per ora salviamo l'URL come placeholder
    const fileUrl = `/uploads/audio/${Date.now()}-${file.name}`

    const record = await db.audioTranscription.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: buffer.length,
        status: "pending",
      },
    })

    // Avvia trascrizione in background
    transcribeAudio(record.id).catch((err) => {
      console.error("Errore trascrizione audio:", err)
    })

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        fileName: record.fileName,
        status: record.status,
      },
    })
  } catch (error) {
    console.error("Errore upload audio:", error)
    return NextResponse.json(
      { error: "Errore durante l'upload" },
      { status: 500 }
    )
  }
}
