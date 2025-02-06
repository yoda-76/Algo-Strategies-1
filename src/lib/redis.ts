import Redis from "ioredis";


export const socketRedisClient = new Redis(
  "redis://127.0.0.1:6379"
);