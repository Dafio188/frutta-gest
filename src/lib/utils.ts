/**
 * Utility Functions
 *
 * Funzioni di utilità condivise in tutta l'applicazione.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(num)
}

export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === "string" ? parseFloat(num) : num
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function generateCode(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, "0")}`
}

export function generateDocumentNumber(
  prefix: string,
  year: number,
  number: number
): string {
  return `${prefix}-${year}-${String(number).padStart(5, "0")}`
}

/**
 * Serializza oggetti Prisma per il passaggio a Client Components.
 * Converte Decimal in number, Date in ISO string, BigInt in number.
 */
export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString() as unknown as T
  if (typeof obj === "bigint") return Number(obj) as unknown as T
  if (typeof (obj as any)?.toNumber === "function") return (obj as any).toNumber()
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj as object)) {
      result[key] = serialize((obj as Record<string, unknown>)[key])
    }
    return result as T
  }
  return obj
}
