const fs = require('fs');

function fixDates(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix validateRequired
    content = content.replace(
      /const value = formData\[field\.key as keyof PrintableData\];\s*if \(typeof value !== "string" \|\| value\.trim\(\) === ""\) \{/g,
      `let value = formData[field.key as keyof PrintableData] as string | undefined | null;
      if (!value && ["date", "receivedFromDate", "approvedByDate", "checkDate"].includes(field.key)) {
        value = new Date().toISOString().split("T")[0];
      }
      if (typeof value !== "string" || value.trim() === "") {`
    );

    // Fix onBlur for date fields
    const dateFields = ["date", "receivedFromDate", "approvedByDate", "checkDate"];
    for (const field of dateFields) {
        // Find: if (!formData.date) setErrors(prev => ({ ...prev, date: "This field is required." }));
        const search = `if (!formData.${field}) setErrors(prev => ({ ...prev, ${field}: "This field is required." }));`;
        content = content.replace(search, `// no-op for dates with defaults`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed dates in", filePath);
}

fixDates("components/app/super/voucher/CashVoucher/FormSection.tsx");
fixDates("components/app/super/voucher/ChequeVoucher/FormSection.tsx");
