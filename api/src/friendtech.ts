import type { Trade } from "@prisma/client";
import { checkUser } from "./twitter";
import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import { exit } from "process";
import { Log, PublicClient } from "viem";
import { address, events } from "./abi/friendtech-events";
import { _previousEvents } from "./events";
dotenv.config();

const saveEvent = async (prisma: PrismaClient, t: Trade) => {
  await prisma.trade.upsert({
    where: { transactionHash: t.transactionHash },
    update: t,
    create: t,
  });
};

const previousEvents = async (
  blockGap: bigint,
  toBlock: bigint | undefined = undefined,
  timeout: number = 300_000
) => {
  return await _previousEvents(address, events, blockGap, toBlock, timeout);
};

const manageEvents = async (
  prisma: PrismaClient,
  client: PublicClient,
  logs: Log[]
) => {
  for (const log of logs) {
    if (!log.blockNumber) {
      console.log(
        `could not determine blockNumber with log, value: ${log.blockNumber}`
      );
      continue;
    }
    try {
      const t = {
        transactionHash: log.transactionHash,
        timestamp: 0,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Trade;
      await saveEvent(prisma, t);
      await checkUser(prisma, log["args"]["trader"]);
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
  manageEvents,
  previousEvents,
  initEvents: async (prisma: PrismaClient, client: PublicClient) => {},
};
