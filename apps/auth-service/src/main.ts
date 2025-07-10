import express from "express";
import cors from "cors";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import swaggerUI from "swagger-ui-express";
import swaggerDocument = require("./swagger-output.json");
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send({ message: "Hello API" });
});

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get("/docs-json", (req, res, next) => {
  res.json(swaggerDocument);
});

// Routes started
app.use("/api", authRouter);
// Routes ended

app.use(errorMiddleware);
const port = process.env.PORT ? Number(process.env.PORT) : 6001;
const server = app.listen(port, () => {
  console.log(
    `auth service ready and running in  http://localhost:${port}/api`
  );
  console.log(`swagger docs avialble at : http://localhost:${port}/docs`);
});
server.on("error", (err) => {
  console.log("error occured", err);
});
