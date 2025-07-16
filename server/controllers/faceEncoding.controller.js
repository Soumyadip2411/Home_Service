import FaceEncodingModel from "../models/faceEncoding.model.js";
import UserModel from "../models/user.model.js";
import axios from "axios";
import FormData from "form-data";
import mongoose from "mongoose";
import generatedAccessToken from "../utils/generatedAccessToken.js";
import genertedRefreshToken from "../utils/generatedRefreshToken.js";
import ServiceModel from "../models/service.model.js";
import dotenv from "dotenv";
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
    if (!req.file) {
      console.log("No image uploaded");
      return res.status(400).json({ success: false, msg: "No image uploaded." });
    }
    // Send image to Python service for encoding
    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("file", req.file.buffer, req.file.originalname);
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/register-face`,
      formData,
      { headers: formData.getHeaders() }
    );
    console.log("Python service response:", response.data);
    if (response.data.success) {
      if (response.data.encoding) {
        console.log("Upserting encoding in DB...");
        await FaceEncodingModel.findOneAndUpdate(
          { userId },
          { encoding: response.data.encoding },
          { upsert: true, new: true }
        );
      }
      await UserModel.findByIdAndUpdate(userId, { faceRegistered: true });
      return res.json({ success: true, msg: "Face registered." });
    } else {
      return res.status(400).json({ success: false, msg: response.data.msg });
    }
  } catch (err) {
    console.error("Error in registerFace:", err);
    return res.status(500).json({ success: false, msg: "Server error." });
  }
};

export const verifyFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "No image uploaded." });
    }
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    let response;
    try {
      response = await axios.post(
        `${PYTHON_SERVICE_URL}/verify-face`,
        formData,
        { headers: formData.getHeaders() }
      );
    } catch (err) {
      if (err.response && err.response.data) {
        return res.status(err.response.status).json(err.response.data);
      }
      throw err;
    }
    if (response.data.success) {
      // Find user and generate tokens
      const user = await UserModel.findById(response.data.user_id);
      if (!user) {
        return res.status(404).json({ success: false, msg: "User not found." });
      }
      const accesstoken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);
      await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() });
      // Set cookies if needed (optional, for consistency)
      // const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
      // res.cookie("accessToken", accesstoken, cookiesOption);
      // res.cookie("refreshToken", refreshToken, cookiesOption);
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
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error." });
  }
};

export const searchProviderByFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "No image uploaded." });
    }
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    let response;
    try {
      response = await axios.post(
        `${PYTHON_SERVICE_URL}/verify-face`,
        formData,
        { headers: formData.getHeaders() }
      );
    } catch (err) {
      if (err.response && err.response.data) {
        return res.status(err.response.status).json(err.response.data);
      }
      throw err;
    }
    if (response.data.success && response.data.user_id) {
      // Find user and check if provider
      const user = await UserModel.findById(response.data.user_id);
      if (!user || user.role !== "PROVIDER") {
        return res.status(404).json({ success: false, msg: "No matching provider found." });
      }
      // Find all services by this provider
      const services = await ServiceModel.find({ provider: user._id }).populate("category").populate("provider");
      if (!services.length) {
        return res.status(404).json({ success: false, msg: "Provider found, but no services listed." });
      }
      return res.json({ success: true, providerId: user._id, provider: user, services });
    } else {
      return res.status(404).json({ success: false, msg: "No matching provider found." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: "Server error." });
  }
}; 