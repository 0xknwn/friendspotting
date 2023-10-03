import type { User } from "@prisma/client";

export const fetchUser = async (address: string) => {
  const user = await fetch(`https://prod-api.kosetto.com/users/${address}`);
  const x = await user.json();
  const u = {
    id: Number(user["id"]),
    address: address.toLowerCase(),
    twitterUserId: x["twitterUserId"],
    twitterUsername: x["twitterUsername"],
    twitterName: x["twitterName"],
    twitterPfpUrl: x["twitterPfpUrl"],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
  return u;
};
