import { createClient } from "redis";
import type { RedisClientType } from "redis";

let redis: RedisClientType | undefined = undefined;

const init = async () => {
  redis = createClient({
    url: `redis://${process.env.REDIS_HOST || "redis"}:6379`,
  });
  return await redis.connect();
};

init()
  .then(() => {
    console.log(`redis client started and connected...`);
  })
  .catch((err) => {
    console.warn(`redis client initialized with err: ${err}`);
  });

export const save = async (key: string, value: any) => {
  if (!redis) {
    throw `redis setup has failed, the redis content is falsy`;
  }
  const output = await redis.set(key, JSON.stringify(value));
  if (output !== "OK") {
    throw "could not cache the key";
  }
};

export const retrieve = async (key: string) => {
  if (!redis) {
    throw `redis setup has failed, the redis content is falsy`;
  }
  const output = await redis.get(key);
  if (!output) {
    return null;
  }
  return JSON.parse(output);
};
