import { lastBlockFromCache } from "./block";
import { publicClient } from "./wallet";
import { base } from "viem/chains";

import type { Address } from "viem";

export const _previousEvents = async (
  address: Address,
  events: any,
  blockGap: bigint,
  toBlock: bigint | undefined = undefined,
  timeout: number = 300_000
) => {
  const client = await publicClient(base);
  const now = new Date().getTime();
  while (!toBlock && new Date().getTime() - now < timeout) {
    try {
      toBlock = await lastBlockFromCache(client);
    } catch (err) {
      console.warn(`could not get current block, err:`, err);
      console.warn(`exit(1)`);
      process.exit(1);
    }
  }
  if (!toBlock) {
    console.warn(`could not get current block, falsy toBlock`);
    console.warn(`exit(1)`);
    process.exit(1);
  }
  const logs = await client.getLogs({
    address,
    event: events,
    fromBlock: toBlock - blockGap,
    toBlock: toBlock - 1n,
  });
  return logs;
};
