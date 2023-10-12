import { expect, test } from "vitest";
import { connect } from "../storage";
import { top } from "../keys";

test.skip("Test the project works as expected", async () => {
  expect(true).toBe(true);
});

test.skip("query top 50", async () => {
  expect(process.env.DATABASE_URL).toBe(
    "postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
  );
  const prisma = connect(process.env.DATABASE_URL || "", [
    "info",
    "warn",
    "error",
  ]);
  const timestamp = 1696982400;
  const v = await top(prisma, timestamp);
  console.log(v);
  expect(v.length).toBe(50);
});
