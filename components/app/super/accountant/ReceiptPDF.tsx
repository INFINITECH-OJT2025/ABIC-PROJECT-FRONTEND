import React from "react";
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { SuccessTransactionData } from "./types";
import { formatDate, getTransactionTypeLabel } from "@/components/app/super/accountant/helpers";

// ─── Register Inter font (matches the app's globals.css font-family) ─────────
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.woff", fontWeight: 400 },
    { src: "/fonts/Inter-SemiBold.woff", fontWeight: 600 },
    { src: "/fonts/Inter-Bold.woff", fontWeight: 700 },
  ],
});

// ─── Design tokens (exact mirrors of TransactionForm constants) ───────────────
const BORDER = "rgba(0,0,0,0.12)";  // BORDER constant in TransactionForm
const ACCENT = "#7a0f1f";           // gradient start / header bg
const GRAY_700 = "#374151";           // text-gray-700
const GRAY_600 = "#4b5563";           // text-gray-600
const GRAY_900 = "#111827";           // text-gray-900
const GRAY_100 = "#f3f4f6";           // bg-gray-100
const TOTAL_COLOR = "#4A081A";           // inline style on the total amount value

// ─── Amount formatter ─────────────────────────────────────────────────────────
const formatAmt = (amount: string): string => {
  if (!amount) return "PHP 0.00";
  const n = parseFloat(amount.replace(/,/g, ""));
  if (isNaN(n)) return "PHP 0.00";
  return `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Page
  page: {
    padding: 32,
    backgroundColor: "#f1f5f9",  // light slate background (like the page background)
    fontFamily: "Inter",
  },

  // Card wrapper  — rounded-lg border shadow-lg bg-white
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },

  // ── Header: px-6 py-6 linear-gradient(135deg,#7a0f1f,#a4163a) ─────────────
  header: {
    backgroundColor: ACCENT,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
  },
  // Top row: "TRANSACTION SUMMARY" label + (no print btn in PDF)
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  // text-xs font-bold uppercase tracking-widest text-white/70
  headerLabel: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.70)",
  },
  // text-3xl font-bold text-white mb-3
  headerAmount: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 26,
    color: "#ffffff",
    marginBottom: 12,
  },
  // Badge row: flex items-center gap-2
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // DEPOSIT badge: bg-green-500/20 text-green-200
  badgeDeposit: {
    backgroundColor: "rgba(34,197,94,0.22)",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeDepositText: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 9,
    color: "#bbf7d0",
    textTransform: "uppercase",
  },
  // WITHDRAWAL badge: bg-red-500/30 text-red-200
  badgeWithdrawal: {
    backgroundColor: "rgba(239,68,68,0.30)",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeWithdrawalText: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 9,
    color: "#fecaca",
    textTransform: "uppercase",
  },
  // Voucher mode badge: bg-white/20 text-white/90
  badgeVoucher: {
    backgroundColor: "rgba(255,255,255,0.20)",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeVoucherText: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 9,
    color: "rgba(255,255,255,0.90)",
  },

  // ── Content: bg-white p-6 ──────────────────────────────────────────────────
  content: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: "#ffffff",
  },

  // ── Row with bottom border  (pb-3 border-b, space-y-4 gap) ────────────────
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  // Last row before Total Amount (no bottom border, no margin)
  rowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  // ── Group: shared single border for Voucher info / Owners ─────────────────
  //    (space-y-2 pb-3 border-b)
  group: {
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  groupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  groupRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  // Stacked row (Particulars) — no horizontal flex; label then value below
  colStack: {
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  // text-xs font-semibold text-gray-700 shrink-0  (bold section labels)
  labelBold: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 9,
    color: GRAY_700,
    flexShrink: 0,
  },
  // text-xs text-gray-600 shrink-0  (lighter sub-labels: Voucher No., Date)
  labelLight: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 9,
    color: GRAY_600,
    flexShrink: 0,
  },

  // ── Values ────────────────────────────────────────────────────────────────
  // text-sm font-semibold text-gray-900 text-right
  valueBold: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 11,
    color: GRAY_900,
    textAlign: "right",
    flex: 1,
  },
  // text-sm font-medium text-gray-900 text-right
  valueNormal: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 11,
    color: GRAY_900,
    textAlign: "right",
    flex: 1,
  },
  // Stacked value (Particulars)
  valueStacked: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 11,
    color: GRAY_900,
    textAlign: "right",
    marginTop: 4,
    lineHeight: 1.5,
  },

  // ── Instrument hint + numbers ─────────────────────────────────────────────
  // text-xs text-gray-600 mb-1 ("Cheque Numbers" / "Deposit Slip Numbers")
  instrumentHint: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 9,
    color: GRAY_600,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 3,
  },
  // text-sm font-medium text-gray-900 text-right
  instrumentNum: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 11,
    color: GRAY_900,
    textAlign: "right",
    marginBottom: 2,
  },

  // ── Total Amount box: bg-gray-100 rounded-md p-4 ─────────────────────────
  totalBox: {
    backgroundColor: GRAY_100,
    borderRadius: 6,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  // text-sm font-bold text-gray-900 uppercase tracking-wide
  totalLabel: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 11,
    color: GRAY_900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  // text-2xl font-bold color:#4A081A
  totalValue: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 20,
    color: TOTAL_COLOR,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

interface ReceiptPDFProps {
  transactionData: SuccessTransactionData;
  transactionType: "DEPOSIT" | "WITHDRAWAL";
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  transactionData,
  transactionType,
}) => {
  const d = transactionData;
  const voucherMode = d.voucherMode || "NO_VOUCHER";
  const instrumentNumbers = d.instrumentNumbers || [];

  const isChequeOrSlip =
    d.transaction_type === "CHEQUE" ||
    d.transaction_type === "CHEQUE DEPOSIT" ||
    d.transaction_type === "DEPOSIT SLIP";

  const hasInstruments =
    isChequeOrSlip &&
    (instrumentNumbers.length > 0 || (d.instrument_no && d.instrument_no.trim()));

  const instrumentLabel =
    d.transaction_type === "CHEQUE" ? "Cheque Numbers" : "Deposit Slip Numbers";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <View style={styles.header}>
            {/* "TRANSACTION SUMMARY" label */}
            <View style={styles.headerTopRow}>
              <Text style={styles.headerLabel}>Transaction Summary</Text>
            </View>

            {/* Amount — text-3xl font-bold */}
            <Text style={styles.headerAmount}>{formatAmt(d.amount)}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {transactionType === "DEPOSIT" ? (
                <View style={styles.badgeDeposit}>
                  <Text style={styles.badgeDepositText}>DEPOSIT</Text>
                </View>
              ) : (
                <View style={styles.badgeWithdrawal}>
                  <Text style={styles.badgeWithdrawalText}>WITHDRAWAL</Text>
                </View>
              )}
              <View style={styles.badgeVoucher}>
                <Text style={styles.badgeVoucherText}>
                  {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Content ──────────────────────────────────────────────────── */}
          <View style={styles.content}>

            {/* Type */}
            <View style={styles.row}>
              <Text style={styles.labelBold}>Type</Text>
              <Text style={styles.valueBold}>
                {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
              </Text>
            </View>

            {/* Voucher Information group (Voucher No. + Voucher Date share one border) */}
            {voucherMode === "WITH_VOUCHER" && (d.voucher_no || d.voucher_date) && (
              <View style={styles.group}>
                {d.voucher_no && (
                  <View style={d.voucher_date ? styles.groupRow : styles.groupRowLast}>
                    <Text style={styles.labelLight}>Voucher No.</Text>
                    <Text style={styles.valueBold}>{d.voucher_no}</Text>
                  </View>
                )}
                {d.voucher_date && (
                  <View style={styles.groupRowLast}>
                    <Text style={styles.labelLight}>Date</Text>
                    <Text style={styles.valueNormal}>{formatDate(d.voucher_date)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Transaction Type + optional instrument list */}
            <View style={styles.row}>
              <Text style={styles.labelBold}>Transaction Type</Text>
              <View style={{ flex: 1, flexDirection: "column", alignItems: "flex-end" }}>
                <Text style={styles.valueBold}>
                  {getTransactionTypeLabel(d.transaction_type) || "—"}
                </Text>
                {hasInstruments && (
                  <View style={{ flexDirection: "column", alignItems: "flex-end", marginTop: 6 }}>
                    <Text style={styles.instrumentHint}>{instrumentLabel}</Text>
                    {instrumentNumbers.length > 0
                      ? instrumentNumbers.map((num, idx) => (
                        <Text key={idx} style={styles.instrumentNum}>{num}</Text>
                      ))
                      : d.instrument_no && d.instrument_no.trim()
                        ? <Text style={styles.instrumentNum}>{d.instrument_no}</Text>
                        : null}
                  </View>
                )}
              </View>
            </View>

            {/* Owners group: Main + Owner share one border */}
            <View style={styles.group}>
              <View style={styles.groupRow}>
                <Text style={styles.labelBold}>Main</Text>
                <Text style={styles.valueNormal}>{d.fromOwnerName || "—"}</Text>
              </View>
              <View style={styles.groupRowLast}>
                <Text style={styles.labelBold}>Owner</Text>
                <Text style={styles.valueNormal}>{d.toOwnerName || "—"}</Text>
              </View>
            </View>

            {/* Unit */}
            {d.unit_name && (
              <View style={styles.row}>
                <Text style={styles.labelBold}>Unit</Text>
                <Text style={styles.valueNormal}>{d.unit_name}</Text>
              </View>
            )}

            {/* Particulars — stacked layout */}
            {d.particulars && (
              <View style={styles.colStack}>
                <Text style={styles.labelBold}>Particulars</Text>
                <Text style={styles.valueStacked}>{d.particulars}</Text>
              </View>
            )}

            {/* Fund Reference */}
            {d.fund_reference && (
              <View style={styles.row}>
                <Text style={styles.labelBold}>Fund Reference</Text>
                <Text style={styles.valueNormal}>{d.fund_reference}</Text>
              </View>
            )}

            {/* Person in Charge */}
            {d.person_in_charge && (
              <View style={styles.row}>
                <Text style={styles.labelBold}>Person in Charge</Text>
                <Text style={styles.valueNormal}>{d.person_in_charge}</Text>
              </View>
            )}

            {/* Attachments */}
            {(d.attachmentsCount ?? 0) > 0 && (
              <View style={styles.row}>
                <Text style={styles.labelBold}>Attachments</Text>
                <Text style={styles.valueNormal}>
                  {d.attachmentsCount} file{d.attachmentsCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}

            {/* Total Amount box */}
            <View style={styles.rowNoBorder}>
              <View style={{ width: "100%" }}>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{formatAmt(d.amount)}</Text>
                </View>
              </View>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  );
};
