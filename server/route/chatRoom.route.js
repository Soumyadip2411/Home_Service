import express from 'express';
import auth from '../middleware/auth.js';
import { getChatRoomByBooking } from '../controllers/chatRoom.controller.js';
import { getMessages, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

// Get chat room by bookingId
router.get('/chatroom/:bookingId', auth, getChatRoomByBooking);

// Get messages for a chat room
router.get('/chatroom/:chatRoomId/messages', auth, getMessages);

// Send a message
router.post('/chatroom/:chatRoomId/message', auth, sendMessage);

export default router;