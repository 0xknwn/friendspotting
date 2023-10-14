import { expect, test } from "vitest";
import { getSharesSupply, setSharesSupply } from "../friendtech-mock";
import { wait } from "../util";

const destAddress = `0xef42b587e4a3d33f88fa499be1d80c676ff7a226`;

test.skip(
  "set a shared supply with the system",
  async () => {
    const currentSupply = await getSharesSupply(destAddress);
    console.log("current supply", currentSupply);
    const receipt = await setSharesSupply(destAddress, currentSupply + 1n);
    console.log(receipt);
    expect(receipt.status).toBe("success");
    await wait(5000);
    const newSupply = await getSharesSupply(destAddress);
    console.log("new supply", newSupply);
    expect(newSupply).toBe(currentSupply + 1n);
  },
  { timeout: 120_000 }
);
