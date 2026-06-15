import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import InventoryLog from '../models/InventoryLog.js';

// ── Gather live business data from MongoDB ──────────────────────────────────
const getBusinessContext = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    allProducts,
    todaySales,
    monthSales,
    totalRevenue,
    pendingInvoices,
    recentInvoices,
    topSelling,
    totalCustomers,
    totalSuppliers,
    recentLogs,
  ] = await Promise.all([
    Product.find({ isActive: true }).select('name sku stock lowStockThreshold sellingPrice purchasePrice category unit gstRate'),
    Invoice.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Invoice.aggregate([{ $match: { createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }]),
    Invoice.find({ paymentStatus: 'pending' }).populate('customer', 'name phone').sort('-createdAt').limit(10),
    Invoice.find().populate('customer', 'name').sort('-createdAt').limit(5),
    Invoice.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, qty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { qty: -1 } }, { $limit: 5 },
    ]),
    Customer.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),
    InventoryLog.find().populate('product', 'name').sort('-createdAt').limit(5),
  ]);

  const lowStockProducts = allProducts.filter(p => p.stock <= p.lowStockThreshold);

  return {
    summary: {
      totalProducts: allProducts.length,
      lowStockCount: lowStockProducts.length,
      totalCustomers,
      totalSuppliers,
      todayRevenue: todaySales[0]?.total || 0,
      todayInvoices: todaySales[0]?.count || 0,
      monthRevenue: monthSales[0]?.total || 0,
      monthInvoices: monthSales[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalInvoices: totalRevenue[0]?.count || 0,
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((s, i) => s + (i.grandTotal - i.paidAmount), 0),
    },
    lowStockProducts: lowStockProducts.map(p => ({ name: p.name, sku: p.sku, stock: p.stock, threshold: p.lowStockThreshold, unit: p.unit })),
    allProducts: allProducts.map(p => ({ name: p.name, sku: p.sku, category: p.category, stock: p.stock, sellingPrice: p.sellingPrice, purchasePrice: p.purchasePrice, unit: p.unit })),
    topSelling: topSelling.map((p, i) => ({ rank: i + 1, name: p.name, unitsSold: p.qty, revenue: p.revenue })),
    recentInvoices: recentInvoices.map(i => ({ number: i.invoiceNumber, customer: i.customer?.name, amount: i.grandTotal, status: i.paymentStatus, date: i.createdAt })),
    pendingInvoices: pendingInvoices.map(i => ({ number: i.invoiceNumber, customer: i.customer?.name, phone: i.customer?.phone, amount: i.grandTotal - i.paidAmount, date: i.createdAt })),
    recentStockMovements: recentLogs.map(l => ({ product: l.product?.name, type: l.type, qty: l.quantity, date: l.createdAt })),
  };
};

// ── Call Gemini AI API ───────────────────────────────────────────────────────
// Model can be swapped for gemini-2.5-flash-lite (cheaper) or a gemini-3.x
// flash model if you want the newest generation.
const GEMINI_MODEL = 'gemini-2.5-flash';

