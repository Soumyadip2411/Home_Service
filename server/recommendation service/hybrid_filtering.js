import { getCollaborativeRecommendations } from "./collaborative_filtering.js";
import { getContentRecommendations } from "./content_based_filtering.js";
import { getLocationRecommendations } from "./location_based_filtering.js";
import Booking from "../models/booking.model.js";
import User from '../models/user.model.js';
import Service from '../models/service.model.js';
import Review from '../models/review.model.js';

const weights = {
  collaborative: 0.3,
  content: 0.4,
  location: 0.1,
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
    let recommendations = Array.from(serviceMap.entries())
      .map(([id, scores]) => ({
        _id: id,
        score: (scores.collab * weights.collaborative) +
               (scores.content * weights.content) +
               (scores.location * weights.location),
        source: 'hybrid'
      }))
      .filter(rec => !bookedServices.includes(rec._id));
    // --- Always include some collaborative-only results (low score) ---
    const collabOnly = collabResults
      .filter(c => !recommendations.some(r => r._id === c._id.toString()))
      .slice(0, 3)
      .map(c => ({ _id: c._id.toString(), score: ((c.score || 0) / maxScores.collab) * 0.1, source: 'collaborative' })); // much lower weight
    recommendations = recommendations.concat(collabOnly);
    // --- Add best-starred and best-reviewed services ---
    // Best-starred: highest average rating
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
        // Bonus if tags overlap
        const tagOverlap = (s.tags || []).some(tag => userTags.includes(tag));
        const bonus = tagOverlap ? 0.15 : 0.05;
        recommendations.push({ _id: s._id.toString(), score: (s.avgRating || 0) * bonus, source: 'best-starred' });
      }
    });
    // Add best-reviewed if not already present
    bestReviewed.forEach(s => {
      if (!recommendations.some(r => r._id === s._id.toString())) {
        // Bonus if tags overlap
        const tagOverlap = (s.tags || []).some(tag => userTags.includes(tag));
        const bonus = tagOverlap ? 0.08 : 0.02;
        recommendations.push({ _id: s._id.toString(), score: (s.reviewCount || 0) * bonus, source: 'best-reviewed' });
      }
    });
    // Sort and return
    recommendations = recommendations.sort((a, b) => b.score - a.score);
    return recommendations;
  } catch (error) {
    console.error("Hybrid filtering error:", error);
    return [];
  }
};

export const getHybridRecommendationsWithQueryBoost = async (userId, lat, lng, tags, query) => {
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
    // Calculate final scores with query/tag boost
    const bookedServices = await (await import('../models/booking.model.js')).default.find({ customer: userId }).distinct("service");
    const Service = (await import('../models/service.model.js')).default;
    const allServices = await Service.find().populate('category');
    const recommendations = Array.from(serviceMap.entries())
      .map(([id, scores]) => {
        // Find the service
        const service = allServices.find(s => s._id.toString() === id);
        let boost = 1;
        if (service) {
          // Check for tag or query match in title or tags
          const serviceTags = (service.tags || []).map(t => t.toLowerCase());
          const serviceTitle = (service.title || '').toLowerCase();
          const hasTagMatch = tags.some(tag => serviceTags.includes(tag.toLowerCase()));
          const hasQueryMatch = query && serviceTitle.includes(query.toLowerCase());
          if (hasTagMatch || hasQueryMatch) {
            boost = 5; // 5x boost
          }
        }
        return {
          _id: id,
          score: ((scores.collab || 0) * weights.collaborative + (scores.content || 0) * weights.content + (scores.location || 0) * weights.location) * boost
        };
      })
      .filter(rec => !bookedServices.includes(rec._id))
      .sort((a, b) => b.score - a.score);
    return recommendations;
  } catch (error) {
    console.error("Hybrid filtering with query boost error:", error);
    return [];
  }
};

export const getTagBasedRecommendations = async (tags, lat, lng) => {
  try {
    const Service = (await import('../models/service.model.js')).default;
    const allServices = await Service.find().populate('category');
    // Score: tag match count (normalized), plus location
    const locationResults = await getLocationRecommendations(lat, lng);
    const locationMap = new Map();
    locationResults.forEach(({ _id, distance }) => {
      locationMap.set(_id.toString(), 1 / (distance + 1));
    });
    const recommendations = allServices.map(service => {
      const serviceTags = (service.tags || []).map(t => t.toLowerCase());
      // Count how many tags match
      const matchCount = tags.filter(tag => serviceTags.includes(tag.toLowerCase())).length;
      const tagScore = tags.length > 0 ? matchCount / tags.length : 0;
      const locationScore = locationMap.get(service._id.toString()) || 0;
      return {
        _id: service._id.toString(),
        score: tagScore * 0.8 + locationScore * 0.2
      };
    }).sort((a, b) => b.score - a.score);
    return recommendations;
  } catch (error) {
    console.error("Tag-based recommendation error:", error);
    return [];
  }
};

export const getProfileBasedRecommendations = async (userId, lat, lng) => {
  try {
    const Service = (await import('../models/service.model.js')).default;
    const allServices = await Service.find().populate('category');
    const user = await User.findById(userId);
    const profile = user?.user_tag_profile || {};
    const locationResults = await getLocationRecommendations(lat, lng);
    const locationMap = new Map();
    locationResults.forEach(({ _id, distance }) => {
      locationMap.set(_id.toString(), 1 / (distance + 1));
    });
    const recommendations = allServices.map(service => {
      const serviceTags = (service.tags || []).map(t => t.toLowerCase());
      // Sum weights for matching tags
      const tagScore = serviceTags.reduce((sum, tag) => sum + (profile[tag] || 0), 0);
      const locationScore = locationMap.get(service._id.toString()) || 0;
      return {
        _id: service._id.toString(),
        score: tagScore * 0.9 + locationScore * 0.1
      };
    }).sort((a, b) => b.score - a.score);
    return recommendations;
  } catch (error) {
    console.error("Profile-based recommendation error:", error);
    return [];
  }
};