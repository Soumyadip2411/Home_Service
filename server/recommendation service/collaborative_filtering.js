import Interaction from "../models/interaction.model.js";

const interactionWeights = { view: 0.3, click: 0.6, booking: 1.0 };

export const getCollaborativeRecommendations = async (userId) => {
  try {
    // Check if user has any interactions
    const userInteractions = await Interaction.find({ user: userId });
    if (userInteractions.length === 0) {
      return [];
    }

    const similarUsers = await Interaction.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: "interactions",
          let: { userServices: "$service" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$service", "$$userServices"] },
                user: { $ne: userId }
              }
            },
            {
              $group: {
                _id: "$user",
                similarity: { $sum: { $multiply: [interactionWeights["$interactionType"], 1] } }
              }
            }
          ],
          as: "similarUsers"
        }
      },
      { $unwind: "$similarUsers" },
      { $sort: { "similarUsers.similarity": -1 } },
      { $limit: 5 }
    ]);

    if (similarUsers.length === 0) {
      return [];
    }

    // Get services from similar users
    return Interaction.aggregate([
      { $match: { user: { $in: similarUsers.map(u => u._id) } } },
      {
        $group: {
          _id: "$service",
          score: { $sum: interactionWeights["$interactionType"] }
        }
      },
      { $sort: { score: -1 } }
    ]);
  } catch (error) {
    console.error("Collaborative filtering error:", error);
    return [];
  }
};

// Real-time collaborative score for a service
export function getCollaborativeScore(profile, service) {
  // Simple heuristic: if the service's tags overlap with the user's top tags, boost score
  if (!service.tags || !Array.isArray(service.tags)) return 0;
  const userTags = Object.keys(profile).map(t => t.toLowerCase());
  const serviceTags = service.tags.map(t => t.toLowerCase());
  let overlap = 0;
  for (let tag of userTags) {
    for (let sTag of serviceTags) {
      if (sTag.includes(tag) || tag.includes(sTag)) {
        overlap += 1;
      }
    }
  }
  // Normalize by number of tags
  return overlap / (serviceTags.length || 1);
}