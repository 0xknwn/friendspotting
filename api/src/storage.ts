import { PrismaClient } from "@prisma/client";

export const connect = (url: string) => {
  return new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: ["info"],
  });
};

export const getLastCapturedContest = async (prisma: PrismaClient) => {
  const result: any =
    await prisma.$queryRaw`select max(args->>'_contestID') from "Log" where name='ContestCreated'`;
  const id = parseInt(result[0]["max"]);
  return id;
};
