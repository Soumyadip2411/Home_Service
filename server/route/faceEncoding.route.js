import express from "express";
import multer from "multer";
import { registerFace, verifyFace } from "../controllers/faceEncoding.controller.js";
import { searchProviderByFace } from "../controllers/faceEncoding.controller.js";

const router = express.Router();
const upload = multer();

// Register face (after login)
router.post("/register", upload.single("file"), registerFace);

// Verify face (for login)
router.post("/verify", upload.single("file"), verifyFace);

// Search provider by face
router.post("/search-provider", upload.single("file"), searchProviderByFace);

export default router; 