import { Router } from "express";
import { createReview} from "../controllers/review.controller.js";
import auth from "../middleware/auth.js";

const reviewRouter = Router();

reviewRouter.post("/create/:serviceId", auth, createReview);
//reviewRouter.get("/service/:serviceId", getServiceReviews);

export default reviewRouter;