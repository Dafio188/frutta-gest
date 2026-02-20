/**
 * Webhook WhatsApp Business API
 *
 * Riceve messaggi da WhatsApp Business Cloud API,
 * li salva nel database e li invia al parser AI per estrarre ordini.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseOrderText } from "@/lib/ai/parse-order"

// Verifica webhook (richiesta da Meta)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// Ricezione messaggi
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entries = body.entry || []
    for (const entry of entries) {
      const changes = entry.changes || []
      for (const change of changes) {
        if (change.field !== "messages") continue

        const messages = change.value?.messages || []
        for (const message of messages) {
          if (message.type !== "text") continue

          const from = message.from
          const messageId = message.id
          const text = message.text?.body || ""
          const timestamp = new Date(parseInt(message.timestamp) * 1000)
          const contactName = change.value?.contacts?.[0]?.profile?.name

          // Salva il messaggio
          const waMessage = await db.whatsAppMessage.upsert({
            where: { messageId },
            update: {},
            create: {
              messageId,
              from,
              customerName: contactName,
              body: text,
              timestamp,
            },
          })

          // Cerca il cliente dal numero di telefono
          const customer = await db.contact.findFirst({
            where: {
              OR: [
                { phone: { contains: from.slice(-10) } },
                { mobile: { contains: from.slice(-10) } },
              ],
              customerId: { not: null },
            },
            include: { customer: true },
          })

          // Parsing AI del messaggio
          try {
            const parsedData = await parseOrderText(text)

            await db.whatsAppMessage.update({
              where: { id: waMessage.id },
              data: {
                parsedData: JSON.parse(JSON.stringify(parsedData)),
                isProcessed: true,
              },
            })

            // Invia conferma via WhatsApp
            if (customer?.customer) {
              await sendWhatsAppReply(
                from,
                `Ordine ricevuto da ${customer.customer.companyName}. ${parsedData.items.length} prodotti identificati. L'ordine sarà confermato a breve.`
              )
            }
          } catch (parseError) {
            await db.whatsAppMessage.update({
              where: { id: waMessage.id },
              data: {
                errorMessage: parseError instanceof Error ? parseError.message : "Errore parsing",
              },
            })
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

async function sendWhatsAppReply(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) return

  await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  )
}
