import { PrismaClient } from "@prisma/client";
import type { DailyStatsBySubject, DailyStats } from "@prisma/client";

export const querySubjectTradersOverTime = async (
  prisma: PrismaClient,
  part: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<
  Array<{
    block: { timestamp: number };
    traderAddress: string;
    subjectAddress: string;
    isBuy: boolean;
    shareAmount: number;
    supply: number;
  }>
> => {
  return await prisma.friendTechTrade.findMany({
    select: {
      isBuy: true,
      shareAmount: true,
      subjectAddress: true,
      supply: true,
      block: {
        select: { timestamp: true },
      },
      traderAddress: true,
    },
    where: {
      subjectAddress: {
        startsWith: part,
      },
      block: {
        timestamp: {
          gte: startTimestamp,
          lt: endTimestamp,
        },
      },
    },
    orderBy: [
      { subjectAddress: "asc" },
      { blockNumber: "desc" },
      { transactionIndex: "desc" },
    ],
  });
};

export const manageStats = async (prisma: PrismaClient) => {};
