import { expect, test } from "vitest";
import { price } from "./price";

test("price returns the expected price for 1,1", async () => {
  expect(price(10, 1)).toBe(6250000000000000n);
});

test("price returns the expected price for 256,2", async () => {
  expect(price(256, 2)).toBe(8224062500000000000n);
});
