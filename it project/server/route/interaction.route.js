import { Router } from "express";
import {
  addInteraction
} from "../controllers/interaction.controller.js";
import auth from "../middleware/auth.js";

const interactionRouter = Router();

interactionRouter.post("/:serviceId",auth, addInteraction);

export default interactionRouter;
