import { publicClient } from "./wallet";
import { parseAbiItem, Log } from "viem";
import type { PublicClient, Address } from "viem";
import * as dotenv from "dotenv";
import { wait } from "./util";
import { setSharesSupply, getSharesSupply } from "./friendtech";
import { sourceSupply } from "./source";

dotenv.config();

const monitoredAddresses: Array<Address> = [];

const feedAddresses = () => {
  if (!process.env.MONITORED_ADDRESSES) {
    throw "missing variable MONITORED_ADDRESSES";
  }
  process.env.MONITORED_ADDRESSES.split(",").forEach((address) => {
    if (!address || address.slice(0, 2) !== "0x") {
      throw `unknown address ${address}`;
    }
    monitoredAddresses.push(address.toLowerCase() as Address);
  });
};

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

const latestSupply = (
  logs: Log[],
  previousSupply: Map<Address, bigint>
): Map<Address, bigint> => {
  for (const log of logs) {
    if (monitoredAddresses.includes(log["args"]["subject"].toLowerCase())) {
      previousSupply.set(log["args"]["subject"], log["args"]["supply"]);
    }
  }
  return previousSupply;
};

const sync = async (supply: Map<Address, bigint>) => {
  for (let [key, value] of supply) {
    console.log("sync mock with", key, ":", value);
    const receipt = await setSharesSupply(key, value);
    if (receipt?.status !== "success") {
      console.warn(receipt);
      throw "could not sync the supply";
    }
  }
};

const reSync = async () => {
  const supply = new Map<Address, bigint>();
  for (let key of monitoredAddresses) {
    const srcSupply = await sourceSupply(key);
    const dstSupply = await getSharesSupply(key);
    if (srcSupply === dstSupply) {
      console.log("mock already synced to", srcSupply);
      continue;
    }
    supply.set(key, srcSupply);
  }
  await sync(supply);
};

const start = async () => {
  feedAddresses();
  await reSync();
  console.log("starting syncing...");
  let current = await currentBlock();
  let previous = current - 1000n;
  let supply = new Map<Address, bigint>();
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
    supply = latestSupply(logs, supply);
    previous += gap;
    if (gap < 10) {
      if (supply) {
        await sync(supply);
        supply = new Map<Address, bigint>();
      }
      await wait(1000);
    }
  }
};

start()
  .then((log) => console.log(log))
  .catch((err) => console.warn(err));
