import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import InventoryLog from '../models/InventoryLog.js';

// Parse user intent from message
const parseIntent = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('low stock') || msg.includes('restock') || msg.includes('running out')) return 'low_stock';
  if (msg.includes('today') && (msg.includes('sale') || msg.includes('revenue'))) return 'today_sales';
  if (msg.includes('top sell') || msg.includes('best sell') || msg.includes('popular')) return 'top_selling';
  if (msg.includes('pending') && msg.includes('payment')) return 'pending_payments';
  if (msg.includes('total revenue') || msg.includes('total sales')) return 'total_revenue';
  if (msg.includes('stock') && (msg.includes('check') || msg.includes('how many'))) return 'check_stock';
  if (msg.includes('customer')) return 'customer_info';
  if (msg.includes('supplier')) return 'supplier_info';
  if (msg.includes('invoice') && msg.includes('recent')) return 'recent_invoices';
  if (msg.includes('profit') || msg.includes('earning')) return 'profit_analysis';
  return 'general';
};

const executeIntent = async (intent, message) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  switch (intent) {
    case 'low_stock': {
      const products = await Product.find({ isActive: true });
      const lowStock = products.filter(p => p.isLowStock);
      if (lowStock.length === 0) return { text: '✅ Great news! All products are well-stocked. No items need restocking right now.', data: null };
      return {
        text: `⚠️ Found **${lowStock.length} products** with low stock that need attention:`,
        data: { type: 'low_stock_table', items: lowStock.map(p => ({ name: p.name, stock: p.stock, threshold: p.lowStockThreshold, sku: p.sku })) },
      };
    }
    case 'today_sales': {
      const sales = await Invoice.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]);
      const s = sales[0] || { total: 0, count: 0 };
      return { text: `📊 **Today's Sales Summary:**\n\n- Total Revenue: ₹${s.total.toFixed(2)}\n- Total Invoices: ${s.count}`, data: null };
    }
    case 'top_selling': {
      const top = await Invoice.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.productName' }, qty: { $sum: '$items.quantity' }, rev: { $sum: '$items.total' } } },
        { $sort: { qty: -1 } }, { $limit: 5 },
      ]);
      return {
        text: `🏆 **Top 5 Selling Products:**`,
        data: { type: 'top_products', items: top.map((p, i) => ({ rank: i + 1, name: p.name, qty: p.qty, revenue: p.rev })) },
      };
    }
    case 'pending_payments': {
      const pending = await Invoice.find({ paymentStatus: 'pending' }).populate('customer', 'name phone').limit(10).sort('-createdAt');
      const totalPending = pending.reduce((sum, inv) => sum + (inv.grandTotal - inv.paidAmount), 0);
      return {
        text: `💰 **Pending Payments:** ${pending.length} invoices totaling ₹${totalPending.toFixed(2)}`,
        data: { type: 'pending_invoices', items: pending.map(inv => ({ number: inv.invoiceNumber, customer: inv.customer?.name, amount: inv.grandTotal - inv.paidAmount, date: inv.createdAt })) },
      };
    }
    case 'total_revenue': {
      const rev = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]);
      const r = rev[0] || { total: 0, count: 0 };
      return { text: `💹 **Total Revenue:** ₹${r.total.toFixed(2)} across ${r.count} invoices`, data: null };
    }
    case 'recent_invoices': {
      const invoices = await Invoice.find().populate('customer', 'name').limit(5).sort('-createdAt');
      return {
        text: `📄 **Last 5 Invoices:**`,
        data: { type: 'recent_invoices', items: invoices.map(inv => ({ number: inv.invoiceNumber, customer: inv.customer?.name, amount: inv.grandTotal, status: inv.paymentStatus, date: inv.createdAt })) },
      };
    }
    case 'profit_analysis': {
      const products = await Product.find({ isActive: true });
      const avgMargin = products.reduce((sum, p) => sum + parseFloat(p.profitMargin), 0) / products.length;
      return { text: `📈 **Profit Analysis:**\n\n- Products Tracked: ${products.length}\n- Average Profit Margin: ${avgMargin.toFixed(1)}%\n\nTip: Go to Reports > Profit Analysis for detailed breakdown.`, data: null };
    }
    default:
      return {
        text: `🤖 I can help you with:\n\n- **Low stock alerts** — "Show low stock products"\n- **Today's sales** — "What are today's sales?"\n- **Top products** — "Show top selling products"\n- **Pending payments** — "Show pending invoices"\n- **Revenue** — "What is total revenue?"\n- **Recent invoices** — "Show recent invoices"`,
        data: null,
      };
  }
};

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
    const intent = parseIntent(message);
    const result = await executeIntent(intent, message);
    res.json({ success: true, reply: result.text, data: result.data, intent });
  } catch (err) { next(err); }
};
