import Express from "express";
import { PrismaClient } from "@prisma/client";
import { Address } from "viem";

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

export const idxHistory = (prisma: PrismaClient) => {
  return async (req: Express.Request, res: Express.Response) => {
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
    const idx = req.params.idx;
    const keys = indexes.get(idx);
    if (!keys || keys.length === 0) {
      res.sendStatus(404);
      return;
    }
    const history = await prisma.trade.findMany({
      select: { timestamp: true, subjectAddress: true, supply: true },
      where: { subjectAddress: { in: keys } },
      orderBy: [{ timestamp: "asc" }, { transactionIndex: "asc" }],
    });
    const data: Array<{
      timestamp: number;
      supplies: Map<Address, number>;
      numKeys: number;
      value: bigint;
    }> = [];
    for (let k = 0; k < history.length; k++) {
      let supplies = new Map<Address, number>();
      if (k > 0) {
        supplies = data[k - 1].supplies;
        supplies.set(history[k].subjectAddress as Address, history[k].supply);
      }
      let value = 0n;
      for (let z of supplies.values()) {
        value += getPrice(z, 1);
      }
      data.push({
        timestamp: history[k].timestamp,
        supplies,
        numKeys: keys.length,
        value,
      });
    }
    // res.json(data.filter((value) => value.numKeys === 6));
    res.json(
      data.map(({ timestamp, supplies, numKeys, value }) => ({
        timestamp,
        supplies,
        numKeys,
        value: Number(value / 10n ** 12n) / 10 ** 6,
      }))
    );
  };
};

export const getPrice = (supply: number, amount: number): bigint => {
  const sum1 =
    supply === 0 ? 0 : ((supply - 1) * supply * (2 * (supply - 1) + 1)) / 6;
  const sum2 =
    supply === 0 && amount === 1
      ? 0
      : ((supply - 1 + amount) *
          (supply + amount) *
          (2 * (supply - 1 + amount) + 1)) /
        6;
  const summation = BigInt((sum2 - sum1) * 10 ** 6);
  return (summation * 10n ** 12n) / 16000n;
};
