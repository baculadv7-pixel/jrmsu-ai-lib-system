import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportRow {
  [key: string]: string | number | null | undefined;
}

export function exportToPDF(title: string, rows: ReportRow[], filename = "report.pdf") {
  if (rows.length === 0) {
    alert('No data to export');
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add JRMSU Header
  doc.setFillColor(0, 51, 102); // Navy blue
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JRMSU Library", 40, 35);
  
  doc.setFontSize(14);
  doc.text("AI-Powered System", 40, 55);
  
  // Report Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 110);
  
  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${dateStr}`, 40, 130);
  
  // Prepare table data
  const headers = Object.keys(rows[0] ?? {});
  const colWidth = (pageWidth - 80) / headers.length;
  let yPos = 160;
  
  // Draw header row
  doc.setFillColor(0, 51, 102);
  doc.rect(40, yPos - 15, pageWidth - 80, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  headers.forEach((header, i) => {
    const text = String(header);
    const xPos = 40 + i * colWidth + 5;
    doc.text(text, xPos, yPos);
  });
  
  yPos += 10;
  
  // Draw data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  rows.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(40, yPos - 10, pageWidth - 80, 15, 'F');
    }
    
    headers.forEach((header, colIndex) => {
      const text = String(row[header] ?? '');
      const xPos = 40 + colIndex * colWidth + 5;
      // Truncate long text
      const maxWidth = colWidth - 10;
      const truncated = doc.splitTextToSize(text, maxWidth)[0] || '';
      doc.text(truncated, xPos, yPos);
    });
    
    yPos += 15;
    
    // Add new page if needed
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 40;
      
      // Redraw header on new page
      doc.setFillColor(0, 51, 102);
      doc.rect(40, yPos - 15, pageWidth - 80, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      
      headers.forEach((header, i) => {
        const text = String(header);
        const xPos = 40 + i * colWidth + 5;
        doc.text(text, xPos, yPos);
      });
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }
  
  doc.save(filename);
}

export function exportToXLSX(sheetName: string, rows: ReportRow[], filename = "report.xlsx") {
  if (rows.length === 0) {
    alert('No data to export');
    return;
  }

  // Add header rows
  const headerData = [
    [`JRMSU Library - ${sheetName} Report`],
    [`Generated: ${new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`],
    [''], // Empty row
  ];

  // Create worksheet with header
  const worksheet = XLSX.utils.aoa_to_sheet(headerData);
  
  // Add data starting from row 4
  XLSX.utils.sheet_add_json(worksheet, rows, { origin: 'A4', skipHeader: false });
  
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Set column widths based on content
  const colWidths = [];
  const headers = Object.keys(rows[0] ?? {});
  
  for (let col = 0; col < headers.length; col++) {
    let maxWidth = headers[col].length;
    
    for (const row of rows) {
      const cellValue = String(row[headers[col]] ?? '');
      maxWidth = Math.max(maxWidth, cellValue.length);
    }
    
    colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
  }
  
  worksheet['!cols'] = colWidths;
  
  // Merge cells for title
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
  ];
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Write file
  XLSX.writeFile(workbook, filename);
}


