// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

//module.exports = mongoose.model('ChatRoom', chatRoomSchema); 
export default mongoose.model('ChatRoom', chatRoomSchema);