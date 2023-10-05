import { sourceABI } from "./abi/source";
import { getContract, Address } from "viem";

import { publicClient } from "./wallet";

export const sourceAddress =
  "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4" as Address;

export const sourceSupply = async (address: Address) => {
  const client = await publicClient();
  const sourceContract = getContract({
    address: sourceAddress,
    abi: sourceABI,
    publicClient: client,
  });
  const data = await sourceContract.read.sharesSupply([address]);
  return data;
};
