
import nodemailer from "nodemailer"

interface SendEmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from,
}: SendEmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtps.aruba.it",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // Force secure for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const mailOptions = {
    from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: Array.isArray(to) ? to.join(",") : to,
    subject,
    text,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}
