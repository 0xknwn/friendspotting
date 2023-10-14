import type { PublicClient } from "viem";
import { baseGoerli, type Chain } from "viem/chains";

import { getBlockOrCrash } from "./util";
import { wait } from "./util";
import { save, retrieve } from "./side-effects/cache";

export type BlockTimestamp = {
  set: (
    chain: Chain | undefined,
    blockNumber: bigint,
    timestamp: number
  ) => Promise<void>;
  get: (
    chain: Chain | undefined,
    blockNumber: bigint
  ) => Promise<number | null>;
  getWithTimeout: (
    chain: Chain | undefined,
    blockNumber: bigint,
    timeout: number
  ) => Promise<number>;
};

export const blockTimestamp: BlockTimestamp = {
  set: async (
    chain: Chain | undefined,
    blockNumber: bigint,
    timestamp: number
  ) => {
    let prefix = "mainnet";
    if (chain && chain === baseGoerli) {
      prefix = "goerli";
    }
    await save(`base:${prefix}:block/${blockNumber.toString()}`, timestamp);
  },
  get: async (chain: Chain | undefined, blockNumber: bigint) => {
    let prefix = "mainnet";
    if (chain && chain === baseGoerli) {
      prefix = "goerli";
    }
    return (await retrieve(
      `base:${prefix}:block/${blockNumber.toString()}`
    )) as number | null;
  },
  getWithTimeout: async (
    chain: Chain | undefined,
    blockNumber: bigint,
    timeout: number
  ) => {
    let prefix = "mainnet";
    if (chain && chain === baseGoerli) {
      prefix = "goerli";
    }
    const now = new Date().getTime();
    while (new Date().getTime() - now < timeout) {
      const v = await retrieve(
        `base:${prefix}:block/${blockNumber.toString()}`
      );
      if (v) {
        return v;
      }
      await wait(1000);
    }
    throw "timeout in getWithTimeout";
  },
};

const scanGapForTimestamps = async (client: PublicClient, gapBlock: bigint) => {
  if (!client.chain) {
    throw "client.chain is undefined";
  }
  const block = await getBlockOrCrash(client);
  let endBlock = block.number as bigint;
  let startBlock = endBlock - gapBlock;
  let previousTimestamp = 0;
  let previousBlockNumber = 0n;
  for (let i = startBlock; i <= endBlock; i++) {
    const v = await blockTimestamp.get(client.chain, i);
    if (!v) {
      startBlock = i;
      break;
    }
    previousBlockNumber = i;
    previousTimestamp = v;
  }
  let nextBlockNumber = previousBlockNumber;
  let gap = 1n;
  if (endBlock - startBlock > 5n) {
    gap = 3n;
  }
  if (endBlock - startBlock > 20n) {
    gap = 10n;
  }
  for (let i = previousBlockNumber + gap; i < endBlock; i += gap) {
    const block = await getBlockOrCrash(client, i);
    console.log(`indexing blockid ${i} with timestamp ${block.timestamp}`);
    for (let j = 1n; j <= gap; j++) {
      await blockTimestamp.set(
        client.chain,
        i + j,
        Math.round(
          previousTimestamp +
            (Number(j) / Number(gap)) *
              Number(block.timestamp - BigInt(previousTimestamp))
        )
      );
    }
    nextBlockNumber = i + 1n;
  }
  return nextBlockNumber;
};

const scanFromBlockForTimestamps = async (
  client: PublicClient,
  nextBlockNumber: bigint
) => {
  if (!client.chain) {
    throw "client.chain is undefined";
  }
  const block = await getBlockOrCrash(client);
  let endBlock = block.number as bigint;
  console.log(`storing blockid ${endBlock} with timestamp ${block.timestamp}`);
  await blockTimestamp.set(client.chain, endBlock, Number(block.timestamp));
  let gap = 1n;
  if (endBlock - nextBlockNumber > 3n) {
    gap = 2n;
  }
  if (endBlock - nextBlockNumber > 5n) {
    gap = 3n;
  }
  if (endBlock - nextBlockNumber > 15n) {
    gap = 10n;
  }
  let previousBlockNumber = nextBlockNumber;
  let previousTimestamp = 0n;
  for (let i = nextBlockNumber; i < endBlock; i += gap) {
    const block = await getBlockOrCrash(client, i);
    if (previousTimestamp === 0n) {
      console.log(`indexing blockid ${i} with timestamp ${block.timestamp}`);
      await blockTimestamp.set(
        client.chain,
        i,
        Math.round(Number(block.timestamp))
      );
      previousTimestamp = block.timestamp;
      continue;
    }
    console.log(`indexing blockid ${i} with timestamp ${block.timestamp}`);
    for (let j = previousBlockNumber + 1n; j <= i; j++) {
      await blockTimestamp.set(
        client.chain,
        j,
        Math.round(
          Number(previousTimestamp) +
            (Number(j - previousBlockNumber) /
              Number(i - previousBlockNumber)) *
              Number(block.timestamp - BigInt(previousTimestamp))
        )
      );
    }
    previousTimestamp = block.timestamp;
  }
  return endBlock + 1n;
};

export const scanTimestamps = async (client: PublicClient) => {
  if (!client.chain) {
    throw "client.chain is undefined";
  }
  let next = await scanGapForTimestamps(client, 1500n);
  while (true) {
    next = await scanFromBlockForTimestamps(client, next);
    await wait(1000);
  }
};
