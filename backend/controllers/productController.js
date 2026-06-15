import Product from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category, lowStock, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = category;
    const skip = (page - 1) * limit;
    let products = await Product.find(query).populate('supplier', 'name').skip(skip).limit(parseInt(limit)).sort('-createdAt');
    if (lowStock === 'true') products = products.filter(p => p.isLowStock);
    const total = await Product.countDocuments(query);
    res.json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name phone');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (err) { next(err); }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => p.isLowStock);
    res.json({ success: true, products: lowStock, count: lowStock.length });
  } catch (err) { next(err); }
};
