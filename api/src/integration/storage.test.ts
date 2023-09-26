import { expect, test } from "vitest";

test(".env created with DATABASE_URL", () => {
  expect(process.env.DATABASE_URL).toContain("postgres:");
});
