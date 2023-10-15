import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { Log, PublicClient, Address } from "viem";
import { address, events } from "./abi/frenbond-events";
import { _previousEvents } from "./events";
import promClient from "prom-client";
import { baseGoerli } from "viem/chains";
dotenv.config();

const captured = new promClient.Counter({
  name: "idxr_frenbond_captured_events_total",
  help: "number of events captured by the idxr",
});

captured.inc(0);

const saved = new promClient.Counter({
  name: "idxr_frenbond_saved_events_total",
  help: "number of events saved by the idxr",
});
saved.inc(0);

const errors = new promClient.Counter({
  name: "idxr_frenbond_errored_events_total",
  help: "number of events errored by the idxr",
});
saved.inc(0);

const genPreviousEvents = (events: any) => {
  return events.map(
    (event) =>
      async (
        client: PublicClient,
        blockGap: bigint,
        toBlock: bigint | undefined = undefined,
        timeout: number = 300_000
      ) => {
        const logs = await _previousEvents(
          address,
          event,
          client,
          blockGap,
          toBlock,
          timeout
        );
        captured.inc(logs.length);
        return logs;
      }
  );
};

const genManageEvents = (events: any) => {
  return events.map(
    (event) =>
      async (prisma: PrismaClient, client: PublicClient, logs: Log[]) => {
        let prefix = "mainnet";
        if (client && client.chain === baseGoerli) prefix = "goerli";
        for (const log of logs) {
          if (!log.blockNumber) {
            console.log(
              `could not determine blockNumber with log, value: ${log.blockNumber}`
            );
            continue;
          }
          if (
            !log.transactionHash ||
            !log.blockNumber ||
            !log.transactionIndex ||
            !log.logIndex ||
            !log["eventName"] ||
            !log["args"]
          ) {
            console.log(log);
            errors.inc(1);
            throw "missing data for log";
          }
          prisma.log.upsert({
            where: {
              chain_eventName_blockNumber_transactionIndex_eventIndex: {
                chain: prefix,
                eventName: log.transactionHash,
                blockNumber: Number(log.blockNumber),
                transactionIndex: log.transactionIndex,
                eventIndex: log.logIndex,
              },
            },
            create: {
              transactionHash: log.transactionHash as Address,
              chain: prefix,
              eventName: log["eventName"],
              blockNumber: Number(log.blockNumber),
              transactionIndex: log.transactionIndex,
              eventIndex: log.logIndex,
              args: JSON.parse(
                JSON.stringify(log["args"], (_, v) =>
                  typeof v === "bigint" ? v.toString() : v
                )
              ),
              updatedAt: new Date(),
            },
            update: {
              eventIndex: log.logIndex,
              eventName: log["eventName"],
              args: JSON.parse(
                JSON.stringify(log["args"], (_, v) =>
                  typeof v === "bigint" ? v.toString() : v
                )
              ),
              updatedAt: new Date(),
            },
          });
          console.log(
            `saved event ${log["eventName"]} for block ${log.blockNumber}`
          );
          captured.inc(1);
        }
      }
  );
};

export const frenbond = {
  initialGap: 100n,
  manageEvents: genManageEvents(events),
  previousEvents: genPreviousEvents(events),
  initEvents: async (prisma: PrismaClient, client: PublicClient) => {},
};
