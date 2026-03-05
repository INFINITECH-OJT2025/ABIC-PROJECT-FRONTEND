const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert FormTooltipError import
  if (!content.includes('FormTooltipError')) {
    content = content.replace(
      'import { User,',
      'import FormTooltipError from "@/components/ui/form-tooltip-error";\nimport { User,'
    );
  }

  // Insert states
  if (!content.includes('const [errors, setErrors]')) {
    content = content.replace(
      'const [formError, setFormError] = useState<string | null>(null);',
      'const [formError, setFormError] = useState<string | null>(null);\n  const [errors, setErrors] = useState<Record<string, string>>({});\n  const [touched, setTouched] = useState<Record<string, boolean>>({});'
    );
  }

  // Update validateRequired
  const validateRegex = /const validateRequired = useCallback\(\(\) => \{[\s\S]*?\}, \[formData, requiredFields\]\);/;
  const newValidate = `const validateRequired = useCallback(() => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const field of requiredFields) {
      const value = formData[field.key as keyof PrintableData];
      if (typeof value !== "string" || value.trim() === "") {
        newErrors[field.key] = \`\${field.label} is required.\`;
        isValid = false;
      }
    }

    const hasReceivedSig = formData.receivedFromSignature && formData.receivedFromSignature !== "/images/voucher/signature/ReceivedSignature.png";
    if (!hasReceivedSig) {
      newErrors.receivedFromSignature = "Received By Signature is required.";
      isValid = false;
    }

    const hasApprovedSig = formData.approvedBySignature && formData.approvedBySignature !== "/images/voucher/signature/ApprovedSignature.png";
    if (!hasApprovedSig) {
      newErrors.approvedBySignature = "Approved By Signature is required.";
      isValid = false;
    }

    setErrors(newErrors);
    
    // Mark everything touched when trying to save
    const allTouched: Record<string, boolean> = {};
    for (const field of requiredFields) allTouched[field.key] = true;
    allTouched.receivedFromSignature = true;
    allTouched.approvedBySignature = true;
    setTouched(allTouched);

    if (!isValid) {
      setFormError("Please fill out all required fields.");
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el && "focus" in el) {
        (el as HTMLElement).focus();
      }
    } else {
      setFormError(null);
    }

    return isValid;
  }, [formData, requiredFields]);`;
  content = content.replace(validateRegex, newValidate);

  const fields = [
    { id: 'paidTo', cb: 'setShowSuggestions', cls: 'fieldClass' },
    { id: 'date', cls: 'fieldClass' },
    { id: 'purpose', cls: 'textareaClass' },
    { id: 'note', cls: 'textareaClass' },
    { id: 'amount', cls: 'amountFieldClass' },
    { id: 'projectDetails', cls: 'fieldClass' },
    { id: 'owner', cb: 'setShowOwnerSuggestions', cls: 'fieldClass' },
    { id: 'receivedFromDate', cls: 'fieldClass' },
    { id: 'approvedByDate', cls: 'fieldClass' },
    
    // Cheque additions
    { id: 'checkDate', cls: 'fieldClass' },
    { id: 'checkNo', cls: 'fieldClass' },
    { id: 'accountName', cls: 'fieldClass' },
    { id: 'accountNumber', cls: 'fieldClass' }
  ];

  for (const field of fields) {
    const regexStr = `(<(?:input|textarea)(?:(?!<\\/div>)[\\s\\S])*?id="${field.id}"(?:(?!<\\/div>)[\\s\\S])*?\\/?>)\\s*<\\/div>`;
    const regex = new RegExp(regexStr);
    const match = content.match(regex);
    if (!match) continue;

    let elementHtml = match[1];
    
    const classRegex = new RegExp(`className=\\{?${field.cls}\\}?`);
    if (!elementHtml.includes(`${field.id} && errors.${field.id}`)) {
       elementHtml = elementHtml.replace(classRegex, `className={\`\$\{${field.cls}\} \$\{touched.${field.id} && errors.${field.id} ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}\`}`);
    }

    if (!elementHtml.includes('onBlur=')) {
      elementHtml = elementHtml.replace(`id="${field.id}"`, `onBlur={() => { setTouched(prev => ({ ...prev, ${field.id}: true })); if (!formData.${field.id}) setErrors(prev => ({ ...prev, ${field.id}: "This field is required." })); }} id="${field.id}"`);
    } else {
      if (field.cb) {
        const oldBlur = new RegExp(`onBlur=\\{.*?\\}`);
        elementHtml = elementHtml.replace(oldBlur, `onBlur={() => { setTouched(prev => ({ ...prev, ${field.id}: true })); if (!formData.${field.id}) setErrors(prev => ({ ...prev, ${field.id}: "This field is required." })); setTimeout(() => ${field.cb}(false), 200); }}`);
      }
    }

    const oldOnChange = new RegExp(`onChange=\\{\\(e\\) => \\{[\\s\\S]*?\\}\\}`);
    const oldOnChangeMatch = elementHtml.match(oldOnChange);
    if (oldOnChangeMatch) {
      if (!oldOnChangeMatch[0].includes('delete nv.')) {
        const updatedChange = oldOnChangeMatch[0].replace(
          'onChange={(e) => {',
          `onChange={(e) => { if (errors.${field.id} && e.target.value.trim()) setErrors(prev => { const nv = {...prev}; delete nv.${field.id}; return nv; });`
        );
        elementHtml = elementHtml.replace(oldOnChangeMatch[0], updatedChange);
      }
    } else {
      const inlineOnChange = new RegExp(`onChange=\\{\\(e\\) => onInputChange[\\s\\S]*?\\}`);
      const inlineMatch = elementHtml.match(inlineOnChange);
      if (inlineMatch && !inlineMatch[0].match(/\\{.*\\}/)) {
         const updatedChange = inlineMatch[0].replace(
           /onChange=\{\(e\) => (.*?)\}/,
           `onChange={(e) => { $1; if (errors.${field.id} && e.target.value.trim()) setErrors(prev => { const nv = {...prev}; delete nv.${field.id}; return nv; }); }}`
         );
         elementHtml = elementHtml.replace(inlineMatch[0], updatedChange);
      }
    }

    const tooltipCode = `\n                  {touched.${field.id} && errors.${field.id} && (\n                    <FormTooltipError message={errors.${field.id}} onClose={() => setErrors(prev => { const nv = {...prev}; delete nv.${field.id}; return nv; })} />\n                  )}`;
    
    let newBlock = elementHtml + '\n                  </div>' + tooltipCode;
    // Replace the exact match
    content = content.replace(match[0], newBlock);
  }

  content = content.replace(
    'onInputChange("receivedFromSignature", reader.result as string);',
    'onInputChange("receivedFromSignature", reader.result as string); setErrors(prev => { const nv = {...prev}; delete nv.receivedFromSignature; return nv; });'
  );
  content = content.replace(
    'onInputChange("approvedBySignature", reader.result as string);',
    'onInputChange("approvedBySignature", reader.result as string); setErrors(prev => { const nv = {...prev}; delete nv.approvedBySignature; return nv; });'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully processed', filePath);
}

processFile('components/app/super/voucher/CashVoucher/FormSection.tsx');
processFile('components/app/super/voucher/ChequeVoucher/FormSection.tsx');
