import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  checkOtpRestriction,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPaaaswordOtp,
  verifyOtp,
} from "../utils/auth.helper";
import { AuthError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import bcrypt, { hash } from "bcryptjs";
import { setCookie } from "../utils/setCookie";

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError("User already exists"));
    }

    await checkOtpRestriction(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-email");
    return res.status(200).json({
      message: `OTP has been sent to ${email} please check`,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required"));
    }
    const exitstingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (exitstingUser) {
      return next(
        new ValidationError("Aready user with given email existed...")
      );
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name: name,
      },
    });
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required"));
    }

    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return next(new AuthError("User not exists ...!"));
    }

    const isMatch =
      user?.password && (await bcrypt.compare(password, user?.password));
    if (!isMatch) {
      return next(new AuthError("Inavlid Email or Password ...!"));
    }

    const access_token = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRETE as string,
      {
        expiresIn: "15m",
      }
    );

    const refresh_token = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRETE as string,
      {
        expiresIn: "7d",
      }
    );
    setCookie(res, "refresh_token", refresh_token);
    setCookie(res, "access_token", access_token);
    res.status(200).json({
      messgae: "login successfully",
      user: { id: user.id, name: user.name, email: user.email },
    });
    // store both token
  } catch (error) {
    next(error);
  }
};

export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

export const verifyUserForgotPasswordResetOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPaaaswordOtp(req, res, next);
};

// reset user password

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw new ValidationError("Email and new Passsword is Required !");
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ValidationError("Email and new Passsword is Required !");
    }

    const isSamePassword =
      user.password && (await bcrypt.compare(newPassword, user.password));
    if (isSamePassword) {
      throw new ValidationError("New apssword should not as old password ...!");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });
    res.status(200).json({
      message: "password reset succesfully",
    });
  } catch (error) {
    next(error);
  }
};
