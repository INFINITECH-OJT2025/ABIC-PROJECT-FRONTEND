/**
 * Data structure for transaction success / receipt generation.
 * Used by ReceiptGenerator, ReceiptPDF, and TransactionForm success flow.
 */
export interface SuccessTransactionData {
  voucherMode?: "WITH_VOUCHER" | "NO_VOUCHER";
  voucher_date?: string;
  voucher_no?: string;
  transaction_type: string;
  instrument_no?: string;
  instrumentNumbers?: string[];
  fromOwnerName: string;
  toOwnerName: string;
  unit_name?: string;
  particulars?: string;
  fund_reference?: string;
  person_in_charge?: string;
  attachmentsCount?: number;
  amount: string;
}
