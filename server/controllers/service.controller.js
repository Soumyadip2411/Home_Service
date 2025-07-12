import Service from "../models/service.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import { generateTags, batchUpdateTags, searchServicesByTags } from "../utils/tagGenerator.js";

export const addService = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      category,
      latitude,
      longitude,
    } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Fetch category object for better tag generation
    const categoryObj = await Service.db.model('Category').findById(category);
    const tags = generateTags(title, description, categoryObj);

    const service = new Service({
      title,
      description,
      price,
      duration,
      category,
      provider: req.userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      tags,
    });

    await service.save();
    res.status(201).json({ 
      success: true,
      message: "Service added", 
      service 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "service",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $lookup: {
          from: "users",
          localField: "provider",
          foreignField: "_id",
          as: "provider",
        },
      },
      {
        $unwind: "$provider",
      },
    ];

    // Enhanced search filter if search query is provided
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(searchTerm, 'i');
      const prefixRegex = new RegExp(`^${searchTerm}`, 'i'); // For prefix matching
      
      pipeline.unshift({
        $match: {
          $or: [
            // Title and description matches
            { title: searchRegex },
            { description: searchRegex },
            
            // Category name matches
            { "category.name": searchRegex },
            
            // Provider name matches (including prefix)
            { "provider.name": searchRegex },
            
            // Tag matches (exact and prefix)
            { 
              tags: { 
                $elemMatch: { 
                  $regex: searchTerm, 
                  $options: 'i' 
                } 
              } 
            },
            
            // Tag prefix matches
            { 
              tags: { 
                $elemMatch: { 
                  $regex: `^${searchTerm}`, 
                  $options: 'i' 
                } 
              } 
            },
            
            // Provider name prefix matches
            { "provider.name": prefixRegex },
            
            // Category name prefix matches
            { "category.name": prefixRegex }
          ]
        }
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { avgRating: -1, createdAt: -1 },
    });

    const services = await Service.aggregate(pipeline);

    // Enhanced AI-powered tag search for better results
    if (search && search.trim().length > 0) {
      try {
        const aiFiltered = searchServicesByTags(search, services);
        return res.status(200).json(aiFiltered);
      } catch (error) {
        console.error('AI search error:', error);
        // Fallback to regular search results
        return res.status(200).json(services);
      }
    }

    res.status(200).json(services);
  } catch (err) {
    console.error('getAllServices error:', err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProviderServices = async (req, res) => {
  try {
    const providerId = req.userId; // assuming your auth middleware attaches `user`

    const services = await Service.find({ provider: providerId }).populate(
      "category"
    );

    res.json({
      success: true,
      message: "Provider's services fetched successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching provider services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch provider services",
    });
  }
};

export const getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId)
      .populate('provider', 'name avatar')
      .populate('category', 'name')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })
      .lean();  // Convert to plain JavaScript object
    service.reviews = service.reviews.filter(r => r.user !== null);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Calculate average rating
    const avgRating = service.reviews?.length > 0
      ? service.reviews.reduce((acc, review) => acc + review.rating, 0) / service.reviews.length
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...service,
        avgRating
      }
    });
  } catch (error) {
    console.error('Service details error:', error); // Add this for debugging
    res.status(500).json({
      success: false,
      message: "Error fetching service details",
      error: error.message
    });
  }
};

// Admin endpoint to batch update tags for all services
export const batchUpdateServiceTags = async (req, res) => {
  try {
    // Optionally, check if user is admin here
    // if (req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    const updatedCount = await batchUpdateTags(Service);
    res.json({ message: `Updated tags for ${updatedCount} services` });
  } catch (error) {
    console.error('Batch tag update error:', error);
    res.status(500).json({ message: 'Failed to update tags' });
  }
};

export const getServiceAvailability = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }

    // Get the service to check its duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing bookings for this service on the selected date
    const existingBookings = await Booking.find({
      service: serviceId,
      date: date,
      status: { $in: ['confirmed', 'pending'] } // Only consider active bookings
    });

    // Define working hours (8 AM to 6 PM)
    const workingHours = {
      start: 8,
      end: 18
    };

    // Generate time slots with 1-hour intervals
    const timeSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if this time slot is available
      const slotStartTime = new Date(selectedDate);
      slotStartTime.setHours(hour, 0, 0, 0);
      
      const slotEndTime = new Date(selectedDate);
      slotEndTime.setHours(hour + service.duration, 0, 0, 0); // Use service duration
      
      // Add relaxation time (30 minutes before and after)
      const relaxationTime = 30; // minutes
      const slotStartWithRelaxation = new Date(slotStartTime);
      slotStartWithRelaxation.setMinutes(slotStartWithRelaxation.getMinutes() - relaxationTime);
      
      const slotEndWithRelaxation = new Date(slotEndTime);
      slotEndWithRelaxation.setMinutes(slotEndWithRelaxation.getMinutes() + relaxationTime);

      // Check if the slot would extend beyond working hours
      const slotEndHour = hour + service.duration;
      if (slotEndHour > workingHours.end) {
        timeSlots.push({
          time: timeString,
          available: false,
          booked: true,
          conflictReason: "Extends beyond working hours"
        });
        continue;
      }

      // Check for conflicts with existing bookings
      let isAvailable = true;
      let conflictReason = null;

      for (const booking of existingBookings) {
        const bookingStartTime = new Date(`${booking.date}T${booking.time}`);
        const bookingEndTime = new Date(bookingStartTime);
        bookingEndTime.setHours(bookingStartTime.getHours() + service.duration); // Use service duration

        // Check if there's any overlap
        if (
          (slotStartWithRelaxation < bookingEndTime && slotEndWithRelaxation > bookingStartTime) ||
          (bookingStartTime < slotEndWithRelaxation && bookingEndTime > slotStartWithRelaxation)
        ) {
          isAvailable = false;
          conflictReason = `Booked at ${booking.time}`;
          break;
        }
      }

      // Check if the time slot is in the past
      const now = new Date();
      if (slotStartTime <= now) {
        isAvailable = false;
        conflictReason = "Past time";
      }

      timeSlots.push({
        time: timeString,
        available: isAvailable,
        booked: !isAvailable,
        conflictReason: conflictReason
      });
    }

    res.status(200).json({
      success: true,
      availableSlots: timeSlots,
      serviceDuration: service.duration,
      workingHours: {
        start: workingHours.start,
        end: workingHours.end
      }
    });

  } catch (error) {
    console.error('Service availability error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching service availability",
      error: error.message
    });
  }
};
