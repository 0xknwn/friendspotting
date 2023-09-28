import Express from "express";
import { Prisma, PrismaClient } from "@prisma/client";

export const keyHistory = (prisma: PrismaClient) => {
  return async (req: Express.Request, res: Express.Response) => {
    let key = req.params.key;
    if (!key) {
      res.sendStatus(404).json({ status: "NotFound" });
      return;
    }
    const history = await prisma.trade.findMany({
      where: { subjectAddress: key },
      orderBy: [{ timestamp: "desc" }],
    });
    res.json(history);
  };
};
