import { expect, describe, it, afterEach, vi } from "vitest";
import { createClient } from "redis";

describe.skip("redis read/write", () => {
  it("connect and ping", async () => {
    expect(process.env.REDIS_HOST).toBe("localhost");
    const client = await createClient({
      url: `redis://${process.env.REDIS_HOST}:6379`,
    })
      .on("error", (err) => {
        console.log("Redis Client Error", err);
        throw `redis exception ${err}`;
      })
      .connect();
    const msg = await client.ping();

    expect(msg).toBe("PONG");
  });

  it("write/read key", async () => {
    expect(process.env.REDIS_HOST).toBe("localhost");
    const client = await createClient({
      url: `redis://${process.env.REDIS_HOST}:6379`,
    })
      .on("error", (err) => {
        console.log("Redis Client Error", err);
        throw `redis exception ${err}`;
      })
      .connect();

    const result = await client.set(
      "idx/idx",
      JSON.stringify([{ name: "name", value: "value" }])
    );
    expect(result).toBe("OK");

    const output = await client.get("idx/idx");
    expect(output).not.toBeNull();
    if (!output) {
      return;
    }
    const value = JSON.parse(output);
    expect(value).toEqual([{ name: "name", value: "value" }]);
  });

  it("missing key", async () => {
    expect(process.env.REDIS_HOST).toBe("localhost");
    const client = await createClient({
      url: `redis://${process.env.REDIS_HOST}:6379`,
    })
      .on("error", (err) => {
        console.log("Redis Client Error", err);
        throw `redis exception ${err}`;
      })
      .connect();

    const output = await client.get("missing");
    expect(output).toBeNull();
  });
});
