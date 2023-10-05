import { publicClient } from "./wallet";
import { parseAbiItem, Log } from "viem";
import type { PublicClient, Address } from "viem";
import * as dotenv from "dotenv";
import { wait } from "./util";
import { setSharesSupply, getSharesSupply } from "./friendtech";
import { sourceSupply } from "./source";

dotenv.config();

const currentBlock = async (client: PublicClient | undefined = undefined) => {
  if (!client) {
    client = (await publicClient()) as PublicClient;
  }
  const block = await client.getBlock();
  return block.number;
};

const previousTrades = async (
  blockGap: bigint,
  toBlock: bigint | undefined = undefined
) => {
  const client = await publicClient();
  if (!toBlock) {
    toBlock = await currentBlock(client);
  }
  const logs = await client.getLogs({
    address: "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4",
    event: parseAbiItem(
      "event Trade(address trader, address subject, bool isBuy, uint256 shareAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply)"
    ),
    fromBlock: toBlock - blockGap,
    toBlock: toBlock - 1n,
  });
  return logs;
};

const latestSupply = (logs: Log[]): bigint | undefined => {
  if (!process.env.MONITORED_ADDRESS) {
    throw "missing MONITORED_ADDRESS variable";
  }
  let supply: bigint | undefined = undefined;
  for (const log of logs) {
    if (
      log["args"]["subject"].toLowerCase() ===
      process.env.MONITORED_ADDRESS.toLowerCase()
    ) {
      supply = log["args"]["supply"];
    }
  }
  return supply;
};

const sync = async (supply: bigint) => {
  if (!process.env.MONITORED_ADDRESS) {
    throw "missing MONITORED_ADDRESS variable";
  }
  console.log("sync mock with", supply);
  const receipt = await setSharesSupply(
    process.env.MONITORED_ADDRESS as `0x${string}`,
    supply
  );
  if (receipt?.status !== "success") {
    console.warn(receipt);
    throw "could not sync the supply";
  }
};

const reSync = async () => {
  if (!process.env.MONITORED_ADDRESS) {
    throw "missing MONITORED_ADDRESS variable";
  }
  const supply = await sourceSupply(process.env.MONITORED_ADDRESS as Address);
  const appliedSupply = await getSharesSupply(
    process.env.MONITORED_ADDRESS as Address
  );
  if (supply === appliedSupply) {
    console.log("mock already synced to", supply);
    return;
  }
  await sync(supply);
};

const start = async () => {
  await reSync();
  console.log("starting syncing...");
  let current = await currentBlock();
  let previous = current - 1000n;
  let supply: bigint | undefined = undefined;
  while (true) {
    let current = await currentBlock();
    let gap = 10n;
    if (current <= previous) {
      await wait(1000);
      continue;
    }
    if (current - previous < 10n) {
      gap = current - previous;
    }
    const logs = await previousTrades(gap, previous + gap);
    console.log(
      `indexing (${logs.length}) between`,
      previous,
      "and",
      previous + gap,
      "target ->",
      current
    );
    supply = await latestSupply(logs);
    previous += gap;
    if (gap < 10) {
      if (supply) {
        await sync(supply);
        supply = undefined;
      }
      await wait(1000);
    }
  }
};

start()
  .then((log) => console.log(log))
  .catch((err) => console.warn(err));
