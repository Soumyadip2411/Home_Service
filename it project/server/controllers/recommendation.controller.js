import { getHybridRecommendations } from "../recommendation service/hybrid_filtering.js";
import Service from "../models/service.model.js";

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const { lat, lng, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required"
      });
    }

    // Get hybrid recommendations
    const recommendations = await getHybridRecommendations(userId, lat, lng);

    // If no recommendations from hybrid filtering, fallback to location-based
    let finalRecommendations = recommendations;
    if (!recommendations || recommendations.length === 0) {
      console.log("No hybrid recommendations, falling back to location-based");
      const { getLocationRecommendations } = await import("../recommendation service/location_based_filtering.js");
      const locationRecs = await getLocationRecommendations(lat, lng);
      finalRecommendations = locationRecs.map(rec => ({
        _id: rec._id,
        score: 1 / (rec.distance + 1) // Convert distance to score
      }));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = finalRecommendations.slice(startIndex, endIndex);

    // Get full service details
    const serviceIds = paginated.map(rec => rec._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate("category provider")
      .lean();

    // Map services with their scores
    const servicesWithScores = services.map(service => ({
      ...service,
      score: finalRecommendations.find(r => r._id === service._id.toString())?.score || 0
    }));

    res.json({
      success: true,
      data: servicesWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: finalRecommendations.length,
        totalPages: Math.ceil(finalRecommendations.length / limit)
      }
    });

  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations"
    });
  }
};