import { adminServer } from "./admin";
import { connect } from "./storage";
import { publicClient } from "./wallet";
import { wait } from "./util";
import { base, baseGoerli, type Chain } from "viem/chains";
import { getBlockOrCrash } from "./block";
import { saveWithTTL } from "./side-effects/cache";
import { Command } from "commander";
import * as dotenv from "dotenv";
dotenv.config();

const admin_port = process.env.ADMIN_PORT || "8081";

const program = new Command();

program
  .version("dev")
  .description("A CLI to start the block indexer")
  .option("-c, --chain  <goerli|base>", "Defines the chain, default base")
  .parse(process.argv);

const options = program.opts();

console.log("starting adminServer");

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});

const start = async () => {
  let chain: Chain = base;
  let prefix = "mainnet";
  if (options.chain === "goerli" || options.c === "goerli") {
    chain = baseGoerli;
    prefix = "goerli";
  }
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL environment variable is missing");
    process.exit(1);
  }
  console.log("connecting to database");
  const prisma = connect(process.env.DATABASE_URL);
  const client = await publicClient(chain);
  console.log("starting block idxr...");
  let scanGap = 1000n;
  let currentBlockNumber = 0n;
  while (true) {
    let lastblock = await getBlockOrCrash(client);
    if (!lastblock.number || !lastblock.timestamp) {
      throw "lastblock is empty";
    }
    if (lastblock.number <= currentBlockNumber) {
      `blocks ${lastblock.number} compared to ${currentBlockNumber}, skip...`;
      await wait(1000);
      continue;
    }
    console.log(
      `accessing and caching block (${lastblock.number}) for ${prefix}`
    );
    await saveWithTTL(
      `base:${prefix}:blocknumber/latest`,
      Number(lastblock.number)
    );
    if (currentBlockNumber === 0n) {
      currentBlockNumber = lastblock.number - scanGap;
      console.log(
        `checking block cache from ${currentBlockNumber} for ${prefix}`
      );
      for (
        let i = currentBlockNumber + 1n;
        i <= (lastblock.number as bigint);
        i++
      ) {
        currentBlockNumber = i;
        const indexedBlock = await prisma.block.findMany({
          select: {
            timestamp: true,
          },
          where: {
            chain: prefix,
            blockNumber: Number(i),
          },
        });
        if (indexedBlock.length === 0) {
          console.log(
            `accessing and caching block (${lastblock.number}) from ${prefix}`
          );
          break;
        }
      }
    }
    let gap = 10n;
    switch (true) {
      case (lastblock.number as bigint) - currentBlockNumber > 10n:
        break;
      case (lastblock.number as bigint) - currentBlockNumber > 5n:
        gap = 5n;
        break;
      default:
        gap = 1n;
    }
    let previousBlockNumber = currentBlockNumber - 1n;
    let previousBlockTimestamp = 0n;
    for (
      let i = currentBlockNumber + 1n;
      i <= (lastblock.number as bigint);
      i += gap
    ) {
      currentBlockNumber = i;
      console.log(`accessing block (${i}) from ${prefix}`);
      let currentblock = await getBlockOrCrash(client, i);
      if (!currentblock.number || !currentblock.timestamp) {
        throw "currentblock is empty";
      }
      if (previousBlockTimestamp === 0n) {
        previousBlockTimestamp = currentblock.timestamp;
      }
      if (previousBlockNumber >= currentblock.number) {
        console.log(
          `timestamp for ${currentblock.number} already saved, skip...`
        );
        continue;
      }
      for (let j = previousBlockNumber; j < currentblock.number; j++) {
        await prisma.block.upsert({
          where: {
            chain_blockNumber: {
              blockNumber: Number(j),
              chain: prefix,
            },
          },
          create: {
            blockNumber: Number(j),
            chain: prefix,
            timestamp:
              Number(currentblock.timestamp) -
              Math.round(
                (Number(currentblock.number - j) /
                  Number(currentblock.number - previousBlockTimestamp)) *
                  Number(currentblock.timestamp - previousBlockTimestamp)
              ),
          },
          update: {
            timestamp:
              Number(currentblock.timestamp) -
              Math.round(
                (Number(currentblock.number - j) /
                  Number(currentblock.number - previousBlockTimestamp)) *
                  Number(currentblock.timestamp - previousBlockTimestamp)
              ),
          },
        });
      }
      previousBlockNumber = currentblock.number;
      previousBlockTimestamp = currentblock.timestamp;
    }
  }
};

start()
  .then((log) => {
    console.log(log);
  })
  .catch((err) => console.warn(err));
