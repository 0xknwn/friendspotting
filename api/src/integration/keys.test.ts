import { expect, test } from "vitest";
import { connect } from "../storage";
import { top, _unittest } from "../keys";

const { _traderHistory } = _unittest;

test.skip("top 50", async () => {
  expect(process.env.DATABASE_URL).toBe(
    "postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
  );
  const prisma = connect(process.env.DATABASE_URL || "", [
    "info",
    "query",
    "warn",
    "error",
  ]);
  const now = Math.floor(new Date().getTime() / 1000);
  const timestamp = now - (now % 86400);
  const v = await top(prisma, timestamp);
  expect(v.length).toBe(50);
});

test.skip("trader 0x497e29d685d006e885b2eee7fe2fdc7febecbf75", async () => {
  expect(process.env.DATABASE_URL).toBe(
    "postgres://postgres:postgres@localhost:5432/postgres?schema=postgres"
  );
  if (!process.env.DATABASE_URL) {
    return;
  }
  const prisma = connect(process.env.DATABASE_URL, ["info", "warn", "error"]);
  const history = await _traderHistory(
    prisma,
    0,
    `0x497e29d685d006e885b2eee7fe2fdc7febecbf75`
  );
  console.log(JSON.stringify(history, null, 2));
});
