import { expect, test } from "vitest";
import { walletClient } from "../wallet";
import { getMnemonic } from "../mnemonic";
import { baseGoerli } from "viem/chains";

test.skip("check the mnemonic is properly set", async () => {
  const mnemonic = getMnemonic();
  const wallet = await walletClient(baseGoerli, mnemonic);
  expect(wallet.account.address).toBe(
    "0xE0d4ec43778010675264c6298eE221f8986DBb25"
  );
});
