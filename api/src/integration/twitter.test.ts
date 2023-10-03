import { expect, test } from "vitest";
import { fetchUser } from "../twitter";

test("check data for 0xd85eff2d610132d507ece73e1f37df82774a8d47", async () => {
  const user = await fetchUser("0xd85eff2d610132d507ece73e1f37df82774a8d47");
  expect(user.twitterUsername).toBe("FrenBond");
});
