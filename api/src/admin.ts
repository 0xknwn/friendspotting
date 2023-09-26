import express, { Request, Response } from "express";
import morgan from "morgan";
import { createServer } from "http";
import promBundle from "express-prom-bundle";

import { version } from "./version";

const admin = express();
admin.use(express.json());
admin.use(morgan("combined"));

admin.get("/version", (_req: Request, res: Response) =>
  res.status(200).json({
    status: "OK",
    application: "friendspotting",
    version,
  })
);

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { application: "friendspotting" },
  promClient: {
    collectDefaultMetrics: {},
  },
});
admin.use(metricsMiddleware);

export const adminServer = createServer(admin);
