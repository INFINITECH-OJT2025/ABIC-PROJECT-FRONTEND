import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { SuccessTransactionData } from "./types";
import { formatDate, getTransactionTypeLabel } from "@/components/app/super/accountant/helpers";

/**
 * Format amount for PDF display (uses "PHP" text for better font compatibility)
 * Helvetica font doesn't reliably support the ₱ symbol, so using "PHP" instead
 */
const formatAmountForPDF = (amount: string): string => {
  if (!amount) return "PHP 0.00";
  const numericValue = parseFloat(amount.replace(/,/g, ''));
  if (isNaN(numericValue)) return "PHP 0.00";
  // Use "PHP" text instead of ₱ symbol for reliable PDF rendering
  return `PHP ${numericValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica", // Default font - supports Unicode characters including ₱
  },
  container: {
    borderWidth: 2,
    borderColor: "#4A081A",
    borderStyle: "solid",
  },
  header: {
    backgroundColor: "#4A081A",
    color: "#ffffff",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#ffffff",
  },
  content: {
    padding: 24,
    backgroundColor: "#ffffff",
  },
  section: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5EC",
    borderBottomStyle: "solid",
  },
  sectionLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rowLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    textAlign: "right",
    maxWidth: "60%",
    flexWrap: "wrap",
  },
  valueMedium: {
    fontSize: 14,
    fontWeight: 500,
    color: "#111827",
    textAlign: "right",
    maxWidth: "60%",
    flexWrap: "wrap",
  },
  subLabel: {
    fontSize: 12,
    color: "#4b5563",
  },
  subValue: {
    fontSize: 14,
    fontWeight: 500,
    color: "#111827",
    textAlign: "right",
  },
  text: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.6,
    marginTop: 4,
    textAlign: "right",
  },
  amountBox: {
    backgroundColor: "#f3f4f6",
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#4A081A",
  },
  instrumentList: {
    marginTop: 8,
  },
  instrumentLabel: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 4,
  },
  instrumentItem: {
    marginTop: 4,
    alignItems: "flex-end",
  },
});

interface ReceiptPDFProps {
  transactionData: SuccessTransactionData;
  transactionType: "DEPOSIT" | "WITHDRAWAL";
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  transactionData,
  transactionType,
}) => {
  const voucherMode = transactionData.voucherMode;
  const formData = {
    voucher_date: transactionData.voucher_date,
    voucher_no: transactionData.voucher_no,
    transaction_type: transactionData.transaction_type,
    instrument_no: transactionData.instrument_no || "",
    unit_name: transactionData.unit_name,
    particulars: transactionData.particulars,
    fund_reference: transactionData.fund_reference,
    person_in_charge: transactionData.person_in_charge,
    amount: transactionData.amount,
  };
  const instrumentNumbers = transactionData.instrumentNumbers || [];
  const fromOwnerName = transactionData.fromOwnerName;
  const toOwnerName = transactionData.toOwnerName;
  const attachmentsCount = transactionData.attachmentsCount;

  const isChequeOrDepositSlip =
    formData.transaction_type === "CHEQUE" ||
    formData.transaction_type === "DEPOSIT SLIP";
  const hasInstrumentNumbers =
    isChequeOrDepositSlip &&
    (instrumentNumbers.length > 0 || formData.instrument_no.trim());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Transaction Summary</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Deposit/Withdrawal Type */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.label}>
                  {transactionType === "DEPOSIT" ? "Deposit Type" : "Withdrawal Type"}
                </Text>
                <Text style={styles.value}>
                  {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                </Text>
              </View>
            </View>

            {/* Voucher Details */}
            {voucherMode === "WITH_VOUCHER" &&
            (formData.voucher_date || formData.voucher_no) ? (
              <View style={styles.section}>
                {formData.voucher_date ? (
                  <View style={styles.row}>
                    <Text style={styles.subLabel}>Voucher Date</Text>
                    <Text style={styles.subValue}>
                      {formatDate(formData.voucher_date)}
                    </Text>
                  </View>
                ) : null}
                {formData.voucher_no ? (
                  <View style={[styles.row, styles.rowLast]}>
                    <Text style={styles.subLabel}>Voucher No.</Text>
                    <Text style={styles.subValue}>{formData.voucher_no}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Transaction Type */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.label}>Transaction Type</Text>
                <Text style={styles.value}>
                  {getTransactionTypeLabel(formData.transaction_type)}
                </Text>
              </View>
              {hasInstrumentNumbers ? (
                <View style={styles.instrumentList}>
                  <Text style={styles.instrumentLabel}>
                    {formData.transaction_type === "CHEQUE"
                      ? "Cheque Numbers"
                      : "Deposit Slip Numbers"}
                  </Text>
                  {instrumentNumbers.length > 0
                    ? instrumentNumbers.map((num, idx) => (
                        <View key={idx} style={styles.instrumentItem}>
                          <Text style={styles.subValue}>{num}</Text>
                        </View>
                      ))
                    : formData.instrument_no.trim() ? (
                        <View style={styles.instrumentItem}>
                          <Text style={styles.subValue}>
                            {formData.instrument_no}
                          </Text>
                        </View>
                      ) : null}
                </View>
              ) : null}
            </View>

            {/* Main and Owner */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.label}>Main</Text>
                <Text style={styles.valueMedium}>{fromOwnerName}</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.label}>Owner</Text>
                <Text style={styles.valueMedium}>{toOwnerName}</Text>
              </View>
            </View>

            {/* Unit */}
            {formData.unit_name ? (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Text style={styles.label}>Unit</Text>
                  <Text style={styles.valueMedium}>{formData.unit_name}</Text>
                </View>
              </View>
            ) : null}

            {/* Particulars */}
            {formData.particulars ? (
              <View style={styles.section}>
                <View>
                  <Text style={styles.label}>Particulars</Text>
                  <Text style={styles.text}>{formData.particulars}</Text>
                </View>
              </View>
            ) : null}

            {/* Fund Reference */}
            {formData.fund_reference ? (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Text style={styles.label}>Fund Reference</Text>
                  <Text style={styles.valueMedium}>
                    {formData.fund_reference}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Person in Charge */}
            {formData.person_in_charge ? (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Text style={styles.label}>Person in Charge</Text>
                  <Text style={styles.valueMedium}>
                    {formData.person_in_charge}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Attachments */}
            {(attachmentsCount ?? 0) > 0 ? (
              <View style={styles.section}>
                <View style={styles.row}>
                  <Text style={styles.label}>Attachments</Text>
                  <Text style={styles.valueMedium}>
                    {attachmentsCount ?? 0} file{(attachmentsCount ?? 0) !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Total Amount */}
            <View style={[styles.section, styles.sectionLast]}>
              <View style={styles.amountBox}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.amountValue}>
                    {formatAmountForPDF(formData.amount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
