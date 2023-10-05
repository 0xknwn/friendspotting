import { publicClient } from "./wallet";
import { parseAbiItem, Log } from "viem";
import type { Trade } from "@prisma/client";
import type { PublicClient } from "viem";
import { checkUser } from "./twitter";
import { PrismaClient, Prisma } from "@prisma/client";
import { connect } from "./storage";
import * as dotenv from "dotenv";
import {wait} from "./util"

dotenv.config();

const blockTimestamp = new Map<bigint, Number>();

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

let lastCollectedBlock = -1;

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
};

start()
  .then((log) => {
    console.log(log);
  })
  .catch((err) => console.warn(err));
