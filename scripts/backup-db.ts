/**
 * Script: Backup Database Neon
 *
 * Esegue pg_dump per ogni schema tenant e per il master.
 * I backup vengono salvati in /backups con timestamp.
 *
 * Prerequisito: pg_dump installato (PostgreSQL client tools)
 * Uso: npx tsx scripts/backup-db.ts [--schema=simonefruit]
 */

import "dotenv/config"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const BACKUP_DIR = path.resolve("backups")
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)

// Schemi da backuppare
const SCHEMAS = ["master", "simonefruit"]

function getBaseUrl(): string {
  const url = process.env.MASTER_DATABASE_URL
  if (!url) throw new Error("MASTER_DATABASE_URL mancante")
  // Usa il non-pooler per pg_dump
  return url.split("?")[0].replace("-pooler.", ".")
}

function buildPgDumpUrl(baseUrl: string): string {
  return `${baseUrl}?sslmode=require&channel_binding=require`
}

async function backupSchema(schema: string, pgUrl: string) {
  const fileName = `backup-${schema}-${TIMESTAMP}.sql`
  const filePath = path.join(BACKUP_DIR, fileName)

  console.log(`\n📦 Backup schema "${schema}"...`)
  console.log(`   → ${filePath}`)

  // Setta password via env per pg_dump (sicuro)
  const urlObj = new URL(pgUrl)
  const password = urlObj.password

  try {
    execSync(
      `pg_dump "${pgUrl}" --schema=${schema} --file="${filePath}" --verbose --no-password`,
      {
        env: { ...process.env, PGPASSWORD: password },
        stdio: ["inherit", "pipe", "pipe"],
        encoding: "utf8",
      }
    )

    const stats = fs.statSync(filePath)
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`✅ Backup completato: ${fileName} (${sizeMb} MB)`)
    return filePath
  } catch (err: any) {
    console.error(`❌ Errore backup schema ${schema}:`, err.message || err.stderr)
    return null
  }
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("📂 Nessun backup presente.")
    return
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .reverse()

  console.log(`\n📂 Backup disponibili (${files.length}):\n`)
  files.forEach((f) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f))
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2)
    const date = stats.mtime.toLocaleString("it-IT")
    console.log(`   📄 ${f} — ${sizeMb} MB — ${date}`)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const schemaArg = args.find((a) => a.startsWith("--schema="))?.split("=")[1]
  const listOnly = args.includes("--list")

  if (listOnly) {
    await listBackups()
    return
  }

  console.log("🚀 FruttaGest — Backup Database Neon")
  console.log(`   Timestamp: ${TIMESTAMP}`)

  // Crea cartella backup se non esiste
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`\n📁 Cartella creata: ${BACKUP_DIR}`)
  }

  const baseUrl = getBaseUrl()
  const pgUrl = buildPgDumpUrl(baseUrl)

  const schemasToBackup = schemaArg ? [schemaArg] : SCHEMAS
  const results: { schema: string; file: string | null }[] = []

  for (const schema of schemasToBackup) {
    const file = await backupSchema(schema, pgUrl)
    results.push({ schema, file })
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("📋 RIEPILOGO BACKUP:")
  results.forEach(({ schema, file }) => {
    if (file) {
      console.log(`   ✅ ${schema} → ${path.basename(file)}`)
    } else {
      console.log(`   ❌ ${schema} → FALLITO`)
    }
  })

  const failed = results.filter((r) => !r.file)
  if (failed.length > 0) {
    console.error(`\n⚠️  ${failed.length} backup falliti!`)
    process.exit(1)
  }

  console.log("\n✅ Tutti i backup completati con successo!")
  console.log("\n💡 Per elencare i backup: npx tsx scripts/backup-db.ts --list")
}

main().catch((e) => {
  console.error("\n❌ Errore fatale:", e.message)
  process.exit(1)
})
