import { adminServer } from "./admin";
import { connect } from "./storage";
import { wait } from "./util";
import { lastBlockFromCache } from "./block";
import { publicClient } from "./wallet";
import { friendtech } from "./friendtech";
import { frenbond } from "./frenbond";
import { syncer } from "./sync";
import { base, baseGoerli } from "viem/chains";

import { PrismaClient } from "@prisma/client";
import { Log, PublicClient } from "viem";
import type { GetLogsReturnType } from "viem";
import type { Chain } from "viem/chains";
import { Command } from "commander";
import * as dotenv from "dotenv";
import { exit } from "process";
dotenv.config();

const admin_port = process.env.ADMIN_PORT || "8081";

const program = new Command();

type ManageEvents = (
  prisma: PrismaClient,
  client: PublicClient,
  logs: Log[]
) => Promise<void>;

type PreviousEvents = (
  client: PublicClient,
  blockGap: bigint,
  toBlock: bigint | undefined,
  timeout: number
) => Promise<GetLogsReturnType>;

type EventManager = {
  initialGap: bigint;
  initEvents: (prisma: PrismaClient, client: PublicClient) => Promise<void>;
  manageEvents: ManageEvents[];
  previousEvents: PreviousEvents[];
};

const eventManager: { [k: string]: EventManager } = {
  friendtech,
  frenbond,
  syncer,
};

program
  .version("dev")
  .description("A CLI to start the indexer with options")
  .option("-c, --chain  <goerli|base>", "Defines the chain, default base")
  .option(
    "-i, --interface [<friendtech|frenbond|sync>]",
    "Defines the event Manager, default friendtech"
  )
  .parse(process.argv);

const options = program.opts();

console.log("starting adminServer");

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});

const start = async () => {
  let chain: Chain = base;
  if (options.chain === "goerli" || options.c === "goerli") {
    chain = baseGoerli;
  }
  const client = await publicClient(chain);
  console.log(`connect with client ${client?.chain?.rpcUrls?.default?.http}`);
  const indexer: string = options.i ? options.i : options.interface;
  let manager: EventManager = eventManager.friendtech;
  switch (indexer) {
    case "frenbond":
      manager = eventManager.frenbond;
      break;
    case "sync":
      manager = eventManager.syncer;
      break;
    case "friendtech":
      manager = eventManager.frenbond;
      break;
    default:
      throw `unknown event manager value for ${indexer}`;
  }
  try {
    console.log(`starting idxr on ${client.chain} with ${indexer}`);
    let current = 0n;
    try {
      current = await lastBlockFromCache(client);
    } catch (err) {
      console.warn(`could not get current block, err:`, err);
      console.warn(`force exit(1)`);
      process.exit(1);
    }
    let previous = current - manager.initialGap;
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL environment variable is missing");
      process.exit(1);
    }
    console.log("connecting to database");
    const prisma = connect(process.env.DATABASE_URL);
    console.log("initialization process...");
    await manager.initEvents(prisma, client);
    console.log("starting block is", previous);
    while (true) {
      let current = 0n;
      try {
        current = await lastBlockFromCache(client);
      } catch (err) {
        console.warn(`could not get current block, err:`, err);
        console.warn(`exit(1)`);
        process.exit(1);
      }
      let gap = 10n;
      if (current <= previous) {
        await wait(1000);
        continue;
      }
      if (current - previous < 10n) {
        gap = current - previous;
      }
      for (let i = 0; i < manager.previousEvents.length; i++) {
        const logs = await manager.previousEvents[i](
          client,
          gap,
          previous + gap,
          30000
        );
        console.log(
          `indexing (${logs.length}) event (${i + 1}/${
            manager.previousEvents.length
          }) between`,
          previous,
          "and",
          previous + gap,
          "target ->",
          current
        );
        await manager.manageEvents[i](prisma, client, logs);
      }
      previous += gap;
      if (gap < 10) {
        await wait(1000);
      }
    }
  } catch (err) {
    console.log("error on job", err);
    exit(1);
  }
};

start()
  .then((log) => {
    console.log(log);
  })
  .catch((err) => console.warn(err));
