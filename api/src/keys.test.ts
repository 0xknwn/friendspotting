import { expect, test } from "vitest";
import { getPrice } from "./keys";

test("getPrice returns the expected price for 1,1", async () => {
  expect(getPrice(10, 1)).toBe(6250000000000000n);
});

test("getPrice returns the expected price for 256,2", async () => {
  expect(getPrice(256, 2)).toBe(8224062500000000000n);
});
