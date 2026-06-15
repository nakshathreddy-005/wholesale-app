import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import InventoryLog from '../models/InventoryLog.js';

const generateInvoiceNumber = () => {
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}-${Date.now().toString().slice(-5)}`;
};

export const createInvoice = async (req, res, next) => {
  try {
    const { customerId, items, paymentMethod, paymentStatus, notes, dueDate } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    let subtotal = 0, totalGST = 0, totalDiscount = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      const unitPrice = item.unitPrice || product.sellingPrice;
      const discountAmt = (unitPrice * item.quantity * (item.discount || 0)) / 100;
      const taxableAmount = unitPrice * item.quantity - discountAmt;
      const gstAmt = (taxableAmount * (item.gstRate || product.gstRate)) / 100;
      const total = taxableAmount + gstAmt;

      subtotal += unitPrice * item.quantity;
      totalDiscount += discountAmt;
      totalGST += gstAmt;

      invoiceItems.push({
        product: product._id, productName: product.name,
        quantity: item.quantity, unitPrice, gstRate: item.gstRate || product.gstRate,
        gstAmount: gstAmt, discount: item.discount || 0, total,
      });

      // deduct stock
      const prevStock = product.stock;
      product.stock -= item.quantity;
      await product.save();
      await InventoryLog.create({
        product: product._id, type: 'sale', quantity: item.quantity,
        previousStock: prevStock, newStock: product.stock,
        reference: 'Invoice', createdBy: req.user._id,
      });
    }

    const grandTotal = subtotal - totalDiscount + totalGST;
    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      customer: customerId, items: invoiceItems,
      subtotal, totalGST, totalDiscount, grandTotal,
      paymentMethod, paymentStatus: paymentStatus || 'pending',
      paidAmount: paymentStatus === 'paid' ? grandTotal : 0,
      notes, dueDate, createdBy: req.user._id,
    });

    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalPurchases: grandTotal, outstandingBalance: paymentStatus !== 'paid' ? grandTotal : 0 },
    });

    const populatedInvoice = await Invoice.findById(invoice._id).populate('customer', 'name phone email address gstin');
    res.status(201).json({ success: true, invoice: populatedInvoice });
  } catch (err) { next(err); }
};

export const getInvoices = async (req, res, next) => {
  try {
    const { search, status, startDate, endDate, customerId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    if (customerId) query.customer = customerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    if (search) query.invoiceNumber = { $regex: search, $options: 'i' };
    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone').populate('createdBy', 'name')
      .skip((page - 1) * limit).limit(parseInt(limit)).sort('-createdAt');
    const total = await Invoice.countDocuments(query);
    res.json({ success: true, invoices, total });
  } catch (err) { next(err); }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone email address gstin')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

export const updatePayment = async (req, res, next) => {
  try {
    const { paymentStatus, paidAmount, paymentMethod } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(req.params.id,
      { paymentStatus, paidAmount, paymentMethod }, { new: true });
    res.json({ success: true, invoice });
  } catch (err) { next(err); }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalRevenue, todaySales, pendingInvoices, monthSales] = await Promise.all([
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Invoice.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
      Invoice.countDocuments({ paymentStatus: 'pending' }),
      Invoice.aggregate([{ $match: { createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    ]);

    const products = await (await import('../models/Product.js')).default.find({ isActive: true });
    const lowStockCount = products.filter(p => p.isLowStock).length;

    const topSelling = await Invoice.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { totalSold: -1 } }, { $limit: 5 },
    ]);

    const weeklyRevenue = await Invoice.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todaySales[0]?.total || 0,
        todayInvoices: todaySales[0]?.count || 0,
        monthRevenue: monthSales[0]?.total || 0,
        pendingInvoices,
        totalProducts: products.length,
        lowStockCount,
        topSelling,
        weeklyRevenue,
      },
    });
  } catch (err) { next(err); }
};
