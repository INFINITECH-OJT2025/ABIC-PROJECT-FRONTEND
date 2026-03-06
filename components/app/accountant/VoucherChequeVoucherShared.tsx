// my-app/app/printable/cheque-voucher/page.tsx
import PrintableView from "@/components/app/super/voucher/ChequeVoucher";

export default function VoucherChequeVoucherShared({ role }: { role: "superadmin" | "accountant" }) {
    return <PrintableView />;
}