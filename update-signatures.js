const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add Ban to lucide-react imports if not present
  if (content.includes('import { User, Receipt,')) {
    if (!content.includes(' Ban ')) {
         content = content.replace('import { User, Receipt,', 'import { User, Receipt, Ban,');
    }
  }

  // 2. Add signatureToRemove state alongside formError
  if (!content.includes('const [signatureToRemove')) {
    content = content.replace(
      'const [formError, setFormError] = useState<string | null>(null);',
      'const [formError, setFormError] = useState<string | null>(null);\n  const [signatureToRemove, setSignatureToRemove] = useState<"receivedFromSignature" | "approvedBySignature" | null>(null);'
    );
  }

  // 3. Update the "Remove" onClick for receivedFromSignature
  const receivedRx = /onClick=\{\(\) => onInputChange\("receivedFromSignature", ""\)\}/;
  content = content.replace(receivedRx, 'onClick={() => setSignatureToRemove("receivedFromSignature")}');

  // 4. Update the "Remove" onClick for approvedBySignature
  const approvedRx = /onClick=\{\(\) => onInputChange\("approvedBySignature", ""\)\}/;
  content = content.replace(approvedRx, 'onClick={() => setSignatureToRemove("approvedBySignature")}');

  // 5. Inject the ConfirmationModal directly before closing form tag
  const modalCode = `
      <ConfirmationModal
        open={signatureToRemove !== null}
        title="Remove Signature"
        message="Are you sure you want to remove this signature?"
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        icon={Ban}
        color="#dc2626"
        onCancel={() => setSignatureToRemove(null)}
        onConfirm={() => {
          if (signatureToRemove) {
            onInputChange(signatureToRemove, "");
          }
          setSignatureToRemove(null);
        }}
        zIndex={50}
      />
    </form>`;

  if (!content.includes('signatureToRemove !== null')) {
    content = content.replace(/<\/form>/, modalCode);
  }

  fs.writeFileSync(file, content, 'utf8');
}

processFile("components/app/super/voucher/CashVoucher/FormSection.tsx");
processFile("components/app/super/voucher/ChequeVoucher/FormSection.tsx");
