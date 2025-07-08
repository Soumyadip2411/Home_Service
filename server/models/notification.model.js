import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['booking', 'chat'], required: true },
  message: { type: String, required: true },
  link: { type: String }, // URL to relevant page
  read: { type: Boolean, default: false },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 