// src/utils/exportToExcel.js
// Builds an .xlsx file from table rows and downloads it in the browser.
// exceljs is loaded only when an export actually happens, to keep pages light.

const pad = (n) => String(n).padStart(2, "0");

/**
 * @param {object}   options
 * @param {string}   options.fileBaseName  e.g. "sales" -> "sales-2026-11-18.xlsx"
 * @param {string}   options.sheetName     Worksheet tab name
 * @param {Array}    options.columns       [{ header, key, width, numFmt? }]
 * @param {Array}    options.rows          Objects keyed by the column keys
 */
const exportToExcel = async ({ fileBaseName, sheetName, columns, rows }) => {
  const { default: ExcelJS } = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map(({ header, key, width }) => ({ header, key, width }));
  sheet.getRow(1).font = { bold: true };

  rows.forEach((row) => sheet.addRow(row));

  // Number formats (e.g. currency) per column
  columns.forEach(({ key, numFmt }) => {
    if (numFmt) sheet.getColumn(key).numFmt = numFmt;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const today = new Date();
  const fileName = `${fileBaseName}-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default exportToExcel;
