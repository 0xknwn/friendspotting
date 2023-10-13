import { publicClient } from "./wallet";
import { parseAbiItem, Log } from "viem";
import type { Trade } from "@prisma/client";
import type { PublicClient } from "viem";
import { checkUser } from "./twitter";
import { PrismaClient, Prisma } from "@prisma/client";
import { connect } from "./storage";
import * as dotenv from "dotenv";
import { wait } from "./util";
import { adminServer } from "./admin";
import { exit } from "process";

dotenv.config();

/**
 * @todo fix the case below by:
 * - not moving forward in case we cannot get the block with getBlock()
 */
//  indexing (3) between 5181910n and 5181913n target -> 5181913n
//  error saving event BlockNotFoundError: Block at number "5181912" could not be found.
//
//  Version: viem@1.15.0
//      at getBlock (/app/node_modules/viem/_cjs/actions/public/getBlock.js:25:15)
//      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
//      at async getTimestamp (/app/build/idxr.js:45:23)
//      at async manageEvents (/app/build/idxr.js:88:35)
//      at async start (/app/build/idxr.js:140:13) {
//    details: undefined,
//    docsPath: undefined,
//    metaMessages: undefined,
//    shortMessage: 'Block at number "5181912" could not be found.',
//    version: 'viem@1.15.0'
//  }
//  log {
//    address: '0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4',
//    blockHash: '0x68686c724929d3a104362e88aad1c48ac548fb83a2f3059e6bb1306ffc0d7fbe',
//    blockNumber: 5181912n,
//    data: '0x000000000000000000000000f97215cd9560b4cb9e81576555bc21d6f4e35e5f0000000000000000000000001b20e1d504e7b09e71e27a749cc4a1aef55ec0d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000258689ac70a8000000000000000000000000000000000000000000000000000001e053af05a2000000000000000000000000000000000000000000000000000001e053af05a200000000000000000000000000000000000000000000000000000000000000000d',
//    logIndex: 0,
//    removed: false,
//    topics: [
//      '0x2c76e7a47fd53e2854856ac3f0a5f3ee40d15cfaa82266357ea9779c486ab9c3'
//    ],
//    transactionHash: '0x3a057f21795090d97f040fcd03b46d4be031fda5826704a5e668a5299450a5ef',
//    transactionIndex: 1,
//    args: {
//      trader: '0xf97215cD9560b4cb9e81576555BC21D6F4e35e5f',
//      subject: '0x1b20e1D504e7b09E71e27A749cC4A1aEF55ec0d4',
//      isBuy: false,
//      shareAmount: 1n,
//      ethAmount: 10562500000000000n,
//      protocolEthAmount: 528125000000000n,
//      subjectEthAmount: 528125000000000n,
//      supply: 13n
//    },
//    eventName: 'Trade'
//  }

const admin_port = process.env.ADMIN_PORT || "8081";

const blockTimestamp = new Map<bigint, Number>();

/**
 * @todo store the timestamp in the database to get better
 * perf and reliability...
 */
const getTimestamp = async (
  blockid: bigint,
  client: PublicClient | undefined = undefined
) => {
  const ts = blockTimestamp.get(blockid);
  if (!ts) {
    if (!client) {
      client = (await publicClient()) as PublicClient;
    }
    const block = await client.getBlock({ blockNumber: blockid });
    blockTimestamp.set(block.number, Number(block.timestamp));
    return Number(block.timestamp);
  }
  return ts;
};

/**
 * @todo store the timestamp in the database to get better
 * perf and reliability...
 */
export const currentBlock = async (
  client: PublicClient | undefined = undefined
) => {
  if (!client) {
    client = (await publicClient()) as PublicClient;
  }
  const block = await client.getBlock();
  blockTimestamp.set(block.number, Number(block.timestamp));
  return block.number;
};

export const previousTrades = async (
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

export const saveEvent = async (prisma: PrismaClient, t: Trade) => {
  await prisma.trade.upsert({
    where: { transactionHash: t.transactionHash },
    update: t,
    create: t,
  });
};

export const manageEvents = async (prisma: PrismaClient, logs: Log[]) => {
  for (const log of logs) {
    try {
      const t = {
        transactionHash: log.transactionHash,
        timestamp: Number(await getTimestamp(log.blockNumber || 0n)),
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
    }
  }
};

const start = async () => {
  console.log("starting adminServer");
  adminServer.listen(admin_port, () => {
    console.log(`administration started on port ${admin_port}`);
  });
  try {
    console.log("starting idxr");
    let current = await currentBlock();
    let previous = current - 1000n;
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL environment variable is missing");
      process.exit(1);
    }
    console.log("connecting to database");
    const prisma = connect(process.env.DATABASE_URL);
    console.log("starting block is", previous);
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
      await manageEvents(prisma, logs);
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
