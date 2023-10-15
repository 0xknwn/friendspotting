import { PrismaClient, Prisma } from "@prisma/client";
import { Log, PublicClient } from "viem";
import type { Address } from "viem";
import { address, events } from "./abi/friendtech-events";
import { _previousEvents } from "./events";
import { setSharesSupply, getSharesSupply } from "./friendtech-mock";
import { sourceSupply } from "./source";
import promClient from "prom-client";
import * as dotenv from "dotenv";
import { wait } from "./util";
dotenv.config();

const captured = new promClient.Counter({
  name: "idxr_sync_captured_events_total",
  help: "number of events captured by the idxr",
});

const saved = new promClient.Counter({
  name: "idxr_sync_saved_events_total",
  help: "number of events captured by the idxr",
});

const monitoredAddresses: Array<Address> = [];

const feedAddresses = () => {
  if (!process.env.MONITORED_ADDRESSES) {
    console.log("variable MONITORED_ADDRESSES not set...");
    return;
  }
  process.env.MONITORED_ADDRESSES.split(",").forEach((address) => {
    if (!address || address.slice(0, 2) !== "0x") {
      throw `unknown address ${address}`;
    }
    monitoredAddresses.push(address.toLowerCase() as Address);
  });
  console.log("monitored addresses", monitoredAddresses);
};

feedAddresses();

const latestSupply = (logs: Log[]): Map<Address, bigint> => {
  const supply = new Map<Address, bigint>();
  for (const log of logs) {
    if (monitoredAddresses.includes(log["args"]["subject"].toLowerCase())) {
      supply.set(log["args"]["subject"], log["args"]["supply"]);
    }
  }
  return supply;
};

const manageEvents = async (
  prisma: PrismaClient,
  client: PublicClient,
  logs: Log[]
) => {
  const supply = latestSupply(logs);
  if (supply) {
    await sync(supply);
  }
};

const sync = async (supply: Map<Address, bigint>) => {
  for (let [key, value] of supply) {
    console.log("sync mock with friendtech", key, ":", value);
    const retry = 3;
    let finalError: any = undefined;
    for (let i = 0; i < retry; i++) {
      try {
        if (i > 0) {
          console.log(`--- attempt number ${i + 1} to sync ${key}:${value}`);
        }
        const receipt = await setSharesSupply(key, value);
        if (receipt?.status !== "success") {
          console.warn(receipt);
          throw "could not sync the supply";
        }
        saved.inc(1);
        return;
      } catch (err) {
        finalError = err;
        console.log(`--- retry on error; log:`, err);
        console.log(err);
        await wait(10000);
        console.log(`--- restarting now...`);
      }
    }
    throw finalError;
  }
};

const initEvents = async (prisma: PrismaClient, client: PublicClient) => {
  const supply = new Map<Address, bigint>();
  for (let key of monitoredAddresses) {
    const srcSupply = await sourceSupply(key);
    const dstSupply = await getSharesSupply(key);
    if (srcSupply === dstSupply) {
      console.log(`mock already synced to ${key}:${srcSupply}`);
      continue;
    }
    supply.set(key, srcSupply);
  }
  await sync(supply);
};

const previousEvents = async (
  client: PublicClient,
  blockGap: bigint,
  toBlock: bigint | undefined = undefined,
  timeout: number = 300_000
) => {
  const logs = await _previousEvents(
    address,
    events,
    client,
    blockGap,
    toBlock,
    timeout
  );
  captured.inc(logs.length);
  return logs;
};

export const syncer = {
  initialGap: 1n,
  manageEvents: [manageEvents],
  previousEvents: [previousEvents],
  initEvents,
};
