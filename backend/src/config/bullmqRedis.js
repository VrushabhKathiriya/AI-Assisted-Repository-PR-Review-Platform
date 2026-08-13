import IORedis from "ioredis";

const bullmqRedis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

bullmqRedis.on("connect", () => {
  console.log("BullMQ Redis connected successfully");
});

bullmqRedis.on("error", (error) => {
  console.error("BullMQ Redis error:", error);
});

export default bullmqRedis;