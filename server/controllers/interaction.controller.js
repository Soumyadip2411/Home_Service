import Interaction from "../models/interaction.model.js";
import User from "../models/user.model.js";
import Service from "../models/service.model.js";

const TAG_DECAY = 0.8;
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

export async function addInteraction(request, response) {
  try {
    const { serviceId } = request.params;
    const { interactionType } = request.body;
    // Validate required fields
    if (!interactionType) {
      return response.status(400).json({
        message: "Interaction type is required",
        error: true,
        success: false
      });
    }

    // Validate interaction type
    const validTypes = ['view', 'booking', 'click'];
    if (!validTypes.includes(interactionType)) {
      return response.status(400).json({
        message: "Invalid interaction type",
        error: true,
        success: false
      });
    }

    // Create new interaction
    const newInteraction = new Interaction({
      user: request.userId,
      service: serviceId,
      interactionType
    });

    console.log(newInteraction);
    // Save to database
    const savedInteraction = await newInteraction.save();

    // --- BOOST LOGIC START ---
    const user = await User.findById(request.userId);
    const service = await Service.findById(serviceId);
    if (user && service) {
      let profile = user.user_tag_profile || {};
      const lastUpdated = user.updatedAt || user.createdAt;
      
      // Apply time-based decay to all existing tags
      const timeDecay = calculateTimeDecay(lastUpdated);
      for (let tag in profile) {
        profile[tag] *= TAG_DECAY * timeDecay;
      }
      
      let serviceBoost = 0, tagBoost = 0;
      if (interactionType === 'booking') {
        serviceBoost = 10;
        tagBoost = 4;
      } else if (interactionType === 'click') {
        serviceBoost = 6;
        tagBoost = 2;
      } else if (interactionType === 'view') {
        serviceBoost = 3;
        tagBoost = 1;
      }
      // Boost tags
      (service.tags || []).forEach(tag => {
        profile[tag] = (profile[tag] || 0) + tagBoost;
      });
      // Boost service itself
      const serviceTag = `service_${serviceId}`;
      profile[serviceTag] = (profile[serviceTag] || 0) + serviceBoost;
      
      // Prune low-weight tags
      profile = pruneTags(profile);
      
      // Keep only top N tags
      profile = keepTopTags(profile);
      
      user.user_tag_profile = profile;
      await user.save();
    }
    // --- BOOST LOGIC END ---

    return response.status(201).json({
      data: savedInteraction,
      message: "Interaction logged successfully",
      success: true
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}