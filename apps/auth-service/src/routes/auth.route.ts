import Express from "express";
import {
  getUser,
  login,
  refreshToken,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
} from "../controller/auth.controller";
import { verifyForgotPaaaswordOtp } from "../utils/auth.helper";
import isAuthenticated from "@packages/middleware/isAuthenticated";
const router = Express.Router();

router.post("/user-registration", userRegistration);

router.post("/verify-user", verifyUser);

router.post("/login-user", login);

router.post("/refresh-token-user", refreshToken);

router.get("/logged-in-user", isAuthenticated, getUser);

router.post("/forgot-password", userForgotPassword);

router.post("/reset-password-user", resetUserPassword);

router.post("/verify-forgot-password-otp", verifyForgotPaaaswordOtp);

export default router;
