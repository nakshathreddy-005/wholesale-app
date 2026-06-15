import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  totalGST: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'credit', 'cheque'], default: 'cash' },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now()}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
