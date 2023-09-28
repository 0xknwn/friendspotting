import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { keyHistory } from "./keys";
import { connect } from "./storage";

const server = express();
if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL environment variable is missing");
  process.exit(1);
}
const prisma = connect(process.env.DATABASE_URL);

server.use(express.json());
server.use(cors());
server.use(morgan("combined"));

server.get("/keys/:key/history", keyHistory(prisma));

server.get("/", (_req: Request, res: Response) =>
  res.status(404).json({
    status: "NotFound",
  })
);

export const app = server;
