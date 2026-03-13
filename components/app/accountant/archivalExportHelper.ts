export const buildOwnerSheet = async (
    XLSX: any,
    wb: any,
    ownerRecord: { id: number; name: string; type: string },
    yearRecords: any[],
    selectedYear: string,
    baseUrl: string
) => {
    const sanitizedName = ownerRecord.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const isClientOrCompany = ownerRecord.type.toUpperCase() === "CLIENT" || ownerRecord.type.toUpperCase() === "COMPANY";

    let units: any[] = [];
    let budgets: any[] = [];

    if (isClientOrCompany) {
        try {
            const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerRecord.id}&per_page=all`);
            const uData = await res.json();
            if (uData.success) {
                units = Array.isArray(uData.data?.data) ? uData.data.data : (Array.isArray(uData.data) ? uData.data : []);
            }
        } catch (e) { console.error(e); }

        try {
            const res = await fetch(`/api/accountant/budgets/owner/${ownerRecord.id}`);
            const bData = await res.json();
            if (bData.success) {
                budgets = bData.data || [];
            }
        } catch (e) { console.error(e); }
    }

    // Determine which units are bound to budgets so we can exclude them from the standalone Unit Ledgers block
    const budgetedUnitIds = new Set<string | number>();
    budgets.forEach(b => {
        if (b.units && Array.isArray(b.units)) {
            b.units.forEach((bu: any) => budgetedUnitIds.add(String(bu.id)));
        }
    });

    const standaloneUnits = units.filter(u => !budgetedUnitIds.has(String(u.id)));

    const wsData: any[][] = [];
    const wsMerges: any[] = [];
    const hyperlinkCells: { r: number; c: number; url: string; text: string }[] = [];

    const titleRows: number[] = [];
    const sectionTitleRows: number[] = [];
    const headerRows: number[] = [];
    const balanceHeaderRows: number[] = [];
    const balanceValueRows: number[] = [];
    const budgetTitleRows: number[] = [];
    const dataRowIndices: Set<number> = new Set();
    // Keyed as "rowIndex,colStart" so each table block has independent stripe tracking
    const stripedCells: Set<string> = new Set();

    let currentRow = 0;

    const pushTransactionsBlock = (transactions: any[], startCol: number) => {
        if (transactions.length === 0) {
            const drIndex = currentRow;
            dataRowIndices.add(drIndex);

            if (!wsData[currentRow]) wsData[currentRow] = [];
            for (let i = 0; i < startCol; i++) {
                if (wsData[currentRow][i] === undefined) wsData[currentRow][i] = "";
            }

            const emptyData = ["No records found", "-", "-", "-", "-", "", "", 0, "-", "-"];
            emptyData.forEach((val, i) => {
                wsData[currentRow][startCol + i] = val;
            });

            currentRow++;
            return;
        }

        transactions.forEach((entry, txIndex) => {
            const drIndex = currentRow;
            dataRowIndices.add(drIndex);
            if (txIndex % 2 === 1) stripedCells.add(`${drIndex},${startCol}`);

            if (!wsData[currentRow]) wsData[currentRow] = [];
            for (let i = 0; i < startCol; i++) {
                if (wsData[currentRow][i] === undefined) wsData[currentRow][i] = "";
            }

            const depVal = Number(entry.deposit) || 0;
            const wthVal = Number(entry.withdrawal) || 0;

            const txData = [
                entry.voucherDate || entry.createdAt || "N/A",
                entry.voucherNo || "—",
                entry.transType || "—",
                entry.owner || "—",
                entry.particulars || "—",
                depVal > 0 ? depVal : "",
                wthVal > 0 ? wthVal : "",
                entry.outsBalance,
                entry.fundReference || "-",
                entry.personInCharge || "-"
            ];

            txData.forEach((val, i) => {
                wsData[currentRow][startCol + i] = val;
            });

            if (entry.voucherAttachmentUrl) {
                const fullUrl = entry.voucherAttachmentUrl.startsWith("http") ? entry.voucherAttachmentUrl : `${baseUrl}${entry.voucherAttachmentUrl}`;
                hyperlinkCells.push({ r: drIndex, c: startCol + 1, url: fullUrl, text: entry.voucherNo || "—" });
            }

            const instrumentFiles = entry.instrumentAttachments ?? [];
            if (instrumentFiles.length > 0) {
                currentRow++;

                // Do not overwrite transType! Append files to succeeding rows.
                for (let fi = 0; fi < instrumentFiles.length; fi++) {
                    const file = instrumentFiles[fi];
                    const fileName = file.instrumentNo ?? file.file_name ?? file.name ?? "—";
                    const fileUrl = file.attachmentUrl ?? file.file_url ?? file.url ?? null;

                    const subRowIdx = currentRow;

                    if (!wsData[currentRow]) wsData[currentRow] = [];
                    for (let i = 0; i < startCol; i++) {
                        if (wsData[currentRow][i] === undefined) wsData[currentRow][i] = "";
                    }

                    const subData = ["", "", fileName, "", "", "", "", "", "", ""];
                    subData.forEach((val, i) => {
                        wsData[currentRow][startCol + i] = val;
                    });

                    dataRowIndices.add(subRowIdx);
                    // Propagate parent stripe to sub-rows
                    if (txIndex % 2 === 1) stripedCells.add(`${subRowIdx},${startCol}`);

                    if (fileUrl) {
                        const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${baseUrl}${fileUrl}`;
                        hyperlinkCells.push({ r: subRowIdx, c: startCol + 2, url: fullUrl, text: fileName });
                    }
                    currentRow++;
                }

                // Merge all columns EXCEPT column 2 (Trans Type) across the main row and all file subrows
                const startR = drIndex;
                const endR = currentRow - 1;
                [0, 1, 3, 4, 5, 6, 7, 8, 9].forEach(colOffset => {
                    wsMerges.push({ s: { r: startR, c: startCol + colOffset }, e: { r: endR, c: startCol + colOffset } });
                });
            } else {
                currentRow++;
            }
        });
    };

    const writeRow = (data: any[], colOffset: number = 0) => {
        if (!wsData[currentRow]) wsData[currentRow] = [];
        for (let i = 0; i < colOffset; i++) {
            if (wsData[currentRow][i] === undefined) wsData[currentRow][i] = "";
        }
        data.forEach((val, i) => {
            wsData[currentRow][colOffset + i] = val;
        });
        currentRow++;
    };

    // Keep track of the maximum depth of rows a column block goes.
    let maxRowOverall = 0;

    // --- TITLE ---
    titleRows.push(currentRow);
    writeRow(["ABIC REALTY & CONSULTANCY CORPORATION 2025"]);
    wsMerges.push({ s: { r: currentRow - 1, c: 0 }, e: { r: currentRow - 1, c: 9 } });

    titleRows.push(currentRow);
    writeRow([`${ownerRecord.name.toUpperCase()} - ARCHIVAL REPORT (${selectedYear})`]);
    wsMerges.push({ s: { r: currentRow - 1, c: 0 }, e: { r: currentRow - 1, c: 9 } });

    writeRow([]);
    writeRow([]);

    const contentStartRow = currentRow;

    // --- 1. MAIN LEDGER ---
    currentRow = contentStartRow;
    const MAIN_COL_START = 0;

    const mainRecords = yearRecords.filter(r => r.ownerForLedger === ownerRecord.name && !r.unitId);
    const getOpeningBalance = (records: any[], fallback: number = 0) => {
        if (!records || records.length === 0) return fallback;
        const oldest = records[0];
        const isOpening = oldest.transType === 'OPENING' || (oldest.particulars || '').toLowerCase().includes('opening balance');
        if (isOpening) return Number(oldest.deposit || 0);
        return (Number(oldest.outsBalance || 0) - (Number(oldest.deposit || 0)) + (Number(oldest.withdrawal || 0)));
    };

    const sortedMain = [...mainRecords].reverse(); // Oldest first
    const mainOpeningBalanceVal = getOpeningBalance(sortedMain);
    const mainRunningBalanceVal = sortedMain.length > 0 ? sortedMain[sortedMain.length - 1].outsBalance : 0;

    balanceHeaderRows.push(currentRow);
    writeRow([
        "MAIN LEDGER", "", "", "", "", "",
        "OPENING BALANCE", "RUNNING BALANCE", "", ""
    ], MAIN_COL_START);
    wsMerges.push({ s: { r: currentRow - 1, c: MAIN_COL_START }, e: { r: currentRow - 1, c: MAIN_COL_START + 5 } });

    balanceValueRows.push(currentRow);
    writeRow([
        "", "", "", "", "", "",
        mainOpeningBalanceVal, mainRunningBalanceVal, "", ""
    ], MAIN_COL_START);
    wsMerges.push({ s: { r: currentRow - 1, c: MAIN_COL_START }, e: { r: currentRow - 1, c: MAIN_COL_START + 5 } });

    headerRows.push(currentRow);
    writeRow(["DATE", "VOUCHER NO.", "TRANS TYPE", "ACCOUNT SOURCE", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"], MAIN_COL_START);

    pushTransactionsBlock(sortedMain, MAIN_COL_START);
    maxRowOverall = Math.max(maxRowOverall, currentRow);

    // --- 2. UNIT LEDGERS (Standalone Only) ---
    // Start this section side-by-side using offset
    const UNIT_COL_START = MAIN_COL_START + 11; // 1 space column buffer

    if (isClientOrCompany && standaloneUnits.length > 0) {
        currentRow = contentStartRow;

        standaloneUnits.forEach(unit => {
            const uRecords = yearRecords.filter(r => r.ownerForLedger === ownerRecord.name && String(r.unitId) === String(unit.id));
            const sortedURecords = [...uRecords].reverse();
            const openingBal = getOpeningBalance(sortedURecords, unit.opening_balance || 0);
            const currentBal = sortedURecords.length > 0 ? sortedURecords[sortedURecords.length - 1].outsBalance : openingBal;

            // Header labels row
            balanceHeaderRows.push(currentRow);
            writeRow([
                `UNIT: ${unit.unit_name.toUpperCase()}`, "", "", "", "", "",
                "OPENING BALANCE", "RUNNING BALANCE", "", ""
            ], UNIT_COL_START);
            wsMerges.push({ s: { r: currentRow - 1, c: UNIT_COL_START }, e: { r: currentRow - 1, c: UNIT_COL_START + 5 } });

            // Value row
            balanceValueRows.push(currentRow);
            writeRow([
                "", "", "", "", "", "",
                openingBal, currentBal, "", ""
            ], UNIT_COL_START);
            wsMerges.push({ s: { r: currentRow - 1, c: UNIT_COL_START }, e: { r: currentRow - 1, c: UNIT_COL_START + 5 } });

            headerRows.push(currentRow);
            writeRow(["DATE", "VOUCHER NO.", "TRANS TYPE", "ACCOUNT SOURCE", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"], UNIT_COL_START);

            pushTransactionsBlock(sortedURecords, UNIT_COL_START);

            writeRow([], UNIT_COL_START);
            writeRow([], UNIT_COL_START);
        });
        maxRowOverall = Math.max(maxRowOverall, currentRow);
    }

    // --- 3. UNIT BUDGETS ---
    // Start side-by-side using offset.
    const BUDGET_COL_START = UNIT_COL_START + ((isClientOrCompany && standaloneUnits.length > 0) ? 11 : 0);

    if (isClientOrCompany && budgets.length > 0) {
        currentRow = contentStartRow;

        budgets.forEach(budget => {
            // Budget Header row
            balanceHeaderRows.push(currentRow);
            budgetTitleRows.push(currentRow); // We add it here to style the main BUDGET title correctly
            writeRow([
                `BUDGET: ${budget.budget_name.toUpperCase()}`, "", "", "", "", "",
                "RUNNING BUDGET", "TOTAL RUNNING BALANCE", "", ""
            ], BUDGET_COL_START);
            wsMerges.push({ s: { r: currentRow - 1, c: BUDGET_COL_START }, e: { r: currentRow - 1, c: BUDGET_COL_START + 5 } });

            // Budget Values row
            balanceValueRows.push(currentRow);
            writeRow([
                "", "", "", "", "", "",
                parseFloat(budget.current_balance) || 0,
                budget.total_units_balance !== undefined ? budget.total_units_balance : (parseFloat(budget.current_balance) || 0),
                "", ""
            ], BUDGET_COL_START);
            wsMerges.push({ s: { r: currentRow - 1, c: BUDGET_COL_START }, e: { r: currentRow - 1, c: BUDGET_COL_START + 5 } });
            writeRow([], BUDGET_COL_START);

            const budgetUnits = budget.units || [];
            budgetUnits.forEach((unit: any) => {
                const uRecords = yearRecords.filter(r => r.ownerForLedger === ownerRecord.name && String(r.unitId) === String(unit.id));
                const sortedURecords = [...uRecords].reverse();
                const openingBal = getOpeningBalance(sortedURecords, unit.opening_balance || 0);
                const currentBal = sortedURecords.length > 0 ? sortedURecords[sortedURecords.length - 1].outsBalance : openingBal;

                budgetTitleRows.push(currentRow);
                balanceHeaderRows.push(currentRow);
                writeRow([
                    `UNIT: ${unit.unit_name.toUpperCase()}`, "", "", "", "", "",
                    "OPENING BALANCE", "RUNNING BALANCE", "", ""
                ], BUDGET_COL_START);
                wsMerges.push({ s: { r: currentRow - 1, c: BUDGET_COL_START }, e: { r: currentRow - 1, c: BUDGET_COL_START + 5 } });

                balanceValueRows.push(currentRow);
                writeRow([
                    "", "", "", "", "", "",
                    openingBal, currentBal, "", ""
                ], BUDGET_COL_START);
                wsMerges.push({ s: { r: currentRow - 1, c: BUDGET_COL_START }, e: { r: currentRow - 1, c: BUDGET_COL_START + 5 } });

                headerRows.push(currentRow);
                writeRow(["DATE", "VOUCHER NO.", "TRANS TYPE", "ACCOUNT SOURCE", "PARTICULARS", "DEPOSIT", "WITHDRAWAL", "OUTS. BALANCE", "FUND REFERENCES", "PERSON IN CHARGE"], BUDGET_COL_START);

                pushTransactionsBlock(sortedURecords, BUDGET_COL_START);
                writeRow([], BUDGET_COL_START);
            });

            writeRow([], BUDGET_COL_START);
            writeRow([], BUDGET_COL_START);
        });
        maxRowOverall = Math.max(maxRowOverall, currentRow);
    }

    // Fill in undefined spots in rows up to maxRowOverall for proper array structure
    for (let i = 0; i < maxRowOverall; i++) {
        if (!wsData[i]) wsData[i] = [];
        for (let j = 0; j < BUDGET_COL_START + 10; j++) {
            if (wsData[i][j] === undefined) wsData[i][j] = "";
        }
    }

    // Format Excel Sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set cols dynamically depending on how many sections used.
    const allColWidths: any[] = [];
    const buildColSet = () => [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 35 }, { wch: 80 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 30 }
    ];

    allColWidths.push(...buildColSet());
    allColWidths.push({ wch: 5 }); // Spacer
    allColWidths.push(...buildColSet());
    allColWidths.push({ wch: 5 }); // Spacer
    allColWidths.push(...buildColSet());

    ws['!cols'] = allColWidths;
    ws['!merges'] = wsMerges;

    hyperlinkCells.forEach(({ r, c, url, text }) => {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        const safeUrl = url.replace(/"/g, '""');
        const safeText = String(text).replace(/"/g, '""');
        ws[cellAddr] = {
            t: 'str',
            f: `HYPERLINK("${safeUrl}","${safeText}")`,
            s: {
                font: { bold: true, color: { rgb: "0563C1" }, underline: true },
                alignment: { vertical: "center" },
                protection: { locked: true }
            }
        };
    });

    // Formatting Styles
    const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };
    const sectionTitleStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 }, fill: { fgColor: { rgb: "5F0C18" } }, alignment: { vertical: "center" } };
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "7A0F1F" } }, alignment: { horizontal: "center", vertical: "center" } };

    const budgetTitleStyle = { font: { bold: true, color: { rgb: "7A0F1F" }, sz: 12 }, alignment: { vertical: "center" } };
    const budgetUnitTitleStyle = { font: { bold: true, color: { rgb: "5F0C18" }, sz: 11 }, alignment: { vertical: "center" } };

    const balanceLabelStyle = { font: { bold: true, sz: 10, color: { rgb: "888888" } }, alignment: { horizontal: "right", vertical: "center" } };
    const balanceNumStyle = { font: { bold: true, sz: 12, color: { rgb: "7A0F1F" } }, alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };

    const dataStyle = { alignment: { vertical: "center" } };
    const numStyle = { alignment: { horizontal: "right", vertical: "center" }, numFmt: "#,##0.00" };

    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:AE10"); // Wide enough range

    for (let R = 0; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress] || ws[cellAddress].v === "") continue;

            const isTitleBlock = titleRows.includes(R);
            const isSectionBlock = sectionTitleRows.includes(R);
            const isBudgetTitleBlock = budgetTitleRows.includes(R);
            const isHeaderBlock = headerRows.includes(R);
            const isBalanceHeaderBlock = balanceHeaderRows.includes(R);
            const isBalanceValueBlock = balanceValueRows.includes(R);
            const isDataBlock = dataRowIndices.has(R);

            const moduloC = C % 11; // 10 columns per table + 1 spacer

            if (isTitleBlock) {
                ws[cellAddress].s = titleStyle;
            } else if (isSectionBlock) {
                ws[cellAddress].s = sectionTitleStyle;
            } else if (isHeaderBlock) {
                ws[cellAddress].s = headerStyle;
            } else if (isBalanceHeaderBlock) {
                if (moduloC === 0) ws[cellAddress].s = isBudgetTitleBlock ? budgetTitleStyle : { font: { bold: true, sz: 11, color: { rgb: "5F0C18" } }, alignment: { vertical: "center" } };
                else if (moduloC === 6 || moduloC === 7) ws[cellAddress].s = balanceLabelStyle;
            } else if (isBalanceValueBlock) {
                if (moduloC === 6 || moduloC === 7) {
                    ws[cellAddress].s = balanceNumStyle;
                    if (ws[cellAddress].v !== "" && !isNaN(Number(ws[cellAddress].v))) {
                        ws[cellAddress].t = "n";
                    }
                }
            } else if (isDataBlock) {
                // Determine which colStart this cell belongs to (by finding the nearest block start)
                // We compute by using modulo: blocks are at 0, 11, 22, ...
                const blockStart = Math.floor(C / 11) * 11;
                const isStriped = stripedCells.has(`${R},${blockStart}`);
                const rowFill = isStriped ? { fill: { fgColor: { rgb: "FFE4E8" } } } : {};

                if (ws[cellAddress].f && String(ws[cellAddress].f).startsWith("HYPERLINK")) {
                    if (isStriped) ws[cellAddress].s = { ...ws[cellAddress].s, ...rowFill };
                    continue;
                }

                if (moduloC >= 5 && moduloC <= 7) {
                    ws[cellAddress].s = { ...numStyle, ...rowFill };
                    if (ws[cellAddress].v !== "" && !isNaN(Number(ws[cellAddress].v))) ws[cellAddress].t = "n";
                } else {
                    ws[cellAddress].s = { ...dataStyle, ...rowFill };
                }
            }
        }
    }

    // Use owner name as sheet name (Excel max 31 chars, strip invalid chars)
    const sheetName = ownerRecord.name
        .replace(/[\\\/\?\*\[\]:']/g, '')
        .substring(0, 31)
        .trim() || 'Sheet';

    // Ensure unique sheet name in the workbook
    let finalSheetName = sheetName;
    let counter = 2;
    while (wb.SheetNames && wb.SheetNames.includes(finalSheetName)) {
        finalSheetName = sheetName.substring(0, 28) + ` ${counter}`;
        counter++;
    }

    XLSX.utils.book_append_sheet(wb, ws, finalSheetName);
};

/**
 * Export a single owner (backward-compatible).
 */
export const performArchivalExport = async (
    XLSX: any,
    ownerRecord: { id: number; name: string; type: string },
    yearRecords: any[],
    selectedYear: string,
    baseUrl: string
) => {
    const wb = XLSX.utils.book_new();
    await buildOwnerSheet(XLSX, wb, ownerRecord, yearRecords, selectedYear, baseUrl);
    const sanitizedName = ownerRecord.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(wb, `${sanitizedName}_${selectedYear}_archive.xlsx`);
};

/**
 * Export multiple owners — each owner gets its own sheet in one workbook.
 * @param onProgress optional callback fired after each sheet is built. Receives (current, total).
 */
export const exportMultipleOwners = async (
    XLSX: any,
    ownerRecords: { id: number; name: string; type: string }[],
    allYearRecords: any[],
    selectedYear: string,
    baseUrl: string,
    onProgress?: (current: number, total: number) => void
) => {
    const wb = XLSX.utils.book_new();
    const total = ownerRecords.length;
    for (let i = 0; i < total; i++) {
        await buildOwnerSheet(XLSX, wb, ownerRecords[i], allYearRecords, selectedYear, baseUrl);
        onProgress?.(i + 1, total);
    }
    const fileName = ownerRecords.length === 1
        ? `${ownerRecords[0].name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${selectedYear}_archive.xlsx`
        : `archival_export_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
