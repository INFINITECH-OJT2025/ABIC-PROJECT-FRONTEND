const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\/\/ no-op for dates with defaults \}\}/g, '/* no-op for dates with defaults */ }}');
  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed", file);
}

fix("components/app/super/voucher/CashVoucher/FormSection.tsx");
fix("components/app/super/voucher/ChequeVoucher/FormSection.tsx");
