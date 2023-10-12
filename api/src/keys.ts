import Express from "express";
import { PrismaClient } from "@prisma/client";
import { Address } from "viem";
import { price } from "./price";
import { refreshIndex } from "./side-effects/requests";

export const keyHistory = (prisma: PrismaClient) => {
  return async (req: Express.Request, res: Express.Response) => {
    let key = req.params.key;
    if (!key) {
      res.sendStatus(404).json({ status: "NotFound" });
      return;
    }
    const history = await prisma.trade.findMany({
      select: { timestamp: true, supply: true },
      where: { subjectAddress: key },
      orderBy: [{ timestamp: "asc" }, { transactionIndex: "asc" }],
    });
    res.json(history);
  };
};

const _traderHistory = async (
  prisma: PrismaClient,
  days: number,
  trader: Address
) => {
  const now = Math.floor(new Date().getTime() / 1000);
  const timestamp = now - (now % 86400) - days * 86400;
  const history = await prisma.trade.findMany({
    select: {
      subjectAddress: true,
      timestamp: true,
      ethAmount: true,
      shareAmount: true,
      isBuy: true,
      supply: true,
    },
    where: {
      traderAddress: trader,
      timestamp: {
        gte: timestamp,
        lt: timestamp + 86400,
      },
    },
    orderBy: [{ subjectAddress: "asc" }, { timestamp: "asc" }],
  });
  const result = {} as {
    [k: Address]: {
      timestamp: number;
      ethAmount: number;
      shareAmount: number;
      isBuy: boolean;
      supply: number;
    }[];
  };
  history.forEach(
    ({ subjectAddress, timestamp, ethAmount, shareAmount, isBuy, supply }) => {
      const key = {
        timestamp,
        ethAmount: Number(BigInt(ethAmount.toString()) / 10n ** 12n) / 10 ** 6,
        shareAmount,
        isBuy,
        supply,
      } as {
        timestamp: number;
        ethAmount: number;
        shareAmount: number;
        isBuy: boolean;
        supply: number;
      };
      if (!result[subjectAddress]) {
        result[subjectAddress] = [];
      }
      const keys = result[subjectAddress];
      keys.push(key);
      result[subjectAddress as Address] = keys;
    }
  );
  return result;
};

export const traderHistory = (prisma: PrismaClient, days: number) => {
  return async (req: Express.Request, res: Express.Response) => {
    let trader = req.params.trader;
    if (!trader || !trader.startsWith("0x")) {
      res.sendStatus(404).json({ status: "NotFound" });
      return;
    }
    res.json(await _traderHistory(prisma, days, trader as Address));
  };
};

const _idxHistory = async (prisma: PrismaClient, idx: string) => {
  const indexes: Map<string, Address[]> = new Map([
    [
      "cbbcartel",
      [
        "0xf0a5a3b09a919c7fe826ea0d9482e8d377952821" as Address,
        "0xa8ba11db2901905c6ab49c1c86e69fd22081f68a" as Address,
        "0x1b546a13875c83db8bab7ea4df760b13019a976c" as Address,
        "0x9c1c9027f2e9194f00f8f732de9f36fdc1e225d6" as Address,
        "0x3ee9eda7d7ae365b47be8bfe67e07e27522aaf6a" as Address,
        "0x1f5b68b914f7ad1afca4528b357827def2500f38" as Address,
      ],
    ],
  ]);
  const beforeRefresh = new Date().getTime();
  await refreshIndex(idx);
  console.log(
    `running refreshIndex has taken ${
      new Date().getTime() - beforeRefresh
    } milliseconds`
  );
  const keys = indexes.get(idx);
  if (!keys || keys.length === 0) {
    return;
  }
  const history = await prisma.trade.findMany({
    select: { timestamp: true, subjectAddress: true, supply: true },
    where: { subjectAddress: { in: keys } },
    orderBy: [{ timestamp: "asc" }, { transactionIndex: "asc" }],
  });
  const data: Array<{
    timestamp: number;
    supplies: { [k: string]: number };
    numKeys: number;
    value: bigint;
  }> = [];
  const suppliesHistory: Array<Map<Address, number>> = [];
  for (let k = 0; k < history.length; k++) {
    let supplies = new Map<Address, number>();
    if (k > 0) {
      supplies = suppliesHistory[k - 1];
    }
    supplies.set(history[k].subjectAddress as Address, history[k].supply);
    suppliesHistory.push(supplies);
    let value = 0n;
    for (let z of supplies.values()) {
      value += price(z, 1);
    }
    data.push({
      timestamp: history[k].timestamp,
      supplies: Object.fromEntries(supplies),
      numKeys: keys.length,
      value,
    });
  }
  return data.map(({ timestamp, supplies, numKeys, value }) => ({
    timestamp,
    supplies,
    numKeys,
    value: Number(value / 10n ** 12n) / 10 ** 6,
  }));
};

/**
 * @todo save and query redis to make it faster
 */
export const idxHistory = (prisma: PrismaClient) => {
  return async (req: Express.Request, res: Express.Response) => {
    const idx = req.params.idx;
    const out = await _idxHistory(prisma, idx);
    if (!out) {
      res.sendStatus(404);
      return;
    }
    res.json(out);
  };
};

export const top = async (prisma: PrismaClient, timestamp: number) => {
  const stats = await prisma.dailyStats.findMany({
    select: { traderAddress: true, realized: true, potential: true },
    where: { timestamp },
    orderBy: [{ timestamp: "asc" }, { realized: "desc" }, { realized: "desc" }],
    take: 50,
  });
  const x = [] as {
    traderAddress: Address;
    realized: number;
    potential: number;
  }[];
  stats.forEach(({ traderAddress, realized, potential }) => {
    const field = {
      traderAddress: traderAddress as Address,
      realized: Number(BigInt(realized.toString())) / 10 ** 9,
      potential: Number(BigInt(potential.toString())) / 10 ** 9,
    };
    x.push(field);
  });
  return x;
};

export const top50 = (prisma: PrismaClient, days: number) => {
  return async (req: Express.Request, res: Express.Response) => {
    const now = Math.floor(new Date().getTime() / 1000);
    const timestamp = now - (now % 86400) - days * 86400;
    res.json(await top(prisma, timestamp));
  };
};

export const _unittest = { _traderHistory };
