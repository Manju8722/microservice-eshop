import { Response } from "express";

export const setCookie = (res: Response, name: string, value: any) => {
  res.cookie(name, value, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
};
