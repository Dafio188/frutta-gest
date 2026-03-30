/**
 * Email Templates — FruttaGest Suite
 *
 * Template HTML branded con inline CSS (compatibili con tutti i client email).
 * Design Apple-inspired: verde smeraldo, Inter, card con ombre leggere.
 */

const BASE_URL = process.env.NEXT_PUBLIC_ROOT_URL || "https://fruttagest.it"

// ─── Wrapper HTML comune ────────────────────────────────────────────────────

function emailWrapper(content: string, previewText = "") {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>FruttaGest</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; background-color: #f4f7f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
  <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f7f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">

          <!-- HEADER -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <a href="${BASE_URL}" style="text-decoration:none;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <div style="width:36px;height:36px;background:linear-gradient(135deg,#059669,#34d399);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-size:18px;font-weight:800;line-height:1;">🍊</span>
                  </div>
                  <span style="font-size:18px;font-weight:800;color:#064e3b;letter-spacing:-0.5px;">FruttaGest</span>
                </div>
              </a>
            </td>
          </tr>

          <!-- CARD CONTENT -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e7f5ee;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                © ${new Date().getFullYear()} FruttaGest &bull;
                <a href="${BASE_URL}/privacy" style="color:#6b7280;text-decoration:none;">Privacy</a> &bull;
                <a href="${BASE_URL}/contact" style="color:#6b7280;text-decoration:none;">Contatti</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
                Hai ricevuto questa email perché sei registrato su FruttaGest.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Componenti riusabili ───────────────────────────────────────────────────

function primaryButton(label: string, href: string) {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;margin-bottom:8px;">
    <tr>
      <td align="center">
        <a href="${href}"
           style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(5,150,105,0.35);letter-spacing:0.2px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e7f5ee;margin:28px 0;" />`
}

function badge(label: string, color = "#059669") {
  return `<span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;letter-spacing:0.5px;text-transform:uppercase;">${label}</span>`
}

function infoBox(content: string) {
  return `
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-top:20px;">
    <p style="margin:0;font-size:13px;color:#065f46;line-height:1.6;">${content}</p>
  </div>`
}

function warningBox(content: string) {
  return `
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-top:20px;">
    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">${content}</p>
  </div>`
}

// ─── 1. RESET PASSWORD ──────────────────────────────────────────────────────

export function resetPasswordTemplate({
  userName,
  resetUrl,
  expiresInMinutes = 60,
}: {
  userName?: string | null
  resetUrl: string
  expiresInMinutes?: number
}) {
  const name = userName || "Utente"
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🔑</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        Reimposta la Password
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        La tua richiesta è stata ricevuta
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ciao <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Abbiamo ricevuto una richiesta per reimpostare la password del tuo account FruttaGest. 
      Clicca il pulsante qui sotto per scegliere una nuova password.
    </p>

    ${primaryButton("Reimposta Password", resetUrl)}

    ${infoBox(`⏱️ Il link è valido per <strong>${expiresInMinutes} minuti</strong>. Dopo la scadenza dovrai richiederne uno nuovo.`)}
    ${divider()}

    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;text-align:center;">
      Non hai richiesto il reset? Puoi ignorare questa email in sicurezza.<br/>
      Il tuo account rimarrà invariato.
    </p>

    <p style="margin:16px 0 0;font-size:12px;color:#d1d5db;text-align:center;word-break:break-all;">
      Problemi con il pulsante? Copia questo link:<br/>
      <a href="${resetUrl}" style="color:#059669;">${resetUrl}</a>
    </p>`

  return {
    subject: "🔑 Reimposta la tua password — FruttaGest",
    html: emailWrapper(content, "Hai richiesto il reset della password. Clicca per procedere."),
  }
}

// ─── 2. MAGIC LINK INVITE ───────────────────────────────────────────────────

export function inviteMagicLinkTemplate({
  inviteeName,
  tenantName,
  inviteUrl,
  role = "ADMIN",
  expiresInHours = 48,
}: {
  inviteeName?: string | null
  tenantName: string
  inviteUrl: string
  role?: string
  expiresInHours?: number
}) {
  const name = inviteeName || "Nuovo Utente"
  const roleLabel = role === "ADMIN" ? "Amministratore" : role === "OPERATOR" ? "Operatore" : role
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#d1fae5,#6ee7b7);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🎉</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        Sei stato invitato!
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        ${badge(roleLabel)} su FruttaGest
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ciao <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Sei stato invitato a unirti a <strong>${tenantName}</strong> su FruttaGest come <strong>${roleLabel}</strong>.
      Clicca il pulsante per completare la registrazione e impostare la tua password.
    </p>

    ${primaryButton("Accetta l'Invito", inviteUrl)}

    ${infoBox(`⏱️ Il link è valido per <strong>${expiresInHours} ore</strong>. Dopo la scadenza sarà necessario un nuovo invito.`)}
    ${divider()}

    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Le tue informazioni</p>
      <p style="margin:0;font-size:14px;color:#374151;">🏢 Organizzazione: <strong>${tenantName}</strong></p>
      <p style="margin:4px 0 0;font-size:14px;color:#374151;">👤 Ruolo: <strong>${roleLabel}</strong></p>
    </div>

    <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;word-break:break-all;">
      Problemi con il pulsante? Copia questo link:<br/>
      <a href="${inviteUrl}" style="color:#059669;">${inviteUrl}</a>
    </p>`

  return {
    subject: `🎉 Sei invitato su FruttaGest — ${tenantName}`,
    html: emailWrapper(content, `Hai ricevuto un invito per unirti a ${tenantName} su FruttaGest.`),
  }
}

// ─── 3. NUOVO LEAD (notifica a SuperAdmin) ──────────────────────────────────

export function newLeadNotificationTemplate({
  leadName,
  leadEmail,
  leadPhone,
  leadCompany,
  leadMessage,
  leadId,
}: {
  leadName: string
  leadEmail: string
  leadPhone?: string | null
  leadCompany?: string | null
  leadMessage?: string | null
  leadId: string
}) {
  const crmUrl = `${BASE_URL}/saas-crm`
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#dbeafe,#93c5fd);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">📩</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        Nuovo Lead
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        ${badge("Nuovo", "#2563eb")} Richiesta di contatto ricevuta
      </p>
    </div>

    <div style="background:#f9fafb;border-radius:16px;padding:24px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Contatto</p>
            <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827;">${leadName}</p>
            ${leadCompany ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">🏢 ${leadCompany}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;">
            <p style="margin:0;font-size:14px;color:#374151;">📧 <a href="mailto:${leadEmail}" style="color:#059669;">${leadEmail}</a></p>
          </td>
        </tr>
        ${leadPhone ? `<tr><td><p style="margin:0;font-size:14px;color:#374151;">📞 ${leadPhone}</p></td></tr>` : ""}
      </table>
    </div>

    ${leadMessage ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:0.5px;">Messaggio</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${leadMessage}"</p>
    </div>` : ""}

    ${primaryButton("Gestisci nel CRM →", crmUrl)}
    ${divider()}

    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
      Vai su <a href="${crmUrl}" style="color:#059669;">FruttaGest CRM</a> per contattare il lead e aggiornarne lo stato.
    </p>`

  return {
    subject: `📩 Nuovo Lead: ${leadName}${leadCompany ? ` — ${leadCompany}` : ""}`,
    html: emailWrapper(content, `Nuova richiesta di contatto da ${leadName}.`),
  }
}

// ─── 4. BENVENUTO NUOVO TENANT ──────────────────────────────────────────────

export function welcomeTenantTemplate({
  adminName,
  tenantName,
  tenantSlug,
  loginUrl,
  plan = "BASIC",
}: {
  adminName?: string | null
  tenantName: string
  tenantSlug: string
  loginUrl: string
  plan?: string
}) {
  const name = adminName || "Amministratore"
  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#d1fae5,#6ee7b7);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🚀</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        Benvenuto su FruttaGest!
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        Il tuo account è pronto
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ciao <strong>${name}</strong>, 👋
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Il tuo spazio di lavoro <strong>${tenantName}</strong> è stato creato con successo. 
      Puoi iniziare subito a gestire ordini, clienti, fatture e molto altro.
    </p>

    <div style="background:#f9fafb;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">I tuoi dati</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;">🏢 Organizzazione: <strong>${tenantName}</strong></p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;">🌐 Slug: <strong>${tenantSlug}</strong></p>
      <p style="margin:0;font-size:14px;color:#374151;">📦 Piano: <strong>${plan}</strong></p>
    </div>

    ${primaryButton("Accedi alla Dashboard →", loginUrl)}

    ${infoBox("💡 <strong>Suggerimento:</strong> Inizia importando il tuo catalogo prodotti e aggiungendo i tuoi clienti. Il nostro sistema AI imparerà a riconoscere i tuoi ordini WhatsApp automaticamente!")}
    ${divider()}

    <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
      Hai bisogno di aiuto? Scrivici a 
      <a href="mailto:info@fruttagest.it" style="color:#059669;">info@fruttagest.it</a>
    </p>`

  return {
    subject: `🚀 Benvenuto su FruttaGest — ${tenantName} è pronto!`,
    html: emailWrapper(content, `Il tuo account ${tenantName} è stato creato con successo.`),
  }
}

// ─── 5. CONFERMA ORDINE (al cliente) ───────────────────────────────────────

export function orderConfirmationTemplate({
  customerName,
  orderNumber,
  orderDate,
  items,
  total,
  deliveryDate,
  portalUrl,
}: {
  customerName: string
  orderNumber: string
  orderDate: string
  items: { name: string; quantity: number | string; unit: string; price: number }[]
  total: number
  deliveryDate?: string | null
  portalUrl: string
}) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n)

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#374151;">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0fdf4;font-size:14px;color:#6b7280;text-align:center;">${item.quantity} ${item.unit}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0fdf4;font-size:14px;font-weight:600;color:#111827;text-align:right;">${formatCurrency(item.price)}</td>
      </tr>`
    )
    .join("")

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#d1fae5,#6ee7b7);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        Ordine Confermato
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        ${badge("Confermato", "#059669")} ${orderNumber}
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ciao <strong>${customerName}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Il tuo ordine è stato confermato e si trova in preparazione. 
      ${deliveryDate ? `La consegna è prevista per il <strong>${deliveryDate}</strong>.` : ""}
    </p>

    <!-- Riepilogo Prodotti -->
    <div style="background:#f9fafb;border-radius:16px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Dettaglio Ordine</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <th style="font-size:11px;color:#9ca3af;font-weight:600;text-align:left;padding-bottom:8px;text-transform:uppercase;">Prodotto</th>
          <th style="font-size:11px;color:#9ca3af;font-weight:600;text-align:center;padding-bottom:8px;text-transform:uppercase;">Quantità</th>
          <th style="font-size:11px;color:#9ca3af;font-weight:600;text-align:right;padding-bottom:8px;text-transform:uppercase;">Totale</th>
        </tr>
        ${itemRows}
        <tr>
          <td colspan="2" style="padding-top:14px;font-size:15px;font-weight:800;color:#111827;text-align:left;">Totale Ordine</td>
          <td style="padding-top:14px;font-size:15px;font-weight:800;color:#059669;text-align:right;">${formatCurrency(total)}</td>
        </tr>
      </table>
    </div>

    ${primaryButton("Traccia il tuo Ordine →", portalUrl)}
    ${divider()}

    <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
      Per modifiche o informazioni, contatta il tuo commerciale di riferimento.
    </p>`

  return {
    subject: `✅ Ordine ${orderNumber} Confermato — FruttaGest`,
    html: emailWrapper(content, `Il tuo ordine ${orderNumber} è stato confermato.`),
  }
}

// ─── 6. NOTIFICA RINNOVO ABBONAMENTO ───────────────────────────────────────

export function subscriptionRenewalTemplate({
  adminName,
  tenantName,
  expiresAt,
  daysLeft,
  renewalFee,
  contactEmail = "info@fruttagest.it",
}: {
  adminName?: string | null
  tenantName: string
  expiresAt: string
  daysLeft: number
  renewalFee?: number | null
  contactEmail?: string
}) {
  const isUrgent = daysLeft <= 7
  const name = adminName || "Amministratore"
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n)

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,${isUrgent ? "#fee2e2,#fca5a5" : "#fef3c7,#fde68a"});border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">${isUrgent ? "🚨" : "⏰"}</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.5px;">
        ${isUrgent ? "Abbonamento in scadenza!" : "Rinnovo imminente"}
      </h1>
      <p style="margin:8px 0 0;font-size:15px;color:#6b7280;">
        ${badge(`${daysLeft} giorni rimanenti`, isUrgent ? "#dc2626" : "#d97706")}
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ciao <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      L'abbonamento di <strong>${tenantName}</strong> su FruttaGest scadrà il <strong>${expiresAt}</strong> 
      (tra <strong>${daysLeft} giorni</strong>).
      ${isUrgent ? " <span style='color:#dc2626;font-weight:600;'>Rinnova subito per non perdere l'accesso.</span>" : ""}
    </p>

    ${renewalFee ? `
    <div style="background:#f9fafb;border-radius:16px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Quota di rinnovo</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#059669;">${formatCurrency(renewalFee)}<span style="font-size:14px;color:#9ca3af;font-weight:400;">/mese</span></p>
    </div>` : ""}

    ${isUrgent
      ? warningBox("⚠️ Dopo la scadenza, l'accesso all'applicazione sarà sospeso fino al rinnovo. I tuoi dati saranno conservati.")
      : infoBox("💡 Contattaci per rinnovare o per aggiornare il tuo piano.")}

    ${primaryButton("Contatta il Supporto →", `mailto:${contactEmail}?subject=Rinnovo abbonamento — ${tenantName}`)}
    ${divider()}

    <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
      Per il rinnovo scrivici a <a href="mailto:${contactEmail}" style="color:#059669;">${contactEmail}</a>
    </p>`

  return {
    subject: `${isUrgent ? "🚨 URGENTE:" : "⏰"} Abbonamento ${tenantName} scade tra ${daysLeft} giorni`,
    html: emailWrapper(content, `Il tuo abbonamento FruttaGest scade tra ${daysLeft} giorni.`),
  }
}
