import { AppError } from "./index";
import { NextFunction, Request, Response } from "express";
export const errorMiddleware = function (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    console.log(`Error : ${req.method} ${req.url} -${err.message}`);

    return res.status(err.statusCode).json({
      status: "Error",
      message: err.message,
      ...(err.detials && { details: err.detials }),
    });
  }

  console.log("unhandles error");
  return res.status(500).json({
    error: "Some thing went wrong",
    message: err.message,
  });
};
