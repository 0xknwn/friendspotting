import * as dotenv from "dotenv";
import { exit } from "process";
import { type PublicClient, type GetBlockParameters } from "viem";
import { baseGoerli } from "viem/chains";

import { wait } from "./util";
import { retrieve } from "./side-effects/cache";
dotenv.config();

const getBlock = async (
  client: PublicClient,
  blockNumber: bigint | undefined = undefined
) => {
  let option: GetBlockParameters<false, "latest"> = {
    includeTransactions: false,
  };
  if (blockNumber) {
    option = {
      blockNumber: blockNumber,
      includeTransactions: false,
    };
  }
  for (let retry = 0; retry < 10; retry++) {
    try {
      const block = await client.getBlock(option);
      return block;
    } catch (err) {
      wait(retry * 1000);
    }
  }
  throw `could not get block ${
    blockNumber ? blockNumber.toString() : "latest"
  }`;
};

export const getBlockOrCrash = async (
  client: PublicClient,
  blockNumber: bigint | undefined = undefined
) => {
  let lastError: string | undefined = undefined;
  const retries = 5;
  for (let i = 0; i < retries; i++) {
    try {
      const block = await getBlock(client, blockNumber);
      if (!block || !block.number) {
        lastError = `empty block ${JSON.stringify(block)}`;
        continue;
      }
      return block;
    } catch (err) {
      lastError = `${err}`;
      continue;
    }
  }
  console.warn(`could not get current block, err:`, lastError);
  console.warn(`force exit(1)`);
  exit(1);
};

export const lastBlockFromCache = async (
  client: PublicClient,
  timeout: number = 60_000
) => {
  let prefix = "mainnet";
  if (client.chain == baseGoerli) {
    prefix = "goerli";
  }
  const startTime = new Date().getTime();
  let blockNumber: bigint | undefined = undefined;
  while (!blockNumber && new Date().getTime() - startTime < timeout) {
    blockNumber = await retrieve(`base:${prefix}:blocknumber/latest`);
    if (!blockNumber) {
      wait(200);
    }
  }
  if (!blockNumber) {
    throw "could not capture last block";
  }
  return BigInt(blockNumber);
};
