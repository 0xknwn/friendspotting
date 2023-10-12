import { Worker } from "bullmq";
import { wait } from "./util";
import * as dotenv from "dotenv";
import { adminServer } from "./admin";

dotenv.config();

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

const admin_port = process.env.ADMIN_PORT || "8081";

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});

start();
