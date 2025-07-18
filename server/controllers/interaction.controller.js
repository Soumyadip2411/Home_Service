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

// Helper function to calculate recency boost (decays by half each day)
const getRecencyFactor = (date) => {
  const daysAgo = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, daysAgo); // Halve boost for each day old
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
    const validTypes = ['view', 'booking', 'click', 'bot_chat'];
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
      service: serviceId === 'bot-chat' ? null : serviceId, // Handle bot-chat case
      interactionType
    });

    
    // Save to database
    const savedInteraction = await newInteraction.save();

    // --- BOOST LOGIC START ---
    const user = await User.findById(request.userId);

    const service = serviceId === 'bot-chat' ? null : await Service.findById(serviceId);
    if (user) {
      let profile = user.user_tag_profile || {};
      const lastUpdated = user.updatedAt || user.createdAt;
      
      // Apply time-based decay to all existing tags
      const timeDecay = calculateTimeDecay(lastUpdated);
      for (let tag in profile) {
        profile[tag] *= TAG_DECAY * timeDecay;
      }
      
      // Handle different interaction types
      const now = new Date();
      let serviceBoost = 0, tagBoost = 0;
      
      if (interactionType === 'bot_chat') {
        // Handle bot chat interaction - use tags from request body
        const { tags, botTagProfile } = request.body;
        
        if (tags && Array.isArray(tags)) {
          const botTagBoost = 0.75; // Better than view (0.3), worse than booking (1.0)
          tags.forEach(tag => {
            if (profile[tag] !== undefined) {
              // Existing tag: give 70% of normal boost
              profile[tag] += (botTagBoost * 0.7);
            } else {
              // New tag: give full boost
              profile[tag] = botTagBoost;
            }
          });
        }
        // Also update with the complete bot tag profile if provided
        if (botTagProfile && typeof botTagProfile === 'object') {
          for (let tag in botTagProfile) {
            profile[tag] = botTagProfile[tag];
          }
        }
        
      
      } else if (service) {
        // Handle regular service interactions
      if (interactionType === 'booking') {
        serviceBoost = 0.8;
        tagBoost = 1;
      } else if (interactionType === 'click') {
        serviceBoost = 0.5;
        tagBoost = 0.4;
      } else if (interactionType === 'view') {
        serviceBoost = 0.1;
        tagBoost = 0.2;
      }
        
        // Apply recency factor
      const recencyFactor = getRecencyFactor(now);
      serviceBoost *= recencyFactor;
      tagBoost *= recencyFactor;
        
        // Boost service tags with reduced boost for existing tags
      (service.tags || []).forEach(tag => {
        if (profile[tag] !== undefined) {
          // Existing tag: give 70% of normal boost
          profile[tag] += (tagBoost * 0.7);
        } else {
          // New tag: give full boost
          profile[tag] = tagBoost;
        }
      });
        
      // Boost service itself with reduced boost for existing service tag
      const serviceTag = `service_${serviceId}`;
      if (profile[serviceTag] !== undefined) {
        // Existing service tag: give 70% of normal boost
        profile[serviceTag] += (serviceBoost * 0.7);
      } else {
        // New service tag: give full boost
        profile[serviceTag] = serviceBoost;
      }
      }
      
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