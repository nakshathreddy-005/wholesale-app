import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  gstin: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
