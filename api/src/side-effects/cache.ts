import { createClient } from "redis";

const client = async () => {
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || "redis"}:6379`,
  });
  return await client.connect();
};

export const save = async (key: string, value: any) => {
  const output = await (await client()).set(key, JSON.stringify(value));
  if (output !== "OK") {
    throw "could not cache the key";
  }
};

export const retrieve = async (key: string) => {
  const output = await (await client()).get(key);
  if (!output) {
    return null;
  }
  return JSON.parse(output);
};
