/**
 * API Upload Immagine Prodotto
 *
 * POST /api/products/upload
 * Riceve un file immagine via FormData e lo salva in public/images/products/
 * Aggiorna il campo image del prodotto nel database.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import path from "path"
import fs from "fs/promises"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const productId = formData.get("productId") as string | null

    if (!file || !productId) {
      return NextResponse.json(
        { error: "File e productId sono obbligatori" },
        { status: 400 }
      )
    }

    // Verifica che il prodotto esista
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 })
    }

    // Valida tipo file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato non supportato. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      )
    }

    // Limite 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Il file non può superare i 5MB." },
        { status: 400 }
      )
    }

    // Genera nome file dal nome prodotto (slug)
    const ext = file.type === "image/png" ? ".png"
      : file.type === "image/webp" ? ".webp"
      : file.type === "image/gif" ? ".gif"
      : ".jpg"

    const slug = product.slug
    const fileName = `${slug}${ext}`

    // Salva file
    const uploadDir = path.join(process.cwd(), "public", "images", "products")
    await fs.mkdir(uploadDir, { recursive: true })

    // Se c'era una vecchia immagine con nome diverso, rimuovila
    if (product.image) {
      const oldFilePath = path.join(process.cwd(), "public", product.image)
      try {
        await fs.unlink(oldFilePath)
      } catch {
        // File potrebbe non esistere più
      }
    }

    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(bytes))

    // Aggiorna DB
    const imagePath = `/images/products/${fileName}`
    await db.product.update({
      where: { id: productId },
      data: { image: imagePath },
    })

    return NextResponse.json({ image: imagePath, success: true })
  } catch (error: any) {
    console.error("Errore upload immagine:", error)
    return NextResponse.json(
      { error: "Errore durante il caricamento dell'immagine." },
      { status: 500 }
    )
  }
}
