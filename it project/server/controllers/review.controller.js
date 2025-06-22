import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import Service from "../models/service.model.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.userId;
    const { serviceId } = req.params;
    const { rating, comment, bookingId } = req.body;
    console.log(`${userId} , ${serviceId} , ${bookingId}, ${rating}, ${comment}`);
    // Validate inputs
    if (!rating || !comment?.trim()) {
      return res.status(400).json({
        message: "Rating and comment are required",
        success: false
      });
    }

    // Check if booking exists and belongs to the user
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: userId,
      status: "completed"
    }).populate('service');

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not completed",
        success: false
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      service: serviceId,
      user: userId,
      booking: bookingId
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this service",
        success: false
      });
    }

    // Create and save the review
    const review = await Review.create({
      service: serviceId,
      user: userId,
      rating,
      comment: comment.trim(),
      booking: bookingId
    });

    // Update booking
    await Booking.findByIdAndUpdate(bookingId, { hasReview: true });

    // Update service average rating
    const serviceReviews = await Review.find({ service: serviceId });
    const avgRating = serviceReviews.reduce((acc, curr) => acc + curr.rating, 0) / serviceReviews.length;

    await Service.findByIdAndUpdate(serviceId, {
      avgRating: Number(avgRating.toFixed(1))
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      data: review,
      success: true
    });

  } catch (error) {
    console.error("Error in createReview:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit review",
      success: false
    });
  }
};