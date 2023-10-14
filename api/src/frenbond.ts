import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import { Log, PublicClient } from "viem";
import { address, events } from "./abi/frenbond-events";
import { _previousEvents } from "./events";
dotenv.config();

const previousEvents = async (
  client: PublicClient,
  blockGap: bigint,
  toBlock: bigint | undefined = undefined,
  timeout: number = 300_000
) => {
  return await _previousEvents(
    address,
    events,
    client,
    blockGap,
    toBlock,
    timeout
  );
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
    console.log(log);
    console.log(
      "and also, args:",
      JSON.stringify(log["args"], (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );
  }
};

export const frenbond = {
  initialGap: 100n,
  manageEvents,
  previousEvents,
  initEvents: async (prisma: PrismaClient, client: PublicClient) => {},
};
