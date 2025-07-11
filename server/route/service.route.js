import express from "express";
import {
  addService,
  getAllServices,
  getProviderServices,
  getServiceDetails,
  getServiceAvailability,
  batchUpdateServiceTags
} from "../controllers/service.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/add-service", auth, addService);
router.get("/all-services", auth, getAllServices);
router.get("/batch-update-tags", auth, batchUpdateServiceTags);
router.get("/", auth, getProviderServices);
router.get("/:serviceId", auth, getServiceDetails);
router.get("/:serviceId/availability", auth, getServiceAvailability);

export default router;
