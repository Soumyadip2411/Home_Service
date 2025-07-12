import { Router } from "express";
import {
  forgotPasswordController,
  loginController,
  logoutController,
  refreshToken,
  registerUserController,
  resetpassword,
  updateUserDetails,
  uploadAvatar,
  removeAvatar,
  verifyEmailController,
  verifyForgotPasswordOtp,
  userDetails,
  requestProviderRoleController,
} from "../controllers/user.controller.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verify-email", verifyEmailController);
userRouter.post("/login", loginController);
userRouter.get("/logout", auth, logoutController);
userRouter.get("/get-user-details", auth, userDetails);
userRouter.put("/upload-avatar", auth, upload.single("avatar"), uploadAvatar);
userRouter.delete("/remove-avatar", auth, removeAvatar);
userRouter.put("/update-user", auth, updateUserDetails);
userRouter.put("/forgot-password", forgotPasswordController);
userRouter.put("/verify-forgot-password-otp", verifyForgotPasswordOtp);
userRouter.put("/reset-password", resetpassword);
userRouter.post("/refresh-token", refreshToken);
userRouter.post("/request-provider", auth, requestProviderRoleController);

export default userRouter;
