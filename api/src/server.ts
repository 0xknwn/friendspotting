import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { createServer } from "http";
import { adminServer } from "./admin";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

app.get("/", (_req: Request, res: Response) =>
  res.status(404).json({
    status: "NotFound",
  })
);

const port = process.env.PORT || "8080";
const admin_port = process.env.ADMIN_PORT || "8081";

var server = createServer(app);

server.listen(port, () => {
  console.log(`server started on port ${port}`);
});

adminServer.listen(admin_port, () => {
  console.log(`administration started on port ${admin_port}`);
});
