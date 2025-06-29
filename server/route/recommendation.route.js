import express from "express";
import { getRecommendations } from "../controllers/recommendation.controller.js";
import auth from "../middleware/auth.js";

const recommendationRouter = express.Router();

recommendationRouter.get("/", auth, getRecommendations);

export default recommendationRouter;