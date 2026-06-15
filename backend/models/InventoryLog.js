import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['stock_in', 'stock_out', 'adjustment', 'sale', 'return'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reference: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('InventoryLog', inventoryLogSchema);
