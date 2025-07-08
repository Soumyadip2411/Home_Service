import Notification from '../models/notification.model.js';

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .sort({ read: 1, createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get count of unread notifications
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.userId, read: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 