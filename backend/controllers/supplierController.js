import Supplier from '../models/Supplier.js';
import InventoryLog from '../models/InventoryLog.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    const suppliers = await Supplier.find(query).skip((page - 1) * limit).limit(parseInt(limit)).sort('-createdAt');
    const total = await Supplier.countDocuments(query);
    res.json({ success: true, suppliers, total });
  } catch (err) { next(err); }
};

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    const history = await InventoryLog.find({ supplier: req.params.id, type: 'stock_in' })
      .populate('product', 'name').sort('-createdAt').limit(20);
    res.json({ success: true, supplier, history });
  } catch (err) { next(err); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) { next(err); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, supplier });
  } catch (err) { next(err); }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};
