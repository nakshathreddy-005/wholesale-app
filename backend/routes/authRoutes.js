import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// TEMPORARY SEED ROUTE — remove after seeding!
router.get('/seed', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const Product = (await import('../models/Product.js')).default;
    const Customer = (await import('../models/Customer.js')).default;
    const Supplier = (await import('../models/Supplier.js')).default;

    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Customer.deleteMany(),
      Supplier.deleteMany(),
    ]);

    await User.create({
      name: 'Admin User',
      email: 'admin@wholesale.com',
      password: 'admin123',
      role: 'admin',
    });

    await User.create({
      name: 'Staff User',
      email: 'staff@wholesale.com',
      password: 'staff123',
      role: 'staff',
    });

    res.json({ success: true, message: '✅ Seeded! Admin: admin@wholesale.com / admin123' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
