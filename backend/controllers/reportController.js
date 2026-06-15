import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import InventoryLog from '../models/InventoryLog.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const formatMap = { day: '%Y-%m-%d', week: '%Y-%U', month: '%Y-%m', year: '%Y' };
    const format = formatMap[groupBy] || '%Y-%m-%d';

    const salesData = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          invoices: { $sum: 1 },
          gst: { $sum: '$totalGST' },
          discount: { $sum: '$totalDiscount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Invoice.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalInvoices: { $sum: 1 }, totalGST: { $sum: '$totalGST' }, totalDiscount: { $sum: '$totalDiscount' }, avgOrder: { $avg: '$grandTotal' } } },
    ]);

    res.json({ success: true, salesData, summary: summary[0] || {}, groupBy });
  } catch (err) { next(err); }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).populate('supplier', 'name');
    const report = products.map(p => ({
      name: p.name, sku: p.sku, category: p.category,
      stock: p.stock, lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.isLowStock, purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice, stockValue: p.stock * p.purchasePrice,
      supplier: p.supplier?.name || 'N/A',
    }));
    const totalValue = report.reduce((sum, p) => sum + p.stockValue, 0);
    const lowStockItems = report.filter(p => p.isLowStock);
    res.json({ success: true, report, totalValue, lowStockCount: lowStockItems.length, totalProducts: report.length });
  } catch (err) { next(err); }
};

export const getCustomerReport = async (req, res, next) => {
  try {
    const customers = await Customer.find({ isActive: true });
    const report = await Promise.all(customers.map(async (c) => {
      const invoices = await Invoice.find({ customer: c._id });
      const totalSpent = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      return { name: c.name, phone: c.phone, email: c.email, totalOrders: invoices.length, totalSpent, outstanding: c.outstandingBalance };
    }));
    report.sort((a, b) => b.totalSpent - a.totalSpent);
    res.json({ success: true, report });
  } catch (err) { next(err); }
};

export const getSupplierReport = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true });
    const report = await Promise.all(suppliers.map(async (s) => {
      const logs = await InventoryLog.find({ supplier: s._id, type: 'stock_in' });
      return { name: s.name, phone: s.phone, contactPerson: s.contactPerson, totalStockIns: logs.length, totalUnitsReceived: logs.reduce((sum, l) => sum + l.quantity, 0) };
    }));
    res.json({ success: true, report });
  } catch (err) { next(err); }
};

export const exportCSV = async (req, res, next) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = `${type}_report_${Date.now()}.csv`;

    if (type === 'sales') {
      const invoices = await Invoice.find().populate('customer', 'name phone');
      data = invoices.map(inv => ({
        InvoiceNo: inv.invoiceNumber, Customer: inv.customer?.name, Phone: inv.customer?.phone,
        Subtotal: inv.subtotal, GST: inv.totalGST, Discount: inv.totalDiscount,
        GrandTotal: inv.grandTotal, Status: inv.paymentStatus, Date: inv.createdAt.toISOString().split('T')[0],
      }));
    } else if (type === 'inventory') {
      const products = await Product.find({ isActive: true });
      data = products.map(p => ({
        Name: p.name, SKU: p.sku, Category: p.category, Stock: p.stock,
        PurchasePrice: p.purchasePrice, SellingPrice: p.sellingPrice,
        StockValue: p.stock * p.purchasePrice, LowStock: p.isLowStock ? 'Yes' : 'No',
      }));
    }

    if (data.length === 0) return res.status(404).json({ success: false, message: 'No data to export' });

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach(row => csvRows.push(headers.map(h => `"${row[h] ?? ''}"`).join(',')));
    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
};
