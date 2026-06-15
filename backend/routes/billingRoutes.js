import express from 'express';
import { createInvoice, getInvoices, getInvoice, updatePayment, getDashboardStats } from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js';
import Invoice from '../models/Invoice.js';
import { generateInvoicePDF } from '../utils/generateInvoice.js';
const router = express.Router();
router.use(protect);
router.get('/dashboard-stats', getDashboardStats);
router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.put('/:id/payment', updatePayment);
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name phone email address gstin')
      .populate('items.product', 'name sku');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    generateInvoicePDF(invoice, res);
  } catch (err) { next(err); }
});
export default router;
