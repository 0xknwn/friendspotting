import { PrismaClient, Prisma } from "@prisma/client";

export const connect = (
  url: string,
  logLevel: Prisma.LogLevel[] = ["info"]
) => {
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: logLevel,
  });
};

export const getLastCapturedContest = async (prisma: PrismaClient) => {
  const result: any =
    await prisma.$queryRaw`select max(args->>'_contestID') from "Log" where name='ContestCreated'`;
  const id = parseInt(result[0]["max"]);
  return id;
};
