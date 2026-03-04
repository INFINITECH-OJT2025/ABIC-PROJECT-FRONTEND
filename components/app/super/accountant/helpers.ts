/**
 * Format date string for display (e.g. "Jan 15, 2025")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Get human-readable label for transaction type
 */
export function getTransactionTypeLabel(transactionType: string): string {
  const labels: Record<string, string> = {
    "CASH DEPOSIT": "Cash Deposit",
    "BANK TRANSFER": "Bank Transfer",
    "CHEQUE": "Cheque",
    "CHEQUE DEPOSIT": "Cheque Deposit",
    "DEPOSIT SLIP": "Deposit Slip",
  };
  return labels[transactionType] ?? transactionType;
}

/**
 * Format amount for display (e.g. "1,234.56")
 */
export function formatAmount(amount: string | number | null | undefined): string {
  if (amount == null || amount === "") return "0.00";
  const n = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
