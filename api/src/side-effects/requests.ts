import { Queue, QueueEvents } from "bullmq";

const queue = new Queue("request-response");
const queueEvents = new QueueEvents("request-response");

queueEvents.on("completed", ({ jobId }) => {
  console.log("done painting, jobid:", jobId);
});

queueEvents.on(
  "failed",
  ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error("error painting, jobid:", jobId, "reason:", failedReason);
  }
);

export const refreshIndex = async (name: string) => {
  const result = await queue.add("idx/refresh", { idx: name });
  console.log(`idx/refresh requested as jobid: ${result.id}`);
};
