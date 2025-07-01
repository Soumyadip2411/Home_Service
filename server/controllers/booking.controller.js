import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { bookingNotificationTemplate, updateBookingStatusTemplate } from "../utils/emailTemplate.js";
import sendEmail from "../config/sendEmail.js";
import Service from "../models/service.model.js";
import Review from "../models/review.model.js";
import { createChatRoom, deactivateChatRoom } from "./chatRoom.controller.js";

export const getBookings = async (request, response) => {
  try {
    const userId = request.userId;
    const user = await User.findById(userId);

    let query = {};
    if (user.role === "PROVIDER") {
      query.provider = userId;
    } else {
      query.customer = userId;
    }

    // Inside getBookings function
    const bookings = await Booking.find(query)
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'title price _id') // Make sure _id is included
      .sort({ createdAt: -1 });

    // Check for existing reviews
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const review = await Review.findOne({
          service: booking.service._id,
          user: userId
        });
        
        return {
          ...booking.toObject(),
          hasReview: !!review
        };
      })
    );

    return response.json({
      message: "Bookings fetched successfully",
      data: bookingsWithReviewStatus,
      success: true,
      error: false
    });
  } catch (error) {
    console.error("Error in getBookings:", error);
    return response.status(500).json({
      message: "Failed to fetch bookings",
      error: true,
      success: false
    });
  }
};

export const getMyBookings = async (request, response) => {
  try {
    const userId = request.userId;
    
    // Inside getBookings function
    const bookings = await Booking.find({ customer: userId })
      .populate('service')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });

    // Check for existing reviews
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const review = await Review.findOne({
          service: booking.service._id,
          user: userId
        });
        
        return {
          ...booking.toObject(),
          hasReview: !!review
        };
      })
    );

    return response.json({
      message: "My bookings fetched successfully",
      data: bookingsWithReviewStatus,
      success: true,
      error: false
    });
  } catch (error) {
    console.error("Error in getMyBookings:", error);
    return response.status(500).json({
      message: "Failed to fetch bookings",
      error: true,
      success: false
    });
  }
};

export async function updateStatus(request, response) {
  try {
    const userId = request.userId;
    const { bookingId } = request.params;
    const { status } = request.body;

    // Validate request body
    if (
      !status ||
      !["pending", "confirmed", "completed", "cancelled"].includes(status)
    ) {
      return response.status(400).json({
        message:
          "Invalid status value. Must be one of: pending, confirmed, completed, cancelled",
        success: false,
        error: true,
      });
    }

    // Check user exists and is a provider
    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    if (user.role !== "PROVIDER") {
      return response.status(403).json({
        message: "Only providers can update booking status",
        success: false,
        error: true,
      });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        provider: userId,
      },
      { status },
      { new: true }
    )
      .populate("customer", "name email avatar")
      .populate("service", "title description price");

    if (!updatedBooking) {
      return response.status(404).json({
        message: "Booking not found or you don't have permission to update it",
        success: false,
        error: true,
      });
    }

    // Chat room logic
    if (status === "confirmed") {
      await createChatRoom(updatedBooking);
    } else if (status === "completed") {
      await deactivateChatRoom(updatedBooking._id);
    }

    if (updatedBooking) {
      const emailContent = updateBookingStatusTemplate({
        userName: updatedBooking.customer.name,
        bookingId: updatedBooking._id,
        serviceName: updatedBooking.service.title,
        status: updatedBooking.status,
        providerName: user.name,
        providerNumber: user.mobile,
      });

      await sendEmail({
        sendTo: updatedBooking.customer.email,
        subject: `Booking ${updatedBooking.status} - #${updatedBooking._id}`,
        html: emailContent,
      });
    }

    return response.status(200).json({
      message: "Booking status updated successfully",
      data: updatedBooking,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "Internal server error",
      error: true,
      success: false,
    });
  }
}

export async function createBooking(request, response) {
  try {
    const userId = request.userId;
    const { serviceId } = request.params;
    const { scheduledAt, location, notes } = request.body;

    // Validate required fields
    if (!scheduledAt || !location) {
      return response.status(400).json({
        message: "Scheduled date and location are required",
        success: false,
        error: true,
      });
    }

    // Get the service details to find the provider
    const service = await Service.findById(serviceId);
    if (!service) {
      return response.status(404).json({
        message: "Service not found",
        success: false,
        error: true,
      });
    }

    const booking = await Booking.create({
      customer: userId,
      provider: service.provider,
      service: serviceId,
      scheduledAt: new Date(scheduledAt),
      location,
      notes,
      status: "pending",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email")
      .populate("provider", "name email")
      .populate("service", "title price");

    // Send email notification to provider
    const provider = await User.findById(service.provider);
    if (provider && provider.email) {
      const emailContent = bookingNotificationTemplate({
        providerName: provider.name,
        customerName: populatedBooking.customer.name,
        serviceTitle: service.title,
        scheduledAt,
        location,
        notes
      });
      await sendEmail({
        sendTo: provider.email,
        subject: `New Booking Request - #${booking._id}`,
        html: emailContent,
      });
    }

    return response.status(201).json({
      message: "Booking created successfully",
      data: populatedBooking,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "Internal server error",
      error: true,
      success: false,
    });
  }
}
