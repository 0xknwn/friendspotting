import { CronJob } from "cron";
import { connect } from "./storage";
import { computeTradersOverTime, saveTradersPerformance } from "./stats";
import * as dotenv from "dotenv";

dotenv.config();

const computeByDay = async () => {
  const computeDate = Math.floor(new Date().getTime() / 1000);
  const prevDay = computeDate - (computeDate % 86400) - 86400;
  const currDay = computeDate - (computeDate % 86400);
  const nextDay = currDay + 86400;
  if (!process.env.DATABASE_URL) {
    console.log(`DATABASE_URL not set... do not run`);
    return;
  }
  const prisma = connect(process.env.DATABASE_URL, ["info", "warn", "error"]);
  console.log(`computing between ${prevDay} - ${currDay} - started`);
  const dataPrev = await computeTradersOverTime(prisma, prevDay, currDay);
  await saveTradersPerformance(prisma, prevDay, dataPrev);
  console.log(`computing between ${prevDay} - ${currDay} - done`);
  console.log(`computing between ${currDay} - ${nextDay} - started`);
  const data = await computeTradersOverTime(prisma, currDay, nextDay);
  await saveTradersPerformance(prisma, currDay, data);
  console.log(`computing between ${currDay} - ${nextDay} - done`);
};

const job = new CronJob("0 7 * * * *", computeByDay, null, true);
