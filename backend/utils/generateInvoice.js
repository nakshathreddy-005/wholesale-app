import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, 612, 100).fill('#1e40af');
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('WHOLESALE BILLING', 50, 30);
  doc.fontSize(10).font('Helvetica').text('Tax Invoice', 50, 60);
  doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, 380, 30, { align: 'right' });
  doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 380, 45, { align: 'right' });
  doc.fontSize(10).text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 380, 60, { align: 'right' });
  doc.fillColor('#000000');

  // Customer info
  doc.moveDown(3);
  doc.font('Helvetica-Bold').fontSize(11).text('Bill To:', 50, 120);
  doc.font('Helvetica').fontSize(10);
  doc.text(invoice.customer?.name || 'N/A', 50, 135);
  doc.text(invoice.customer?.phone || '', 50, 150);
  if (invoice.customer?.email) doc.text(invoice.customer.email, 50, 165);
  if (invoice.customer?.address) doc.text(invoice.customer.address, 50, 180);
  if (invoice.customer?.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`, 50, 195);

  // Table header
  const tableTop = 230;
  doc.rect(50, tableTop, 512, 22).fill('#1e40af');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('#', 55, tableTop + 6);
  doc.text('Product', 75, tableTop + 6);
  doc.text('Qty', 290, tableTop + 6);
  doc.text('Rate', 330, tableTop + 6);
  doc.text('GST%', 380, tableTop + 6);
  doc.text('Disc%', 420, tableTop + 6);
  doc.text('Amount', 465, tableTop + 6);
  doc.fillColor('#000000');

  // Table rows
  let y = tableTop + 30;
  invoice.items.forEach((item, i) => {
    const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(50, y - 5, 512, 20).fill(bg);
    doc.fillColor('#000000').font('Helvetica').fontSize(9);
    doc.text(i + 1, 55, y);
    doc.text(item.productName?.slice(0, 28) || '', 75, y);
    doc.text(item.quantity, 290, y);
    doc.text(`₹${item.unitPrice?.toFixed(2)}`, 325, y);
    doc.text(`${item.gstRate}%`, 380, y);
    doc.text(`${item.discount || 0}%`, 420, y);
    doc.text(`₹${item.total?.toFixed(2)}`, 462, y);
    y += 22;
  });

  // Totals
  y += 10;
  doc.moveTo(50, y).lineTo(562, y).stroke('#e2e8f0');
  y += 10;

  const addTotalRow = (label, value, bold = false) => {
    if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
    doc.fontSize(10).text(label, 380, y).text(`₹${value?.toFixed(2)}`, 490, y);
    y += 18;
  };

  addTotalRow('Subtotal:', invoice.subtotal);
  if (invoice.totalDiscount > 0) addTotalRow('Discount:', -invoice.totalDiscount);
  addTotalRow('GST:', invoice.totalGST);

  doc.rect(378, y - 3, 184, 22).fill('#1e40af');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
  doc.text('GRAND TOTAL:', 382, y + 3).text(`₹${invoice.grandTotal?.toFixed(2)}`, 490, y + 3);
  doc.fillColor('#000000');
  y += 35;

  // Payment info
  doc.font('Helvetica').fontSize(10);
  doc.text(`Payment Method: ${invoice.paymentMethod?.toUpperCase() || 'CASH'}`, 50, y);
  doc.text(`Amount Paid: ₹${invoice.paidAmount?.toFixed(2) || '0.00'}`, 50, y + 15);
  if (invoice.grandTotal - (invoice.paidAmount || 0) > 0) {
    doc.fillColor('#dc2626').text(`Balance Due: ₹${(invoice.grandTotal - (invoice.paidAmount || 0)).toFixed(2)}`, 50, y + 30);
    doc.fillColor('#000000');
  }
  if (invoice.notes) {
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Notes:', 50, y + 55);
    doc.font('Helvetica').text(invoice.notes, 50, y + 70);
  }

  // Footer
  doc.rect(0, 760, 612, 82).fill('#f1f5f9');
  doc.fillColor('#64748b').fontSize(9).text('Thank you for your business!', 50, 775, { align: 'center', width: 512 });
  doc.text('This is a computer-generated invoice and does not require a signature.', 50, 790, { align: 'center', width: 512 });

  doc.end();
};
