import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export interface ReportRow {
  [key: string]: string | number | null | undefined;
}

export function exportToPDF(title: string, rows: ReportRow[], filename = "report.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const headers = Object.keys(rows[0] ?? {});
  const colWidth = (pageWidth - margin * 2) / Math.max(1, headers.length);

  // Header row
  headers.forEach((h, i) => {
    doc.text(String(h), margin + i * colWidth, 80);
  });

  // Data rows
  rows.forEach((row, rIdx) => {
    headers.forEach((h, cIdx) => {
      const text = String(row[h] ?? "");
      doc.text(text, margin + cIdx * colWidth, 100 + rIdx * 18);
    });
  });

  doc.save(filename);
}

export function exportToXLSX(sheetName: string, rows: ReportRow[], filename = "report.xlsx") {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}


