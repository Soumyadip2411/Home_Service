import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import { bookingNotificationTemplate, updateBookingStatusTemplate } from "../utils/emailTemplate.js";
import sendEmail from "../config/sendEmail.js";
import Service from "../models/service.model.js";
import Review from "../models/review.model.js";
import { createChatRoom, deactivateChatRoom } from "./chatRoom.controller.js";
import Notification from '../models/notification.model.js';

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
      .populate('service', 'title price duration _id') // Make sure _id is included
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
      .populate('service', 'title price duration')
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

    // Notification logic for all statuses
    const statusMessages = {
      confirmed: `Your booking #${updatedBooking._id} has been confirmed!`,
      completed: `Your booking #${updatedBooking._id} has been completed. Thank you for using our service!`,
      cancelled: `Your booking #${updatedBooking._id} has been cancelled.`
    };
    if (statusMessages[updatedBooking.status]) {
      // Notify customer only
      await Notification.create({
        user: updatedBooking.customer,
        type: 'booking',
        message: statusMessages[updatedBooking.status],
        link: `/bookings`,
        booking: updatedBooking._id
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
    const { serviceId, date, time, instructions, phone } = request.body;

    // Validate required fields
    if (!date || !time) {
      return response.status(400).json({
        message: "Date and time are required",
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

    // Check for booking conflicts
    const bookingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    // Check if the booking is in the past
    if (bookingDateTime <= now) {
      return response.status(400).json({
        message: "Cannot book a time in the past",
        success: false,
        error: true,
      });
    }

    // Check for existing bookings with relaxation time
    const relaxationTime = 30; // minutes
    const bookingStartTime = new Date(bookingDateTime);
    const bookingEndTime = new Date(bookingDateTime);
    bookingEndTime.setHours(bookingEndTime.getHours() + service.duration); // Use service duration

    const slotStartWithRelaxation = new Date(bookingStartTime);
    slotStartWithRelaxation.setMinutes(slotStartWithRelaxation.getMinutes() - relaxationTime);
    
    const slotEndWithRelaxation = new Date(bookingEndTime);
    slotEndWithRelaxation.setMinutes(slotEndWithRelaxation.getMinutes() + relaxationTime);

    // Check for conflicts with existing bookings using a simpler approach
    const existingBookings = await Booking.find({
      service: serviceId,
      date: date,
      status: { $in: ['confirmed', 'pending'] }
    });

    // Check for time conflicts manually
    let hasConflict = false;
    for (const booking of existingBookings) {
      const existingBookingTime = new Date(`${booking.date}T${booking.time}`);
      const existingBookingEndTime = new Date(existingBookingTime);
      existingBookingEndTime.setHours(existingBookingEndTime.getHours() + service.duration); // Use service duration

      // Check if there's any overlap with relaxation time
      if (
        (slotStartWithRelaxation < existingBookingEndTime && slotEndWithRelaxation > existingBookingTime) ||
        (existingBookingTime < slotEndWithRelaxation && existingBookingEndTime > slotStartWithRelaxation)
      ) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      return response.status(409).json({
        message: "This time slot is no longer available. Please select another time.",
        success: false,
        error: true,
      });
    }

    // Create the booking
    const bookingData = {
      customer: userId,
      provider: service.provider,
      service: serviceId,
      date: date,
      time: time,
      instructions: instructions || "",
      phone: phone || "",
      status: "pending",
    };

    const booking = await Booking.create(bookingData);

    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer", "name email")
      .populate("provider", "name email")
      .populate("service", "title price duration");

    // Send email notification to provider
    const provider = await User.findById(service.provider);
    if (provider && provider.email) {
      const emailContent = bookingNotificationTemplate({
        providerName: provider.name,
        customerName: populatedBooking.customer.name,
        serviceTitle: service.title,
        scheduledAt: `${date}T${time}`,
        duration: service.duration,
        location: request.body.location || "",
        pincode: request.body.pincode || "",
        notes: instructions || "No special instructions"
      });
      await sendEmail({
        sendTo: provider.email,
        subject: `New Booking Request - #${booking._id}`,
        html: emailContent,
      });
    }

    // Notification logic for new booking
    await Notification.create({
      user: service.provider,
      type: 'booking',
      message: `New booking request #${booking._id} received. Please confirm or reject.`,
      link: `/bookings`,
      booking: booking._id
    });

    return response.status(201).json({
      message: "Booking created successfully",
      data: populatedBooking,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error('Error in createBooking:', error);
    return response.status(500).json({
      message: "Internal server error",
      error: true,
      success: false,
    });
  }
}

export const getCustomerNameByBookingId = async (request, response) => {
  try {
    const { bookingId } = request.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email');
    
    if (!booking) {
      return response.status(404).json({
        message: "Booking not found",
        success: false,
        error: true,
      });
    }

    return response.json({
      message: "Customer name fetched successfully",
      data: {
        name: booking.customer.name,
        email: booking.customer.email
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error in getCustomerNameByBookingId:", error);
    return response.status(500).json({
      message: "Failed to fetch customer name",
      error: true,
      success: false,
    });
  }
};

export const getProviderNameByBookingId = async (request, response) => {
  try {
    const { bookingId } = request.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('provider', 'name email');
    
    if (!booking) {
      return response.status(404).json({
        message: "Booking not found",
        success: false,
        error: true,
      });
    }

    return response.json({
      message: "Provider name fetched successfully",
      data: {
        name: booking.provider.name,
        email: booking.provider.email
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error in getProviderNameByBookingId:", error);
    return response.status(500).json({
      message: "Failed to fetch provider name",
      error: true,
      success: false,
    });
  }
};

export const getCustomerDetailsByBookingId = async (request, response) => {
  try {
    const { bookingId } = request.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email avatar');
    
    if (!booking) {
      return response.status(404).json({
        message: "Booking not found",
        success: false,
        error: true,
      });
    }

    return response.json({
      message: "Customer details fetched successfully",
      data: {
        name: booking.customer.name,
        email: booking.customer.email,
        avatar: booking.customer.avatar || ''
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error in getCustomerDetailsByBookingId:", error);
    return response.status(500).json({
      message: "Failed to fetch customer details",
      error: true,
      success: false,
    });
  }
};

export const getProviderDetailsByBookingId = async (request, response) => {
  try {
    const { bookingId } = request.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('provider', 'name email avatar');
    
    if (!booking) {
      return response.status(404).json({
        message: "Booking not found",
        success: false,
        error: true,
      });
    }

    return response.json({
      message: "Provider details fetched successfully",
      data: {
        name: booking.provider.name,
        email: booking.provider.email,
        avatar: booking.provider.avatar || ''
      },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error in getProviderDetailsByBookingId:", error);
    return response.status(500).json({
      message: "Failed to fetch provider details",
      error: true,
      success: false,
    });
  }
};

export const getBookingById = async (request, response) => {
  try {
    const userId = request.userId;
    const { bookingId } = request.params;
    
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'title price duration _id');
    
    if (!booking) {
      return response.status(404).json({
        message: "Booking not found",
        success: false,
        error: true,
      });
    }

    // Check if the user has access to this booking
    if (booking.customer._id.toString() !== userId && booking.provider._id.toString() !== userId) {
      return response.status(403).json({
        message: "You don't have permission to access this booking",
        success: false,
        error: true,
      });
    }

    // Check for existing review
    const review = await Review.findOne({
      service: booking.service._id,
      user: userId
    });
    
    const bookingWithReviewStatus = {
      ...booking.toObject(),
      hasReview: !!review
    };

    return response.json({
      message: "Booking fetched successfully",
      data: bookingWithReviewStatus,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error in getBookingById:", error);
    return response.status(500).json({
      message: "Failed to fetch booking",
      error: true,
      success: false,
    });
  }
};
