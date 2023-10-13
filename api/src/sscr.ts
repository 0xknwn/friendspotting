import { Worker } from "bullmq";
import * as dotenv from "dotenv";
import { adminServer } from "./admin";
import { save } from "./side-effects/cache";
import { idxQueryHistory } from "./side-effects/queries";
import { connect } from "./storage";
import { PrismaClient } from "@prisma/client";
import { refreshIndex } from "./side-effects/request-response";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL environment variable is missing");
  process.exit(1);
}
const prisma = connect(process.env.DATABASE_URL);

const refreshIndexTracker: { [idx: string]: number } = {};

const refreshIndexJob = async (prisma: PrismaClient, idx: string) => {
  const now = new Date().getTime();
  if (refreshIndexTracker[idx] && now - refreshIndexTracker[idx] < 3000) {
    console.log(
      `cache for ${idx} cache up-to-date ${
        new Date().getTime() - refreshIndexTracker[idx]
      } ms`
    );
  }
  refreshIndexTracker[idx] = now;
  const data = await idxQueryHistory(prisma, idx);
  save(`idx/${idx}`, data);
  console.log(`idx ${idx} cache refreshed`);
};

const start = async (prisma: PrismaClient) => {
  const worker = new Worker(
    "request-response",
    async (job) => {
      if (job.name === "idx/refresh") {
        console.log(`receiving idx/refresh request`);
        if (!job.data.idx) {
          console.log(`error index not requested, skip...`);
          return;
        }
        await refreshIndexJob(prisma, job.data.idx);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: 6379,
      },
    }
  );
  await refreshIndex("cbbcartel");
};

const admin_port = process.env.ADMIN_PORT || "8081";

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});

start(prisma)
  .then(() => {
    console.log(`subscriber started...`);
  })
  .catch((err) => {
    console.warn("subscriber error", err);
  });
