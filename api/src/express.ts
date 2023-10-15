import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { idxHistory, keyHistory, top50, traderHistory } from "./keys";
import { connect } from "./storage";
import { bundle } from "./admin";
const server = express();

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL environment variable is missing");
  process.exit(1);
}
const prisma = connect(process.env.DATABASE_URL);

server.use(express.json());
server.use(cors());
server.use(morgan("combined"));

server.use(bundle);

server.get("/keys/:key/history", keyHistory(prisma));
server.get("/indexes/:idx", idxHistory(prisma));
server.get("/top50/today", top50(prisma, 0));
server.get("/top50/yesterday", top50(prisma, 1));
server.get("/traders/:trader/yesterday", traderHistory(prisma, 1));
server.get("/traders/:trader/today", traderHistory(prisma, 0));

server.get("/", (_req: Request, res: Response) =>
  res.status(404).json({
    status: "NotFound",
  })
);

export const app = server;
