import type { PublicClient } from "viem";
import { publicClient } from "./wallet";
import { save, retrieve } from "./side-effects/cache";

export const wait = (delay: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};

type BlockTimestamp = {
  set: (blockNumber: bigint, timestamp: number) => Promise<void>;
  get: (blockNumber: bigint) => Promise<number | null>;
};

export const blockTimestamp: BlockTimestamp = {
  set: async (blockNumber: bigint, timestamp: number) => {
    await save(`base:mainnet:block/${blockNumber.toString()}`, timestamp);
  },
  get: async (blockNumber: bigint) => {
    return (await retrieve(`base:mainnet:block/${blockNumber.toString()}`)) as
      | number
      | null;
  },
};

export const currentBlock = async (
  client: PublicClient | undefined = undefined
) => {
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
