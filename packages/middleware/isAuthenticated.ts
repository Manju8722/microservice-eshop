import prisma from "@packages/libs/prisma";
import { users } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.access_token || req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized Access token missing",
      });
    }

    // verifying the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE!) as {
      id: string;
      role: "user" | "seller";
    };

    if (!decoded) {
      return res.status(401).json({
        message: "Unauthorized Invalid token",
      });
    }

    const userAccount = await prisma.users.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!userAccount) {
      return res.status(401).json({
        message: "Unauthorized User not found",
      });
    }

    req.user = userAccount;

    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: users;
    }
  }
}

export default isAuthenticated;
