import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

export default app;
