/**
 * Email Service — FruttaGest Suite
 *
 * Centralizza l'invio di email via Aruba SMTP (nodemailer).
 * Supporta più indirizzi mittente con strategia definita:
 *
 * noreply@fruttagest.it → email di sistema (reset password, conferme automatiche)
 * hello@fruttagest.it   → email relazionali (inviti, benvenuto) — tono amichevole
 * info@fruttagest.it    → notifiche operative verso SuperAdmin (lead, rinnovi)
 */

import nodemailer from "nodemailer"

// ─── Tipi ───────────────────────────────────────────────────────────────────

export type EmailSender = "noreply" | "hello" | "info"

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: EmailSender
  replyTo?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: unknown
}

// ─── Configurazione indirizzi ────────────────────────────────────────────────

const SENDERS: Record<EmailSender, string> = {
  noreply: `FruttaGest <noreply@fruttagest.it>`,
  hello: `FruttaGest <hello@fruttagest.it>`,
  info: `FruttaGest <info@fruttagest.it>`,
}

// ─── Transporter Singleton ───────────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtps.aruba.it",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
  })

  return _transporter
}

// ─── Funzione principale ─────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = "noreply",
  replyTo,
}: SendEmailOptions): Promise<EmailResult> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error("[Email] SMTP non configurato: SMTP_USER o SMTP_PASSWORD mancanti")
    return { success: false, error: "SMTP non configurato" }
  }

  const transporter = getTransporter()

  const mailOptions = {
    from: SENDERS[from],
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    replyTo,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[Email] ✅ Inviata "${subject}" → ${mailOptions.to} (${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[Email] ❌ Errore invio "${subject}":`, error)
    return { success: false, error }
  }
}

// ─── Helper specializzati ────────────────────────────────────────────────────

/** Reset password — mittente noreply (sistema, no risposta attesa) */
export async function sendResetPasswordEmail(
  to: string,
  params: { userName?: string | null; resetUrl: string }
) {
  const { resetPasswordTemplate } = await import("./email-templates")
  const { subject, html } = resetPasswordTemplate(params)
  return sendEmail({ to, subject, html, from: "noreply" })
}

/** Magic Link invite — mittente hello (tono amichevole, onboarding) */
export async function sendInviteEmail(
  to: string,
  params: Parameters<typeof import("./email-templates").inviteMagicLinkTemplate>[0]
) {
  const { inviteMagicLinkTemplate } = await import("./email-templates")
  const { subject, html } = inviteMagicLinkTemplate(params)
  return sendEmail({ to, subject, html, from: "hello", replyTo: "info@fruttagest.it" })
}

/** Notifica nuovo lead — mittente info (notifica operativa al SuperAdmin) */
export async function sendLeadNotificationEmail(
  params: Parameters<typeof import("./email-templates").newLeadNotificationTemplate>[0]
) {
  const { newLeadNotificationTemplate } = await import("./email-templates")
  const { subject, html } = newLeadNotificationTemplate(params)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "info@fruttagest.it"
  return sendEmail({ to: superAdminEmail, subject, html, from: "info", replyTo: params.leadEmail })
}

/** Benvenuto tenant — mittente hello (relazionale, onboarding) */
export async function sendWelcomeTenantEmail(
  to: string,
  params: Parameters<typeof import("./email-templates").welcomeTenantTemplate>[0]
) {
  const { welcomeTenantTemplate } = await import("./email-templates")
  const { subject, html } = welcomeTenantTemplate(params)
  return sendEmail({ to, subject, html, from: "hello", replyTo: "info@fruttagest.it" })
}

/** Conferma ordine — mittente noreply (automatica, no risposta) */
export async function sendOrderConfirmationEmail(
  to: string,
  params: Parameters<typeof import("./email-templates").orderConfirmationTemplate>[0]
) {
  const { orderConfirmationTemplate } = await import("./email-templates")
  const { subject, html } = orderConfirmationTemplate(params)
  return sendEmail({ to, subject, html, from: "noreply", replyTo: "info@fruttagest.it" })
}

/** Notifica rinnovo abbonamento — mittente info (operativa) */
export async function sendRenewalNotificationEmail(
  to: string,
  params: Parameters<typeof import("./email-templates").subscriptionRenewalTemplate>[0]
) {
  const { subscriptionRenewalTemplate } = await import("./email-templates")
  const { subject, html } = subscriptionRenewalTemplate(params)
  return sendEmail({ to, subject, html, from: "info", replyTo: "info@fruttagest.it" })
}
