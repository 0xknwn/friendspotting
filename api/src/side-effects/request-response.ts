import { Queue, QueueEvents } from "bullmq";
import * as dotenv from "dotenv";

dotenv.config();

const queue = new Queue("request-response", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
  },
});

const queueEvents = new QueueEvents("request-response", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
  },
});

queueEvents.on("completed", ({ jobId }) => {
  console.log("done painting, jobid:", jobId);
});

queueEvents.on(
  "failed",
  ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error("error painting, jobid:", jobId, "reason:", failedReason);
  }
);

export const refreshIndex = async (idx: string) => {
  const result = await queue.add("idx/refresh", { idx });
  console.log(`idx/refresh requested as jobid: ${result.id}`);
};
