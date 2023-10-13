import Express from "express";
import { PrismaClient } from "@prisma/client";
import { Address } from "viem";
import { refreshIndex } from "./side-effects/request-response";
import { idxQueryHistory } from "./side-effects/queries";
import { retrieve } from "./side-effects/cache";

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

/**
 * @todo save and query redis to make it faster
 */
export const idxHistory = (prisma: PrismaClient) => {
  return async (req: Express.Request, res: Express.Response) => {
    const idx = req.params.idx;
    const beforeRefresh = new Date().getTime();
    await refreshIndex(idx);
    console.log(
      `running refreshIndex has taken ${
        new Date().getTime() - beforeRefresh
      } milliseconds`
    );
    try {
      const data = await retrieve(`idx/${idx}`);
      res.json(data);
      return;
    } catch (err) {
      console.error(`could not retrieve key idx/${idx}`);
    }
    res.sendStatus(404).json({ status: "NotFound" });
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
