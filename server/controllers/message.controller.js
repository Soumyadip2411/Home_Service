import Message from '../models/message.model.js';
import ChatRoom from '../models/chatRoom.model.js';
import Notification from '../models/notification.model.js';
import Booking from '../models/booking.model.js';

// Send a message (only if chat is active)
export const sendMessage = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { message } = req.body;
    const senderId = req.body.senderId || req.userId;
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) return res.status(404).json({ message: 'Chat room not found' });
    if (!chatRoom.isActive) return res.status(403).json({ message: 'Chat is closed' });
    const msg = await Message.create({ chatRoomId, senderId, message });
    // Determine recipient (other user in chat room)
    let recipientId;
    if (chatRoom.clientId.toString() === senderId.toString()) {
      recipientId = chatRoom.providerId;
    } else {
      recipientId = chatRoom.clientId;
    }
    // Get sender's name (optional, fallback to 'Someone')
    let senderName = 'Someone';
    try {
      const senderUser = await import('../models/user.model.js').then(m => m.default.findById(senderId));
      if (senderUser) senderName = senderUser.name;
    } catch {}
    // Check booking status before sending notification
    const booking = await Booking.findById(chatRoom.bookingId);
    if (chatRoom.isActive && (booking.status === 'confirmed' || booking.status === 'completed')) {
      await Notification.create({
        user: recipientId,
        type: 'chat',
        message: `New message from ${senderName}`,
        link: `/chat/${booking._id.toString()}`,
        chatRoom: chatRoomId,
        read: false
      });
    }
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all messages for a chat room
export const getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const messages = await Message.find({ chatRoomId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 