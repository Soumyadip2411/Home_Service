import express from 'express';
import { saveBotMessage, getBotMessages } from '../controllers/botChat.controller.js';
import auth from '../middleware/auth.js';
const router = express.Router();
router.post('/message', auth, saveBotMessage);
router.get('/messages', auth, getBotMessages);
export default router; 