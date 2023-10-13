import type { Chain } from "viem/chains";
import type { Trade } from "@prisma/client";
import type { PublicClient, GetBlockReturnType } from "viem";

import { adminServer } from "./admin";
import { connect } from "./storage";
import { checkUser } from "./twitter";
import { wait, currentBlock } from "./util";
import { publicClient } from "./wallet";
import { blockTimestamp } from "./util";

import { PrismaClient, Prisma } from "@prisma/client";
import * as dotenv from "dotenv";
import { exit } from "process";
import { parseAbiItem, Log } from "viem";
dotenv.config();

const admin_port = process.env.ADMIN_PORT || "8081";

/**
 * @todo store the timestamp in the database to get better
 * perf and reliability...
 */
const getTimestamp = async (
  blockid: bigint,
  gapForEstimate: number = 0,
  client: PublicClient | undefined = undefined
) => {
  let gapWithPreviousTimestamp = 0;
  let gap = 0;
  let ts = await blockTimestamp.get(blockid);
  if (!ts) {
    if (gapForEstimate !== 0) {
      for (let i = 1; i <= gapForEstimate; i++) {
        ts = await blockTimestamp.get(blockid - BigInt(i));
        if (ts) {
          gapWithPreviousTimestamp = i;
          gap = gapForEstimate;
        }
      }
    }
    if (!client) {
      client = (await publicClient()) as PublicClient;
    }
    let block: GetBlockReturnType<Chain, false, "latest"> | undefined =
      undefined;
    for (let retry = 0; retry < 10; retry++) {
      try {
        block = await client.getBlock({
          blockNumber: blockid + BigInt(gap),
        });
        break;
      } catch (err) {
        wait(retry * 1000);
      }
    }
    if (!block) {
      console.warn(`could not access block ${blockid}`);
      console.warn(`exit(1)`);
      exit(1);
    }
    try {
      for (let i = 1 - gapWithPreviousTimestamp; i <= gap; i++) {
        await blockTimestamp.set(
          blockid + BigInt(i),
          Number(ts) +
            Math.round(
              ((i + gapWithPreviousTimestamp) /
                (gap + gapWithPreviousTimestamp)) *
                (Number(block.timestamp) - Number(ts))
            )
        );
      }
      return await blockTimestamp.get(blockid);
    } catch (err) {
      console.warn(`could not save the block ${blockid}`);
      console.warn(`exit(1)`);
      exit(1);
    }
  }
  return ts;
};

export const previousTrades = async (
  blockGap: bigint,
  toBlock: bigint | undefined = undefined
) => {
  const client = await publicClient();
  if (!toBlock) {
    try {
      toBlock = await currentBlock(client);
    } catch (err) {
      console.warn(`could not get current block, err:`, err);
      console.warn(`force exit(1)`);
      exit(1);
    }
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

export const manageEvents = async (
  prisma: PrismaClient,
  logs: Log[],
  gapForEstimate: number = 0
) => {
  for (const log of logs) {
    try {
      const t = {
        transactionHash: log.transactionHash,
        timestamp: Number(
          await getTimestamp(log.blockNumber || 0n, gapForEstimate)
        ),
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

console.log("starting adminServer");

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});

const start = async () => {
  try {
    console.log("starting idxr");
    let current = 0n;
    try {
      current = await currentBlock();
    } catch (err) {
      console.warn(`could not get current block, err:`, err);
      console.warn(`force exit(1)`);
      process.exit(1);
    }
    let previous = current - 1000n;
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL environment variable is missing");
      process.exit(1);
    }
    console.log("connecting to database");
    const prisma = connect(process.env.DATABASE_URL);
    console.log("starting block is", previous);
    while (true) {
      let current = 0n;
      try {
        current = await currentBlock();
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
      const logs = await previousTrades(gap, previous + gap);
      console.log(
        `indexing (${logs.length}) between`,
        previous,
        "and",
        previous + gap,
        "target ->",
        current
      );
      let gapForEstimate = current - previous - gap;
      if (gapForEstimate > 10n) {
        gapForEstimate = 10n;
      }
      if (gapForEstimate <= 0n) {
        gapForEstimate = 0n;
      }
      await manageEvents(prisma, logs, Number(gapForEstimate));
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
