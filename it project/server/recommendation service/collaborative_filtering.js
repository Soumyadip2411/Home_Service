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