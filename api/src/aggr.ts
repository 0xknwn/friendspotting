import { CronJob } from "cron";
import { connect } from "./storage";
import { computeTradersOverTime, saveTradersPerformance } from "./stats";

const computeByDay = async () => {
  const computeDate = Math.floor(new Date().getTime() / 1000) - 6 * 3600;
  const startDate = computeDate - (computeDate % 86400);
  const endDate = startDate + 86400;
  if (!process.env.DATABASE_URL) {
    console.log(`DATABASE_URL not set... do not run`);
    return;
  }
  console.log(`computing data between ${startDate} - ${endDate} - started`);
  const prisma = connect(process.env.DATABASE_URL, ["info", "warn", "error"]);
  const data = await computeTradersOverTime(prisma, startDate, endDate);
  await saveTradersPerformance(prisma, startDate, data);
  console.log(`computing data between ${startDate} - ${endDate} - done`);
};

const job = new CronJob("0 7 * * * *", computeByDay, null, true);
