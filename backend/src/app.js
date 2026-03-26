import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.routes.js";
import repositoryRoutes from "./routes/repository.routes.js";
import fileRoutes from "./routes/file.routes.js";
import pullRequestRoutes from "./routes/pullRequest.routes.js";
import contributorRouter from "./routes/contributor.routes.js";
import commentRouter from "./routes/comment.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import statsRouter from "./routes/stats.routes.js";
import searchRouter from "./routes/search.routes.js";
import activityRouter from "./routes/activity.routes.js";

const app = express();

/* ---------- MIDDLEWARES ---------- */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------- HEALTH ROUTE ---------- */

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀"
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/repos", repositoryRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/pr", pullRequestRoutes);
app.use("/api/v1/repos", contributorRouter);
app.use("/api/v1/pr", commentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/activity", activityRouter);


app.use(errorHandler);

export default app;
