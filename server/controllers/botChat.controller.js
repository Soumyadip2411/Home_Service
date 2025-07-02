import BotChatMessage from '../models/botChatMessage.model.js';

export const saveBotMessage = async (req, res) => {
  try {
    const { sender, text } = req.body;
    const userId = req.userId; // from auth middleware
    const msg = await BotChatMessage.create({ userId, sender, text });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBotMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const messages = await BotChatMessage.find({ userId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 