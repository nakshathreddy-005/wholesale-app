import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wholesale_db');
    console.log('🔌 Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Product.deleteMany(), Customer.deleteMany(), Supplier.deleteMany()]);
    console.log('🧹 Cleared existing data');

    // Create Admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@wholesale.com',
      password: 'admin123',
      role: 'admin',
    });
    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@wholesale.com',
      password: 'staff123',
      role: 'staff',
    });
    console.log('👤 Users created');

    // Create Suppliers
    const [sup1, sup2] = await Supplier.insertMany([
      { name: 'Rajesh Electronics Pvt Ltd', phone: '9876543210', email: 'rajesh@electronics.com', address: '12 MG Road, Bangalore', gstin: '29ABCDE1234F1Z5', contactPerson: 'Rajesh Kumar', paymentTerms: '30 days' },
      { name: 'Sharma General Traders', phone: '9876001234', email: 'sharma@traders.com', address: '45 Gandhi Nagar, Mumbai', gstin: '27XYZAB5678G2H6', contactPerson: 'Mohan Sharma', paymentTerms: '15 days' },
    ]);
    console.log('🏭 Suppliers created');

    // Create Products
    await Product.insertMany([
      { name: 'Samsung LED TV 43"', sku: 'ELEC-001', barcode: '8901234567890', category: 'Electronics', purchasePrice: 22000, sellingPrice: 28000, stock: 15, lowStockThreshold: 3, unit: 'pcs', gstRate: 18, supplier: sup1._id },
      { name: 'LG Refrigerator 350L', sku: 'ELEC-002', barcode: '8901234567891', category: 'Electronics', purchasePrice: 28000, sellingPrice: 35000, stock: 8, lowStockThreshold: 2, unit: 'pcs', gstRate: 18, supplier: sup1._id },
      { name: 'Prestige Pressure Cooker 5L', sku: 'KITCH-001', category: 'Kitchen', purchasePrice: 1200, sellingPrice: 1800, stock: 50, lowStockThreshold: 10, unit: 'pcs', gstRate: 12, supplier: sup2._id },
      { name: 'Borosil Glass Set (6 pcs)', sku: 'KITCH-002', category: 'Kitchen', purchasePrice: 400, sellingPrice: 650, stock: 5, lowStockThreshold: 10, unit: 'set', gstRate: 12, supplier: sup2._id },
      { name: 'Parle-G Biscuits (1kg)', sku: 'FOOD-001', category: 'Food & Beverages', purchasePrice: 60, sellingPrice: 80, stock: 200, lowStockThreshold: 50, unit: 'kg', gstRate: 5, supplier: sup2._id },
      { name: 'Tata Salt (1kg)', sku: 'FOOD-002', category: 'Food & Beverages', purchasePrice: 20, sellingPrice: 28, stock: 300, lowStockThreshold: 100, unit: 'kg', gstRate: 5, supplier: sup2._id },
      { name: 'Havells Switch Board', sku: 'ELEC-003', category: 'Electronics', purchasePrice: 350, sellingPrice: 550, stock: 3, lowStockThreshold: 10, unit: 'pcs', gstRate: 18, supplier: sup1._id },
      { name: 'Pidilite Fevicol 1kg', sku: 'MISC-001', category: 'Hardware', purchasePrice: 150, sellingPrice: 220, stock: 30, lowStockThreshold: 15, unit: 'pcs', gstRate: 18, supplier: sup2._id },
    ]);
    console.log('📦 Products created');

    // Create Customers
    await Customer.insertMany([
      { name: 'Ravi Retail Store', phone: '9988776655', email: 'ravi@retailstore.com', address: '78 Commercial Street, Bangalore', gstin: '29PQRST9012K3L7', creditLimit: 50000 },
      { name: 'Priya General Store', phone: '9977665544', email: 'priya@general.com', address: '23 Linking Road, Mumbai', gstin: '27MNOPQ3456H5J8', creditLimit: 30000 },
      { name: 'Suresh Wholesale', phone: '9966554433', address: 'Ring Road, Hyderabad', creditLimit: 100000 },
      { name: 'Meena Kirana', phone: '9955443322', address: 'MG Road, Chennai', creditLimit: 25000 },
    ]);
    console.log('👥 Customers created');

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin:  admin@wholesale.com / admin123');
    console.log('🔑 Staff:  staff@wholesale.com / staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
