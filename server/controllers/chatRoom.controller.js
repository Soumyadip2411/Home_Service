// const ChatRoom = require('../models/chatRoom.model');
// const Booking = require('../models/booking.model');
// const User = require('../models/user.model');
import ChatRoom from '../models/chatRoom.model.js';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';

// Create chat room when booking is confirmed
export const createChatRoom = async (booking) => {
  // Only create if not exists
  let chatRoom = await ChatRoom.findOne({ bookingId: booking._id });
  if (!chatRoom) {
    chatRoom = await ChatRoom.create({
      bookingId: booking._id,
      clientId: booking.customer,
      providerId: booking.provider,
      isActive: true,
    });
  } else {
    chatRoom.isActive = true;
    await chatRoom.save();
  }
  return chatRoom;
};

// Deactivate chat room when booking is completed
export const deactivateChatRoom = async (bookingId) => {
  const chatRoom = await ChatRoom.findOne({ bookingId });
  if (chatRoom) {
    chatRoom.isActive = false;
    await chatRoom.save();
  }
  return chatRoom;
};

// Get chat room by bookingId
export const getChatRoomByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const chatRoom = await ChatRoom.findOne({ bookingId });
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });
    res.json(chatRoom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 
