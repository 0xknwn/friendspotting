import { PrismaClient } from "@prisma/client";
import type { DailyStatsBySubject, DailyStats } from "@prisma/client";

export const querySubjectTradersOverTime = async (
  prisma: PrismaClient,
  part: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<
  Array<{
    timestamp: number;
    traderAddress: string;
    subjectAddress: string;
    isBuy: boolean;
    shareAmount: number;
    supply: number;
  }>
> => {
  return await prisma.trade.findMany({
    select: {
      isBuy: true,
      shareAmount: true,
      subjectAddress: true,
      supply: true,
      timestamp: true,
      traderAddress: true,
    },
    where: {
      subjectAddress: {
        startsWith: part,
      },
      timestamp: {
        gte: startTimestamp,
        lt: endTimestamp,
      },
    },
    orderBy: [
      { subjectAddress: "asc" },
      { timestamp: "desc" },
      { transactionIndex: "desc" },
    ],
  });
};

export const manageStats = async (prisma: PrismaClient) => {};
