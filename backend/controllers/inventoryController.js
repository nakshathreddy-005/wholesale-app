import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';

export const getInventoryLogs = async (req, res, next) => {
  try {
    const { productId, type, page = 1, limit = 30 } = req.query;
    const query = {};
    if (productId) query.product = productId;
    if (type) query.type = type;
    const logs = await InventoryLog.find(query)
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .populate('supplier', 'name')
      .skip((page - 1) * limit).limit(parseInt(limit)).sort('-createdAt');
    const total = await InventoryLog.countDocuments(query);
    res.json({ success: true, logs, total });
  } catch (err) { next(err); }
};

export const stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, supplierId, notes, reference } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const previousStock = product.stock;
    product.stock += parseInt(quantity);
    await product.save();
    const log = await InventoryLog.create({
      product: productId, type: 'stock_in', quantity,
      previousStock, newStock: product.stock,
      supplier: supplierId, notes, reference, createdBy: req.user._id,
    });
    res.json({ success: true, log, newStock: product.stock });
  } catch (err) { next(err); }
};

export const stockOut = async (req, res, next) => {
  try {
    const { productId, quantity, notes, reference } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
    const previousStock = product.stock;
    product.stock -= parseInt(quantity);
    await product.save();
    const log = await InventoryLog.create({
      product: productId, type: 'stock_out', quantity,
      previousStock, newStock: product.stock,
      notes, reference, createdBy: req.user._id,
    });
    res.json({ success: true, log, newStock: product.stock });
  } catch (err) { next(err); }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { productId, newQuantity, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const previousStock = product.stock;
    const diff = newQuantity - previousStock;
    product.stock = parseInt(newQuantity);
    await product.save();
    const log = await InventoryLog.create({
      product: productId, type: 'adjustment', quantity: Math.abs(diff),
      previousStock, newStock: product.stock, notes, createdBy: req.user._id,
    });
    res.json({ success: true, log, newStock: product.stock });
  } catch (err) { next(err); }
};
