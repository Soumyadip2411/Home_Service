import mongoose from "mongoose";

const faceEncodingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    encoding: {
      type: [Number], // Array of floats
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FaceEncodingModel = mongoose.model("FaceEncoding", faceEncodingSchema);

export default FaceEncodingModel; 