/**
 * Template PDF Bolla di Consegna (DDT)
 *
 * Genera PDF con @react-pdf/renderer.
 * Include: dati mittente, destinatario, prodotti, trasporto.
 * Conforme alla normativa italiana per DDT.
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
    marginTop: 4,
  },
  ddtTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  ddtNumber: {
    fontSize: 10,
    textAlign: "right",
    marginTop: 2,
  },
  ddtDate: {
    fontSize: 9,
    textAlign: "right",
    marginTop: 2,
    color: "#666",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
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
  row: {
    flexDirection: "row",
    gap: 8,
  },
  col: {
    flex: 1,
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
    marginTop: 10,
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
  colProduct: { width: "40%" },
  colQty: { width: "15%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  transportSection: {
    flexDirection: "row",
    gap: 15,
    marginTop: 15,
  },
  transportBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#999",
  },
})

interface DDTPdfProps {
  ddt: {
    ddtNumber: string
    issueDate: Date | string
    transportReason: string
    transportedBy: string
    goodsAppearance?: string | null
    numberOfPackages?: number | null
    weight?: number | null
    items: Array<{
      product: { name: string }
      quantity: number | string
      unit: string
      unitPrice: number | string
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
    }
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
  }
}

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg", G: "g", PEZZI: "Pz", CASSETTA: "Cs",
  MAZZO: "Mz", GRAPPOLO: "Gr", VASETTO: "Vs", SACCHETTO: "Sc",
}

const formatAmount = (n: number | string) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    typeof n === "string" ? parseFloat(n) : n
  )

export function DDTPdfDocument({ ddt, company }: DDTPdfProps) {
  const issueDate = typeof ddt.issueDate === "string" ? new Date(ddt.issueDate) : ddt.issueDate

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
          </View>
          <View>
            <Text style={styles.ddtTitle}>DOCUMENTO DI TRASPORTO</Text>
            <Text style={styles.ddtNumber}>N. {ddt.ddtNumber}</Text>
            <Text style={styles.ddtDate}>
              Data: {format(issueDate, "dd MMMM yyyy", { locale: it })}
            </Text>
          </View>
        </View>

        {/* Destinatario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinatario</Text>
          <View style={styles.box}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>{ddt.customer.companyName}</Text>
            <Text style={styles.value}>
              {ddt.customer.address} — {ddt.customer.postalCode} {ddt.customer.city} ({ddt.customer.province})
            </Text>
            {ddt.customer.vatNumber && <Text style={styles.value}>P.IVA: {ddt.customer.vatNumber}</Text>}
            {ddt.customer.fiscalCode && <Text style={styles.value}>C.F.: {ddt.customer.fiscalCode}</Text>}
          </View>
        </View>

        {/* Tabella prodotti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettaglio Merce</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colNum]}>#</Text>
              <Text style={[styles.thText, styles.colProduct]}>Prodotto</Text>
              <Text style={[styles.thText, styles.colQty]}>Quantità</Text>
              <Text style={[styles.thText, styles.colUnit]}>U.M.</Text>
              <Text style={[styles.thText, styles.colPrice]}>Prezzo</Text>
              <Text style={[styles.thText, styles.colTotal]}>Totale</Text>
            </View>
            {ddt.items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tdText, styles.colNum]}>{i + 1}</Text>
                <Text style={[styles.tdText, styles.colProduct]}>{item.product.name}</Text>
                <Text style={[styles.tdText, styles.colQty]}>{formatAmount(item.quantity)}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{UNIT_LABELS[item.unit] || item.unit}</Text>
                <Text style={[styles.tdText, styles.colPrice]}>€ {formatAmount(item.unitPrice)}</Text>
                <Text style={[styles.tdText, styles.colTotal]}>€ {formatAmount(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trasporto */}
        <View style={styles.transportSection}>
          <View style={styles.transportBox}>
            <Text style={styles.label}>Causale Trasporto</Text>
            <Text style={styles.value}>{ddt.transportReason}</Text>
          </View>
          <View style={styles.transportBox}>
            <Text style={styles.label}>Trasporto a cura</Text>
            <Text style={styles.value}>{ddt.transportedBy}</Text>
          </View>
          {ddt.numberOfPackages && (
            <View style={styles.transportBox}>
              <Text style={styles.label}>N. Colli</Text>
              <Text style={styles.value}>{ddt.numberOfPackages}</Text>
            </View>
          )}
          {ddt.weight && (
            <View style={styles.transportBox}>
              <Text style={styles.label}>Peso Kg</Text>
              <Text style={styles.value}>{formatAmount(ddt.weight)}</Text>
            </View>
          )}
        </View>

        {/* Firme */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma Mittente</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Firma Destinatario</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
