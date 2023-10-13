import { createClient } from "redis";

const client = () => {
  return createClient({
    url: `redis://${process.env.REDIS_HOST || "redis"}:6379`,
  });
};

export const save = async (key: string, value: any) => {
  const output = await client().set(key, JSON.stringify(value));
  if (output !== "OK") {
    throw "could not cache the key";
  }
};

export const retrieve = async (key: string) => {
  const output = await client().get(key);
  if (!output) {
    throw "could not retrieve the key";
  }
  return JSON.parse(output);
};
