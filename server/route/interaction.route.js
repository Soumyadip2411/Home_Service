import express from "express";
import { addInteraction } from "../controllers/interaction.controller.js";
import auth from "../middleware/auth.js";

const interactionRouter = express.Router();

// Regular service interactions
interactionRouter.post("/:serviceId", auth, addInteraction);

// Bot chat interactions (no serviceId required)
interactionRouter.post("/bot-chat", auth, async (req, res) => {
  try {
    const { interactionType, tags, botTagProfile } = req.body;
    
    // Validate required fields
    if (!interactionType || interactionType !== 'bot_chat') {
      return res.status(400).json({
        message: "Invalid interaction type for bot chat",
        error: true,
        success: false
      });
    }

    // Create a virtual interaction for bot chat
    const virtualInteraction = {
      user: req.userId,
      service: null, // No specific service for bot chat
      interactionType: 'bot_chat'
    };

    // Call the interaction controller with virtual serviceId
    req.params = { serviceId: 'bot-chat' };
    req.body = { interactionType: 'bot_chat', tags, botTagProfile };
    
    return await addInteraction(req, res);
    
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
});

export default interactionRouter;
