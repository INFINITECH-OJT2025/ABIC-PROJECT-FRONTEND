export interface PrintableData {
  voucherNo: string;
  date: string;
  paidTo: string;
  projectDetails: string; // ✅ ADD THIS
  purpose: string;
  note: string;
  amount: string;
  owner: string;
  receivedBy: string;
  approvedBy: string;
  receivedFromSignature?: string;
  approvedBySignature?: string;
  receivedFromDate?: string;
  approvedByDate?: string;
}