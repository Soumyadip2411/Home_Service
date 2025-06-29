import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    interactionType: {
      type: String,
      enum: ['view', 'booking', 'click'],
      required: true
    },
  },{
    timestamps: true,
  });

  const InteractionModel = mongoose.model("Interaction", interactionSchema);
  
  export default InteractionModel;