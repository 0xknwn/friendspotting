import type { User, PrismaClient } from "@prisma/client";
import axios, { AxiosError } from "axios";

export const fetchUser = async (address: string) => {
  try {
    const user = await axios.get(
      `https://prod-api.kosetto.com/users/${address}`
    );
    const x = user.data;
    const u = {
      address: address.toLowerCase(),
      twitterUserId: x["twitterUserId"],
      twitterUsername: x["twitterUsername"],
      twitterName: x["twitterName"],
      twitterPfpUrl: x["twitterPfpUrl"],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    return u;
  } catch (err) {
    const v = err as AxiosError;
    if (v.response?.status === 404) {
      const u = {
        address: address.toLowerCase(),
        twitterUserId: "0",
        twitterUsername: "unknown",
        twitterName: "unknown",
        twitterPfpUrl: "unknown",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      return u;
    }
  }
};

export const checkUser = async (prisma: PrismaClient, address: string) => {
  try {
    await prisma.user.findFirstOrThrow({
      where: { address: address.toLowerCase() },
    });
  } catch (err) {
    try {
      const u = await fetchUser(address.toLowerCase());
      if (!u) {
        return;
      }
      await prisma.user.upsert({
        where: { address: address.toLowerCase() },
        update: u,
        create: u,
      });
    } catch (err) {
      console.warn(
        "could not find or insert user with address",
        address.toLowerCase()
      );
      console.warn("error", err);
    }
  }
};
