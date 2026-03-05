const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  const paidToRx = /onClick=\{\(\) => \{\s*onInputChange\("paidTo", s\.paidTo \|\| ""\);\s*if \(s\.projectDetails\) onInputChange\("projectDetails", s\.projectDetails\);\s*if \(s\.owner\) onInputChange\("owner", s\.owner\);\s*if \(s\.purpose\) onInputChange\("purpose", s\.purpose\);\s*if \(s\.amount\) onInputChange\("amount", s\.amount\);\s*if \(s\.note\) onInputChange\("note", s\.note\);(\s*if \(s\.accountName\) onInputChange\("accountName", s\.accountName\);\s*if \(s\.accountNumber\) onInputChange\("accountNumber", s\.accountNumber\);)?\s*setShowSuggestions\(false\);\s*\}\}/;

  content = content.replace(paidToRx, (match) => {
    return match.replace(/setShowSuggestions\(false\);/, 
`setShowSuggestions(false);
                              setErrors(prev => {
                                const nv = { ...prev };
                                delete nv.paidTo;
                                if (s.projectDetails) delete nv.projectDetails;
                                if (s.owner) delete nv.owner;
                                if (s.purpose) delete nv.purpose;
                                if (s.amount) delete nv.amount;
                                if (s.note) delete nv.note;
                                if (s.accountName) delete nv.accountName;
                                if (s.accountNumber) delete nv.accountNumber;
                                return nv;
                              });`);
  });

  const ownerRx = /onClick=\{\(\) => \{\s*onInputChange\("owner", o\.name\);\s*setShowOwnerSuggestions\(false\);\s*\}\}/g;
  content = content.replace(ownerRx, `onClick={() => {
                              onInputChange("owner", o.name);
                              setShowOwnerSuggestions(false);
                              setErrors(prev => {
                                const nv = { ...prev };
                                delete nv.owner;
                                return nv;
                              });
                            }}`);

  fs.writeFileSync(file, content, 'utf8');
}

patch("components/app/super/voucher/CashVoucher/FormSection.tsx");
patch("components/app/super/voucher/ChequeVoucher/FormSection.tsx");
