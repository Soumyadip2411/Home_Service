import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const categoryRouter = Router();

categoryRouter.post("/create", auth, upload.single("image"), createCategory);
categoryRouter.get("/all", getCategories);
categoryRouter.get("/:id", getCategory);
categoryRouter.put("/:id", auth, upload.single("image"), updateCategory);
categoryRouter.delete("/:id", auth, deleteCategory);

export default categoryRouter;