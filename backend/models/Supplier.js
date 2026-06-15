import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  gstin: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  paymentTerms: { type: String, default: '30 days' },
  totalPurchased: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
