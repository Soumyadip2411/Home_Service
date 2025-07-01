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
    console.log(req.userId);
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

    // Add search filter if search query is provided
    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      pipeline.unshift({
        $match: {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } },
            { "category.name": searchRegex }
          ]
        }
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { avgRating: -1, createdAt: -1 },
    });

    const services = await Service.aggregate(pipeline);

    // If search is provided, also use AI-powered tag search for better results
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
