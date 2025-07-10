import Express from "express";
import {
  login,
  resetUserPassword,
  userForgotPassword,
  userRegistration,
  verifyUser,
} from "../controller/auth.controller";
import { verifyForgotPaaaswordOtp } from "../utils/auth.helper";
const router = Express.Router();

router.post("/user-registration", userRegistration);

router.post("/verify-user", verifyUser);

router.post("/login-user", login);

router.post("/forgot-password", userForgotPassword);

router.post("/reset-password-user", resetUserPassword);

router.post("/verify-forgot-password-otp", verifyForgotPaaaswordOtp);

export default router;
