import Message from '../models/message.model.js';
import ChatRoom from '../models/chatRoom.model.js';

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