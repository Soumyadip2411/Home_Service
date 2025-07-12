import { getAdvancedHybridRecommendations } from "../recommendation service/hybrid_filtering.js";
import Service from "../models/service.model.js";
import { generateTags } from "../utils/tagGenerator.js";
import User from '../models/user.model.js';
import natural from 'natural';

const TAG_DECAY = 0.8;
const TAG_BOOSTS = { bot: 2.5, content: 1.8, collab: 0.4 };
const TAG_THRESHOLD = 0.01; // Remove tags below this weight
const TIME_DECAY_FACTOR = 0.95; // Daily decay factor
const MAX_TAGS_PER_USER = 50; // Maximum tags to keep per user

// Helper function to calculate time-based decay
const calculateTimeDecay = (lastUpdated) => {
  const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(TIME_DECAY_FACTOR, daysSinceUpdate);
};

// Helper function to prune low-weight tags
const pruneTags = (profile) => {
  const pruned = {};
  Object.entries(profile).forEach(([tag, weight]) => {
    if (weight >= TAG_THRESHOLD) {
      pruned[tag] = weight;
    }
  });
  return pruned;
};

// Helper function to keep only top N tags
const keepTopTags = (profile, maxTags = MAX_TAGS_PER_USER) => {
  const sorted = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const topTags = {};
  sorted.slice(0, maxTags).forEach(([tag, weight]) => {
    topTags[tag] = weight;
  });
  return topTags;
};

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

    // Get user's tag profile from database (fallback)
    const user = await User.findById(userId);
    const tagProfile = user?.user_tag_profile || {};

    // Use advanced hybrid recommendations with database profile
    const recommendations = await getAdvancedHybridRecommendations(userId, lat, lng, tagProfile);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = recommendations.slice(startIndex, endIndex);

    // Get full service details
    const serviceIds = paginated.map(rec => rec._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate("category provider")
      .lean();

    // Map services with their scores
    const servicesWithScores = services.map(service => ({
      ...service,
      score: paginated.find(r => r._id === service._id.toString())?.score || 0,
      breakdown: paginated.find(r => r._id === service._id.toString())?.breakdown || null
    }));

    res.json({
      success: true,
      data: servicesWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: recommendations.length,
        totalPages: Math.ceil(recommendations.length / limit)
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

export const getQueryRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const { query, lat, lng, page = 1, limit = 10 } = req.body;
    if (!query || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Query, lat, and lng are required" });
    }

    // Get user's tag profile from database (fallback)
    const user = await User.findById(userId);
    const tagProfile = user?.user_tag_profile || {};

    // Use advanced hybrid recommendations
    const recommendations = await getAdvancedHybridRecommendations(userId, lat, lng, tagProfile);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = recommendations.slice(startIndex, endIndex);

    // Get full service details
    const serviceIds = paginated.map(rec => rec._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate("category provider")
      .lean();

    // Map services with their scores
    const servicesWithScores = services.map(service => ({
      ...service,
      score: paginated.find(r => r._id === service._id.toString())?.score || 0,
      breakdown: paginated.find(r => r._id === service._id.toString())?.breakdown || null
    }));

    res.json({
      success: true,
      data: servicesWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: recommendations.length,
        totalPages: Math.ceil(recommendations.length / limit)
      }
    });
  } catch (error) {
    console.error("Query Recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate query recommendations" });
  }
};

export const getTagRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const { tags, lat, lng, page = 1, limit = 10 } = req.body;
    if (!tags || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Tags, lat, and lng are required" });
    }

    // Get user's tag profile from database (fallback)
    const user = await User.findById(userId);
    const tagProfile = user?.user_tag_profile || {};

    // Use advanced hybrid recommendations
    const recommendations = await getAdvancedHybridRecommendations(userId, lat, lng, tagProfile);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = recommendations.slice(startIndex, endIndex);

    // Get full service details
    const serviceIds = paginated.map(rec => rec._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate("category provider")
      .lean();

    // Map services with their scores
    const servicesWithScores = services.map(service => ({
      ...service,
      score: paginated.find(r => r._id === service._id.toString())?.score || 0,
      breakdown: paginated.find(r => r._id === service._id.toString())?.breakdown || null
    }));

    res.json({
      success: true,
      data: servicesWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: recommendations.length,
        totalPages: Math.ceil(recommendations.length / limit)
      }
    });
  } catch (error) {
    console.error("Tag Recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate tag recommendations" });
  }
};

export const extractTagsFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ tags: [] });
    // Use the advanced generateTags function for extraction
    // We'll treat the text as both title and description for best coverage
    const tags = generateTags(text, text, { name: "" });
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ tags: [] });
  }
};

export const updateUserTagProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { newTags, source } = req.body;
    if (!Array.isArray(newTags) || !source) return res.status(400).json({ success: false });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false });
    let profile = user.user_tag_profile || {};
    const lastUpdated = user.updatedAt || user.createdAt;
    
    // Apply time-based decay to all existing tags
    const timeDecay = calculateTimeDecay(lastUpdated);
    for (let tag in profile) {
      profile[tag] *= TAG_DECAY * timeDecay;
    }
    
    // Add/increase new tags
    for (let tag of newTags) {
      if (profile[tag] === undefined) {
        // New tag: give a higher initial boost
        profile[tag] = (TAG_BOOSTS[source] || 0.2) * 2;
      } else {
        // Existing tag: boost as usual
        profile[tag] += (TAG_BOOSTS[source] || 0.2);
      }
    }
    
    // Prune low-weight tags
    profile = pruneTags(profile);
    
    // Keep only top N tags
    profile = keepTopTags(profile);
    
    user.user_tag_profile = profile;
    await user.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const getUserTagProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ profile: {} });
    res.json({ profile: user.user_tag_profile || {} });
  } catch (error) {
    res.status(500).json({ profile: {} });
  }
};

export const replaceUserTagProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { profile } = req.body; // { tag: weight, ... }
    if (!profile || typeof profile !== 'object') return res.status(400).json({ success: false });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false });
    user.user_tag_profile = profile;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// POST /api/recommendations/profile-tags - MAIN ENDPOINT FOR REAL-TIME RECOMMENDATIONS
export const getProfileTagsHybridRecommendations = async (req, res) => {
  try {
    const { profile, lat, lng, page = 1, limit = 10 } = req.body;
    if (!profile || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Profile, lat, and lng are required" });
    }

    // Use the frontend tag profile (real-time) for recommendations
    // This ensures we use the most up-to-date user preferences
    const recommendations = await getAdvancedHybridRecommendations(
      req.userId, 
      lat, 
      lng, 
      profile  // ← Frontend tag profile (real-time)
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = recommendations.slice(startIndex, endIndex);

    // Get full service details
    const serviceIds = paginated.map(rec => rec._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate("category provider")
      .lean();

    // Map services with their scores and breakdowns
    const servicesWithScores = services.map(service => {
      const rec = paginated.find(r => r._id === service._id.toString());
      return {
        ...service,
        score: rec?.score || 0,
        contentBreakdown: rec?.breakdown || null // Include for debugging
      };
    });

    res.json({
      success: true,
      data: servicesWithScores,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: recommendations.length,
        totalPages: Math.ceil(recommendations.length / limit)
      }
    });
  } catch (error) {
    console.error("Advanced hybrid recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate recommendations" });
  }
};