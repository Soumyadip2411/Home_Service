import express from "express";
import { 
    getRecommendations, 
    getQueryRecommendations, 
    getTagRecommendations, 
    extractTagsFromText, 
    updateUserTagProfile, 
    getUserTagProfile, 
    replaceUserTagProfile, 
    getProfileTagsHybridRecommendations 
} from "../controllers/recommendation.controller.js";
import auth from "../middleware/auth.js";

const recommendationRouter = express.Router();

recommendationRouter.get("/", auth, getRecommendations);
recommendationRouter.post("/query", auth, getQueryRecommendations);
recommendationRouter.post("/tags", auth, getTagRecommendations);
recommendationRouter.post("/extract-tags", extractTagsFromText);
recommendationRouter.post("/update-profile", auth, updateUserTagProfile);
recommendationRouter.get("/profile", auth, getUserTagProfile);
recommendationRouter.post("/replace-profile", auth, replaceUserTagProfile);
recommendationRouter.post("/profile-tags", getProfileTagsHybridRecommendations);

export default recommendationRouter;