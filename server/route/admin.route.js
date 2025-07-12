import { Router } from "express";
import {
  getProviderRequests,
  approveProviderRequest,
  rejectProviderRequest,
  getAdminStats,
} from "../controllers/admin.controller.js";
import auth from "../middleware/auth.js";

const adminRouter = Router();

adminRouter.get("/provider-requests", auth, getProviderRequests);
adminRouter.post("/approve-request/:requestId", auth, approveProviderRequest);
adminRouter.post("/reject-request/:requestId", auth, rejectProviderRequest);
adminRouter.get("/stats", auth, getAdminStats);

export default adminRouter; 