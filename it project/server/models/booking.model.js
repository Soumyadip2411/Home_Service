import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  scheduledAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  location: { type: String, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  hasReview: {
    type: Boolean,
    default: false
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
