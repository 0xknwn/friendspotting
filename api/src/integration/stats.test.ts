import { expect, test } from "vitest";
import { connect } from "../storage";
import { computeTradersOverTime, saveTradersPerformance } from "../stats";

test.skip(
  "collect data for daily stats",
  async () => {
    expect(process.env.DATABASE_URL).toBe(
      "postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
    );
    const prisma = connect(process.env.DATABASE_URL || "", [
      "info",
      "warn",
      "error",
    ]);
    const startOf10Oct2023 = 1696982400;
    const endOf10Oct2023 = 1697068800;
    const data = await computeTradersOverTime(
      prisma,
      startOf10Oct2023,
      endOf10Oct2023
    );
    await saveTradersPerformance(prisma, startOf10Oct2023, data);
  },
  {
    timeout: 60_000,
  }
);
