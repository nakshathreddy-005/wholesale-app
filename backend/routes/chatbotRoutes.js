import express from 'express';
import { chat } from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
router.use(protect);
router.post('/chat', chat);
export default router;
