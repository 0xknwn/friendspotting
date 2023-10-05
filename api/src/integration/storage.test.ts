import { expect, test } from "vitest";

test.skip(".env created with DATABASE_URL", () => {
  expect(process.env.DATABASE_URL).toContain("postgres:");
});
