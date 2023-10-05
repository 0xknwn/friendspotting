import { expect, test } from "vitest";
import { sourceSupply } from "../source";

test(
  "check the supply for our account is not 0n",
  async () => {
    const currentSupply = await sourceSupply(
      `0xd85eff2d610132d507ece73e1f37df82774a8d47`
    );
    expect(currentSupply).not.toBe(0n);
  },
  { timeout: 120_000 }
);
