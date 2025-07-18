import FaceEncodingModel from "../models/faceEncoding.model.js";
import UserModel from "../models/user.model.js";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
import generatedAccessToken from "../utils/generatedAccessToken.js";
import genertedRefreshToken from "../utils/generatedRefreshToken.js";
import ServiceModel from "../models/service.model.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

// URL of the Python microservice
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL; // Change port if needed

export const registerFace = async (req, res) => {
  try {
    let userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, msg: "No userId provided." });
    }
    if (typeof userId === "string" && userId.length === 24 && /^[a-fA-F0-9]{24}$/.test(userId)) {
      try {
        userId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        console.log("Invalid userId format (ObjectId conversion failed)");
        return res.status(400).json({ success: false, msg: "Invalid userId format." });
      }
    } else {
      console.log("Invalid userId format (not 24 hex chars)");
      return res.status(400).json({ success: false, msg: "Invalid userId format." });
    }
    // Check if user exists
    const user = await UserModel.findById(userId);
    console.log("user found:", user ? user.email : null);
    if (!user) {
      return res.status(400).json({ success: false, msg: "User not found." });
    }
    // Accept multiple files for different face angles
    const files = req.files;
    const MIN_IMAGES = 3;
    if (!files || files.length < MIN_IMAGES) {
      return res.status(400).json({ success: false, msg: `Please upload at least ${MIN_IMAGES} face images (different angles).` });
    }
    // For each image, get encoding from Python service
    const encodings = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("user_id", userId.toString());
      formData.append("file", file.buffer, file.originalname);
      try {
        const response = await axios.post(
          `${PYTHON_SERVICE_URL}/register-face`,
          formData,
          { headers: formData.getHeaders() }
        );
        if (response.data.success && response.data.encoding) {
          encodings.push(response.data.encoding);
        } else {
          return res.status(400).json({ success: false, msg: response.data.msg || `Face not detected in one of the images: ${file.originalname}` });
        }
      } catch (err) {
        // Forward Python error message if available
        if (err.response && err.response.data && err.response.data.msg) {
          return res.status(err.response.status || 500).json({ success: false, msg: err.response.data.msg });
        }
        return res.status(500).json({ success: false, msg: "Server error." });
      }
    }
    // Upsert all encodings for the user
    await FaceEncodingModel.findOneAndUpdate(
      { userId },
      { encodings },
      { upsert: true, new: true }
    );
    await UserModel.findByIdAndUpdate(userId, { faceRegistered: true });
    return res.json({ success: true, msg: "Face encodings registered for multiple angles." });
  } catch (err) {
    console.error("Error in registerFace:", err);
    return res.status(500).json({ success: false, msg: "Server error." });
  }
};



export const searchProviderByFace = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!req.file || !sessionId) {
      return res.status(400).json({ success: false, msg: "Missing image or sessionId." });
    }
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", req.file.buffer, req.file.originalname);

    let response;
    try {
      response = await axios.post(
        `${PYTHON_SERVICE_URL}/verify-frame`,
        formData,
        { headers: formData.getHeaders() }
      );
    } catch (err) {
      if (err.response && err.response.data) {
        // Only forward 400/404 for actual malformed requests
        if (err.response.status === 400 || err.response.status === 404) {
          return res.status(err.response.status).json(err.response.data);
        }
        // For any other error, treat as server error
        return res.status(500).json({ success: false, msg: "Face verification failed." });
      }
      throw err;
    }

    // If no match found, Python returns 200 with success: false
    if (response.data.success && response.data.user_id) {
      // Find user and check if provider
      const user = await UserModel.findById(response.data.user_id);
      if (!user || user.role !== "PROVIDER") {
        return res.status(200).json({ success: false, msg: "No matching provider found." });
      }
      // Find all services by this provider
      const services = await ServiceModel.find({ provider: user._id }).populate("category").populate("provider");
      if (!services.length) {
        return res.status(200).json({ success: false, msg: "Provider found, but no services listed." });
      }
      return res.json({ success: true, providerId: user._id, provider: user, services });
    } else {
      // Always return 200 for "no match found"
      return res.status(200).json({ success: false, msg: "No matching provider found." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error." });
  }
};

export const startFaceVerification = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const allEncodings = await FaceEncodingModel.find({}, { userId: 1, encodings: 1 });
    const encodingsList = allEncodings.map(e => ({
      user_id: e.userId.toString(),
      encodings: e.encodings // array of arrays
    }));
    const encodingsBuffer = Buffer.from(JSON.stringify(encodingsList));
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("encodings", encodingsBuffer, { filename: "encodings.json", contentType: "application/json" });
    await axios.post(`${PYTHON_SERVICE_URL}/start-verify-session`, formData, { headers: formData.getHeaders() });
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error("Error in startFaceVerification:", err);
    res.status(500).json({ success: false, msg: "Failed to start session." });
  }
};

export const verifyFaceFrame = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!req.file || !sessionId) {
      return res.status(400).json({ success: false, msg: "Missing image or sessionId." });
    }
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", req.file.buffer, req.file.originalname);
    const response = await axios.post(`${PYTHON_SERVICE_URL}/verify-frame`, formData, { headers: formData.getHeaders() });
    if (response.data.success && response.data.user_id) {
      // Find user and generate tokens
      const user = await UserModel.findById(response.data.user_id);
      if (!user) {
        return res.status(404).json({ success: false, msg: "User not found." });
      }
      
      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);
      await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() });
      return res.json({
        success: true,
        accesstoken,
        refreshToken,
        user: { ...user.toObject(), password: undefined, refresh_token: undefined }
      });
    } else {
      return res.status(401).json({ success: false, msg: response.data.msg });
    }
  } catch (err) {
    console.error("Error in verifyFaceFrame:", err);
    res.status(500).json({ success: false, msg: "Verification failed." });
  }
};

export const endFaceVerification = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, msg: "Missing sessionId." });
    const formData = new FormData();
    formData.append("session_id", sessionId);
    await axios.post(`${PYTHON_SERVICE_URL}/end-verify-session`, formData, { headers: formData.getHeaders() });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in endFaceVerification:", err);
    res.status(500).json({ success: false, msg: "Failed to end session." });
  }
}; 