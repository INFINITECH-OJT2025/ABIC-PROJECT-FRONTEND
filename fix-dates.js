const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove validateRequired fallback
  // The code currently looks exactly like:
  /*
      let value = formData[field.key as keyof PrintableData] as string | undefined | null;
      if (!value && ["date", "receivedFromDate", "approvedByDate", "checkDate"].includes(field.key)) {
        value = new Date().toISOString().split("T")[0];
      }
      if (typeof value !== "string" || value.trim() === "") {
        newErrors[field.key] = `${field.label} is required.`;
        isValid = false;
      }
  */
  
  content = content.replace(
    /let value = formData\[field\.key as keyof PrintableData\] as string \| undefined \| null;\s*if \(\!value && \["date", "receivedFromDate", "approvedByDate", "checkDate"\]\.includes\(field\.key\)\) \{\s*value = new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\];\s*\}/g,
    `const value = formData[field.key as keyof PrintableData] as string | undefined | null;`
  );

  // 2. Fix the fallbacks in inputs globally
  content = content.replace(/value=\{formData\.(\w+) \|\| new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\}/g, 'value={formData.$1 || ""}');

  // 3. Fix the onBlur comments back to validation globally
  const dateFields = ["date", "receivedFromDate", "approvedByDate", "checkDate"];
  for (const field of dateFields) {
    const rx = new RegExp(`onBlur=\\{\\(\\) => \\{ setTouched\\(prev => \\(\\{ \\.\\.\\.prev, ${field}: true \\}\\)\\); \\/\\* no-op for dates with defaults \\*\\/ \\}\\} id="${field}"`, 'g');
    content = content.replace(rx, `onBlur={() => { setTouched(prev => ({ ...prev, ${field}: true })); if (!formData.${field}) setErrors(prev => ({ ...prev, ${field}: "This field is required." })); }} id="${field}"`);
  }

  fs.writeFileSync(file, content, 'utf8');
}

processFile("components/app/super/voucher/CashVoucher/FormSection.tsx");
processFile("components/app/super/voucher/ChequeVoucher/FormSection.tsx");
