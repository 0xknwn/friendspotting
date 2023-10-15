import express, { Request, Response } from "express";
import morgan from "morgan";
import { createServer } from "http";
import promBundle from "express-prom-bundle";

import { version } from "./version";

export const admin = express();

export const bundle = promBundle({
  autoregister: false,
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  metricsApp: admin,
  customLabels: { application: "friendspotting" },
  promClient: {
    collectDefaultMetrics: {},
  },
});

admin.use(express.json());
admin.use(morgan("combined"));
admin.use("/metrics", promBundle.clusterMetrics());

admin.get("/version", (_req: Request, res: Response) =>
  res.status(200).json({
    status: "OK",
    application: "friendspotting",
    version,
  })
);
export const adminServer = createServer(admin);
