import { lastBlockFromCache } from "./block";
import { type PublicClient } from "viem";
import { wait } from "./util";

import type { Address } from "viem";

export const _previousEvents = async (
  address: Address,
  events: any,
  client: PublicClient,
  blockGap: bigint,
  toBlock: bigint | undefined = undefined,
  timeout: number = 300_000
) => {
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

  const retry = 3;
  let finalError: any = undefined;
  for (let i = 0; i < retry; i++) {
    try {
      if (i > 0) {
        console.log(
          `--- attempt ${i + 1} to read block between ${
            toBlock - blockGap
          } and ${toBlock - 1n}`
        );
      }
      const logs = await client.getLogs({
        address,
        event: events,
        fromBlock: toBlock - blockGap,
        toBlock: toBlock - 1n,
      });
      return logs;
    } catch (err) {
      finalError = err;
      console.log(`--- retry on error; log:`, err);
      console.log(err);
      await wait(10000);
      console.log(`--- restarting now...`);
    }
  }
  throw finalError;
};
