import type { PublicClient, GetBlockParameters } from "viem";
import { exit } from "process";
import { save, retrieve } from "./side-effects/cache";
import { baseGoerli } from "viem/chains";

export const wait = (delay: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};

const getBlock = async (
  client: PublicClient,
  blockNumber: bigint | undefined = undefined
) => {
  let option: GetBlockParameters<false, "latest"> = {
    includeTransactions: false,
  };
  if (!blockNumber) {
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
  let prefix = "mainnet";
  if (client.chain == baseGoerli) {
    prefix = "goerli";
  }
  try {
    const block = await getBlock(client, blockNumber);
    if (!blockNumber) {
      await save(`base:${prefix}:blocknumber/latest`, Number(block.number));
    }
    return block;
  } catch (err) {
    console.warn(`could not get current block, err:`, err);
    console.warn(`force exit(1)`);
    exit(1);
  }
};

export const lastBlock = async (client: PublicClient) => {
  let prefix = "mainnet";
  if (client.chain == baseGoerli) {
    prefix = "goerli";
  }
  const blockNumber = await retrieve(`base:${prefix}:blocknumber/latest`);
  if (!blockNumber) {
    return undefined;
  }
  return BigInt(blockNumber);
};

export const lastBlockWithTimeout = async (
  client: PublicClient,
  timeout: number = 60_000
) => {
  let prefix = "mainnet";
  if (client.chain == baseGoerli) {
    prefix = "goerli";
  }
  const now = new Date().getTime();
  let blockNumber: bigint | undefined = undefined;
  while (!blockNumber && new Date().getTime() - now < timeout) {
    blockNumber = await retrieve(`base:${prefix}:blocknumber/latest`);
    if (!blockNumber) {
      wait(500);
    }
  }
  if (!blockNumber) {
    throw "could not capture last block";
  }
  return BigInt(blockNumber);
};
