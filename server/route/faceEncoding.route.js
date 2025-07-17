import express from "express";
import multer from "multer";
import { registerFace, startFaceVerification, verifyFaceFrame, endFaceVerification } from "../controllers/faceEncoding.controller.js";
import { searchProviderByFace } from "../controllers/faceEncoding.controller.js";

const router = express.Router();
const upload = multer();

// Register face (after login)
router.post("/register", upload.single("file"), registerFace);



// Session-based face verification
router.post("/start-session", startFaceVerification);
router.post("/verify-frame", upload.single("file"), verifyFaceFrame);
router.post("/end-session", endFaceVerification);

// Search provider by face
router.post("/search-provider", upload.single("file"), searchProviderByFace);

export default router; 