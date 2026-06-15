import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, unique: true, trim: true },
  barcode: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String },
  gstRate: { type: Number, default: 18 },
}, { timestamps: true });

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

productSchema.virtual('profit').get(function () {
  return this.sellingPrice - this.purchasePrice;
});

productSchema.virtual('profitMargin').get(function () {
  return ((this.sellingPrice - this.purchasePrice) / this.sellingPrice * 100).toFixed(2);
});

productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
