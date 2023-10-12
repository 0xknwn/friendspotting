import { expect, test } from "vitest";
import { connect } from "../storage";
import { top } from "../keys";

test.skip("Test the project works as expected", async () => {
  expect(true).toBe(true);
});

test("query top 50", async () => {
  expect(process.env.DATABASE_URL).toBe(
    "postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
  );
  const prisma = connect(process.env.DATABASE_URL || "", [
    "info",
    "warn",
    "error",
  ]);
  const now = Math.floor(new Date().getTime() / 1000);
  const timestamp = now - (now % 86400);
  const v = await top(prisma, timestamp);
  expect(v.length).toBe(50);
});
