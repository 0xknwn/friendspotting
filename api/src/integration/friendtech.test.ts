import { expect, test } from "vitest";
import { getSharesSupply, setSharesSupply } from "../friendtech";
import { wait } from "../util";

test.skip(
  "set a shared supply with the system",
  async () => {
    const currentSupply = await getSharesSupply(
      `0x26BE4e415B38738A5E1845A3dc0cd4Eb26718815`
    );
    console.log("current supply", currentSupply);
    const receipt = await setSharesSupply(
      `0x26BE4e415B38738A5E1845A3dc0cd4Eb26718815`,
      currentSupply + 1n
    );
    console.log(receipt);
    expect(receipt.status).toBe("success");
    await wait(5000);
    const newSupply = await getSharesSupply(
      `0x26BE4e415B38738A5E1845A3dc0cd4Eb26718815`
    );
    console.log("new supply", newSupply);
    expect(newSupply).toBe(currentSupply + 1n);
  },
  { timeout: 120_000 }
);
