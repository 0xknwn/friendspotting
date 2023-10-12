import { Worker } from "bullmq";
import { wait } from "./util";

const start = () => {
  const worker = new Worker(
    "request-response",
    async (job) => {
      if (job.name === "idx/refresh") {
        console.log(
          `idx/refresh requested for ${job.data.idx}, respond to ${job.data.requester}`
        );
        await wait(1000);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: 6379,
      },
    }
  );
};

start();
