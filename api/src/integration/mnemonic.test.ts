import { expect, test } from "vitest";
import { generateMnemonic } from "bip39";
import { getMnemonic } from "../mnemonic";

test.skip("check the Mnemonic are 12 words", () => {
  const mnemonic = generateMnemonic();
  expect(mnemonic.split(" ").length).toBe(12);
});

test("check the Mnemonic file exists", () => {
  const mnemonic = getMnemonic();
  expect(mnemonic.split(" ").length).toBe(12);
});
