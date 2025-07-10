import { ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/redis";
import crypto from "crypto";
import { sendEmail } from "./sendMail";
import { NextFunction, Request, Response } from "express";
import prisma from "@packages/libs/prisma";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing reuired fileds");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
};

export async function checkOtpRestriction(email: string, next: NextFunction) {
  // if wrong otp for more than 3 times
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "Account locked due to multiple failed attemptes! try again"
    );
  }
  // if otp requesting is more than 3 times or frequest otp requesting
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "Too many OTP request ! please wait 1 hour before requesting again"
    );
  }

  // if rqeuest before 1 minute of otp requested otp before
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      "please wait 1 minute before requesting a new OTP"
    );
  }
}

export async function sendOtp(name: string, email: string, template: string) {
  const otp = crypto.randomInt(1000, 9999).toString();

  await sendEmail(email, "Verify Your Email", template, {
    name,
    otp,
  });
  // set otp to redis with email with exiprestaion time
  // expires in 5 minute  or 300 seconds
  await redis.set(`otp:${email}`, otp, "EX", 300);

  // restrcting sendting 2nd otp after 1 minute
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
}

export async function trackOtpRequests(email: string, next: NextFunction) {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");
  if (otpRequests >= parseInt(process.env.EMAIl_MAX_NUM_REQUEST || "2")) {
    // locked for 1 hour if reust is greater or equal to 2
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
    throw new ValidationError(
      "Too many OTP Request .Please wait 1 hour before requesting aagin"
    );
  }

  // defualt  otp_request_count is 0
  // tracking rqeuest 1 hour
  await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600);
}

export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  const storeOtp = await redis.get(`otp:${email}`);
  if (!storeOtp) {
    throw new ValidationError("Invalid or OTP has been expired");
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  //@ts-ignore
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || 0);
  if (storeOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        "Too Many failed OTP entered attempts and your account has been locked for 30 min"
      );
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
    throw new ValidationError(
      `Incorrect OTP entered ${2 - failedAttempts} attempts left`
    );
  }

  await redis.del(`otp:${email}`, failedAttemptsKey);
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError("Email is Required !");
    }

    const user =
      userType === "user"
        ? await prisma.users.findUnique({
            where: { email },
          })
        : null;
    if (!user) {
      throw new ValidationError(`${userType} is not found`);
    }

    // check otp restrication
    await checkOtpRestriction(email, next);
    await trackOtpRequests(email, next);

    await sendOtp(user.name, email, "forgot-passworsd-user-email");
    res.status(200).json({
      message: "OTP has been sent please verify",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPaaaswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError("Email and OTP is Required !");
    }
    await verifyOtp(email, otp, next);
    res.status(200).json({
      message: "OTP Verified Yoiu cn reset password now !",
    });
  } catch (error) {
    next(error);
  }
};
