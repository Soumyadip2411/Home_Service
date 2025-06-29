import { getCollaborativeRecommendations } from "./collaborative_filtering.js";
import { getContentRecommendations } from "./content_based_filtering.js";
import { getLocationRecommendations } from "./location_based_filtering.js";
import Booking from "../models/booking.model.js";

const weights = {
  collaborative: 0.4,
  content: 0.3,
  location: 0.2,
  popularity: 0.1
};

export const getHybridRecommendations = async (userId, lat, lng) => {
  try {
    // Get all candidate services with error handling
    const [collab, content, location] = await Promise.allSettled([
      getCollaborativeRecommendations(userId),
      getContentRecommendations(userId),
      getLocationRecommendations(lat, lng)
    ]);

    // Extract results or use empty arrays if failed
    const collabResults = collab.status === 'fulfilled' ? collab.value : [];
    const contentResults = content.status === 'fulfilled' ? content.value : [];
    const locationResults = location.status === 'fulfilled' ? location.value : [];

    // Normalize scores with safety checks
    const maxScores = {
      collab: Math.max(...collabResults.map(c => c.score || 0)) || 1,
      content: Math.max(...contentResults.map(c => c.score || 0)) || 1,
      location: Math.max(...locationResults.map(l => 1 / ((l.distance || 0) + 1))) || 1
    };

    // Create combined scores
    const serviceMap = new Map();

    // Add collaborative scores
    collabResults.forEach(({ _id, score }) => {
      if (_id && score !== undefined) {
        serviceMap.set(_id.toString(), {
          collab: score / maxScores.collab,
          content: 0,
          location: 0
        });
      }
    });

    // Add content scores
    contentResults.forEach(({ service, score }) => {
      if (service?._id && score !== undefined) {
        const id = service._id.toString();
        serviceMap.set(id, {
          ...(serviceMap.get(id) || {}),
          content: score / maxScores.content
        });
      }
    });

    // Add location scores
    locationResults.forEach(({ _id, distance }) => {
      if (_id && distance !== undefined) {
        const id = _id.toString();
        serviceMap.set(id, {
          ...(serviceMap.get(id) || {}),
          location: (1 / (distance + 1)) / maxScores.location
        });
      }
    });

    // Calculate final scores
    const bookedServices = await Booking.find({ customer: userId }).distinct("service");
    const recommendations = Array.from(serviceMap.entries())
      .map(([id, scores]) => ({
        _id: id,
        score: (scores.collab * weights.collaborative) +
               (scores.content * weights.content) +
               (scores.location * weights.location)
      }))
      .filter(rec => !bookedServices.includes(rec._id))
      .sort((a, b) => b.score - a.score);

    return recommendations;
  } catch (error) {
    console.error("Hybrid filtering error:", error);
    return [];
  }
};