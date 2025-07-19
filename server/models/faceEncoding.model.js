import mongoose from "mongoose";

const faceEncodingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    encodings: {
      type: [[Number]], // Array of arrays of floats
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const FaceEncodingModel = mongoose.model("FaceEncoding", faceEncodingSchema);

export default FaceEncodingModel; 