import dotenv from "dotenv";
dotenv.config();


import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => connectRedis())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Server startup failed", err);
  });
