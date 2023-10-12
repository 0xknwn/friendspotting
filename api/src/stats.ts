import { PrismaClient, Prisma } from "@prisma/client";
import { Address } from "viem";
import { tradingGain } from "./price";
import { querySubjectTradersOverTime } from "./side-effects/stats";

export type Trade = {
  timestamp: number;
  supply: number;
  amount: number;
  isBuy: boolean;
};

export type subjectTradersHistory = {
  subject: Address | undefined;
  startSupply: number;
  endSupply: number;
  traderHistory: Map<Address, Trade[]>;
};

export type TraderPerformance = {
  realized: number;
  potential: number;
};

export type mapSubjectsTradersHistory = Map<Address, subjectTradersHistory>;

export type mapTradersSubjectsPerformance = Map<
  Address,
  Map<Address, TraderPerformance>
>;

type mapTradersPerformance = Map<Address, TraderPerformance>;

/**
 * @todo Create stats for traders who generate pump from a purchase
 * for 10 min, 1h, 3h and 1 day (max over...)
 */
const pumpAfterTraderPurchase = async () => {};

/**
 * @todo Create stats for traders who generate dump from a sale
 * for 10 min, 1h, 3h and 1 day (max over...)
 */
const dumpAfterTraderSale = async () => {};

const _mapSubjectTradersOverTime = async (
  prisma: PrismaClient,
  part: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<mapSubjectsTradersHistory | undefined> => {
  const map = new Map<Address, subjectTradersHistory>();
  let currentSubjectAddress: Address | undefined = undefined;
  let traderHistory: Trade[] | undefined = undefined;
  const result = await querySubjectTradersOverTime(
    prisma,
    part,
    startTimestamp,
    endTimestamp
  );
  for (let {
    isBuy,
    shareAmount,
    subjectAddress,
    supply,
    timestamp,
    traderAddress,
  } of result) {
    let subject = map.get(subjectAddress as Address);
    if (!subject) {
      currentSubjectAddress = subjectAddress as Address;
      subject = {
        subject: currentSubjectAddress as Address,
        startSupply: isBuy ? supply - shareAmount : supply + shareAmount,
        endSupply: supply,
        traderHistory: new Map<Address, Array<Trade>>(),
      };
      map.set(currentSubjectAddress as Address, subject);
    }
    subject.startSupply = isBuy ? supply - shareAmount : supply + shareAmount;
    traderHistory = subject.traderHistory.get(traderAddress as Address);
    if (!traderHistory) {
      traderHistory = [] as Trade[];
    }
    traderHistory.push({ timestamp, supply, amount: shareAmount, isBuy });
    subject.traderHistory.set(traderAddress as Address, traderHistory);
    map.set(currentSubjectAddress as Address, subject);
  }
  return map;
};

const _computeTradersSubjectsOverTime = (
  mapSubjectsTradersHistory: mapSubjectsTradersHistory,
  part: string
): {
  partition: string;
  mapTradersSubjectsPerformance: mapTradersSubjectsPerformance;
} => {
  const map = new Map<Address, Map<Address, TraderPerformance>>();
  let traderSubjectPerformance: Map<Address, TraderPerformance> | undefined =
    undefined;
  for (let {
    subject,
    startSupply,
    endSupply,
    traderHistory,
  } of mapSubjectsTradersHistory.values()) {
    for (let [trader, trades] of traderHistory.entries()) {
      traderSubjectPerformance = map.get(trader as Address);
      if (!traderSubjectPerformance) {
        traderSubjectPerformance = new Map<Address, TraderPerformance>();
      }
      const traderPerformance = {
        realized: 0.0,
        potential: 0.0,
      };
      const sales = [] as Trade[];
      let loop = 0;
      for (let { timestamp, supply, amount, isBuy } of trades) {
        loop++;
        if (!isBuy) {
          sales.push({ timestamp, supply, amount, isBuy });
          continue;
        }
        while (amount > 0) {
          /**
           * @todo fix the infinite loop
           */
          const lastSale = sales.shift();
          if (!lastSale) {
            traderPerformance.potential += tradingGain(
              supply,
              endSupply,
              amount
            );
            break;
          }
          if (amount < lastSale.amount) {
            sales.unshift({
              timestamp,
              supply: lastSale.supply - amount,
              amount: lastSale.amount - amount,
              isBuy,
            });
            traderPerformance.realized += tradingGain(
              lastSale.supply - amount,
              supply,
              amount
            );
            amount = 0;
            supply = supply - amount;
            continue;
          }
          traderPerformance.realized += tradingGain(
            supply,
            lastSale.supply,
            lastSale.amount
          );
          amount -= lastSale.amount;
          supply -= lastSale.amount;
        }
      }
      for (let { timestamp, supply, amount, isBuy } of sales) {
        traderPerformance.realized += tradingGain(startSupply, supply, amount);
      }
      traderSubjectPerformance.set(subject as Address, traderPerformance);
      map.set(trader, traderSubjectPerformance);
    }
  }
  return {
    partition: part,
    mapTradersSubjectsPerformance: map,
  };
};

const _computeTradersOverTime = (
  mapTradersSubjectsPerformance: mapTradersSubjectsPerformance
): mapTradersPerformance => {
  const map = new Map<Address, TraderPerformance>();
  let traderPerformance: TraderPerformance | undefined = undefined;
  for (let [
    trader,
    traderSubjectsPerformance,
  ] of mapTradersSubjectsPerformance.entries()) {
    for (let subjectPerformance of traderSubjectsPerformance.values()) {
      traderPerformance = map.get(trader);
      if (!traderPerformance) {
        traderPerformance = { realized: 0.0, potential: 0.0 };
      }
      traderPerformance.realized += subjectPerformance.realized;
      traderPerformance.potential += subjectPerformance.potential;
      map.set(trader, traderPerformance);
    }
  }
  return map;
};

const _computeTradersOverTimeAndPart = async (
  prisma: PrismaClient,
  part: string,
  startTimestamp: number,
  endTimestamp: number
) => {
  const map = await _mapSubjectTradersOverTime(
    prisma,
    part,
    startTimestamp,
    endTimestamp
  );
  if (!map) {
    return;
  }
  const tradersSubjectsOverTime = _computeTradersSubjectsOverTime(map, part);
  const tradersOverTime = _computeTradersOverTime(
    tradersSubjectsOverTime.mapTradersSubjectsPerformance
  );
  return { part, tradersOverTime };
};

const _partList = [
  "0x0",
  "0x1",
  "0x2",
  "0x3",
  "0x4",
  "0x5",
  "0x6",
  "0x7",
  "0x8",
  "0x9",
  "0xa",
  "0xb",
  "0xc",
  "0xd",
  "0xe",
  "0xf",
];

export const computeTradersOverTime = async (
  prisma: PrismaClient,
  startTimestamp: number,
  endTimestamp: number
) => {
  const mapTradersPerformance = new Map<Address, TraderPerformance>();
  for (const part of _partList) {
    const mapTradersPerformanceByPart = await _computeTradersOverTimeAndPart(
      prisma,
      part,
      startTimestamp,
      endTimestamp
    );
    if (!mapTradersPerformanceByPart) {
      continue;
    }
    for (const [
      traderAddress,
      traderOverTime,
    ] of mapTradersPerformanceByPart.tradersOverTime.entries()) {
      let traderPerformance = mapTradersPerformance.get(traderAddress);
      if (!traderPerformance) {
        traderPerformance = { realized: 0.0, potential: 0.0 };
      }
      traderPerformance.realized += traderOverTime.realized;
      traderPerformance.potential += traderOverTime.potential;
      mapTradersPerformance.set(traderAddress, traderPerformance);
    }
  }
  return mapTradersPerformance;
};

export const saveTradersPerformance = async (
  prisma: PrismaClient,
  timestamp: number,
  map: mapTradersPerformance
) => {
  for (let [trader, traderPerformance] of map.entries()) {
    const d = {
      timestamp,
      traderAddress: trader as Address,
      partKey: "0x",
      realized: new Prisma.Decimal(
        BigInt(Math.trunc(traderPerformance.realized * 10 ** 9)).toString()
      ),
      potential: new Prisma.Decimal(
        (
          BigInt(Math.trunc(traderPerformance.potential * 10 ** 9)) *
          10n ** 9n
        ).toString()
      ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await prisma.dailyStats.upsert({
        where: {
          timestamp_traderAddress_partKey: {
            timestamp: d.timestamp as number,
            traderAddress: d.traderAddress as Address,
            partKey: d.partKey as string,
          },
        },
        update: d,
        create: d,
      });
    } catch (err) {
      console.warn(
        "could not find or insert dailysyays with address",
        d.traderAddress
      );
      console.warn("error", err);
    }
  }
};

export const _unittest = {
  _mapSubjectTradersOverTime,
  _computeTradersSubjectsOverTime,
  _computeTradersOverTime,
  _computeTradersOverTimeAndPart,
};
