import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false }, // Made optional for bot_chat
    interactionType: {
      type: String,
      enum: ['view', 'booking', 'click', 'bot_chat'], // Added bot_chat
      required: true
    },
  },{
    timestamps: true,
  });

  const InteractionModel = mongoose.model("Interaction", interactionSchema);
  
  export default InteractionModel;