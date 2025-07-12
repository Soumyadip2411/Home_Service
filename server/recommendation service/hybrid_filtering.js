import { getAdvancedContentBasedRecommendations } from "./content_based_filtering.js";
import { getCollaborativeRecommendations } from "./collaborative_filtering.js";
import { getLocationRecommendations } from "./location_based_filtering.js";
import Booking from "../models/booking.model.js";
import User from '../models/user.model.js';
import Service from '../models/service.model.js';
import Review from '../models/review.model.js';

const weights = {
  collaborative: 0.3,
  content: 0.5,        // Content-based gets highest weight (advanced)
  location: 0.1,
  popularity: 0.1
};

export const getAdvancedHybridRecommendations = async (userId, lat, lng, tagProfile) => {
  try {
    // Get all candidate services with error handling
    const [collab, content, location] = await Promise.allSettled([
      getCollaborativeRecommendations(userId),
      getAdvancedContentBasedRecommendations(tagProfile), // ← Advanced content-based
      getLocationRecommendations(lat, lng)
    ]);

    // Extract results
    const collabResults = collab.status === 'fulfilled' ? collab.value : [];
    const contentResults = content.status === 'fulfilled' ? content.value : [];
    const locationResults = location.status === 'fulfilled' ? location.value : [];

    // Normalize scores
    const maxScores = {
      collab: collabResults.length > 0 ? Math.max(...collabResults.map(c => c.score || 0)) : 1,
      content: contentResults.length > 0 ? Math.max(...contentResults.map(c => c.score || 0)) : 1,
      location: locationResults.length > 0 ? Math.max(...locationResults.map(l => 1 / ((l.distance || 0) + 1))) : 1
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

    // Add content scores (advanced)
    contentResults.forEach(({ service, score, breakdown }) => {
      if (service?._id && score !== undefined && !isNaN(score)) {
        const id = service._id.toString();
        const normalizedScore = score / maxScores.content;
        serviceMap.set(id, {
          ...(serviceMap.get(id) || {}),
          content: normalizedScore,
          contentBreakdown: breakdown // Keep detailed breakdown for debugging
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

    // Calculate final scores with intelligent weighting
    const bookedServices = await Booking.find({ customer: userId }).distinct("service");
    let recommendations = Array.from(serviceMap.entries())
      .map(([id, scores]) => {
        // Handle undefined scores by defaulting to 0
        const collabScore = scores.collab || 0;
        const contentScore = scores.content || 0;
        const locationScore = scores.location || 0;
        
        const score = (collabScore * weights.collaborative) +
                     (contentScore * weights.content) +
                     (locationScore * weights.location);
        
        return {
          _id: id,
          score: score,
          source: 'advanced-hybrid',
          breakdown: scores.contentBreakdown // Include detailed breakdown
        };
      })
      .filter(rec => !bookedServices.includes(rec._id));

    // Add popularity bonuses
    const bestStarred = await Service.aggregate([
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'service', as: 'reviews' } },
      { $addFields: { avgRating: { $avg: '$reviews.rating' }, reviewCount: { $size: '$reviews' } } },
      { $sort: { avgRating: -1 } },
      { $limit: 3 }
    ]);

    const bestReviewed = await Service.aggregate([
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'service', as: 'reviews' } },
      { $addFields: { avgRating: { $avg: '$reviews.rating' }, reviewCount: { $size: '$reviews' } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 3 }
    ]);

    // Get user profile tags for bonus
    const user = await User.findById(userId);
    const userTags = user?.user_tag_profile ? Object.keys(user.user_tag_profile) : [];

    // Add best-starred if not already present
    bestStarred.forEach(s => {
      if (!recommendations.some(r => r._id === s._id.toString())) {
        const tagOverlap = (s.tags || []).some(tag => userTags.includes(tag));
        const bonus = tagOverlap ? 0.15 : 0.05;
        recommendations.push({ 
          _id: s._id.toString(), 
          score: (s.avgRating || 0) * bonus, 
          source: 'best-starred' 
        });
      }
    });

    // Add best-reviewed if not already present
    bestReviewed.forEach(s => {
      if (!recommendations.some(r => r._id === s._id.toString())) {
        const tagOverlap = (s.tags || []).some(tag => userTags.includes(tag));
        const bonus = tagOverlap ? 0.08 : 0.02;
        recommendations.push({ 
          _id: s._id.toString(), 
          score: (s.reviewCount || 0) * bonus, 
          source: 'best-reviewed' 
        });
      }
    });

    // Sort and return
    recommendations = recommendations.sort((a, b) => b.score - a.score);
    
    // If no recommendations or all scores are NaN, fallback to random services
    if (recommendations.length === 0 || recommendations.every(r => isNaN(r.score))) {
      const fallbackServices = await Service.find().limit(10).lean();
      return fallbackServices.map((service, index) => ({
        _id: service._id.toString(),
        score: 1 - (index * 0.1), // Decreasing scores
        source: 'fallback'
      }));
    }
    
    return recommendations;
    
  } catch (error) {
    console.error("Advanced hybrid filtering error:", error);
    return [];
  }
};

// Legacy function for backward compatibility
export const getHybridRecommendations = async (userId, lat, lng) => {
  console.warn("getHybridRecommendations is deprecated. Use getAdvancedHybridRecommendations instead.");
  return getAdvancedHybridRecommendations(userId, lat, lng, {});
};

// Legacy function for backward compatibility
export const getHybridRecommendationsWithQueryBoost = async (userId, lat, lng, tags, query) => {
  console.warn("getHybridRecommendationsWithQueryBoost is deprecated. Use getAdvancedHybridRecommendations instead.");
  return getAdvancedHybridRecommendations(userId, lat, lng, {});
};

// Legacy function for backward compatibility
export const getTagBasedRecommendations = async (tags, lat, lng) => {
  console.warn("getTagBasedRecommendations is deprecated. Use getAdvancedHybridRecommendations instead.");
  return getAdvancedHybridRecommendations(null, lat, lng, {});
};

// Legacy function for backward compatibility
export const getProfileBasedRecommendations = async (userId, lat, lng) => {
  console.warn("getProfileBasedRecommendations is deprecated. Use getAdvancedHybridRecommendations instead.");
  const user = await User.findById(userId);
  const tagProfile = user?.user_tag_profile || {};
  return getAdvancedHybridRecommendations(userId, lat, lng, tagProfile);
};