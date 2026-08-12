import redisClient from "../config/redis.js";

export const createRateLimiter = (
  keyPrefix,
  maxRequests,
  windowSeconds
) => {

  return async (req, res, next) => {

    try {
      // 1. Get client IP
      const ip = req.ip;

      // 2. Create unique Redis key
      const key = `${keyPrefix}:${ip}`;

      // 3. Increment request count
      const requestCount = await redisClient.incr(key);

      // 4. Set expiration only for the first request
      if (requestCount === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      // 5. Check whether limit is exceeded
      if (requestCount > maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later."
        });
      }

      // 6. Request is within the limit
      next();

    } catch (error) {

      console.error("Rate limiter error:", error);

      // If Redis fails, allow the request to continue
      next();
    }
  };
};

export const loginRateLimiter = createRateLimiter(
  "rate:login",
  5,
  15 * 60
);

export const registerRateLimiter = createRateLimiter(
  "rate:register",
  5,
  15 * 60 
);

export const forgotPasswordRateLimiter = createRateLimiter(
    "rate:forgot-password",
    3,
    15 * 60
);

export const searchRateLimiter = createRateLimiter(
    "rate:search",
    30,
    60
);

export const createSlidingWindowRateLimiter = (
  keyPrefix,
  maxRequests,
  windowSeconds
) => {
  return async (req, res, next) => {
    try {
      // 1. Get client IP
      const ip = req.ip;

      // 2. Create Redis key
      const key = `${keyPrefix}:${ip}`;

      // 3. Current time
      const now = Date.now();

      // 4. Start of the sliding window
      const windowStart = now - windowSeconds * 1000;

      // 5. Remove requests older than the sliding window
      await redisClient.zRemRangeByScore(
        key,
        0,
        windowStart
      );

      // 6. Count requests currently inside the window
      const requestCount = await redisClient.zCard(key);

      // 7. Check the limit
      if (requestCount >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later."
        });
      }

      // 8. Add current request
      await redisClient.zAdd(key, [
        {
          score: now,
          value: now.toString()
        }
      ]);

      // 9. Remove the key automatically when unused
      await redisClient.expire(key, windowSeconds);

      // 10. Allow request
      next();

    } catch (error) {
      console.error(
        "Sliding window rate limiter error:",
        error
      );

      // If Redis fails, allow request
      next();
    }
  };
};

export const loginSlidingRateLimiter =
  createSlidingWindowRateLimiter(
    "rate:login:sliding",
    5,
    60
  );

  export const registerSlidingRateLimiter =
    createSlidingWindowRateLimiter(
      "rate:register:sliding",
      5,
      60
    );
  
  export const forgotPasswordSlidingRateLimiter =
  createSlidingWindowRateLimiter(
    "rate:forgot-password:sliding",
    3,
    60
  );

  export const searchSlidingRateLimiter =
  createSlidingWindowRateLimiter(
    "rate:search:sliding",
    30,
    60
  );

  export const aiReviewSlidingRateLimiter =
  createSlidingWindowRateLimiter(
    "rate:ai-review:sliding",
    10,
    60
  );


