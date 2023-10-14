import { expect, test } from "vitest";
import { generateMnemonic } from "bip39";
import { baseGoerli } from "viem/chains";
import { getMnemonic } from "../mnemonic";
import { walletClient } from "../wallet";

test.skip("check the Mnemonic are 12 words", () => {
  const mnemonic = generateMnemonic();
  expect(mnemonic.split(" ").length).toBe(12);
});

test("check the container key matches the mnemonic", async () => {
  const mnemonic = getMnemonic();
  const wallet = await walletClient(baseGoerli, mnemonic);
  expect(mnemonic.split(" ").length).toBe(12);
  expect(wallet.account.address).toBe(
    `0xE0d4ec43778010675264c6298eE221f8986DBb25`
  );
});
