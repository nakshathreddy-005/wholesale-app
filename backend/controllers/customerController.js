import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const customers = await Customer.find(query).skip((page - 1) * limit).limit(parseInt(limit)).sort('-createdAt');
    const total = await Customer.countDocuments(query);
    res.json({ success: true, customers, total });
  } catch (err) { next(err); }
};

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const invoices = await Invoice.find({ customer: req.params.id }).sort('-createdAt').limit(10);
    res.json({ success: true, customer, invoices });
  } catch (err) { next(err); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, customer });
  } catch (err) { next(err); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) { next(err); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
};