const askGemini = async (userMessage, businessData, history = []) => {
  const systemPrompt = `You are an intelligent AI assistant for a wholesale business management system called "WholeSale Pro". 
You have access to real-time business data provided below. Answer questions accurately using this data.
Be concise, helpful, and use INR (₹) for currency. Use emojis to make responses friendly.
When listing products or data, be specific with numbers. Give actionable business advice when relevant.

=== LIVE BUSINESS DATA ===
${JSON.stringify(businessData, null, 2)}
=========================

Always answer based on the data above. If data is empty or zero, mention that honestly.`;

  // Gemini uses "contents" with roles 'user' / 'model' (not 'assistant'),
  // and each turn's text goes inside a "parts" array.
  const contents = [
    ...history.slice(-6).map(h => ({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API error');
  }

  const data = await response.json();

  // Gemini can return an empty candidates array if the response was blocked
  // (e.g. finishReason: 'SAFETY' or 'RECITATION') — handle that gracefully.
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text).join('') || '';

  if (!text) {
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Gemini response blocked or empty (reason: ${candidate.finishReason})`);
    }
    return 'Sorry, I could not generate a response.';
  }

  return text;
};

// ── Detect if response needs structured table data ──────────────────────────
const extractStructuredData = (userMessage, businessData) => {
  const msg = userMessage.toLowerCase();
  if ((msg.includes('low stock') || msg.includes('restock')) && businessData.lowStockProducts.length > 0) {
    return { type: 'low_stock_table', items: businessData.lowStockProducts };
  }
  if (msg.includes('top sell') || msg.includes('best sell') || msg.includes('popular')) {
    return businessData.topSelling.length > 0 ? { type: 'top_products', items: businessData.topSelling } : null;
  }
  if (msg.includes('pending') && (msg.includes('payment') || msg.includes('invoice'))) {
    return businessData.pendingInvoices.length > 0 ? { type: 'pending_invoices', items: businessData.pendingInvoices } : null;
  }
  if (msg.includes('recent invoice') || msg.includes('last invoice')) {
    return businessData.recentInvoices.length > 0 ? { type: 'recent_invoices', items: businessData.recentInvoices } : null;
  }
  return null;
};

// ── Main chat handler ───────────────────────────────────────────────────────
export const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });

    // Gather live data
    const businessData = await getBusinessContext();

    let reply;
    let usedAI = false;

    // Use Gemini AI if API key is set, otherwise fall back to smart rules
    if (process.env.GEMINI_API_KEY) {
      try {
        reply = await askGemini(message, businessData, history);
        usedAI = true;
      } catch (aiErr) {
        console.error('Gemini API error, falling back to rule-based:', aiErr.message);
        reply = getFallbackReply(message, businessData);
      }
    } else {
      reply = getFallbackReply(message, businessData);
    }

    // Attach structured table data if relevant
    const data = extractStructuredData(message, businessData);

    res.json({ success: true, reply, data, usedAI });
  } catch (err) { next(err); }
};

// ── Smart fallback (works without API key) ──────────────────────────────────
const getFallbackReply = (message, bd) => {
  const msg = message.toLowerCase();
  const s = bd.summary;

  if (msg.includes('low stock') || msg.includes('restock') || msg.includes('running out')) {
    if (bd.lowStockProducts.length === 0) return '✅ Great news! All products are well-stocked. No items need restocking right now.';
    return `⚠️ **${bd.lowStockProducts.length} product(s)** are running low on stock and need restocking urgently!`;
  }
  if ((msg.includes('today') || msg.includes("today's")) && (msg.includes('sale') || msg.includes('revenue'))) {
    return `📊 **Today's Sales:**\n\n- Revenue: ₹${s.todayRevenue.toFixed(2)}\n- Invoices: ${s.todayInvoices}\n- This Month: ₹${s.monthRevenue.toFixed(2)}`;
  }
  if (msg.includes('top sell') || msg.includes('best sell') || msg.includes('popular')) {
    if (bd.topSelling.length === 0) return '📦 No sales data yet. Create some invoices to see top selling products!';
    return `🏆 **Top ${bd.topSelling.length} Selling Products:**\n\n${bd.topSelling.map(p => `${p.rank}. ${p.name} — ${p.unitsSold} units sold`).join('\n')}`;
  }
  if (msg.includes('pending') && msg.includes('payment')) {
    return `💰 **Pending Payments:** ${s.pendingCount} invoices totaling ₹${s.pendingAmount.toFixed(2)}`;
  }
  if (msg.includes('total revenue') || msg.includes('total sales') || msg.includes('overall revenue')) {
    return `💹 **Total Revenue:** ₹${s.totalRevenue.toFixed(2)} across ${s.totalInvoices} invoices\n📅 This month: ₹${s.monthRevenue.toFixed(2)}`;
  }
  if (msg.includes('recent invoice') || msg.includes('last invoice')) {
    if (bd.recentInvoices.length === 0) return '📄 No invoices found yet. Create your first invoice in the Billing section!';
    return `📄 **Last ${bd.recentInvoices.length} Invoices:**\n\n${bd.recentInvoices.map(i => `• ${i.number} — ${i.customer} — ₹${i.amount?.toFixed(2)} (${i.status})`).join('\n')}`;
  }
  if (msg.includes('product') && (msg.includes('how many') || msg.includes('total') || msg.includes('count'))) {
    return `📦 You have **${s.totalProducts} products** in total.\n⚠️ ${s.lowStockCount} are low on stock.`;
  }
  if (msg.includes('customer') && (msg.includes('how many') || msg.includes('total') || msg.includes('count'))) {
    return `👥 You have **${s.totalCustomers} active customers** registered.`;
  }
  if (msg.includes('supplier') && (msg.includes('how many') || msg.includes('total') || msg.includes('count'))) {
    return `🏭 You have **${s.totalSuppliers} active suppliers** registered.`;
  }
  if (msg.includes('profit') || msg.includes('margin')) {
    const products = bd.allProducts;
    if (products.length === 0) return '📈 No products found to calculate profit margins.';
    const avgMargin = products.reduce((sum, p) => sum + ((p.sellingPrice - p.purchasePrice) / p.sellingPrice * 100), 0) / products.length;
    return `📈 **Profit Overview:**\n\n- Products tracked: ${products.length}\n- Average margin: ${avgMargin.toFixed(1)}%\n- Total revenue: ₹${s.totalRevenue.toFixed(2)}`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `👋 Hello! I'm your AI Business Assistant.\n\nHere's a quick snapshot:\n📦 Products: ${s.totalProducts} (${s.lowStockCount} low stock)\n💰 Today's Revenue: ₹${s.todayRevenue.toFixed(2)}\n⏳ Pending: ${s.pendingCount} invoices\n\nWhat would you like to know?`;
  }

  return `🤖 I can help you with:\n\n- **Low stock alerts** — "Show low stock products"\n- **Today's sales** — "What are today's sales?"\n- **Top products** — "Show top selling products"\n- **Pending payments** — "Show pending payments"\n- **Revenue** — "What is total revenue?"\n- **Recent invoices** — "Show recent invoices"\n- **Counts** — "How many customers do I have?"\n\nCurrent snapshot: ${s.totalProducts} products, ₹${s.totalRevenue.toFixed(2)} total revenue, ${s.pendingCount} pending invoices.`;
};