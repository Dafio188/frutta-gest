/**
 * Template PDF Fattura
 *
 * Genera PDF fattura con @react-pdf/renderer.
 * Include: dati fiscali italiani completi, DDT collegati,
 * dettaglio IVA, modalità pagamento, coordinate bancarie.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { it } from "date-fns/locale"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#22c55e",
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#22c55e",
  },
  companyDetails: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 9,
    textAlign: "right",
    marginTop: 2,
    color: "#666",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    color: "#22c55e",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  box: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
  },
  label: {
    fontSize: 7,
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#666",
  },
  tdText: {
    fontSize: 9,
  },
  colNum: { width: "5%" },
  colDesc: { width: "35%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "8%", textAlign: "center" },
  colPrice: { width: "12%", textAlign: "right" },
  colVat: { width: "10%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totalsSection: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 220,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  totalRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#22c55e",
  },
  totalLabel: {
    fontSize: 9,
    color: "#666",
  },
  totalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  totalLabelBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  totalValueBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
  },
  paymentSection: {
    marginTop: 15,
    flexDirection: "row",
    gap: 15,
  },
  paymentBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
})

interface InvoicePdfProps {
  invoice: {
    invoiceNumber: string
    issueDate: Date | string
    dueDate: Date | string
    subtotal: number | string
    vatAmount: number | string
    total: number | string
    paymentTerms?: string | null
    paymentMethod?: string | null
    notes?: string | null
    items: Array<{
      description: string
      quantity: number | string
      unit: string
      unitPrice: number | string
      vatRate: number | string
      lineTotal: number | string
    }>
    customer: {
      companyName: string
      address: string
      city: string
      province: string
      postalCode: string
      vatNumber?: string | null
      fiscalCode?: string | null
      sdiCode?: string | null
      pecEmail?: string | null
    }
    ddtNumbers?: string[]
  }
  company: {
    companyName: string
    address: string
    city: string
    province: string
    postalCode: string
    vatNumber: string
    fiscalCode: string
    phone?: string | null
    email?: string | null
    pecEmail?: string | null
    bankName?: string | null
    bankIban?: string | null
    bankBic?: string | null
  }
}

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg", G: "g", PEZZI: "Pz", CASSETTA: "Cs",
  MAZZO: "Mz", GRAPPOLO: "Gr", VASETTO: "Vs", SACCHETTO: "Sc",
}

const PAYMENT_LABELS: Record<string, string> = {
  CONTANTI: "Contanti", BONIFICO: "Bonifico Bancario",
  ASSEGNO: "Assegno", RIBA: "Ri.Ba.", CARTA: "Carta di Credito",
}

const fmtAmount = (n: number | string) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    typeof n === "string" ? parseFloat(n) : n
  )

export function InvoicePdfDocument({ invoice, company }: InvoicePdfProps) {
  const issueDate = typeof invoice.issueDate === "string" ? new Date(invoice.issueDate) : invoice.issueDate
  const dueDate = typeof invoice.dueDate === "string" ? new Date(invoice.dueDate) : invoice.dueDate

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.companyName}</Text>
            <Text style={styles.companyDetails}>
              {company.address} — {company.postalCode} {company.city} ({company.province})
            </Text>
            <Text style={styles.companyDetails}>
              P.IVA: {company.vatNumber} — C.F.: {company.fiscalCode}
            </Text>
            {company.phone && <Text style={styles.companyDetails}>Tel: {company.phone}</Text>}
            {company.email && <Text style={styles.companyDetails}>Email: {company.email}</Text>}
            {company.pecEmail && <Text style={styles.companyDetails}>PEC: {company.pecEmail}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FATTURA</Text>
            <Text style={styles.invoiceNumber}>N. {invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Data: {format(issueDate, "dd/MM/yyyy")}
            </Text>
            <Text style={styles.invoiceDate}>
              Scadenza: {format(dueDate, "dd/MM/yyyy")}
            </Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.box}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>{invoice.customer.companyName}</Text>
            <Text style={styles.value}>
              {invoice.customer.address} — {invoice.customer.postalCode} {invoice.customer.city} ({invoice.customer.province})
            </Text>
            {invoice.customer.vatNumber && <Text style={styles.value}>P.IVA: {invoice.customer.vatNumber}</Text>}
            {invoice.customer.fiscalCode && <Text style={styles.value}>C.F.: {invoice.customer.fiscalCode}</Text>}
            {invoice.customer.sdiCode && <Text style={styles.value}>Codice SDI: {invoice.customer.sdiCode}</Text>}
            {invoice.customer.pecEmail && <Text style={styles.value}>PEC: {invoice.customer.pecEmail}</Text>}
          </View>
        </View>

        {/* DDT collegati */}
        {invoice.ddtNumbers && invoice.ddtNumbers.length > 0 && (
          <View style={styles.section}>
            <Text style={{ fontSize: 8, color: "#666" }}>
              Rif. DDT: {invoice.ddtNumbers.join(", ")}
            </Text>
          </View>
        )}

        {/* Tabella prodotti */}
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colNum]}>#</Text>
              <Text style={[styles.thText, styles.colDesc]}>Descrizione</Text>
              <Text style={[styles.thText, styles.colQty]}>Q.tà</Text>
              <Text style={[styles.thText, styles.colUnit]}>U.M.</Text>
              <Text style={[styles.thText, styles.colPrice]}>Prezzo</Text>
              <Text style={[styles.thText, styles.colVat]}>IVA %</Text>
              <Text style={[styles.thText, styles.colTotal]}>Importo</Text>
            </View>
            {invoice.items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tdText, styles.colNum]}>{i + 1}</Text>
                <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tdText, styles.colQty]}>{fmtAmount(item.quantity)}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{UNIT_LABELS[item.unit] || item.unit}</Text>
                <Text style={[styles.tdText, styles.colPrice]}>€ {fmtAmount(item.unitPrice)}</Text>
                <Text style={[styles.tdText, styles.colVat]}>{item.vatRate}%</Text>
                <Text style={[styles.tdText, styles.colTotal]}>€ {fmtAmount(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totali */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Imponibile</Text>
              <Text style={styles.totalValue}>€ {fmtAmount(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA</Text>
              <Text style={styles.totalValue}>€ {fmtAmount(invoice.vatAmount)}</Text>
            </View>
            <View style={styles.totalRowBold}>
              <Text style={styles.totalLabelBold}>TOTALE</Text>
              <Text style={styles.totalValueBold}>€ {fmtAmount(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Pagamento + Banca */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentBox}>
            <Text style={styles.label}>Modalità di Pagamento</Text>
            <Text style={styles.value}>
              {invoice.paymentMethod ? PAYMENT_LABELS[invoice.paymentMethod] || invoice.paymentMethod : "—"}
            </Text>
            {invoice.paymentTerms && (
              <>
                <Text style={[styles.label, { marginTop: 4 }]}>Termini</Text>
                <Text style={styles.value}>{invoice.paymentTerms}</Text>
              </>
            )}
          </View>
          {company.bankIban && (
            <View style={styles.paymentBox}>
              <Text style={styles.label}>Coordinate Bancarie</Text>
              {company.bankName && <Text style={styles.value}>{company.bankName}</Text>}
              <Text style={styles.value}>IBAN: {company.bankIban}</Text>
              {company.bankBic && <Text style={styles.value}>BIC/SWIFT: {company.bankBic}</Text>}
            </View>
          )}
        </View>

        {/* Note */}
        {invoice.notes && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.label}>Note</Text>
            <Text style={styles.value}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {company.companyName} — P.IVA {company.vatNumber} — {company.address}, {company.postalCode} {company.city} ({company.province})
          </Text>
        </View>
      </Page>
    </Document>
  )
}
