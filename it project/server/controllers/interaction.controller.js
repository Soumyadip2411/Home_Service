import Interaction from "../models/interaction.model.js";
import User from "../models/user.model.js";

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