
import { sendEmail } from "../src/lib/email"
import dotenv from 'dotenv';
dotenv.config();

const testEmail = process.argv[2]

if (!testEmail) {
  console.error("Specifica un indirizzo email come argomento")
  process.exit(1)
}

console.log(`Tentativo invio email a: ${testEmail}`)

sendEmail({
  to: testEmail,
  subject: "Test Invio Email - FruttaGest",
  text: "Questa è una email di test per verificare la configurazione SMTP di Aruba.",
  html: "<h1>Test Email</h1><p>Questa è una email di test per verificare la configurazione SMTP di Aruba.</p>",
})
  .then((result) => {
    console.log("Risultato invio:", result)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Errore script:", error)
    process.exit(1)
  })
