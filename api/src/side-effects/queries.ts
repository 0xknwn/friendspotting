import { PrismaClient } from "@prisma/client";
import { Address } from "viem";
import { price } from "../price";

export const idxQueryHistory = async (prisma: PrismaClient, idx: string) => {
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
  const keys = indexes.get(idx);
  if (!keys || keys.length === 0) {
    return;
  }
  const history = await prisma.friendTechTrade.findMany({
    select: {
      block: { select: { timestamp: true } },
      subjectAddress: true,
      supply: true,
    },
    where: { subjectAddress: { in: keys } },
    orderBy: [{ blockNumber: "asc" }, { transactionIndex: "asc" }],
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
      timestamp: history[k].block.timestamp,
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
