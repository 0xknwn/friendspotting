import type { FriendTechTrade } from "@prisma/client";
import { checkUser } from "./twitter";
import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import { exit } from "process";
import { Log, PublicClient } from "viem";
import { baseGoerli } from "viem/chains";
import { address, events } from "./abi/friendtech-events";
import { _previousEvents } from "./events";
import { wait } from "./util";
import promClient from "prom-client";
dotenv.config();

const captured = new promClient.Counter({
  name: "idxr_friendtech_captured_events_total",
  help: "number of events captured by the idxr",
});

const saved = new promClient.Counter({
  name: "idxr_friendtech_saved_events_total",
  help: "number of events captured by the idxr",
});

const saveEvent = async (prisma: PrismaClient, t: FriendTechTrade) => {
  const retry = 3;
  let finalError: any = undefined;
  for (let i = 0; i < retry; i++) {
    try {
      if (i > 0) {
        console.log(
          `--- attempt ${i + 1} to store data for tx`,
          t.transactionHash
        );
      }
      await prisma.friendTechTrade.upsert({
        where: { transactionHash: t.transactionHash },
        update: t,
        create: t,
      });
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

const manageEvents = async (
  prisma: PrismaClient,
  client: PublicClient,
  logs: Log[]
) => {
  let prefix = "mainnet";
  if (client.chain === baseGoerli) {
    prefix = "goerli";
  }
  for (const log of logs) {
    if (!log.blockNumber) {
      console.log(
        `could not determine blockNumber with log, value: ${log.blockNumber}`
      );
      continue;
    }
    try {
      const t = {
        chain: prefix,
        transactionHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        transactionIndex: log["transactionIndex"],
        traderAddress: log["args"]["trader"].toLowerCase(),
        subjectAddress: log["args"]["subject"].toLowerCase(),
        isBuy: log["args"]["isBuy"],
        shareAmount: Number(log["args"]["shareAmount"]),
        ethAmount: new Prisma.Decimal(
          BigInt(log["args"]["ethAmount"]).toString()
        ),
        protocolEthAmount: new Prisma.Decimal(
          BigInt(log["args"]["protocolEthAmount"]).toString()
        ),
        subjectEthAmount: new Prisma.Decimal(
          BigInt(log["args"]["subjectEthAmount"]).toString()
        ),
        supply: Number(log["args"]["supply"]),
        updatedAt: new Date(),
      } as FriendTechTrade;
      await checkUser(prisma, log["args"]["trader"]);
      await saveEvent(prisma, t);
      saved.inc(1);
    } catch (err) {
      console.log("error saving event", err);
      console.log("log", log);
      console.log(`exit(1)`);
      exit(1);
    }
  }
};

export const friendtech = {
  initialGap: 1000n,
  manageEvents: [manageEvents],
  previousEvents: [previousEvents],
  initEvents: async (prisma: PrismaClient, client: PublicClient) => {},
};
