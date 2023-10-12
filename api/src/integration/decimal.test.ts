import { expect, test } from "vitest";
import { Prisma } from "@prisma/client";

test.skip("cast BigInt into Decinal", async () => {
  const x = new Prisma.Decimal(
    BigInt(2000000000000000000000000000n).toString()
  );
  expect(x.d[0]).toBe(2000000);
});
