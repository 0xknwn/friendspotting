import type { PublicClient } from "viem";
import { publicClient } from "./wallet";

export const wait = (delay: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};

export const currentBlock = async (client: PublicClient | undefined = undefined) => {
  if (!client) {
    client = (await publicClient()) as PublicClient;
  }
  let blockNumber = 0n;
  for (let retry = 0; retry < 10; retry++) {
    try {
      const block = await client.getBlock();
      blockNumber = block.number;
      break;
    } catch (err) {
      wait(retry * 1000);
    }
  }
  return blockNumber;
};
